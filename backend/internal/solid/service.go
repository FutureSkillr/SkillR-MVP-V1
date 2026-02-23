package solid

import (
	"context"
	"fmt"
	"log"
	"net/url"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Service orchestrates Pod connection, disconnection, and sync.
type Service struct {
	client Client
	db     *pgxpool.Pool
}

// NewService creates a new Solid Pod service.
func NewService(client Client, db *pgxpool.Pool) *Service {
	return &Service{client: client, db: db}
}

// SetDB updates the database pool (supports delayed connection pattern from main.go).
func (s *Service) SetDB(db *pgxpool.Pool) {
	s.db = db
}

// Connect creates a Pod for the user and initializes the container structure.
func (s *Service) Connect(ctx context.Context, userID string, req ConnectRequest) (*PodConnection, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not available")
	}

	podURL := req.PodURL
	provider := req.Provider
	if provider == "" {
		provider = PodProviderManaged
	}

	// For managed provider, construct Pod URL from base + userID
	if provider == PodProviderManaged && podURL == "" {
		return nil, fmt.Errorf("podUrl is required")
	}

	username := sanitizeUsername(userID)
	// Store only the relative path so sync uses client.baseURL + path (no double-host)
	podPath := "/" + username
	webID := podURL + podPath + "/profile/card#me"

	// Initialize Pod container structure
	if err := s.initializePodStructure(ctx, username); err != nil {
		return nil, fmt.Errorf("initialize pod structure: %w", err)
	}

	// Persist connection in database — store relative path, not full URL
	now := time.Now().UTC()
	_, err := s.db.Exec(ctx,
		`UPDATE users SET pod_url=$1, pod_webid=$2, pod_provider=$3, pod_connected_at=$4, pod_sync_status='connected' WHERE id=$5`,
		podPath, webID, string(provider), now, userID,
	)
	if err != nil {
		return nil, fmt.Errorf("save pod connection: %w", err)
	}

	return &PodConnection{
		UserID:      userID,
		PodURL:      podURL + podPath,
		WebID:       webID,
		Provider:    provider,
		ConnectedAt: &now,
		SyncStatus:  "connected",
	}, nil
}

// Disconnect removes the user's Pod connection.
func (s *Service) Disconnect(ctx context.Context, userID string) error {
	if s.db == nil {
		return fmt.Errorf("database not available")
	}

	_, err := s.db.Exec(ctx,
		`UPDATE users SET pod_url=NULL, pod_webid=NULL, pod_provider='none', pod_connected_at=NULL, pod_last_synced_at=NULL, pod_sync_status='none' WHERE id=$1`,
		userID,
	)
	if err != nil {
		return fmt.Errorf("disconnect pod: %w", err)
	}
	return nil
}

// Status returns the user's current Pod connection status.
func (s *Service) Status(ctx context.Context, userID string) (*PodStatus, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not available")
	}

	var podURL, webID, provider, syncStatus *string
	var connectedAt, lastSyncedAt *time.Time

	err := s.db.QueryRow(ctx,
		`SELECT pod_url, pod_webid, pod_provider, pod_connected_at, pod_last_synced_at, pod_sync_status FROM users WHERE id=$1`,
		userID,
	).Scan(&podURL, &webID, &provider, &connectedAt, &lastSyncedAt, &syncStatus)
	if err != nil {
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

	return status, nil
}

// Sync pushes current app state to the user's Pod.
func (s *Service) Sync(ctx context.Context, userID string, req SyncRequest) (*SyncResult, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not available")
	}

	// Get Pod path (relative path like /af95a07c-.../; older rows may contain full URLs)
	var podURL *string
	err := s.db.QueryRow(ctx, `SELECT pod_url FROM users WHERE id=$1`, userID).Scan(&podURL)
	if err != nil {
		return nil, fmt.Errorf("query pod url: %w", err)
	}
	if podURL == nil || *podURL == "" {
		return nil, fmt.Errorf("no pod connected")
	}

	// Normalize: strip scheme+host if a full URL was stored (legacy data)
	podPath := normalizePodPath(*podURL)

	result := &SyncResult{Errors: []string{}}

	// Full overwrite: wipe all known resources, then recreate from scratch.
	// CSS does not support recursive DELETE on non-empty containers, so we
	// delete resources first (leaves), then containers bottom-up.
	s.wipePodContents(ctx, podPath)

	// 1. Sync user profile
	if err := s.syncUserProfile(ctx, userID, podPath); err != nil {
		log.Printf("pod sync: user profile error: %v", err)
		result.Errors = append(result.Errors, fmt.Sprintf("profile: %v", err))
	} else {
		result.SyncedEntities++
	}

	// 2. Sync skill profile
	if err := s.syncSkillProfile(ctx, userID, podPath); err != nil {
		log.Printf("pod sync: skill profile error: %v", err)
		result.Errors = append(result.Errors, fmt.Sprintf("skill-profile: %v", err))
	} else {
		result.SyncedEntities++
	}

	// 3. Sync engagement (from request body, not DB)
	if req.Engagement != nil {
		turtle := SerializeEngagement(*req.Engagement)
		if err := s.client.PutResource(ctx, podPath+"/profile/engagement", turtle); err != nil {
			log.Printf("pod sync: engagement error: %v", err)
			result.Errors = append(result.Errors, fmt.Sprintf("engagement: %v", err))
		} else {
			result.SyncedEntities++
		}
	}

	// 4. Sync journey progress (from request body, not DB)
	if req.JourneyProgress != nil {
		turtle := SerializeJourneyProgress(*req.JourneyProgress)
		if err := s.client.PutResource(ctx, podPath+"/journey/vuca-state", turtle); err != nil {
			log.Printf("pod sync: journey progress error: %v", err)
			result.Errors = append(result.Errors, fmt.Sprintf("journey: %v", err))
		} else {
			result.SyncedEntities++
		}
	}

	// 5. Sync reflections
	if err := s.syncReflections(ctx, userID, podPath); err != nil {
		log.Printf("pod sync: reflections error: %v", err)
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
		log.Printf("pod sync: update sync status error: %v", dbErr)
	}

	return result, nil
}

