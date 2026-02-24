package solid

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/url"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ErrNotReady is returned when the Pod service has no database connection.
var ErrNotReady = errors.New("pod: not ready")

// Service orchestrates Pod connection, disconnection, and sync.
type Service struct {
	client     Client
	db         *pgxpool.Pool
	cssBaseURL string // base URL of the managed CSS instance (e.g. http://localhost:3003)
	// extClients caches authenticated HTTPClients for external pods (keyed by userID).
	// The cache persists for the lifetime of the service (server restart clears it).
	extClients map[string]*HTTPClient
}

// NewService creates a new Solid Pod service.
// cssBaseURL is the externally-visible base URL of the managed CSS instance.
func NewService(client Client, db *pgxpool.Pool, cssBaseURL string) *Service {
	log.Printf("[pod] service created (db=%v cssBaseURL=%s)", db != nil, cssBaseURL)
	return &Service{client: client, db: db, cssBaseURL: strings.TrimRight(cssBaseURL, "/"), extClients: make(map[string]*HTTPClient)}
}

// CSSBaseURL returns the externally-visible base URL of the managed CSS instance.
func (s *Service) CSSBaseURL() string {
	return s.cssBaseURL
}

// SetDB updates the database pool (supports delayed connection pattern from main.go).
func (s *Service) SetDB(db *pgxpool.Pool) {
	log.Printf("[pod] SetDB (db=%v)", db != nil)
	s.db = db
}

// Ready returns true when the service has a database connection and can serve requests.
func (s *Service) Ready() bool {
	return s.db != nil
}

// PingCSS checks whether the CSS (Community Solid Server) is reachable.
func (s *Service) PingCSS(ctx context.Context) error {
	log.Printf("[pod] PingCSS")
	if err := s.client.Ping(ctx); err != nil {
		log.Printf("[pod] WARN PingCSS: %v", err)
		return err
	}
	log.Printf("[pod] PingCSS: ok")
	return nil
}

// podContext holds the resolved client and pod path for a user's Pod.
// For managed pods, it uses the service's built-in CSS client.
// For external pods, it creates a dynamic HTTPClient from the stored URL.
type podContext struct {
	client  Client
	podPath string
}

// resolveClient determines the correct Client and pod path for a user's Pod.
func (s *Service) resolveClient(ctx context.Context, userID string) (*podContext, error) {
	if s.db == nil {
		return nil, ErrNotReady
	}

	var podURL, provider *string
	err := s.db.QueryRow(ctx,
		`SELECT pod_url, pod_provider FROM users WHERE id=$1`, userID,
	).Scan(&podURL, &provider)
	if err != nil {
		return nil, fmt.Errorf("query pod: %w", err)
	}
	if podURL == nil || *podURL == "" {
		return nil, fmt.Errorf("no pod connected")
	}

	if provider != nil && PodProvider(*provider) == PodProviderExternal {
		parsed, err := url.Parse(*podURL)
		if err != nil {
			return nil, fmt.Errorf("parse external pod url: %w", err)
		}

		// Use cached authenticated client if available (set during Connect)
		if cached, ok := s.extClients[userID]; ok {
			log.Printf("[pod] resolveClient: external (cached auth) path=%s", parsed.Path)
			return &podContext{
				client:  cached,
				podPath: parsed.Path,
			}, nil
		}

		baseURL := parsed.Scheme + "://" + parsed.Host
		log.Printf("[pod] resolveClient: external baseURL=%s path=%s", baseURL, parsed.Path)
		return &podContext{
			client:  NewHTTPClient(baseURL),
			podPath: parsed.Path,
		}, nil
	}

	// Managed: use built-in CSS client with relative path
	return &podContext{
		client:  s.client,
		podPath: normalizePodPath(*podURL),
	}, nil
}

