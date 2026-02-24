import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAnalyticsOverview } from '../../services/analytics';
import type { AnalyticsOverview } from '../../types/analytics';

// --- Node definitions (fixed layout) ---

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

const SVG_WIDTH = 900;
const SVG_HEIGHT = 700;
const NODE_W = 130;
const NODE_H = 36;

const NODES: FlowNode[] = [
  // Row 0: Entry
  { id: 'welcome',              label: 'Welcome',            x: 450, y: 40,  color: '#a78bfa' },
  // Row 1: Pre-auth split
  { id: 'intro-coach-select',   label: 'Coach-Auswahl',      x: 280, y: 110, color: '#c084fc' },
  { id: 'login',                label: 'Login',              x: 620, y: 110, color: '#60a5fa' },
  // Row 2: Intro flow
  { id: 'intro-chat',           label: 'Intro-Chat',         x: 280, y: 180, color: '#c084fc' },
  // Row 3: Intro register
  { id: 'intro-register',       label: 'Registrierung',      x: 280, y: 250, color: '#c084fc' },
  // Row 4: Auth'd landing
  { id: 'landing',              label: 'Landing',            x: 450, y: 320, color: '#34d399' },
  // Row 5: Core flow
  { id: 'onboarding',           label: 'Onboarding',         x: 300, y: 400, color: '#fbbf24' },
  { id: 'journey-select',       label: 'Reise-Auswahl',      x: 600, y: 400, color: '#38bdf8' },
  // Row 6: Station
  { id: 'station',              label: 'Station',            x: 600, y: 480, color: '#f97316' },
  // Row 7: Results
  { id: 'journey-complete',     label: 'Reise fertig',       x: 600, y: 560, color: '#10b981' },
  { id: 'profile',              label: 'Profil',             x: 300, y: 560, color: '#8b5cf6' },
  // Legal (side)
  { id: 'datenschutz',          label: 'Datenschutz',        x: 100, y: 640, color: '#64748b' },
  { id: 'impressum',            label: 'Impressum',          x: 300, y: 640, color: '#64748b' },
];

const NODE_MAP = new Map(NODES.map((n) => [n.id, n]));

// --- Edge path computation ---

function edgePath(from: FlowNode, to: FlowNode): string {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return '';

  // Offset start/end to node border
  const halfW = NODE_W / 2;
  const halfH = NODE_H / 2;

  // Simple approach: find edge intersection with rect border
  const fromPt = rectBorderPoint(from.x, from.y, halfW, halfH, dx, dy);
  const toPt = rectBorderPoint(to.x, to.y, halfW, halfH, -dx, -dy);

  // Curved path via control point offset perpendicular to the line
  const mx = (fromPt.x + toPt.x) / 2;
  const my = (fromPt.y + toPt.y) / 2;
  const perpX = -(toPt.y - fromPt.y) * 0.15;
  const perpY = (toPt.x - fromPt.x) * 0.15;

  return `M ${fromPt.x} ${fromPt.y} Q ${mx + perpX} ${my + perpY} ${toPt.x} ${toPt.y}`;
}

function rectBorderPoint(cx: number, cy: number, hw: number, hh: number, dx: number, dy: number) {
  // Find where the ray from (cx,cy) in direction (dx,dy) exits the rect
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);
  if (absDx === 0 && absDy === 0) return { x: cx, y: cy };

  const scaleX = absDx > 0 ? hw / absDx : Infinity;
  const scaleY = absDy > 0 ? hh / absDy : Infinity;
  const scale = Math.min(scaleX, scaleY);

  return { x: cx + dx * scale, y: cy + dy * scale };
}

// --- Edge color by relative traffic ---

function edgeColor(count: number, maxCount: number): string {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  if (ratio > 0.5) return '#34d399';  // green — hot path
  if (ratio > 0.2) return '#fbbf24';  // amber — medium
  return '#64748b';                    // slate — low
}

// --- Component ---

