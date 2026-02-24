import React, { useState, useEffect, useCallback } from 'react';
import { PromptLogPanel } from './debug/PromptLogPanel';
import { AdminBar } from './admin/AdminBar';
import { UserAdmin } from './admin/UserAdmin';
import { RoleManager } from './admin/RoleManager';
import { MetaKursEditor } from './admin/MetaKursEditor';
import { AnalyticsDashboard } from './admin/AnalyticsDashboard';
import { BrandConfigEditor } from './admin/BrandConfigEditor';
import { BusinessConfigTab } from './admin/BusinessConfigTab';
import { CampaignDashboard } from './admin/CampaignDashboard';
import { DialogTraceViewer } from './admin/DialogTraceViewer';
import { ContentPackEditor } from './admin/ContentPackEditor';
import { InfraDashboard } from './admin/InfraDashboard';
import { PageFlowGraph } from './admin/PageFlowGraph';
import { LegalFooter } from './legal/LegalFooter';
import { isDevMode } from '../services/devMode';
import type { AuthUser } from '../types/auth';
import type { AdminTab } from '../types/admin';

interface LayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  onBack?: () => void;
  authUser?: AuthUser | null;
  onLogout?: () => void;
  onProfileClick?: () => void;
  showProfileButton?: boolean;
  /** Show globe navigation button in header. */
  showJourneyButton?: boolean;
  /** Globe button is "active" (journey-select page shown) — earth-blue glow. */
  journeySelectActive?: boolean;
  onSelectJourney?: () => void;
  voiceEnabled?: boolean;
  onToggleVoice?: () => void;
  onNavigate?: (page: 'datenschutz' | 'impressum') => void;
  onOpenCookieSettings?: () => void;
}

const ADMIN_LABELS: Record<AdminTab, string> = {
  users: 'Benutzer',
  roles: 'Rollen',
  brands: 'Partner-Brands',
  'meta-kurs': 'Content Editor',
  'content-packs': 'Content Packs',
  analytics: 'Analytics',
  flow: 'Page Flow',
  dialogs: 'Dialog-Trace',
  campaigns: 'Kampagnen',
  legal: 'Geschaeftsdaten',
  infra: 'Infrastruktur',
};

export const Layout: React.FC<LayoutProps> = ({
  children,
  showBackButton,
  onBack,
  authUser,
  onLogout,
  onProfileClick,
  showProfileButton,
  showJourneyButton,
  journeySelectActive,
  onSelectJourney,
  voiceEnabled,
  onToggleVoice,
  onNavigate,
  onOpenCookieSettings,
}) => {
  const [debugOpen, setDebugOpen] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab | null>(null);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'L') {
      e.preventDefault();
      setDebugOpen((prev) => !prev);
    }
    if (e.key === 'Escape' && adminTab) {
      setAdminTab(null);
    }
  }, [adminTab]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const isAdmin = authUser?.role === 'admin' || isDevMode();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Admin Bar — thin dark strip above nav, admin-only */}
      {isAdmin && authUser && (
        <AdminBar
          activeTab={adminTab}
          onTabChange={setAdminTab}
          displayName={authUser.displayName}
        />
      )}

      {/* Header */}
      <header className={`glass sticky ${isAdmin ? 'top-9' : 'top-0'} z-50 px-4 py-3`}>
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          {/* Left: back + logo */}
          <div className="flex items-center gap-3">
            {((showBackButton && onBack) || adminTab) && (
              <button
                onClick={() => {
                  if (adminTab) {
                    setAdminTab(null);
                  } else if (onBack) {
                    onBack();
                  }
                }}
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
            <img src="/icons/app-icon.png" alt="SkillR" className="w-7 h-7 rounded-lg" />
            <h1 className="text-lg font-bold">
              <span className="gradient-text">SkillR</span>
            </h1>
            {adminTab && (
              <span className="text-xs text-purple-400 font-medium hidden sm:inline">
                / {ADMIN_LABELS[adminTab]}
              </span>
            )}
          </div>

          {/* Center: globe + audio toggle */}
          {authUser && !adminTab && (
            <div className="flex items-center gap-2">
              {showJourneyButton && onSelectJourney && (
                <button
                  onClick={onSelectJourney}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    journeySelectActive
                      ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_14px_rgba(59,130,246,0.5)]'
                      : 'bg-slate-800/60 text-slate-400 hover:text-blue-300 hover:bg-blue-500/10'
                  }`}
                  title="Reise-Auswahl"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </button>
              )}
              {onToggleVoice && (
                <button
                  onClick={onToggleVoice}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    voiceEnabled
                      ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                      : 'bg-slate-800/60 text-slate-500 hover:text-slate-300'
                  }`}
                  title={voiceEnabled ? 'Audio-Modus deaktivieren' : 'Audio-Modus aktivieren'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            </div>
          )}

          {/* Right: navigation + user */}
          <div className="flex items-center gap-3">
            {authUser ? (
              <>
                {onProfileClick && !adminTab && (
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
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
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

      {/* Main Content — admin page or app content */}
      <main className="flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          {adminTab && authUser ? (
            <>
              {adminTab === 'users' && <UserAdmin currentUser={authUser} />}
              {adminTab === 'roles' && <RoleManager currentUser={authUser} />}
              {adminTab === 'brands' && <BrandConfigEditor />}
              {adminTab === 'meta-kurs' && <MetaKursEditor />}
              {adminTab === 'content-packs' && <ContentPackEditor />}
              {adminTab === 'analytics' && <AnalyticsDashboard />}
              {adminTab === 'flow' && <PageFlowGraph />}
              {adminTab === 'dialogs' && <DialogTraceViewer />}
              {adminTab === 'campaigns' && <CampaignDashboard />}
              {adminTab === 'legal' && <BusinessConfigTab />}
              {adminTab === 'infra' && <InfraDashboard />}
            </>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Footer */}
      {onNavigate && onOpenCookieSettings ? (
        <LegalFooter
          onNavigate={onNavigate}
          onOpenCookieSettings={onOpenCookieSettings}
          variant="compact"
        />
      ) : (
        <footer className="glass-light px-4 py-3 text-center">
          <p className="text-xs text-slate-500">
            SkillR &mdash; Bist Du ein SkillR?
          </p>
        </footer>
      )}

      {/* Debug Panel */}
      <PromptLogPanel isOpen={debugOpen} onClose={() => setDebugOpen(false)} />
    </div>
  );
};