// ResolveUserID converts a middleware UID (Firebase UID or local auth UUID) into
// the users.id UUID. Firebase UIDs are not UUIDs, so we look them up via
// the firebase_uid column. If the Firebase user has no users row yet, one is
// auto-provisioned so that Pod operations can persist connection state.
//
// For local auth users the UID is already a valid UUID and is returned directly.
func (s *Service) ResolveUserID(ctx context.Context, uid, email, displayName string) (string, error) {
	// If uid is already a valid UUID, it's a local auth user — use directly.
	// The downstream queries will return ErrNoRows if the user doesn't exist.
	if _, err := uuid.Parse(uid); err == nil {
		log.Printf("[pod] ResolveUserID: local auth user=%s", uid)
		return uid, nil
	}

	// Firebase UID — need DB to resolve
	if s.db == nil {
		return "", ErrNotReady
	}

	// Look up by firebase_uid column
	var userID string
	err := s.db.QueryRow(ctx,
		`SELECT id FROM users WHERE firebase_uid=$1`, uid,
	).Scan(&userID)
	if err == nil {
		log.Printf("[pod] ResolveUserID: firebase_uid=%s -> id=%s", uid, userID)
		return userID, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", fmt.Errorf("resolve user: %w", err)
	}

	// No row with this firebase_uid — check if email already exists (local auth account)
	if email != "" {
		err = s.db.QueryRow(ctx,
			`SELECT id FROM users WHERE email=$1`, email,
		).Scan(&userID)
		if err == nil {
			// Email exists but firebase_uid not linked — link it now
			log.Printf("[pod] ResolveUserID: linking firebase_uid=%s to existing user=%s (email=%s)", uid, userID, email)
			_, linkErr := s.db.Exec(ctx,
				`UPDATE users SET firebase_uid=$1 WHERE id=$2 AND firebase_uid IS NULL`,
				uid, userID,
			)
			if linkErr != nil {
				log.Printf("[pod] WARN ResolveUserID: link failed: %v", linkErr)
			}
			return userID, nil
		}
	}

	// No users row at all — auto-provision
	log.Printf("[pod] ResolveUserID: auto-provisioning user for firebase_uid=%s email=%s", uid, email)
	err = s.db.QueryRow(ctx,
		`INSERT INTO users (firebase_uid, email, display_name, auth_provider)
		 VALUES ($1, $2, $3, 'google'::auth_provider)
		 RETURNING id`,
		uid, email, displayName,
	).Scan(&userID)
	if err != nil {
		return "", fmt.Errorf("auto-provision user: %w", err)
	}
	log.Printf("[pod] ResolveUserID: provisioned user=%s for firebase_uid=%s", userID, uid)
	return userID, nil
}

// Connect creates a Pod for the user and initializes the container structure.
// For managed pods: uses the built-in CSS client, creates container hierarchy, stores relative path.
// For external pods: creates a dynamic client, initializes SkillR containers, stores full URL.
func (s *Service) Connect(ctx context.Context, userID string, req ConnectRequest) (*PodConnection, error) {
	log.Printf("[pod] Connect: user=%s provider=%s", userID, req.Provider)
	if s.db == nil {
		return nil, ErrNotReady
	}

	podURL := req.PodURL
	provider := req.Provider
	if provider == "" {
		provider = PodProviderManaged
	}
	if podURL == "" {
		return nil, fmt.Errorf("podUrl is required")
	}

	var (
		storedURL  string // what goes in the DB
		displayURL string // what goes in the response
		webID      string
	)

	switch provider {
	case PodProviderExternal:
		// External pod: create dynamic client, ping remote, authenticate, init containers
		parsed, err := url.Parse(podURL)
		if err != nil {
			return nil, fmt.Errorf("parse pod url: %w", err)
		}
		baseURL := parsed.Scheme + "://" + parsed.Host
		extClient := NewHTTPClient(baseURL)

		if err := extClient.Ping(ctx); err != nil {
			return nil, fmt.Errorf("pod server not reachable: %w", err)
		}

		// Authenticate with CSS account if credentials provided
		if req.Email != "" && req.Password != "" {
			if err := extClient.Authenticate(ctx, req.Email, req.Password); err != nil {
				return nil, fmt.Errorf("external pod authentication failed: %w", err)
			}
			// Cache the authenticated client for Sync/Data operations
			s.extClients[userID] = extClient
		}

		podPath := strings.TrimRight(parsed.Path, "/")
		cleanURL := strings.TrimRight(podURL, "/")
		webID = cleanURL + "/profile/card#me"
		storedURL = cleanURL // full URL for external
		displayURL = cleanURL

		// Initialize SkillR container structure inside the external pod.
		// Containers may already exist — CreateContainer handles 409.
		if err := s.initPodContainers(ctx, extClient, podPath); err != nil {
			log.Printf("[pod] WARN external pod init: %v", err)
			// Don't fail — the pod may have a different structure or auth
		}

	default: // managed
		if err := s.client.Ping(ctx); err != nil {
			return nil, fmt.Errorf("pod server not reachable: %w", err)
		}

		username := sanitizeUsername(userID)
		podPath := "/" + username
		// Use the service's known CSS base URL — not the frontend-sent podUrl
		base := s.cssBaseURL
		if base == "" {
			base = podURL // fallback to frontend-provided URL
		}
		webID = base + podPath + "/profile/card#me"
		storedURL = podPath        // relative path for managed
		displayURL = base + podPath

		if err := s.initPodContainers(ctx, s.client, podPath); err != nil {
			return nil, fmt.Errorf("initialize pod structure: %w", err)
		}
	}

	// Persist connection in database
	now := time.Now().UTC()
	_, err := s.db.Exec(ctx,
		`UPDATE users SET pod_url=$1, pod_webid=$2, pod_provider=$3, pod_connected_at=$4, pod_sync_status='connected' WHERE id=$5`,
		storedURL, webID, string(provider), now, userID,
	)
	if err != nil {
		log.Printf("[pod] ERROR Connect: %v", err)
		return nil, fmt.Errorf("save pod connection: %w", err)
	}

	log.Printf("[pod] Connect: ok user=%s provider=%s", userID, provider)
	return &PodConnection{
		UserID:      userID,
		PodURL:      displayURL,
		WebID:       webID,
		Provider:    provider,
		ConnectedAt: &now,
		SyncStatus:  "connected",
	}, nil
}

