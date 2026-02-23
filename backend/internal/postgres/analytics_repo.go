package postgres

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

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

// --- Gateway analytics: user events ---

// GatewayEvent represents a frontend analytics event (Express gateway schema).
type GatewayEvent struct {
	ID               int64           `json:"id"`
	EventType        string          `json:"event_type"`
	BrowserSessionID string          `json:"browser_session_id"`
	PromptSessionID  *string         `json:"prompt_session_id"`
	Timestamp        int64           `json:"timestamp"`
	Properties       json.RawMessage `json:"properties"`
}

// EventFilter holds query parameters for event filtering.
type EventFilter struct {
	EventType        string
	BrowserSessionID string
	From             *int64
	To               *int64
	Limit            int
}

// InsertGatewayEvents batch-inserts frontend analytics events.
func (r *AnalyticsRepository) InsertGatewayEvents(ctx context.Context, events []GatewayEvent) (int, error) {
	if len(events) == 0 {
		return 0, nil
	}
	inserted := 0
	for _, e := range events {
		if e.EventType == "" || e.BrowserSessionID == "" || e.Timestamp == 0 {
			continue
		}
		props := e.Properties
		if props == nil {
			props = json.RawMessage(`{}`)
		}
		// Store browser_session_id and prompt_session_id inside event_data for the PG schema
		data := make(map[string]interface{})
		_ = json.Unmarshal(props, &data)
		data["browser_session_id"] = e.BrowserSessionID
		if e.PromptSessionID != nil {
			data["prompt_session_id"] = *e.PromptSessionID
		}
		dataJSON, _ := json.Marshal(data)

		_, err := r.pool.Exec(ctx,
			`INSERT INTO user_events (event_type, event_data, created_at) VALUES ($1, $2, $3)`,
			e.EventType, dataJSON, time.UnixMilli(e.Timestamp),
		)
		if err != nil {
			return inserted, fmt.Errorf("insert gateway event: %w", err)
		}
		inserted++
	}
	return inserted, nil
}

