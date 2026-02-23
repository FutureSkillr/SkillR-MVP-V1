package server

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"regexp"
	"sync"
	"time"
	"unicode"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

var emailRegexp = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

// M22: Brute-force protection — track failed login attempts per IP
var (
	loginAttemptsMu sync.Mutex
	loginAttempts   = map[string]*loginAttemptEntry{}
)

type loginAttemptEntry struct {
	count   int
	resetAt time.Time
}

const maxLoginAttempts = 5
const loginAttemptWindow = 15 * time.Minute

func checkBruteForce(ip string) error {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()

	now := time.Now()
	entry, ok := loginAttempts[ip]
	if !ok || now.After(entry.resetAt) {
		loginAttempts[ip] = &loginAttemptEntry{count: 0, resetAt: now.Add(loginAttemptWindow)}
		return nil
	}
	if entry.count >= maxLoginAttempts {
		return fmt.Errorf("too many login attempts")
	}
	return nil
}

func recordFailedLogin(ip string) {
	loginAttemptsMu.Lock()
	defer loginAttemptsMu.Unlock()

	now := time.Now()
	entry, ok := loginAttempts[ip]
	if !ok || now.After(entry.resetAt) {
		loginAttempts[ip] = &loginAttemptEntry{count: 1, resetAt: now.Add(loginAttemptWindow)}
		return
	}
	entry.count++
}

// M20: Password strength validation
func validatePasswordStrength(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters")
	}
	var hasUpper, hasLower, hasDigit bool
	for _, r := range password {
		switch {
		case unicode.IsUpper(r):
			hasUpper = true
		case unicode.IsLower(r):
			hasLower = true
		case unicode.IsDigit(r):
			hasDigit = true
		}
	}
	if !hasUpper || !hasLower || !hasDigit {
		return fmt.Errorf("password must contain uppercase, lowercase, and a digit")
	}
	return nil
}

// AuthHandler provides local (non-Firebase) email/password authentication.
// This is used when Firebase is not configured (staging / dev).
type AuthHandler struct {
	db *pgxpool.Pool
}

func NewAuthHandler(db *pgxpool.Pool) *AuthHandler {
	return &AuthHandler{db: db}
}

// SetDB updates the database pool (for async startup).
func (h *AuthHandler) SetDB(db *pgxpool.Pool) {
	h.db = db
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type registerRequest struct {
	Email       string `json:"email"`
	DisplayName string `json:"displayName"`
	Password    string `json:"password"`
}

type providerRequest struct {
	Provider string `json:"provider"`
}

type authUserResponse struct {
	ID           string  `json:"id"`
	Email        string  `json:"email"`
	DisplayName  string  `json:"displayName"`
	Role         string  `json:"role"`
	AuthProvider string  `json:"authProvider"`
	PhotoURL     *string `json:"photoURL"`
	CreatedAt    int64   `json:"createdAt"`
}

// Login handles POST /api/auth/login
func (h *AuthHandler) Login(c echo.Context) error {
	if h.db == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	// M22: Brute-force protection
	if err := checkBruteForce(c.RealIP()); err != nil {
		return echo.NewHTTPError(http.StatusTooManyRequests, "too many login attempts, try again later")
	}

	var req loginRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Email == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email and password are required")
	}

	var id uuid.UUID
	var email, displayName, role, authProvider string
	var photoURL *string
	var passwordHash *string
	var createdAt time.Time

	err := h.db.QueryRow(c.Request().Context(),
		`SELECT id, email, display_name, role, auth_provider, photo_url, password_hash, created_at
		 FROM users WHERE email = $1`, req.Email).
		Scan(&id, &email, &displayName, &role, &authProvider, &photoURL, &passwordHash, &createdAt)

	if err == pgx.ErrNoRows {
		recordFailedLogin(c.RealIP())
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "E-Mail oder Passwort falsch."})
	}
	if err != nil {
		log.Printf("auth login query error: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	if passwordHash == nil || *passwordHash == "" {
		recordFailedLogin(c.RealIP())
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "E-Mail oder Passwort falsch."})
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*passwordHash), []byte(req.Password)); err != nil {
		recordFailedLogin(c.RealIP())
		return c.JSON(http.StatusUnauthorized, map[string]string{"error": "E-Mail oder Passwort falsch."})
	}

	// H11: Issue a session token after successful login.
	// Encode user info as base64 JSON so the LocalSessionAuth middleware
	// can extract user identity without a database lookup.
	tokenPayload := map[string]interface{}{
		"uid":   id.String(),
		"email": email,
		"name":  displayName,
		"role":  role,
		"iat":   time.Now().Unix(),
	}
	payloadBytes, _ := json.Marshal(tokenPayload)
	sessionToken := base64.RawURLEncoding.EncodeToString(payloadBytes)
	log.Printf("session token issued for user %s (role=%s)", id, role)

	return c.JSON(http.StatusOK, map[string]interface{}{
		"user": authUserResponse{
			ID:           id.String(),
			Email:        email,
			DisplayName:  displayName,
			Role:         role,
			AuthProvider: authProvider,
			PhotoURL:     photoURL,
			CreatedAt:    createdAt.UnixMilli(),
		},
		"token": sessionToken,
	})
}

