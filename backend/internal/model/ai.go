package model

// Shared AI types used by both firebase and ai packages.
// Extracted to break the import cycle: ai -> middleware -> firebase -> ai.

type PromptTemplate struct {
	PromptID          string      `json:"prompt_id" firestore:"prompt_id"`
	Name              string      `json:"name" firestore:"name"`
	Category          string      `json:"category" firestore:"category"`
	SystemInstruction string      `json:"system_instruction" firestore:"system_instruction"`
	ModelConfig       ModelConfig `json:"model_config" firestore:"model_config"`
	CompletionMarkers []string    `json:"completion_markers,omitempty" firestore:"completion_markers"`
	Version           int         `json:"version" firestore:"version"`
	IsActive          bool        `json:"is_active" firestore:"is_active"`
	Tags              []string    `json:"tags,omitempty" firestore:"tags"`
	CreatedBy         string      `json:"created_by,omitempty" firestore:"created_by"`
	CreatedAt         string      `json:"created_at,omitempty" firestore:"created_at"`
	UpdatedAt         string      `json:"updated_at,omitempty" firestore:"updated_at"`
}

type ModelConfig struct {
	Model            string  `json:"model,omitempty" firestore:"model"`
	Temperature      float64 `json:"temperature,omitempty" firestore:"temperature"`
	TopP             float64 `json:"top_p,omitempty" firestore:"top_p"`
	TopK             int     `json:"top_k,omitempty" firestore:"top_k"`
	MaxOutputTokens  int     `json:"max_output_tokens,omitempty" firestore:"max_output_tokens"`
	ResponseMIMEType string  `json:"response_mime_type,omitempty" firestore:"response_mime_type"`
}

type AgentConfig struct {
	AgentID         string                 `json:"agent_id" firestore:"agent_id"`
	Name            string                 `json:"name" firestore:"name"`
	Role            string                 `json:"role" firestore:"role"`
	PromptIDs       []string               `json:"prompt_ids" firestore:"prompt_ids"`
	ActivationRules map[string]interface{} `json:"activation_rules,omitempty" firestore:"activation_rules"`
	TransitionRules map[string]interface{} `json:"transition_rules,omitempty" firestore:"transition_rules"`
	Tone            string                 `json:"tone,omitempty" firestore:"tone"`
	Temperature     *float64               `json:"temperature,omitempty" firestore:"temperature"`
	IsActive        bool                   `json:"is_active" firestore:"is_active"`
	CreatedAt       string                 `json:"created_at,omitempty" firestore:"created_at"`
	UpdatedAt       string                 `json:"updated_at,omitempty" firestore:"updated_at"`
}
