import React, { useState, useCallback } from 'react';
import type {
  PodModalStep,
  PodPermission,
  PodProvider,
  PodSyncResult,
} from '../../types/pod';
import type { PodSyncRequest } from '../../types/pod';

// --- Step Components ---

const PodExplainStep: React.FC<{
  onContinue: () => void;
  onSkip: () => void;
}> = ({ onContinue, onSkip }) => (
  <div className="text-center space-y-6">
    <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.3)]">
      <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    </div>
    <h2 className="text-2xl font-bold text-white">Deine Daten, Dein Pod</h2>
    <p className="text-slate-400 max-w-sm mx-auto">
      Verbinde deinen persoenlichen Datentresor und behalte die volle Kontrolle ueber deine Daten.
    </p>
    <div className="space-y-3 text-left max-w-sm mx-auto">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <div>
          <p className="text-white text-sm font-medium">Dein digitaler Tresor</p>
          <p className="text-slate-500 text-xs">Eine sichere Kopie deiner Daten, die dir gehoert</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </span>
        <div>
          <p className="text-white text-sm font-medium">Volle Transparenz</p>
          <p className="text-slate-500 text-xs">Sieh genau, was die Plattform ueber dich weiss</p>
        </div>
      </div>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </span>
        <div>
          <p className="text-white text-sm font-medium">Ueberall dabei</p>
          <p className="text-slate-500 text-xs">Dein Pod gehoert dir — unabhaengig von der Plattform</p>
        </div>
      </div>
    </div>
    <div className="flex flex-col gap-3 pt-2">
      <button
        onClick={onContinue}
        className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
      >
        Pod verbinden
      </button>
      <button
        onClick={onSkip}
        className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
      >
        Spaeter einrichten
      </button>
    </div>
  </div>
);