export const PageFlowGraph: React.FC = () => {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalyticsOverview();
      setOverview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const edges = useMemo(() => {
    if (!overview?.topPaths) return [];
    return overview.topPaths
      .filter((p) => NODE_MAP.has(p.from_view) && NODE_MAP.has(p.to_view))
      .map((p) => ({
        from: p.from_view,
        to: p.to_view,
        count: p.count,
      }));
  }, [overview]);

  const maxEdgeCount = useMemo(() => {
    return edges.reduce((max, e) => Math.max(max, e.count), 0);
  }, [edges]);

  // Compute node visit counts (sum of inbound edge counts)
  const nodeVisits = useMemo(() => {
    const visits = new Map<string, number>();
    for (const e of edges) {
      visits.set(e.to, (visits.get(e.to) || 0) + e.count);
    }
    return visits;
  }, [edges]);

  // Edges connected to selected node
  const connectedEdges = useMemo(() => {
    if (!selectedNode) return null;
    return new Set(
      edges
        .filter((e) => e.from === selectedNode || e.to === selectedNode)
        .map((e) => `${e.from}->${e.to}`)
    );
  }, [selectedNode, edges]);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedNode((prev) => (prev === nodeId ? null : nodeId));
  }, []);

  const handleBgClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  // Node stats for tooltip
  const selectedStats = useMemo(() => {
    if (!selectedNode) return null;
    const inbound = edges.filter((e) => e.to === selectedNode);
    const outbound = edges.filter((e) => e.from === selectedNode);
    return { inbound, outbound };
  }, [selectedNode, edges]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" data-testid="flow-loading">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Page Flow wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={loadData} className="text-xs px-4 py-2 rounded-lg glass text-slate-300 hover:text-white transition-colors">
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Page Flow Graph</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Knotenpunkte = Views, Kanten = Uebergaenge mit Anzahl
          </p>
        </div>
        <button
          onClick={loadData}
          className="text-xs px-4 py-2 rounded-lg glass text-slate-300 hover:text-white transition-colors"
        >
          Aktualisieren
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-6 h-0.5 bg-emerald-400 inline-block rounded" /> Hoher Traffic
        </span>
        <span className="flex items-center gap-1">
          <span className="w-6 h-0.5 bg-amber-400 inline-block rounded" /> Mittel
        </span>
        <span className="flex items-center gap-1">
          <span className="w-6 h-0.5 bg-slate-500 inline-block rounded" /> Niedrig
        </span>
      </div>

      {/* Graph */}
      <div className="glass rounded-xl p-2 overflow-x-auto">
        {edges.length === 0 ? (
          <div className="text-center py-16" data-testid="flow-empty">
            <p className="text-slate-500 text-sm">Keine Daten — es wurden noch keine page_view Events erfasst.</p>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full"
            style={{ minWidth: 600, maxHeight: '70vh' }}
            onClick={handleBgClick}
            data-testid="flow-svg"
          >
            {/* Arrow marker definition */}
            <defs>
              <marker
                id="arrowGreen"
                viewBox="0 0 10 7"
                refX="10"
                refY="3.5"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#34d399" />
              </marker>
              <marker
                id="arrowAmber"
                viewBox="0 0 10 7"
                refX="10"
                refY="3.5"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
              </marker>
              <marker
                id="arrowSlate"
                viewBox="0 0 10 7"
                refX="10"
                refY="3.5"
                markerWidth="8"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
              </marker>
            </defs>

            {/* Edges */}
            {edges.map((e) => {
              const fromNode = NODE_MAP.get(e.from)!;
              const toNode = NODE_MAP.get(e.to)!;
              const path = edgePath(fromNode, toNode);
              if (!path) return null;

              const color = edgeColor(e.count, maxEdgeCount);
              const strokeWidth = Math.max(1, Math.min(5, (e.count / maxEdgeCount) * 5));
              const edgeKey = `${e.from}->${e.to}`;
              const dimmed = connectedEdges && !connectedEdges.has(edgeKey);
              const markerUrl =
                color === '#34d399' ? 'url(#arrowGreen)' :
                color === '#fbbf24' ? 'url(#arrowAmber)' :
                'url(#arrowSlate)';

              // Label position: midpoint of the quadratic bezier
              const mx = (fromNode.x + toNode.x) / 2;
              const my = (fromNode.y + toNode.y) / 2;
              const dx = toNode.x - fromNode.x;
              const dy = toNode.y - fromNode.y;
              const perpX = -(dy) * 0.15;
              const perpY = (dx) * 0.15;

              return (
                <g key={edgeKey} style={{ opacity: dimmed ? 0.12 : 1, transition: 'opacity 0.2s' }}>
                  <path
                    d={path}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    markerEnd={markerUrl}
                    strokeLinecap="round"
                  />
                  {/* Edge count label */}
                  <text
                    x={mx + perpX}
                    y={my + perpY - 4}
                    textAnchor="middle"
                    fill={color}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {e.count}
                  </text>
                </g>
              );
            })}

            {/* Nodes */}
            {NODES.map((node) => {
              const isSelected = selectedNode === node.id;
              const isConnected = connectedEdges
                ? [...connectedEdges].some((k) => k.includes(node.id))
                : true;
              const dimmed = selectedNode && !isSelected && !isConnected;
              const visits = nodeVisits.get(node.id) || 0;

              return (
                <g
                  key={node.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node.id);
                  }}
                  style={{
                    cursor: 'pointer',
                    opacity: dimmed ? 0.25 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  data-testid={`flow-node-${node.id}`}
                >
                  {/* Glow on selected */}
                  {isSelected && (
                    <rect
                      x={node.x - NODE_W / 2 - 3}
                      y={node.y - NODE_H / 2 - 3}
                      width={NODE_W + 6}
                      height={NODE_H + 6}
                      rx={12}
                      fill="none"
                      stroke={node.color}
                      strokeWidth={2}
                      opacity={0.5}
                    />
                  )}
                  {/* Node background */}
                  <rect
                    x={node.x - NODE_W / 2}
                    y={node.y - NODE_H / 2}
                    width={NODE_W}
                    height={NODE_H}
                    rx={10}
                    fill="#1e293b"
                    stroke={node.color}
                    strokeWidth={isSelected ? 2 : 1}
                    opacity={0.9}
                  />
                  {/* Label */}
                  <text
                    x={node.x}
                    y={node.y - 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#e2e8f0"
                    fontSize="10"
                    fontWeight="600"
                  >
                    {node.label}
                  </text>
                  {/* Visit count badge */}
                  {visits > 0 && (
                    <text
                      x={node.x}
                      y={node.y + 12}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={node.color}
                      fontSize="8"
                      fontFamily="monospace"
                      opacity={0.8}
                    >
                      {visits}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Selected node detail panel */}
      {selectedNode && selectedStats && (
        <div className="glass rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-bold text-white">
            {NODE_MAP.get(selectedNode)?.label || selectedNode}
            <span className="text-slate-500 font-normal ml-2 text-xs font-mono">{selectedNode}</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* Inbound */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Eingehend</p>
              {selectedStats.inbound.length === 0 ? (
                <p className="text-xs text-slate-600">Keine</p>
              ) : (
                <div className="space-y-1">
                  {selectedStats.inbound.map((e) => (
                    <div key={e.from} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{NODE_MAP.get(e.from)?.label || e.from}</span>
                      <span className="text-slate-300 font-mono">{e.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Outbound */}
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Ausgehend</p>
              {selectedStats.outbound.length === 0 ? (
                <p className="text-xs text-slate-600">Keine</p>
              ) : (
                <div className="space-y-1">
                  {selectedStats.outbound.map((e) => (
                    <div key={e.to} className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">{NODE_MAP.get(e.to)?.label || e.to}</span>
                      <span className="text-slate-300 font-mono">{e.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