// Disconnect removes the user's Pod connection.
func (s *Service) Disconnect(ctx context.Context, userID string) error {
	log.Printf("[pod] Disconnect: user=%s", userID)
	if s.db == nil {
		return ErrNotReady
	}

	// Clear cached auth client for external pods
	delete(s.extClients, userID)

	_, err := s.db.Exec(ctx,
		`UPDATE users SET pod_url=NULL, pod_webid=NULL, pod_provider='none', pod_connected_at=NULL, pod_last_synced_at=NULL, pod_sync_status='none' WHERE id=$1`,
		userID,
	)
	if err != nil {
		return fmt.Errorf("disconnect pod: %w", err)
	}
	log.Printf("[pod] Disconnect: ok user=%s", userID)
	return nil
}

// Status returns the user's current Pod connection status.
func (s *Service) Status(ctx context.Context, userID string) (*PodStatus, error) {
	log.Printf("[pod] Status: user=%s", userID)
	if s.db == nil {
		return nil, ErrNotReady
	}

	var podURL, webID, provider, syncStatus *string
	var connectedAt, lastSyncedAt *time.Time

	err := s.db.QueryRow(ctx,
		`SELECT pod_url, pod_webid, pod_provider, pod_connected_at, pod_last_synced_at, pod_sync_status FROM users WHERE id=$1`,
		userID,
	).Scan(&podURL, &webID, &provider, &connectedAt, &lastSyncedAt, &syncStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return &PodStatus{
				Connected:  false,
				Provider:   PodProviderNone,
				SyncStatus: "none",
			}, nil
		}
		return nil, fmt.Errorf("query pod status: %w", err)
	}

	status := &PodStatus{
		Connected:    podURL != nil && *podURL != "",
		Provider:     PodProviderNone,
		SyncStatus:   "none",
	}
	if podURL != nil {
		status.PodURL = *podURL
	}
	if webID != nil {
		status.WebID = *webID
	}
	if provider != nil {
		status.Provider = PodProvider(*provider)
	}
	if connectedAt != nil {
		status.ConnectedAt = connectedAt
	}
	if lastSyncedAt != nil {
		status.LastSyncedAt = lastSyncedAt
	}
	if syncStatus != nil {
		status.SyncStatus = *syncStatus
	}

	log.Printf("[pod] Status: user=%s connected=%v", userID, status.Connected)
	return status, nil
}

