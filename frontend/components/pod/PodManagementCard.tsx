import React, { useState, useCallback } from 'react';
import type { PodConnectionState, PodSyncResult } from '../../types/pod';

interface PodManagementCardProps {
  podState: PodConnectionState | null;
  loading: boolean;
  syncResult: PodSyncResult | null;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync: () => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const PodManagementCard: React.FC<PodManagementCardProps> = ({
  podState,
  loading,
  syncResult,
  error,
  onConnect,
  onDisconnect,
  onSync,
}) => {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleDisconnect = useCallback(() => {
    if (confirmDisconnect) {
      onDisconnect();
      setConfirmDisconnect(false);
    } else {
      setConfirmDisconnect(true);
    }
  }, [confirmDisconnect, onDisconnect]);

  const connected = podState?.connected ?? false;

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            connected
              ? 'bg-emerald-500/20'
              : 'bg-slate-700/50'
          }`}>
            <svg className={`w-5 h-5 ${connected ? 'text-emerald-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Solid Pod</h3>
            <p className={`text-xs ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
              {connected ? 'Verbunden' : 'Nicht verbunden'}
            </p>
          </div>
        </div>
        {!connected && (
          <button
            onClick={onConnect}
            className="text-xs bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-medium py-2 px-4 rounded-lg hover:from-emerald-400 hover:to-blue-400 transition-all"
          >
            Verbinden
          </button>
        )}
      </div>

      {connected && podState && (
        <>
          <div className="border-t border-slate-700/50 pt-3 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Pod-URL</span>
              <span className="text-slate-300 truncate max-w-[200px]">{podState.podUrl}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Letzte Sync</span>
              <span className="text-slate-300">{formatDate(podState.lastSyncedAt)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Status</span>
              <span className={`${
                podState.syncStatus === 'synced' ? 'text-emerald-400' :
                podState.syncStatus === 'partial' ? 'text-yellow-400' :
                'text-slate-300'
              }`}>
                {podState.syncStatus === 'synced' ? 'Synchronisiert' :
                 podState.syncStatus === 'partial' ? 'Teilweise' :
                 podState.syncStatus === 'connected' ? 'Bereit' : podState.syncStatus}
              </span>
            </div>
          </div>

          {syncResult && syncResult.errors.length === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 text-center">
              <p className="text-emerald-400 text-xs">{syncResult.syncedEntities} Bereiche synchronisiert</p>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
              <p className="text-red-400 text-xs">{error}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onSync}
              disabled={loading}
              className="flex-1 glass py-2 px-3 rounded-lg text-xs text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            >
              {loading ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </button>
            <button
              onClick={handleDisconnect}
              className={`py-2 px-3 rounded-lg text-xs transition-colors ${
                confirmDisconnect
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'glass text-slate-500 hover:text-red-400'
              }`}
            >
              {confirmDisconnect ? 'Bestaetigen?' : 'Trennen'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