// QueryEvents returns events matching the given filter.
func (r *AnalyticsRepository) QueryEvents(ctx context.Context, f EventFilter) ([]GatewayEvent, error) {
	query := `SELECT id, event_type, event_data, created_at FROM user_events WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if f.EventType != "" {
		query += fmt.Sprintf(" AND event_type = $%d", argIdx)
		args = append(args, f.EventType)
		argIdx++
	}
	if f.BrowserSessionID != "" {
		query += fmt.Sprintf(" AND event_data->>'browser_session_id' = $%d", argIdx)
		args = append(args, f.BrowserSessionID)
		argIdx++
	}
	if f.From != nil {
		query += fmt.Sprintf(" AND created_at >= $%d", argIdx)
		args = append(args, time.UnixMilli(*f.From))
		argIdx++
	}
	if f.To != nil {
		query += fmt.Sprintf(" AND created_at <= $%d", argIdx)
		args = append(args, time.UnixMilli(*f.To))
		argIdx++
	}

	query += " ORDER BY created_at DESC"
	limit := f.Limit
	if limit <= 0 || limit > 5000 {
		limit = 500
	}
	query += fmt.Sprintf(" LIMIT %d", limit)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query events: %w", err)
	}
	defer rows.Close()

	var events []GatewayEvent
	for rows.Next() {
		var e GatewayEvent
		var data json.RawMessage
		var createdAt time.Time
		if err := rows.Scan(&e.ID, &e.EventType, &data, &createdAt); err != nil {
			return nil, fmt.Errorf("scan event: %w", err)
		}
		e.Timestamp = createdAt.UnixMilli()
		e.Properties = data
		// Extract browser_session_id from event_data
		var m map[string]interface{}
		if json.Unmarshal(data, &m) == nil {
			if bsid, ok := m["browser_session_id"].(string); ok {
				e.BrowserSessionID = bsid
			}
			if psid, ok := m["prompt_session_id"].(string); ok {
				e.PromptSessionID = &psid
			}
		}
		events = append(events, e)
	}
	return events, rows.Err()
}

// AnalyticsOverview holds aggregated analytics data.
type AnalyticsOverview struct {
	TotalEvents            int64                  `json:"totalEvents"`
	UniqueSessions         int64                  `json:"uniqueSessions"`
	AvgOnboardingMs        int64                  `json:"avgOnboardingDurationMs"`
	AvgStationMs           int64                  `json:"avgStationDurationMs"`
	EventsByType           map[string]int64       `json:"eventsByType"`
	ConversionFunnel       []FunnelStep           `json:"conversionFunnel"`
	JourneyPopularity      map[string]int64       `json:"journeyPopularity"`
	TopPaths               []PathCount            `json:"topPaths"`
}

type FunnelStep struct {
	Label          string `json:"label"`
	Count          int64  `json:"count"`
	DropoffPercent int    `json:"dropoff_percent"`
}

type PathCount struct {
	FromView string `json:"from_view"`
	ToView   string `json:"to_view"`
	Count    int64  `json:"count"`
}

// GetOverview returns aggregated analytics data.
func (r *AnalyticsRepository) GetOverview(ctx context.Context) (*AnalyticsOverview, error) {
	o := &AnalyticsOverview{
		EventsByType:      make(map[string]int64),
		JourneyPopularity: make(map[string]int64),
	}

	// Totals
	err := r.pool.QueryRow(ctx,
		`SELECT COUNT(*), COUNT(DISTINCT event_data->>'browser_session_id')
		 FROM user_events`,
	).Scan(&o.TotalEvents, &o.UniqueSessions)
	if err != nil {
		return nil, fmt.Errorf("overview totals: %w", err)
	}

	// Events by type
	rows, err := r.pool.Query(ctx,
		`SELECT event_type, COUNT(*) FROM user_events GROUP BY event_type ORDER BY COUNT(*) DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("overview events by type: %w", err)
	}
	defer rows.Close()
	for rows.Next() {
		var et string
		var c int64
		if err := rows.Scan(&et, &c); err != nil {
			return nil, err
		}
		o.EventsByType[et] = c
	}

	// Avg durations
	r.pool.QueryRow(ctx,
		`SELECT COALESCE(AVG((event_data->>'duration_ms')::numeric), 0) FROM user_events WHERE event_type = 'onboarding_complete'`,
	).Scan(&o.AvgOnboardingMs)
	r.pool.QueryRow(ctx,
		`SELECT COALESCE(AVG((event_data->>'duration_ms')::numeric), 0) FROM user_events WHERE event_type = 'station_complete'`,
	).Scan(&o.AvgStationMs)

	// Journey popularity
	jRows, err := r.pool.Query(ctx,
		`SELECT event_data->>'journey_type', COUNT(*) FROM user_events WHERE event_type = 'journey_select' GROUP BY event_data->>'journey_type' ORDER BY COUNT(*) DESC`,
	)
	if err == nil {
		defer jRows.Close()
		for jRows.Next() {
			var jt *string
			var c int64
			if err := jRows.Scan(&jt, &c); err == nil && jt != nil {
				o.JourneyPopularity[*jt] = c
			}
		}
	}

	// Top paths
	pRows, err := r.pool.Query(ctx,
		`SELECT event_data->>'from_view', event_data->>'to_view', COUNT(*)
		 FROM user_events WHERE event_type = 'page_view'
		 GROUP BY event_data->>'from_view', event_data->>'to_view'
		 ORDER BY COUNT(*) DESC LIMIT 20`,
	)
	if err == nil {
		defer pRows.Close()
		for pRows.Next() {
			var pc PathCount
			var from, to *string
			if err := pRows.Scan(&from, &to, &pc.Count); err == nil {
				if from != nil {
					pc.FromView = *from
				}
				if to != nil {
					pc.ToView = *to
				}
				o.TopPaths = append(o.TopPaths, pc)
			}
		}
	}

	// Conversion funnel
	funnelQueries := []struct {
		Label string
		Where string
	}{
		{"Landing", `event_type = 'page_view' AND event_data->>'to_view' = 'landing'`},
		{"Onboarding Start", `event_type = 'onboarding_start'`},
		{"Onboarding Complete", `event_type = 'onboarding_complete'`},
		{"Journey Select", `event_type = 'journey_select'`},
		{"Station Start", `event_type = 'station_start'`},
		{"Station Complete", `event_type = 'station_complete'`},
		{"Profile View", `event_type = 'profile_view'`},
	}
	var prevCount int64
	for i, fq := range funnelQueries {
		var c int64
		r.pool.QueryRow(ctx,
			fmt.Sprintf(`SELECT COUNT(DISTINCT event_data->>'browser_session_id') FROM user_events WHERE %s`, fq.Where),
		).Scan(&c)
		dropoff := 0
		if i > 0 && prevCount > 0 {
			dropoff = int((1 - float64(c)/float64(prevCount)) * 100)
		}
		o.ConversionFunnel = append(o.ConversionFunnel, FunnelStep{
			Label:          fq.Label,
			Count:          c,
			DropoffPercent: dropoff,
		})
		prevCount = c
	}

	return o, nil
}

