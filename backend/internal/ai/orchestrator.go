package ai

import (
	"context"
	"fmt"
	"log"

	"skillr-mvp-v1/backend/internal/model"
)

type PromptLoader interface {
	GetActivePrompt(ctx context.Context, promptID string) (*model.PromptTemplate, error)
}

type AgentConfigLoader interface {
	GetActiveAgent(ctx context.Context, agentID string) (*model.AgentConfig, error)
	ListActiveAgents(ctx context.Context) ([]model.AgentConfig, error)
}

type Orchestrator struct {
	prompts PromptLoader
	agents  AgentConfigLoader
}

func NewOrchestrator(prompts PromptLoader, agents AgentConfigLoader) *Orchestrator {
	return &Orchestrator{prompts: prompts, agents: agents}
}

// NewPassthroughOrchestrator creates an orchestrator with empty stores.
// Used when no prompt DB is available — handlers fall back to built-in prompts.
func NewPassthroughOrchestrator() *Orchestrator {
	return &Orchestrator{
		prompts: &emptyPromptLoader{},
		agents:  &emptyAgentLoader{},
	}
}

type emptyPromptLoader struct{}

func (e *emptyPromptLoader) GetActivePrompt(_ context.Context, _ string) (*model.PromptTemplate, error) {
	return nil, fmt.Errorf("no prompt store configured")
}

type emptyAgentLoader struct{}

func (e *emptyAgentLoader) GetActiveAgent(_ context.Context, _ string) (*model.AgentConfig, error) {
	return nil, fmt.Errorf("no agent store configured")
}

func (e *emptyAgentLoader) ListActiveAgents(_ context.Context) ([]model.AgentConfig, error) {
	return nil, nil
}

// SelectAgent determines which agent to use based on journey state.
// Returns the agent ID and the primary prompt template.
func (o *Orchestrator) SelectAgent(ctx context.Context, journeyType, stationID string) (*model.AgentConfig, *model.PromptTemplate, error) {
	agents, err := o.agents.ListActiveAgents(ctx)
	if err != nil {
		return nil, nil, fmt.Errorf("list agents: %w", err)
	}

	// Simple selection: find the first agent that matches the journey state
	for _, agent := range agents {
		if rules, ok := agent.ActivationRules["journey_states"]; ok {
			if states, ok := rules.([]interface{}); ok {
				for _, state := range states {
					if s, ok := state.(string); ok && s == journeyType {
						prompt, err := o.loadPrimaryPrompt(ctx, agent)
						if err != nil {
							log.Printf("warning: agent %s has no valid prompt: %v", agent.AgentID, err)
							continue
						}
						return &agent, prompt, nil
					}
				}
			}
		}
	}

	// Fallback: use first active agent
	if len(agents) > 0 {
		prompt, err := o.loadPrimaryPrompt(ctx, agents[0])
		if err != nil {
			return &agents[0], nil, nil
		}
		return &agents[0], prompt, nil
	}

	return nil, nil, fmt.Errorf("no active agents found")
}

func (o *Orchestrator) loadPrimaryPrompt(ctx context.Context, agent model.AgentConfig) (*model.PromptTemplate, error) {
	if len(agent.PromptIDs) == 0 {
		return nil, fmt.Errorf("agent %s has no prompt IDs", agent.AgentID)
	}
	return o.prompts.GetActivePrompt(ctx, agent.PromptIDs[0])
}

func (o *Orchestrator) GetPrompt(ctx context.Context, promptID string) (*model.PromptTemplate, error) {
	return o.prompts.GetActivePrompt(ctx, promptID)
}
