package postgres

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AnalyticsRepository struct {
	pool *pgxpool.Pool
}

func NewAnalyticsRepository(pool *pgxpool.Pool) *AnalyticsRepository {
	return &AnalyticsRepository{pool: pool}
}

func (r *AnalyticsRepository) LogPrompt(ctx context.Context, userID *uuid.UUID, sessionID *uuid.UUID, promptID string, promptVersion int, modelName string, inputTokens, outputTokens, latencyMs int, status, errorMsg string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO prompt_logs (user_id, session_id, prompt_id, prompt_version, model_name, input_tokens, output_tokens, latency_ms, status, error_message)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		userID, sessionID, promptID, promptVersion, modelName, inputTokens, outputTokens, latencyMs, status, nilIfEmpty(errorMsg),
	)
	if err != nil {
		return fmt.Errorf("log prompt: %w", err)
	}
	return nil
}

func (r *AnalyticsRepository) LogAgentExecution(ctx context.Context, agentID, promptID string, promptVersion int, userID *uuid.UUID, sessionID *uuid.UUID, triggerEvent, inputSummary, outputSummary, modelName string, latencyMs, tokenCount int, status, errorMsg string) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO agent_executions (agent_id, prompt_id, prompt_version, user_id, session_id, trigger_event, input_summary, output_summary, model_name, latency_ms, token_count, status, error_message)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
		agentID, promptID, promptVersion, userID, sessionID, triggerEvent, inputSummary, outputSummary, modelName, latencyMs, tokenCount, status, nilIfEmpty(errorMsg),
	)
	if err != nil {
		return fmt.Errorf("log agent execution: %w", err)
	}
	return nil
}

func (r *AnalyticsRepository) LogUserEvent(ctx context.Context, userID *uuid.UUID, eventType string, eventData map[string]interface{}, sessionID *uuid.UUID) error {
	dataJSON, _ := json.Marshal(eventData)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_events (user_id, event_type, event_data, session_id) VALUES ($1, $2, $3, $4)`,
		userID, eventType, dataJSON, sessionID,
	)
	if err != nil {
		return fmt.Errorf("log user event: %w", err)
	}
	return nil
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}