// Data reads Pod contents and returns them as structured JSON.
func (s *Service) Data(ctx context.Context, userID string) (*PodData, error) {
	if s.db == nil {
		return nil, fmt.Errorf("database not available")
	}

	var podURL *string
	err := s.db.QueryRow(ctx, `SELECT pod_url FROM users WHERE id=$1`, userID).Scan(&podURL)
	if err != nil {
		return nil, fmt.Errorf("query pod url: %w", err)
	}
	if podURL == nil || *podURL == "" {
		return nil, fmt.Errorf("no pod connected")
	}

	podPath := normalizePodPath(*podURL)

	data := &PodData{
		Profile: make(map[string]any),
		Journey: make(map[string]any),
	}

	// Read profile resources
	for _, resource := range []string{"state", "skill-profile", "engagement"} {
		content, err := s.client.GetResource(ctx, podPath+"/profile/"+resource)
		if err != nil {
			log.Printf("pod data: read %s: %v", resource, err)
			continue
		}
		data.Profile[resource] = content
	}

	// Read journey state
	content, err := s.client.GetResource(ctx, podPath+"/journey/vuca-state")
	if err != nil {
		log.Printf("pod data: read journey: %v", err)
	} else {
		data.Journey["vuca-state"] = content
	}

	return data, nil
}

// initializePodStructure creates the container hierarchy for a new Pod.
func (s *Service) initializePodStructure(ctx context.Context, username string) error {
	containers := []string{
		"/" + username,
		"/" + username + "/profile",
		"/" + username + "/journey",
		"/" + username + "/journal",
		"/" + username + "/journal/reflections",
	}

	for _, container := range containers {
		if err := s.client.CreateContainer(ctx, container); err != nil {
			return fmt.Errorf("create %s: %w", container, err)
		}
	}

	// Create minimal WebID profile card
	card := turtlePrefixes() +
		fmt.Sprintf("<#me> a foaf:Person ;\n    foaf:name %q .\n", username)
	if err := s.client.PutResource(ctx, "/"+username+"/profile/card", card); err != nil {
		return fmt.Errorf("create profile card: %w", err)
	}

	return nil
}

// wipePodContents removes all known resources and containers from the Pod
// in leaf-to-root order. CSS requires containers to be empty before deletion,
// so we delete resources first, then containers from deepest to shallowest.
// Errors are logged but not fatal — resources may not exist (first sync).
func (s *Service) wipePodContents(ctx context.Context, podPath string) {
	// 1. Delete known resource files (leaves)
	resources := []string{
		podPath + "/profile/card",
		podPath + "/profile/state",
		podPath + "/profile/skill-profile",
		podPath + "/profile/engagement",
		podPath + "/journey/vuca-state",
	}

	// Also delete any reflections currently in the DB (they'll be re-created).
	// Reflections not in the DB but still in the pod will remain — but since
	// we also delete the reflections container itself, CSS will reject that
	// only if unknown reflections exist. We query known IDs to clean them.
	if s.db != nil {
		rows, err := s.db.Query(ctx, `SELECT id FROM reflections WHERE user_id=$1`, podPath[1:])
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
		if err := s.client.DeleteResource(ctx, r); err != nil {
			log.Printf("pod wipe: delete %s: %v", r, err)
		}
	}

	// 2. Delete containers bottom-up (deepest first)
	containers := []string{
		podPath + "/journal/reflections",
		podPath + "/journal",
		podPath + "/journey",
		podPath + "/profile",
	}
	for _, c := range containers {
		if err := s.client.DeleteResource(ctx, c+"/"); err != nil {
			log.Printf("pod wipe: delete container %s: %v", c, err)
		}
	}
	// Note: we keep the root container (podPath/) so the Pod identity persists.
}

func (s *Service) syncUserProfile(ctx context.Context, userID, podURL string) error {
	var user UserRow
	err := s.db.QueryRow(ctx,
		`SELECT id, COALESCE(email,''), COALESCE(display_name,'') FROM users WHERE id=$1`,
		userID,
	).Scan(&user.ID, &user.Email, &user.Name)
	if err != nil {
		return fmt.Errorf("read user: %w", err)
	}

	turtle := SerializeUserProfile(user)
	return s.client.PutResource(ctx, podURL+"/profile/state", turtle)
}

func (s *Service) syncSkillProfile(ctx context.Context, userID, podURL string) error {
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
	return s.client.PutResource(ctx, podURL+"/profile/skill-profile", turtle)
}

func (s *Service) syncReflections(ctx context.Context, userID, podURL string) error {
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
		if err := s.client.PutResource(ctx, podURL+"/journal/reflections/"+r.ID, turtle); err != nil {
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