// GetSessionEvents returns all events for a browser session ID.
func (r *AnalyticsRepository) GetSessionEvents(ctx context.Context, browserSessionID string) ([]GatewayEvent, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, event_type, event_data, created_at
		 FROM user_events WHERE event_data->>'browser_session_id' = $1
		 ORDER BY created_at ASC`,
		browserSessionID,
	)
	if err != nil {
		return nil, fmt.Errorf("get session events: %w", err)
	}
	defer rows.Close()

	var events []GatewayEvent
	for rows.Next() {
		var e GatewayEvent
		var data json.RawMessage
		var createdAt time.Time
		if err := rows.Scan(&e.ID, &e.EventType, &data, &createdAt); err != nil {
			return nil, err
		}
		e.Timestamp = createdAt.UnixMilli()
		e.Properties = data
		e.BrowserSessionID = browserSessionID
		events = append(events, e)
	}
	return events, rows.Err()
}

// ExportEventsCSV returns all user events as CSV bytes.
func (r *AnalyticsRepository) ExportEventsCSV(ctx context.Context) ([]byte, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, event_type, event_data, created_at FROM user_events ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("export events csv: %w", err)
	}
	defer rows.Close()

	var buf bytes.Buffer
	buf.WriteString("id,event_type,browser_session_id,prompt_session_id,timestamp,properties\n")
	for rows.Next() {
		var id int64
		var eventType string
		var data json.RawMessage
		var createdAt time.Time
		if err := rows.Scan(&id, &eventType, &data, &createdAt); err != nil {
			return nil, err
		}
		bsid, psid := "", ""
		var m map[string]interface{}
		if json.Unmarshal(data, &m) == nil {
			if v, ok := m["browser_session_id"].(string); ok {
				bsid = v
			}
			if v, ok := m["prompt_session_id"].(string); ok {
				psid = v
			}
		}
		buf.WriteString(fmt.Sprintf("%d,%s,%s,%s,%d,%s\n",
			id, csvEscape(eventType), csvEscape(bsid), csvEscape(psid),
			createdAt.UnixMilli(), csvEscape(string(data))))
	}
	return buf.Bytes(), rows.Err()
}

// DeleteAllEvents removes all user events.
func (r *AnalyticsRepository) DeleteAllEvents(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM user_events`)
	if err != nil {
		return fmt.Errorf("delete all events: %w", err)
	}
	return nil
}

// LogConsent stores a consent event.
func (r *AnalyticsRepository) LogConsent(ctx context.Context, data map[string]interface{}) error {
	dataJSON, _ := json.Marshal(data)
	_, err := r.pool.Exec(ctx,
		`INSERT INTO user_events (event_type, event_data) VALUES ('consent', $1)`,
		dataJSON,
	)
	if err != nil {
		return fmt.Errorf("log consent: %w", err)
	}
	return nil
}

// --- Gateway analytics: prompt logs ---

// GatewayPromptLog matches the Express gateway prompt_logs schema.
type GatewayPromptLog struct {
	ID                 string  `json:"id"`
	RequestID          string  `json:"request_id"`
	SessionID          string  `json:"session_id"`
	Method             string  `json:"method"`
	SessionType        string  `json:"session_type"`
	ModelName          string  `json:"model_name"`
	SystemPrompt       string  `json:"system_prompt"`
	UserMessage        string  `json:"user_message"`
	ChatHistory        string  `json:"chat_history"`
	RawResponse        string  `json:"raw_response"`
	StructuredResponse string  `json:"structured_response"`
	Status             string  `json:"status"`
	ErrorMessage       *string `json:"error_message"`
	LatencyMs          int     `json:"latency_ms"`
	RetryCount         int     `json:"retry_count"`
	RequestTimestamp   int64   `json:"request_timestamp"`
	ResponseTimestamp  int64   `json:"response_timestamp"`
	TokenCountEstimate int     `json:"token_count_estimate"`
}

// PromptLogFilter holds query params for prompt log filtering.
type PromptLogFilter struct {
	Method    string
	Status    string
	SessionID string
}

