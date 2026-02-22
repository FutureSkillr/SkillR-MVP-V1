import React, { useState, useEffect, useCallback } from 'react';
import { PromptLogPanel } from './debug/PromptLogPanel';
import type { AuthUser } from '../types/auth';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onAdminClick?: () => void;
  onProfileClick?: () => void;
  showProfileButton?: boolean;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showBackButton,
  onBack,
  authUser,
  onLogout,
  onAdminClick,
  onProfileClick,
  showProfileButton,
  voiceEnabled,
  onToggleVoice,
}) => {
  const [debugOpen, setDebugOpen] = useState(false);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      setDebugOpen((prev) => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="glass sticky top-0 z-50 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {showBackButton && onBack && (
              <button
                onClick={onBack}
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}
            <h1 className="text-lg font-bold">
              <span className="gradient-text">Future Skiller</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {authUser ? (
              <>
                {onProfileClick && (
                  <button
                    onClick={onProfileClick}
                    className="text-xs px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors font-medium flex items-center gap-1.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    Profil
                  </button>
                )}
                {onToggleVoice && (
                  <button
                    onClick={onToggleVoice}
                    className={`p-1.5 rounded-lg transition-colors ${
                      voiceEnabled
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800/50 border border-white/10 text-slate-500 hover:text-slate-300'
                    }`}
                    title={voiceEnabled ? 'Sprachausgabe deaktivieren' : 'Sprachausgabe aktivieren'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {voiceEnabled ? (
                        <>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                        </>
                      ) : (
                        <>
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                          <line x1="23" y1="9" x2="17" y2="15" />
                          <line x1="17" y1="9" x2="23" y2="15" />
                        </>
                      )}
                    </svg>
                  </button>
                )}
                {authUser.role === 'admin' && onAdminClick && (
                  <button
                    onClick={onAdminClick}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 hover:bg-purple-500/20 transition-colors font-medium"
                  >
                    Admin
                  </button>
                )}
                <span className="text-xs text-slate-400 font-medium">
                  {authUser.displayName}
                </span>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Abmelden
                  </button>
                )}
              </>
            ) : (
              <span className="text-xs text-slate-500 font-mono">MVP Demo</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>

      {/* Footer */}
      <footer className="glass-light px-4 py-3 text-center">
        <p className="text-xs text-slate-500">
          Future Skiller &mdash; Bist Du ein SkillR?
        </p>
      </footer>

      {/* Debug Panel */}
      <PromptLogPanel isOpen={debugOpen} onClose={() => setDebugOpen(false)} />
    </div>
  );
};
