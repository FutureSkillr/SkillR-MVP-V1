package portfolio

import (
	"fmt"
	"time"

	"github.com/google/uuid"
)

// PortfolioEntry represents a single portfolio item owned by a user.
type PortfolioEntry struct {
	ID          uuid.UUID `json:"id"`
	UserID      uuid.UUID `json:"userId"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Category    string    `json:"category"`
	Visibility  string    `json:"visibility"`
	Tags        []string  `json:"tags"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// PublicProfileSummary is a lightweight profile snapshot for public pages.
type PublicProfileSummary struct {
	SkillCategories []interface{} `json:"skillCategories"`
	TopInterests    []string      `json:"topInterests"`
	TopStrengths    []string      `json:"topStrengths"`
}

// PublicPortfolio is returned by the public page endpoint.
type PublicPortfolio struct {
	UserID      uuid.UUID             `json:"userId"`
	DisplayName string                `json:"displayName"`
	Entries     []PortfolioEntry      `json:"entries"`
	Profile     *PublicProfileSummary `json:"profile,omitempty"`
}

// CreateEntryRequest is the payload for creating a new entry.
type CreateEntryRequest struct {
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Category    string   `json:"category"`
	Visibility  string   `json:"visibility"`
	Tags        []string `json:"tags"`
}

// ExportFormat enumerates supported export formats.
type ExportFormat string

const (
	ExportHTML ExportFormat = "html"
	ExportZIP  ExportFormat = "zip"
)

// Validation constants
const (
	MaxTitleLen       = 200
	MaxDescriptionLen = 2000
	MaxTagLen         = 50
	MaxTagsPerEntry   = 10
	MaxEntriesPerUser = 50
)

var validCategories = map[string]bool{
	"project":     true,
	"deliverable": true,
	"example":     true,
}

var validVisibilities = map[string]bool{
	"public":  true,
	"private": true,
}

// Validate checks the CreateEntryRequest fields.
func (r *CreateEntryRequest) Validate() error {
	if r.Title == "" {
		return fmt.Errorf("title is required")
	}
	if len(r.Title) > MaxTitleLen {
		return fmt.Errorf("title must be at most %d characters", MaxTitleLen)
	}
	if len(r.Description) > MaxDescriptionLen {
		return fmt.Errorf("description must be at most %d characters", MaxDescriptionLen)
	}
	if !validCategories[r.Category] {
		return fmt.Errorf("category must be one of: project, deliverable, example")
	}
	if !validVisibilities[r.Visibility] {
		return fmt.Errorf("visibility must be one of: public, private")
	}
	if len(r.Tags) > MaxTagsPerEntry {
		return fmt.Errorf("at most %d tags allowed", MaxTagsPerEntry)
	}
	for _, tag := range r.Tags {
		if len(tag) > MaxTagLen {
			return fmt.Errorf("each tag must be at most %d characters", MaxTagLen)
		}
		if tag == "" {
			return fmt.Errorf("tags must not be empty strings")
		}
	}
	return nil
}