// InsertGatewayPromptLog inserts a prompt log with full dialog content.
func (r *AnalyticsRepository) InsertGatewayPromptLog(ctx context.Context, log GatewayPromptLog) error {
	_, err := r.pool.Exec(ctx,
		`INSERT INTO prompt_logs (prompt_id, session_id, model_name, input_tokens, output_tokens, latency_ms, status, error_message,
		   method, session_type, system_prompt, user_message, chat_history, raw_response, structured_response, retry_count, request_timestamp, response_timestamp)
		 VALUES ($1, $2, $3, $4, $5, $6, $7::agent_execution_status, $8,
		   $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`,
		log.RequestID,
		nilUUID(log.SessionID),
		log.ModelName,
		log.TokenCountEstimate,
		0,
		log.LatencyMs,
		mapStatus(log.Status),
		nilIfEmpty(stringVal(log.ErrorMessage)),
		nilIfEmpty(log.Method),
		nilIfEmpty(log.SessionType),
		nilIfEmpty(log.SystemPrompt),
		nilIfEmpty(log.UserMessage),
		nilIfEmpty(log.ChatHistory),
		nilIfEmpty(log.RawResponse),
		nilIfEmpty(log.StructuredResponse),
		log.RetryCount,
		nilInt64(log.RequestTimestamp),
		nilInt64(log.ResponseTimestamp),
	)
	if err != nil {
		return fmt.Errorf("insert gateway prompt log: %w", err)
	}
	return nil
}

// QueryPromptLogs returns prompt logs matching the given filter.
func (r *AnalyticsRepository) QueryPromptLogs(ctx context.Context, f PromptLogFilter) ([]map[string]interface{}, error) {
	query := `SELECT id, prompt_id, session_id, model_name, input_tokens, output_tokens, latency_ms, status, error_message, created_at,
	  method, session_type, system_prompt, user_message, chat_history, raw_response, structured_response, retry_count, request_timestamp, response_timestamp
	  FROM prompt_logs WHERE 1=1`
	args := []interface{}{}
	argIdx := 1

	if f.Method != "" {
		query += fmt.Sprintf(" AND method = $%d", argIdx)
		args = append(args, f.Method)
		argIdx++
	}
	if f.Status != "" {
		mapped := mapStatus(f.Status)
		query += fmt.Sprintf(" AND status = $%d::agent_execution_status", argIdx)
		args = append(args, mapped)
		argIdx++
	}
	if f.SessionID != "" {
		if uid, err := uuid.Parse(f.SessionID); err == nil {
			query += fmt.Sprintf(" AND session_id = $%d", argIdx)
			args = append(args, uid)
			argIdx++
		}
	}

	query += " ORDER BY created_at DESC"

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, fmt.Errorf("query prompt logs: %w", err)
	}
	defer rows.Close()

	var results []map[string]interface{}
	for rows.Next() {
		var id uuid.UUID
		var promptID string
		var sessionID *uuid.UUID
		var modelName string
		var inputTokens, outputTokens, latencyMs *int
		var status string
		var errorMsg *string
		var createdAt time.Time
		var method, sessionType, systemPrompt, userMessage, chatHistory, rawResponse, structuredResponse *string
		var retryCount *int
		var requestTimestamp, responseTimestamp *int64

		if err := rows.Scan(&id, &promptID, &sessionID, &modelName, &inputTokens, &outputTokens, &latencyMs, &status, &errorMsg, &createdAt,
			&method, &sessionType, &systemPrompt, &userMessage, &chatHistory, &rawResponse, &structuredResponse, &retryCount, &requestTimestamp, &responseTimestamp); err != nil {
			return nil, err
		}

		ts := createdAt.UnixMilli()
		if requestTimestamp != nil && *requestTimestamp > 0 {
			ts = *requestTimestamp
		}

		row := map[string]interface{}{
			"id":                   id.String(),
			"request_id":          promptID,
			"session_id":          sessionID,
			"model_name":          modelName,
			"status":              status,
			"error_message":       errorMsg,
			"latency_ms":          latencyMs,
			"token_count_estimate": inputTokens,
			"request_timestamp":   ts,
			"method":              method,
			"session_type":        sessionType,
			"system_prompt":       systemPrompt,
			"user_message":        userMessage,
			"chat_history":        chatHistory,
			"raw_response":        rawResponse,
			"structured_response": structuredResponse,
			"retry_count":         retryCount,
			"response_timestamp":  responseTimestamp,
		}
		results = append(results, row)
	}
	return results, rows.Err()
}

// PromptLogStats holds aggregated prompt log statistics.
type PromptLogStats struct {
	TotalCalls         int64 `json:"totalCalls"`
	SuccessCount       int64 `json:"successCount"`
	ErrorCount         int64 `json:"errorCount"`
	AvgLatencyMs       int64 `json:"avgLatencyMs"`
	TotalTokenEstimate int64 `json:"totalTokenEstimate"`
}