// Sync pushes current app state to the user's Pod.
// Uses resolveClient to determine the correct client (managed CSS or external).
func (s *Service) Sync(ctx context.Context, userID string, req SyncRequest) (*SyncResult, error) {
	log.Printf("[pod] Sync: user=%s", userID)
	if s.db == nil {
		return nil, ErrNotReady
	}

	pctx, err := s.resolveClient(ctx, userID)
	if err != nil {
		return nil, err
	}
	c := pctx.client
	podPath := pctx.podPath

	result := &SyncResult{Errors: []string{}}

	// Full overwrite: wipe all known resources, then recreate from scratch.
	// CSS does not support recursive DELETE on non-empty containers, so we
	// delete resources first (leaves), then containers bottom-up.
	s.wipePodContents(ctx, c, podPath, userID)

	// 1. Sync user profile
	if err := s.syncUserProfile(ctx, c, userID, podPath); err != nil {
		log.Printf("[pod] WARN sync user profile: %v", err)
		result.Errors = append(result.Errors, fmt.Sprintf("profile: %v", err))
	} else {
		result.SyncedEntities++
	}

	// 2. Sync skill profile
	if err := s.syncSkillProfile(ctx, c, userID, podPath); err != nil {
		log.Printf("[pod] WARN sync skill profile: %v", err)
		result.Errors = append(result.Errors, fmt.Sprintf("skill-profile: %v", err))
	} else {
		result.SyncedEntities++
	}

	// 3. Sync engagement (from request body, not DB)
	if req.Engagement != nil {
		turtle := SerializeEngagement(*req.Engagement)
		if err := c.PutResource(ctx, podPath+"/profile/engagement", turtle); err != nil {
			log.Printf("[pod] WARN sync engagement: %v", err)
			result.Errors = append(result.Errors, fmt.Sprintf("engagement: %v", err))
		} else {
			result.SyncedEntities++
		}
	}

	// 4. Sync journey progress (from request body, not DB)
	if req.JourneyProgress != nil {
		turtle := SerializeJourneyProgress(*req.JourneyProgress)
		if err := c.PutResource(ctx, podPath+"/journey/vuca-state", turtle); err != nil {
			log.Printf("[pod] WARN sync journey progress: %v", err)
			result.Errors = append(result.Errors, fmt.Sprintf("journey: %v", err))
		} else {
			result.SyncedEntities++
		}
	}

	// 5. Sync reflections
	if err := s.syncReflections(ctx, c, userID, podPath); err != nil {
		log.Printf("[pod] WARN sync reflections: %v", err)
		result.Errors = append(result.Errors, fmt.Sprintf("reflections: %v", err))
	} else {
		result.SyncedEntities++
	}

	// Update last synced timestamp
	now := time.Now().UTC()
	result.LastSyncedAt = now
	syncStatus := "synced"
	if len(result.Errors) > 0 {
		syncStatus = "partial"
	}

	_, dbErr := s.db.Exec(ctx,
		`UPDATE users SET pod_last_synced_at=$1, pod_sync_status=$2 WHERE id=$3`,
		now, syncStatus, userID,
	)
	if dbErr != nil {
		log.Printf("[pod] WARN sync update status: %v", dbErr)
	}

	log.Printf("[pod] Sync: user=%s synced=%d errors=%d", userID, result.SyncedEntities, len(result.Errors))
	return result, nil
}

// Data reads Pod contents and returns them as structured JSON.
// Uses resolveClient to determine the correct client (managed CSS or external).
func (s *Service) Data(ctx context.Context, userID string) (*PodData, error) {
	log.Printf("[pod] Data: user=%s", userID)
	if s.db == nil {
		return nil, ErrNotReady
	}

	pctx, err := s.resolveClient(ctx, userID)
	if err != nil {
		return nil, err
	}
	c := pctx.client
	podPath := pctx.podPath

	data := &PodData{
		Profile: make(map[string]any),
		Journey: make(map[string]any),
	}

	// Read profile resources
	for _, resource := range []string{"state", "skill-profile", "engagement"} {
		content, err := c.GetResource(ctx, podPath+"/profile/"+resource)
		if err != nil {
			log.Printf("[pod] WARN data read %s: %v", resource, err)
			continue
		}
		data.Profile[resource] = content
	}

	// Read journey state
	content, err := c.GetResource(ctx, podPath+"/journey/vuca-state")
	if err != nil {
		log.Printf("[pod] WARN data read journey: %v", err)
	} else {
		data.Journey["vuca-state"] = content
	}

	log.Printf("[pod] Data: user=%s profileKeys=%d journeyKeys=%d", userID, len(data.Profile), len(data.Journey))
	return data, nil
}

// initPodContainers creates the SkillR container hierarchy inside a Pod.
// Works with any Client (managed CSS or external pod server).
func (s *Service) initPodContainers(ctx context.Context, c Client, basePath string) error {
	containers := []string{
		basePath,
		basePath + "/profile",
		basePath + "/journey",
		basePath + "/journal",
		basePath + "/journal/reflections",
	}

	for _, container := range containers {
		if err := c.CreateContainer(ctx, container); err != nil {
			return fmt.Errorf("create %s: %w", container, err)
		}
	}

	// Create minimal WebID profile card
	name := basePath
	if len(name) > 0 && name[0] == '/' {
		name = name[1:]
	}
	card := turtlePrefixes() +
		fmt.Sprintf("<#me> a foaf:Person ;\n    foaf:name %q .\n", name)
	if err := c.PutResource(ctx, basePath+"/profile/card", card); err != nil {
		return fmt.Errorf("create profile card: %w", err)
	}

	return nil
}