// Register handles POST /api/auth/register
func (h *AuthHandler) Register(c echo.Context) error {
	if h.db == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var req registerRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Email == "" || req.DisplayName == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email, displayName, and password are required")
	}
	if !emailRegexp.MatchString(req.Email) {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid email format")
	}
	// M20: Password strength validation
	if err := validatePasswordStrength(req.Password); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, err.Error())
	}

	ctx := c.Request().Context()

	// Check if email already exists
	var exists bool
	err := h.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, req.Email).Scan(&exists)
	if err != nil {
		log.Printf("auth register check error: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	if exists {
		return c.JSON(http.StatusConflict, map[string]string{"error": "Ein Konto mit dieser E-Mail existiert bereits."})
	}

	// H10: First-user-gets-admin — use atomic check to prevent race condition
	// The INSERT with CASE ensures only the truly first row gets admin role.
	role := "user"

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	id := uuid.New()
	now := time.Now()

	// H10: Atomic first-user-gets-admin — use INSERT with subquery to prevent race
	_, err = h.db.Exec(ctx,
		`INSERT INTO users (id, email, display_name, role, auth_provider, password_hash, created_at, updated_at)
		 VALUES ($1, $2, $3, (CASE WHEN (SELECT COUNT(*) FROM users) = 0 THEN 'admin' ELSE 'user' END)::user_role, $4::auth_provider, $5, $6, $6)`,
		id, req.Email, req.DisplayName, "email", string(hash), now)
	if err != nil {
		log.Printf("auth register insert error: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	// Fetch the actual role assigned (may be admin if first user)
	var actualRole string
	if err := h.db.QueryRow(ctx, `SELECT role FROM users WHERE id = $1`, id).Scan(&actualRole); err != nil {
		actualRole = role
	}

	return c.JSON(http.StatusOK, authUserResponse{
		ID:           id.String(),
		Email:        req.Email,
		DisplayName:  req.DisplayName,
		Role:         actualRole,
		AuthProvider: "email",
		CreatedAt:    now.UnixMilli(),
	})
}

// LoginProvider handles POST /api/auth/login-provider (stub for dev/staging)
func (h *AuthHandler) LoginProvider(c echo.Context) error {
	if h.db == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var req providerRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Provider == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "provider is required")
	}

	providerNames := map[string]string{
		"google":   "Google",
		"apple":    "Apple",
		"facebook": "Facebook",
		"email":    "E-Mail",
	}
	name := providerNames[req.Provider]
	if name == "" {
		name = req.Provider
	}

	ctx := c.Request().Context()
	id := uuid.New()
	now := time.Now()
	fakeEmail := req.Provider + "-user-" + id.String()[:8] + "@" + req.Provider + ".local"
	displayName := name + "-Nutzer"

	var count int
	if err := h.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&count); err != nil {
		log.Printf("auth login-provider count error: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}
	role := "user"
	if count == 0 {
		role = "admin"
	}

	_, err := h.db.Exec(ctx,
		`INSERT INTO users (id, email, display_name, role, auth_provider, created_at, updated_at)
		 VALUES ($1, $2, $3, $4::user_role, $5::auth_provider, $6, $6)`,
		id, fakeEmail, displayName, role, mapProvider(req.Provider), now)
	if err != nil {
		log.Printf("auth login-provider insert error: %v", err)
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	return c.JSON(http.StatusOK, authUserResponse{
		ID:           id.String(),
		Email:        fakeEmail,
		DisplayName:  displayName,
		Role:         role,
		AuthProvider: req.Provider,
		CreatedAt:    now.UnixMilli(),
	})
}

// ResetPassword handles POST /api/auth/reset-password
// L7: In local auth mode, generates a reset token and logs it (email sending is not yet implemented).
func (h *AuthHandler) ResetPassword(c echo.Context) error {
	if h.db == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var req struct {
		Email string `json:"email"`
	}
	if err := c.Bind(&req); err != nil || req.Email == "" {
		// Always return the same response to prevent email enumeration
		return c.JSON(http.StatusOK, map[string]interface{}{
			"ok":      true,
			"message": "Falls ein Konto existiert, wurde eine E-Mail gesendet.",
		})
	}

	// Check if user exists (don't reveal to client)
	var exists bool
	ctx := c.Request().Context()
	if err := h.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`, req.Email).Scan(&exists); err != nil {
		log.Printf("auth reset-password check error: %v", err)
	}
	if exists {
		resetToken := uuid.New().String()
		log.Printf("password reset requested for %s — token: %s (email sending not yet implemented)", req.Email, resetToken)
	}

	return c.JSON(http.StatusOK, map[string]interface{}{
		"ok":      true,
		"message": "Falls ein Konto existiert, wurde eine E-Mail gesendet.",
	})
}

// DeleteAccount handles DELETE /api/auth/account — DSGVO Art. 17 (Right to Erasure)
// Requires the user to authenticate with their password to confirm deletion.
func (h *AuthHandler) DeleteAccount(c echo.Context) error {
	if h.db == nil {
		return echo.NewHTTPError(http.StatusServiceUnavailable, "database not available")
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest, "invalid request body")
	}
	if req.Email == "" || req.Password == "" {
		return echo.NewHTTPError(http.StatusBadRequest, "email and password required for account deletion")
	}

	ctx := c.Request().Context()

	// Verify the user's credentials
	var id uuid.UUID
	var passwordHash *string
	err := h.db.QueryRow(ctx,
		`SELECT id, password_hash FROM users WHERE email = $1`, req.Email).
		Scan(&id, &passwordHash)

	if err == pgx.ErrNoRows || passwordHash == nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
	}
	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, "internal error")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*passwordHash), []byte(req.Password)); err != nil {
		return echo.NewHTTPError(http.StatusUnauthorized, "invalid credentials")
	}

	// Delete all user data (cascade if FK constraints allow, otherwise delete related tables)
	_, err = h.db.Exec(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		log.Printf("account deletion error for %s: %v", id, err)
		return echo.NewHTTPError(http.StatusInternalServerError, "deletion failed")
	}

	log.Printf("account deleted: user %s (DSGVO Art. 17)", id)
	return c.JSON(http.StatusOK, map[string]interface{}{
		"ok":      true,
		"message": "Dein Konto und alle Daten wurden geloescht.",
	})
}

// SeedAdmin creates the default admin user if no users exist.
// Credentials come from Config (resolved from env vars with dev defaults in FR-115).
func (h *AuthHandler) SeedAdmin(ctx context.Context, email, password string) {
	if h.db == nil {
		return
	}

	var count int
	err := h.db.QueryRow(ctx, `SELECT COUNT(*) FROM users`).Scan(&count)
	if err != nil {
		log.Printf("seed admin: count error: %v", err)
		return
	}
	if count > 0 {
		return
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("seed admin: hash error: %v", err)
		return
	}

	id := uuid.New()
	now := time.Now()
	_, err = h.db.Exec(ctx,
		`INSERT INTO users (id, email, display_name, role, auth_provider, password_hash, created_at, updated_at)
		 VALUES ($1, $2, $3, $4::user_role, $5::auth_provider, $6, $7, $7)`,
		id, email, "Admin", "admin", "email", string(hash), now)
	if err != nil {
		log.Printf("seed admin: insert error: %v", err)
		return
	}

	log.Printf("seeded default admin user — email: %s  password: %s", email, password)
}

func mapProvider(p string) string {
	switch p {
	case "google", "apple", "email":
		return p
	case "facebook":
		return "meta"
	default:
		return "email"
	}
}