// GetPromptLogStats returns aggregated prompt log statistics.
func (r *AnalyticsRepository) GetPromptLogStats(ctx context.Context) (*PromptLogStats, error) {
	s := &PromptLogStats{}
	err := r.pool.QueryRow(ctx,
		`SELECT
			COUNT(*),
			COUNT(*) FILTER (WHERE status = 'success'),
			COUNT(*) FILTER (WHERE status = 'error'),
			COALESCE(AVG(latency_ms), 0),
			COALESCE(SUM(input_tokens), 0)
		 FROM prompt_logs`,
	).Scan(&s.TotalCalls, &s.SuccessCount, &s.ErrorCount, &s.AvgLatencyMs, &s.TotalTokenEstimate)
	if err != nil {
		return nil, fmt.Errorf("prompt log stats: %w", err)
	}
	return s, nil
}

// ExportPromptLogsCSV returns all prompt logs as CSV bytes.
func (r *AnalyticsRepository) ExportPromptLogsCSV(ctx context.Context) ([]byte, error) {
	rows, err := r.pool.Query(ctx,
		`SELECT id, prompt_id, session_id, model_name, input_tokens, output_tokens, latency_ms, status, error_message, created_at,
		   method, session_type, system_prompt, user_message, raw_response
		 FROM prompt_logs ORDER BY created_at DESC`,
	)
	if err != nil {
		return nil, fmt.Errorf("export prompt logs csv: %w", err)
	}
	defer rows.Close()

	var buf bytes.Buffer
	buf.WriteString("id,request_id,session_id,model_name,method,session_type,status,error_message,latency_ms,token_count_estimate,request_timestamp,system_prompt,user_message,raw_response\n")
	for rows.Next() {
		var id uuid.UUID
		var promptID string
		var sessionID *uuid.UUID
		var modelName string
		var inputTokens, outputTokens, latencyMs *int
		var status string
		var errorMsg *string
		var createdAt time.Time
		var method, sessionType, systemPrompt, userMessage, rawResponse *string

		if err := rows.Scan(&id, &promptID, &sessionID, &modelName, &inputTokens, &outputTokens, &latencyMs, &status, &errorMsg, &createdAt,
			&method, &sessionType, &systemPrompt, &userMessage, &rawResponse); err != nil {
			return nil, err
		}
		sid := ""
		if sessionID != nil {
			sid = sessionID.String()
		}
		em := ""
		if errorMsg != nil {
			em = *errorMsg
		}
		it := 0
		if inputTokens != nil {
			it = *inputTokens
		}
		lm := 0
		if latencyMs != nil {
			lm = *latencyMs
		}
		buf.WriteString(fmt.Sprintf("%s,%s,%s,%s,%s,%s,%s,%s,%d,%d,%d,%s,%s,%s\n",
			id.String(), csvEscape(promptID), csvEscape(sid), csvEscape(modelName),
			csvEscape(derefStr(method)), csvEscape(derefStr(sessionType)),
			csvEscape(status), csvEscape(em), lm, it, createdAt.UnixMilli(),
			csvEscape(derefStr(systemPrompt)), csvEscape(derefStr(userMessage)), csvEscape(derefStr(rawResponse))))
	}
	return buf.Bytes(), rows.Err()
}

// DeleteAllPromptLogs removes all prompt logs.
func (r *AnalyticsRepository) DeleteAllPromptLogs(ctx context.Context) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM prompt_logs`)
	if err != nil {
		return fmt.Errorf("delete all prompt logs: %w", err)
	}
	return nil
}

// --- helpers ---

func csvEscape(s string) string {
	if strings.ContainsAny(s, ",\"\n") {
		return `"` + strings.ReplaceAll(s, `"`, `""`) + `"`
	}
	return s
}

func nilUUID(s string) *uuid.UUID {
	if s == "" {
		return nil
	}
	uid, err := uuid.Parse(s)
	if err != nil {
		return nil
	}
	return &uid
}

func mapStatus(s string) string {
	switch s {
	case "success", "error", "timeout":
		return s
	default:
		return "success"
	}
}

func stringVal(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func nilIfEmpty(s string) *string {
	if s == "" {
		return nil
	}
	return &s
}

func nilInt64(v int64) *int64 {
	if v == 0 {
		return nil
	}
	return &v
}

func derefStr(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}