// initializePodStructure creates the container hierarchy using the built-in CSS client.
// Kept for backward compatibility with existing integration tests.
func (s *Service) initializePodStructure(ctx context.Context, username string) error {
	return s.initPodContainers(ctx, s.client, "/"+username)
}

// wipePodContents removes all known resources and containers from the Pod
// in leaf-to-root order. CSS requires containers to be empty before deletion,
// so we delete resources first, then containers from deepest to shallowest.
// Errors are logged but not fatal — resources may not exist (first sync).
func (s *Service) wipePodContents(ctx context.Context, c Client, podPath string, userID string) {
	// 1. Delete known resource files (leaves)
	resources := []string{
		podPath + "/profile/card",
		podPath + "/profile/state",
		podPath + "/profile/skill-profile",
		podPath + "/profile/engagement",
		podPath + "/journey/vuca-state",
	}

	// Also delete any reflections currently in the DB (they'll be re-created).
	if s.db != nil {
		rows, err := s.db.Query(ctx, `SELECT id FROM reflections WHERE user_id=$1`, userID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var id string
				if rows.Scan(&id) == nil {
					resources = append(resources, podPath+"/journal/reflections/"+id)
				}
			}
		}
	}

	for _, r := range resources {
		if err := c.DeleteResource(ctx, r); err != nil {
			log.Printf("[pod] WARN wipe delete %s: %v", r, err)
		}
	}

	// 2. Delete containers bottom-up (deepest first)
	containers := []string{
		podPath + "/journal/reflections",
		podPath + "/journal",
		podPath + "/journey",
		podPath + "/profile",
	}
	for _, cont := range containers {
		if err := c.DeleteResource(ctx, cont+"/"); err != nil {
			log.Printf("[pod] WARN wipe delete container %s: %v", cont, err)
		}
	}
	// Note: we keep the root container (podPath/) so the Pod identity persists.
}

func (s *Service) syncUserProfile(ctx context.Context, c Client, userID, podPath string) error {
	var user UserRow
	err := s.db.QueryRow(ctx,
		`SELECT id, COALESCE(email,''), COALESCE(display_name,'') FROM users WHERE id=$1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Name)
	if err != nil {
		return fmt.Errorf("read user: %w", err)
	}

	turtle := SerializeUserProfile(user)
	return c.PutResource(ctx, podPath+"/profile/state", turtle)
}

func (s *Service) syncSkillProfile(ctx context.Context, c Client, userID, podPath string) error {
	var sp SkillProfileRow
	err := s.db.QueryRow(ctx,
		`SELECT id, user_id, skill_categories, created_at FROM skill_profiles WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`,
		userID,
	).Scan(&sp.ID, &sp.UserID, &sp.Categories, &sp.CreatedAt)
	if err != nil {
		// No skill profile yet — not an error
		return nil
	}

	turtle := SerializeSkillProfile(sp)
	return c.PutResource(ctx, podPath+"/profile/skill-profile", turtle)
}

func (s *Service) syncReflections(ctx context.Context, c Client, userID, podPath string) error {
	rows, err := s.db.Query(ctx,
		`SELECT id, user_id, question_id, response, capability_scores, created_at FROM reflections WHERE user_id=$1`,
		userID,
	)
	if err != nil {
		return fmt.Errorf("query reflections: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var r ReflectionRow
		if err := rows.Scan(&r.ID, &r.UserID, &r.QuestionID, &r.Response, &r.CapabilityScores, &r.CreatedAt); err != nil {
			return fmt.Errorf("scan reflection: %w", err)
		}
		turtle := SerializeReflection(r)
		if err := c.PutResource(ctx, podPath+"/journal/reflections/"+r.ID, turtle); err != nil {
			return fmt.Errorf("put reflection %s: %w", r.ID, err)
		}
	}

	return rows.Err()
}

// normalizePodPath extracts the path component from a pod_url value.
// New connections store a relative path (e.g. "/af95a07c-..."), but legacy
// rows may contain a full URL (e.g. "http://localhost:3000/af95a07c-...").
// Stripping the scheme+host prevents double-host URLs when the client
// prepends its own baseURL.
func normalizePodPath(raw string) string {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Host == "" {
		// Already a relative path
		return raw
	}
	// Full URL — extract just the path
	return parsed.Path
}

// sanitizeUsername creates a URL-safe Pod username from a user ID.
func sanitizeUsername(userID string) string {
	// Replace non-alphanumeric characters with hyphens
	var b []byte
	for _, c := range []byte(userID) {
		if (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c == '-' {
			b = append(b, c)
		} else {
			b = append(b, '-')
		}
	}
	return string(b)
}
