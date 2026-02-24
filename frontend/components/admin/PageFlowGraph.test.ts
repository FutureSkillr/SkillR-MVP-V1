// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock analytics service
const mockOverview = {
  totalEvents: 100,
  uniqueSessions: 20,
  avgOnboardingDurationMs: 5000,
  avgStationDurationMs: 12000,
  eventsByType: { page_view: 80 },
  conversionFunnel: [],
  journeyPopularity: {},
  topPaths: [
    { from_view: 'welcome', to_view: 'intro-coach-select', count: 30 },
    { from_view: 'welcome', to_view: 'login', count: 15 },
    { from_view: 'login', to_view: 'landing', count: 12 },
    { from_view: 'landing', to_view: 'onboarding', count: 10 },
    { from_view: 'onboarding', to_view: 'journey-select', count: 8 },
    { from_view: 'journey-select', to_view: 'station', count: 6 },
    { from_view: 'station', to_view: 'journey-complete', count: 4 },
    { from_view: 'journey-complete', to_view: 'profile', count: 3 },
  ],
};

vi.mock('../../services/analytics', () => ({
  getAnalyticsOverview: vi.fn(),
}));

import { getAnalyticsOverview } from '../../services/analytics';
import React from 'react';

// Minimal DOM render helper (no @testing-library needed)
async function renderAndWait(element: React.ReactElement): Promise<HTMLElement> {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  const container = document.createElement('div');
  document.body.appendChild(container);
  await act(async () => {
    createRoot(container).render(element);
  });
  // Flush microtasks
  await act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
  return container;
}

describe('PageFlowGraph', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = '';
  });

  it('shows loading state initially', async () => {
    // Make the promise hang so we see loading
    (getAnalyticsOverview as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    const { PageFlowGraph } = await import('./PageFlowGraph');
    const { createRoot } = await import('react-dom/client');
    const { act } = await import('react');
    const container = document.createElement('div');
    document.body.appendChild(container);
    await act(async () => {
      createRoot(container).render(React.createElement(PageFlowGraph));
    });

    const loading = container.querySelector('[data-testid="flow-loading"]');
    expect(loading).not.toBeNull();
  });

  it('renders SVG with nodes after data loads', async () => {
    (getAnalyticsOverview as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverview);

    const { PageFlowGraph } = await import('./PageFlowGraph');
    const container = await renderAndWait(React.createElement(PageFlowGraph));

    const svg = container.querySelector('[data-testid="flow-svg"]');
    expect(svg).not.toBeNull();

    // Check that known nodes are rendered
    const welcomeNode = container.querySelector('[data-testid="flow-node-welcome"]');
    expect(welcomeNode).not.toBeNull();

    const landingNode = container.querySelector('[data-testid="flow-node-landing"]');
    expect(landingNode).not.toBeNull();

    const stationNode = container.querySelector('[data-testid="flow-node-station"]');
    expect(stationNode).not.toBeNull();
  });

  it('renders edges with count labels', async () => {
    (getAnalyticsOverview as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverview);

    const { PageFlowGraph } = await import('./PageFlowGraph');
    const container = await renderAndWait(React.createElement(PageFlowGraph));

    const svg = container.querySelector('[data-testid="flow-svg"]');
    expect(svg).not.toBeNull();

    // SVG should contain text elements with edge counts
    const texts = svg!.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);

    // Should contain the count "30" from welcome → intro-coach-select
    expect(textContents).toContain('30');
    // Should contain the count "15" from welcome → login
    expect(textContents).toContain('15');
  });

  it('shows empty state when no topPaths data', async () => {
    (getAnalyticsOverview as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockOverview,
      topPaths: [],
    });

    const { PageFlowGraph } = await import('./PageFlowGraph');
    const container = await renderAndWait(React.createElement(PageFlowGraph));

    const empty = container.querySelector('[data-testid="flow-empty"]');
    expect(empty).not.toBeNull();
  });

  it('renders all 13 view nodes', async () => {
    (getAnalyticsOverview as ReturnType<typeof vi.fn>).mockResolvedValue(mockOverview);

    const { PageFlowGraph } = await import('./PageFlowGraph');
    const container = await renderAndWait(React.createElement(PageFlowGraph));

    const expectedNodes = [
      'welcome', 'intro-coach-select', 'login', 'intro-chat', 'intro-register',
      'landing', 'onboarding', 'journey-select', 'station', 'journey-complete',
      'profile', 'datenschutz', 'impressum',
    ];

    for (const nodeId of expectedNodes) {
      const node = container.querySelector(`[data-testid="flow-node-${nodeId}"]`);
      expect(node, `node ${nodeId} should exist`).not.toBeNull();
    }
  });

  it('filters out edges referencing unknown views', async () => {
    (getAnalyticsOverview as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...mockOverview,
      topPaths: [
        { from_view: 'welcome', to_view: 'login', count: 5 },
        { from_view: 'unknown-view', to_view: 'login', count: 99 },
      ],
    });

    const { PageFlowGraph } = await import('./PageFlowGraph');
    const container = await renderAndWait(React.createElement(PageFlowGraph));

    const svg = container.querySelector('[data-testid="flow-svg"]');
    const texts = svg!.querySelectorAll('text');
    const textContents = Array.from(texts).map((t) => t.textContent);

    // Should contain "5" but NOT "99" (unknown source node)
    expect(textContents).toContain('5');
    expect(textContents).not.toContain('99');
  });
});