const PodProviderStep: React.FC<{
  onSelect: (provider: PodProvider, url: string) => void;
  onBack: () => void;
}> = ({ onSelect, onBack }) => {
  const [customUrl, setCustomUrl] = useState('');
  const [selected, setSelected] = useState<'local' | 'custom'>('local');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-white text-center">Pod-Anbieter waehlen</h2>
      <div className="space-y-3">
        <button
          onClick={() => setSelected('local')}
          className={`w-full p-4 rounded-xl border text-left transition-all ${
            selected === 'local'
              ? 'border-emerald-500/50 bg-emerald-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 ${
              selected === 'local' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'
            }`} />
            <div>
              <p className="text-white font-medium">Lokaler Dev-Server</p>
              <p className="text-slate-500 text-xs">http://localhost:3000</p>
            </div>
          </div>
        </button>
        <button
          onClick={() => setSelected('custom')}
          className={`w-full p-4 rounded-xl border text-left transition-all ${
            selected === 'custom'
              ? 'border-blue-500/50 bg-blue-500/10'
              : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-4 h-4 rounded-full border-2 ${
              selected === 'custom' ? 'border-blue-500 bg-blue-500' : 'border-slate-600'
            }`} />
            <div>
              <p className="text-white font-medium">Eigener Pod-Server</p>
              <p className="text-slate-500 text-xs">Eigene URL eingeben</p>
            </div>
          </div>
        </button>
        {selected === 'custom' && (
          <input
            type="url"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            placeholder="https://my-pod.example.com"
            className="w-full mt-2 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        )}
      </div>
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 glass px-4 py-3 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
        >
          Zurueck
        </button>
        <button
          onClick={() => {
            const url = selected === 'local' ? 'http://localhost:3000' : customUrl;
            const provider: PodProvider = selected === 'local' ? 'managed' : 'external';
            onSelect(provider, url);
          }}
          disabled={selected === 'custom' && !customUrl}
          className="flex-1 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Verbinden
        </button>
      </div>
    </div>
  );
};

const PodAuthStep: React.FC<{
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}> = ({ loading, error, onRetry }) => (
  <div className="text-center space-y-6 py-4">
    {loading && !error && (
      <>
        <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" />
        <p className="text-slate-400">Verbindung wird hergestellt...</p>
      </>
    )}
    {error && (
      <>
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={onRetry}
          className="glass px-6 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors"
        >
          Erneut versuchen
        </button>
      </>
    )}
  </div>
);

const PodPermissionStep: React.FC<{
  permissions: PodPermission[];
  onToggle: (category: string) => void;
  onContinue: () => void;
}> = ({ permissions, onToggle, onContinue }) => (
  <div className="space-y-6">
    <h2 className="text-xl font-bold text-white text-center">Welche Daten synchronisieren?</h2>
    <p className="text-slate-400 text-sm text-center">
      Waehle, welche Daten in deinen Pod kopiert werden.
    </p>
    <div className="space-y-2">
      {permissions.map((p) => (
        <button
          key={p.category}
          onClick={() => onToggle(p.category)}
          className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-700 bg-slate-800/50 hover:border-slate-600 transition-all"
        >
          <span className="text-white text-sm">{p.label}</span>
          <div className={`w-10 h-6 rounded-full transition-colors ${
            p.enabled ? 'bg-emerald-500' : 'bg-slate-600'
          }`}>
            <div className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
              p.enabled ? 'translate-x-5' : 'translate-x-1'
            }`} />
          </div>
        </button>
      ))}
    </div>
    <button
      onClick={onContinue}
      className="w-full bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all"
    >
      Jetzt synchronisieren
    </button>
  </div>
);

const PodSyncStep: React.FC<{
  loading: boolean;
  result: PodSyncResult | null;
  error: string | null;
  onDone: () => void;
}> = ({ loading, result, error, onDone }) => (
  <div className="text-center space-y-6 py-4">
    {loading && (
      <>
        <div className="w-20 h-20 relative mx-auto">
          <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgb(51,65,85)" strokeWidth="6" />
            <circle
              cx="40" cy="40" r="36" fill="none" stroke="url(#syncGrad)" strokeWidth="6"
              strokeLinecap="round" strokeDasharray="226" strokeDashoffset="56"
              className="animate-pulse"
            />
            <defs>
              <linearGradient id="syncGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <p className="text-slate-400">Daten werden synchronisiert...</p>
      </>
    )}
    {!loading && result && result.errors.length === 0 && (
      <>
        <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(16,185,129,0.3)]">
          <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white">Alles sicher!</h3>
        <p className="text-slate-400 text-sm">
          {result.syncedEntities} Datenbereiche erfolgreich synchronisiert.
        </p>
        <button
          onClick={onDone}
          className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-400 hover:to-blue-400 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
        >
          Fertig
        </button>
      </>
    )}
    {!loading && result && result.errors.length > 0 && (
      <>
        <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <p className="text-yellow-400 text-sm">
          {result.syncedEntities} synchronisiert, {result.errors.length} Fehler
        </p>
        <button onClick={onDone} className="glass px-6 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors">
          Schliessen
        </button>
      </>
    )}
    {!loading && error && (
      <>
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-red-400 text-sm">{error}</p>
        <button onClick={onDone} className="glass px-6 py-2 rounded-xl text-sm text-slate-300 hover:text-white transition-colors">
          Schliessen
        </button>
      </>
    )}
  </div>
);

// --- Main Modal ---

interface PodConnectModalProps {
  open: boolean;
  step: PodModalStep;
  permissions: PodPermission[];
  loading: boolean;
  syncResult: PodSyncResult | null;
  error: string | null;
  onClose: () => void;
  onSetStep: (step: PodModalStep) => void;
  onTogglePermission: (category: string) => void;
  onConnect: (provider: PodProvider, url: string) => void;
  onSync: (data: PodSyncRequest) => void;
}

export const PodConnectModal: React.FC<PodConnectModalProps> = ({
  open,
  step,
  permissions,
  loading,
  syncResult,
  error,
  onClose,
  onSetStep,
  onTogglePermission,
  onConnect,
  onSync,
}) => {
  const [providerUrl, setProviderUrl] = useState('');

  const handleProviderSelect = useCallback((provider: PodProvider, url: string) => {
    setProviderUrl(url);
    onSetStep('auth');
    onConnect(provider, url);
  }, [onConnect, onSetStep]);

  const handleSyncStart = useCallback(() => {
    onSetStep('sync');
    onSync({
      engagement: { totalXP: 0, level: 1, streak: 0, title: 'Starter' },
      journeyProgress: {},
    });
  }, [onSetStep, onSync]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {step === 'explain' && (
          <PodExplainStep
            onContinue={() => onSetStep('provider')}
            onSkip={onClose}
          />
        )}
        {step === 'provider' && (
          <PodProviderStep
            onSelect={handleProviderSelect}
            onBack={() => onSetStep('explain')}
          />
        )}
        {step === 'auth' && (
          <PodAuthStep loading={loading} error={error} onRetry={() => handleProviderSelect('managed', providerUrl)} />
        )}
        {step === 'permissions' && (
          <PodPermissionStep
            permissions={permissions}
            onToggle={onTogglePermission}
            onContinue={handleSyncStart}
          />
        )}
        {step === 'sync' && (
          <PodSyncStep
            loading={loading}
            result={syncResult}
            error={error}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  );
};
