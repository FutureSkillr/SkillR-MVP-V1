package profile

import (
	"time"

	"github.com/google/uuid"
)

type SkillCategory struct {
	Key                    string   `json:"key"`
	Label                  string   `json:"label"`
	Score                  float64  `json:"score"`
	ContributingDimensions []string `json:"contributing_dimensions"`
}

type EvidenceSummary struct {
	TotalInteractions int `json:"total_interactions"`
	TotalReflections  int `json:"total_reflections"`
	TotalEndorsements int `json:"total_endorsements"`
	TotalArtifacts    int `json:"total_artifacts"`
}

type SkillProfile struct {
	ID              uuid.UUID       `json:"id"`
	UserID          uuid.UUID       `json:"user_id"`
	SkillCategories []SkillCategory `json:"skill_categories"`
	TopInterests    []string        `json:"top_interests,omitempty"`
	TopStrengths    []string        `json:"top_strengths,omitempty"`
	Completeness    float64         `json:"completeness"`
	EvidenceSummary *EvidenceSummary `json:"evidence_summary,omitempty"`
	LastComputedAt  time.Time       `json:"last_computed_at"`
	CreatedAt       time.Time       `json:"created_at,omitempty"`
}

type PublicProfile struct {
	UserID              uuid.UUID       `json:"user_id"`
	DisplayName         string          `json:"display_name"`
	SkillCategories     []SkillCategory `json:"skill_categories"`
	TopInterests        []string        `json:"top_interests,omitempty"`
	TopStrengths        []string        `json:"top_strengths,omitempty"`
	Completeness        float64         `json:"completeness"`
	EndorsementCount    int             `json:"endorsement_count"`
	VisibleEndorsements []interface{}   `json:"visible_endorsements,omitempty"`
}
