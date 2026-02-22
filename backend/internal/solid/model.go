package solid

import (
	"fmt"
	"net/url"
	"strings"
	"time"
)

const (
	// maxPodURLLength limits the Pod URL to prevent abuse.
	maxPodURLLength = 512
	// maxSyncTitleLength limits the engagement title length.
	maxSyncTitleLength = 100
	// maxJourneyTypes limits the number of journey types in a sync request.
	maxJourneyTypes = 20
	// maxDimensionScores limits dimension score entries per journey type.
	maxDimensionScores = 50
)

// PodProvider identifies where the user's Pod is hosted.
type PodProvider string

const (
	PodProviderNone     PodProvider = "none"
	PodProviderManaged  PodProvider = "managed"  // local CSS instance
	PodProviderExternal PodProvider = "external" // user-provided external Pod
)

// PodConnection represents a user's Pod connection state in PostgreSQL.
type PodConnection struct {
	UserID       string      `json:"userId"`
	PodURL       string      `json:"podUrl"`
	WebID        string      `json:"webId"`
	Provider     PodProvider `json:"provider"`
	ConnectedAt  *time.Time  `json:"connectedAt"`
	LastSyncedAt *time.Time  `json:"lastSyncedAt,omitempty"`
	SyncStatus   string      `json:"syncStatus"`
}

// ConnectRequest is the payload for POST /api/v1/pod/connect.
type ConnectRequest struct {
	Provider PodProvider `json:"provider"`
	PodURL   string      `json:"podUrl,omitempty"` // required for external provider
}

// Validate checks the connect request for valid provider and URL format.
func (r *ConnectRequest) Validate() error {
	switch r.Provider {
	case PodProviderManaged, PodProviderExternal:
		// valid
	case "":
		r.Provider = PodProviderManaged
	default:
		return fmt.Errorf("invalid provider: must be 'managed' or 'external'")
	}

	if r.PodURL == "" {
		return fmt.Errorf("podUrl is required")
	}

	if len(r.PodURL) > maxPodURLLength {
		return fmt.Errorf("podUrl too long (max %d characters)", maxPodURLLength)
	}

	parsed, err := url.Parse(r.PodURL)
	if err != nil {
		return fmt.Errorf("podUrl is not a valid URL")
	}

	if parsed.Scheme != "http" && parsed.Scheme != "https" {
		return fmt.Errorf("podUrl must use http or https scheme")
	}

	if parsed.Host == "" {
		return fmt.Errorf("podUrl must have a host")
	}

	// Block obvious internal network targets (SSRF prevention)
	host := strings.ToLower(parsed.Hostname())
	if isBlockedHost(host) {
		return fmt.Errorf("podUrl cannot target internal addresses")
	}

	return nil
}

// isBlockedHost checks for internal/private network hostnames (SSRF prevention).
func isBlockedHost(host string) bool {
	blocked := []string{
		"169.254.169.254", // cloud metadata
		"metadata.google.internal",
		"metadata.google",
		"10.", // RFC 1918
		"192.168.",
		"172.16.", "172.17.", "172.18.", "172.19.",
		"172.20.", "172.21.", "172.22.", "172.23.",
		"172.24.", "172.25.", "172.26.", "172.27.",
		"172.28.", "172.29.", "172.30.", "172.31.",
		"0.0.0.0",
		"[::1]", "::1",
	}
	// Allow localhost only — CSS dev server runs there
	// but block cloud metadata and private networks
	for _, prefix := range blocked {
		if strings.HasPrefix(host, prefix) {
			return true
		}
	}
	return false
}

// SyncRequest is the payload for POST /api/v1/pod/sync.
// Frontend sends engagement + journey state that is not in the database.
type SyncRequest struct {
	Engagement      *EngagementData      `json:"engagement,omitempty"`
	JourneyProgress *JourneyProgressData `json:"journeyProgress,omitempty"`
}

// Validate checks the sync request for reasonable bounds.
func (r *SyncRequest) Validate() error {
	if r.Engagement != nil {
		if r.Engagement.TotalXP < 0 || r.Engagement.TotalXP > 1_000_000 {
			return fmt.Errorf("engagement totalXP out of range")
		}
		if r.Engagement.Level < 0 || r.Engagement.Level > 100 {
			return fmt.Errorf("engagement level out of range")
		}
		if r.Engagement.Streak < 0 || r.Engagement.Streak > 10_000 {
			return fmt.Errorf("engagement streak out of range")
		}
		if len(r.Engagement.Title) > maxSyncTitleLength {
			return fmt.Errorf("engagement title too long (max %d)", maxSyncTitleLength)
		}
	}
	if r.JourneyProgress != nil {
		if len(*r.JourneyProgress) > maxJourneyTypes {
			return fmt.Errorf("too many journey types (max %d)", maxJourneyTypes)
		}
		for key, jp := range *r.JourneyProgress {
			if len(key) > 64 {
				return fmt.Errorf("journey type key too long (max 64)")
			}
			if len(jp.DimensionScores) > maxDimensionScores {
				return fmt.Errorf("too many dimension scores (max %d)", maxDimensionScores)
			}
		}
	}
	return nil
}

// EngagementData mirrors the frontend EngagementState.
type EngagementData struct {
	TotalXP int    `json:"totalXP"`
	Level   int    `json:"level"`
	Streak  int    `json:"streak"`
	Title   string `json:"title"`
}

// JourneyProgressData mirrors the frontend journey progress per type.
type JourneyProgressData map[string]JourneyTypeProgress

// JourneyTypeProgress tracks progress for a single journey type.
type JourneyTypeProgress struct {
	Started           bool               `json:"started"`
	StationsCompleted int                `json:"stationsCompleted"`
	DimensionScores   map[string]float64 `json:"dimensionScores"`
}

// SyncResult is returned from a sync operation.
type SyncResult struct {
	SyncedEntities int        `json:"syncedEntities"`
	LastSyncedAt   time.Time  `json:"lastSyncedAt"`
	Errors         []string   `json:"errors"`
}

// PodStatus is returned from GET /api/v1/pod/status.
type PodStatus struct {
	Connected    bool        `json:"connected"`
	PodURL       string      `json:"podUrl,omitempty"`
	WebID        string      `json:"webId,omitempty"`
	Provider     PodProvider `json:"provider"`
	ConnectedAt  *time.Time  `json:"connectedAt,omitempty"`
	LastSyncedAt *time.Time  `json:"lastSyncedAt,omitempty"`
	SyncStatus   string      `json:"syncStatus"`
}

// PodData is returned from GET /api/v1/pod/data.
type PodData struct {
	Profile     map[string]any `json:"profile,omitempty"`
	Journey     map[string]any `json:"journey,omitempty"`
	Reflections []map[string]any `json:"reflections,omitempty"`
}

// UserRow represents the fields we read from the users table for sync.
type UserRow struct {
	ID    string
	Email string
	Name  string
}

// SkillProfileRow represents a skill profile from the database.
type SkillProfileRow struct {
	ID         string
	UserID     string
	Categories map[string]float64
	CreatedAt  time.Time
}

// ReflectionRow represents a reflection from the database.
type ReflectionRow struct {
	ID         string
	UserID     string
	QuestionID string
	Answer     string
	Score      float64
	CreatedAt  time.Time
}
