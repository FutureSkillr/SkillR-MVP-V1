import React from 'react';
import type { AiConnectionStatus } from '../../hooks/useAiStatus';

interface AiStatusDiamondProps {
  status: AiConnectionStatus;
  latencyMs?: number;
  size?: number;
}

const STATUS_CONFIG: Record<AiConnectionStatus, {
  glowClass: string;
  fillClass: string;
  label: string;
}> = {
  connected: {
    glowClass: 'ai-diamond-glow-cyan',
    fillClass: 'text-cyan-400',
    label: 'Vertex AI verbunden',
  },
  error: {
    glowClass: 'ai-diamond-glow-red',
    fillClass: 'text-red-400',
    label: 'Vertex AI Fehler',
  },
  network_error: {
    glowClass: 'ai-diamond-glow-yellow',
    fillClass: 'text-amber-400',
    label: 'Netzwerk offline',
  },
  unknown: {
    glowClass: 'ai-diamond-glow-dim',
    fillClass: 'text-slate-500',
    label: 'Vertex AI Status unbekannt',
  },
};

/**
 * A glowing diamond icon indicating Vertex AI connection status.
 * - Blue/cyan glow: connected
 * - Red glow: error (auth, permission, rate limit, etc.)
 * - Yellow/amber glow: network offline / unreachable
 * - Dim: unknown / checking
 */
export const AiStatusDiamond: React.FC<AiStatusDiamondProps> = ({
  status,
  latencyMs,
  size = 18,
}) => {
  const config = STATUS_CONFIG[status];
  const latencyLabel = latencyMs && latencyMs > 0 ? ` (${latencyMs}ms)` : '';

  return (
    <div
      className={`ai-diamond-wrapper ${config.glowClass} inline-flex items-center justify-center`}
      title={`${config.label}${latencyLabel}`}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${config.fillClass} ai-diamond-icon`}
      >
        {/* Diamond shape — rotated square with faceted top */}
        <path
          d="M12 2L4 10L12 22L20 10L12 2Z"
          fill="currentColor"
          fillOpacity="0.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Top facet lines */}
        <path
          d="M4 10H20M12 2L8 10M12 2L16 10"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      </svg>
    </div>
  );
};
