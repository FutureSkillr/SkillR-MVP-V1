export interface InfraComponentStatus {
  status: 'ok' | 'unavailable' | 'not_configured';
  latencyMs?: number;
  note?: string;
}

export interface InfraResponse {
  status: 'ok' | 'degraded';
  version: string;
  startedAt: string;
  uptimeSeconds: number;
  postgres: InfraComponentStatus;
  redis: InfraComponentStatus;
  kafka: InfraComponentStatus;
  apis: Record<string, InfraComponentStatus>;
  configPresence: Record<string, boolean>;
  runtime: { goroutines: number; heapMB: number };
}
