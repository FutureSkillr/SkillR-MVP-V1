import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { WelcomePage } from './components/WelcomePage';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { OnboardingChat } from './components/OnboardingChat';
import { GlobeNavigation } from './components/GlobeNavigation';
import { VucaStation } from './components/stations/VucaStation';
import { EntrepreneurStation } from './components/stations/EntrepreneurStation';
import { SelfLearningStation } from './components/stations/SelfLearningStation';
import { CombinedProfile } from './components/CombinedProfile';
import { CoachSelectPage } from './components/intro/CoachSelectPage';
import { IntroChat } from './components/intro/IntroChat';
import { IntroRegisterPage } from './components/intro/IntroRegisterPage';
import { DatenschutzPage } from './components/legal/DatenschutzPage';
import { ImpressumPage } from './components/legal/ImpressumPage';
import { CookieSettingsModal } from './components/legal/CookieSettingsModal';
import { PartnerPreviewPage } from './components/partner/PartnerPreviewPage';
import { PartnerAdminPage } from './components/partner/PartnerAdminPage';
import { getStationsAsRecord } from './services/contentResolver';
import { getCurrentUser, logout as authLogout, seedDefaultAdmin } from './services/auth';
import { refreshAuthUser } from './services/firebaseAuth';
import { isFirebaseConfigured } from './services/firebase';
import { updateIntroCoach, loadIntroState, transferIntroToProfile } from './services/introStorage';
import {
  setCurrentUserId,
  loadUserData,
  saveUserData,
  migrateAnonymousToUser,
  clearCurrentSession,
} from './services/userStorage';
import type { UserProfile, OnboardingInsights } from './types/user';
import { getDialectForCoach } from './types/user';
import type { JourneyType, Station, StationResult } from './types/journey';
import type { AuthUser } from './types/auth';
import type { CoachId } from './types/intro';
import { createInitialProfile } from './types/user';
import {
  trackPageView,
  trackOnboardingStart,
  trackOnboardingComplete,
  trackJourneySelect,
  trackStationStart,
  trackStationComplete,
  trackProfileView,
  trackCoachChange,
} from './services/analytics';
import { captureUTM } from './services/campaignAttribution';
import { hasMarketingConsent } from './services/consent';
import {
  initMetaPixel,
  trackPixelPageView,
  trackPixelViewContent,
  trackPixelInitiateCheckout,
  trackPixelCompleteRegistration,
} from './services/metaPixel';

type ViewState =
  | 'welcome'
  | 'intro-coach-select'
  | 'intro-chat'
  | 'intro-register'
  | 'login'
  | 'landing'
  | 'onboarding'
  | 'journey-select'
  | 'station'
  | 'profile'
  | 'journey-complete'
  | 'datenschutz'
  | 'impressum';

const STORAGE_KEY = 'skillr-state';
const VOICE_STORAGE_KEY = 'skillr-voice-enabled';

interface AppState {
  view: ViewState;
  profile: UserProfile;
  stationResults: StationResult[];
  activeJourney: JourneyType | null;
  activeStation: Station | null;
}

const FRESH_STATE: AppState = {
  view: 'welcome',
  profile: createInitialProfile(),
  stationResults: [],
  activeJourney: null,
  activeStation: null,
};

function loadState(isLoggedIn: boolean, userId?: string): AppState {
  const stored = loadUserData<AppState | null>(STORAGE_KEY, null, userId);
  if (stored) {
    const storedView = stored.view as ViewState;
    let view: ViewState;
    if (isLoggedIn) {
      const preAuthViews: ViewState[] = ['welcome', 'login', 'intro-coach-select', 'intro-chat', 'intro-register', 'datenschutz', 'impressum'];
      view = preAuthViews.includes(storedView) ? 'landing' : storedView;
    } else {
      view = 'welcome';
    }
    return {
      ...stored,
      view,
      activeStation: stored.activeStation || null,
    };
  }
  return {
    ...FRESH_STATE,
    view: isLoggedIn ? 'landing' : 'welcome',
    profile: createInitialProfile(),
  };
}

function saveState(state: AppState, userId?: string) {
  saveUserData(STORAGE_KEY, state, userId);
}

// Seed default admin user for local development (no-op if users exist)
seedDefaultAdmin();

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => {
    const user = getCurrentUser();
    if (user) setCurrentUserId(user.id);
    return user;
  });
  const [state, setState] = useState<AppState>(() => {
    const user = getCurrentUser();
    return loadState(!!user, user?.id);
  });
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try { return loadUserData<string>(VOICE_STORAGE_KEY, 'false') === 'true'; } catch { return false; }
  });
  const [introCoachId, setIntroCoachId] = useState<CoachId | null>(() => loadIntroState()?.coachId ?? null);
  const [cookieModalOpen, setCookieModalOpen] = useState(false);
  const [legalReturnView, setLegalReturnView] = useState<ViewState>('welcome');
  const [partnerSlug, setPartnerSlug] = useState<string | null>(null);
  const [partnerAdminSlug, setPartnerAdminSlug] = useState<string | null>(null);
  const onboardingStartTime = useRef<number>(0);
  const stationStartTime = useRef<number>(0);

  // Persist on change (write to the current user's slot)
  useEffect(() => {
    saveState(state, authUser?.id);
  }, [state, authUser?.id]);

  // Refresh admin role from Firebase custom claims on mount
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    refreshAuthUser().then((updated) => {
      if (updated) setAuthUser(updated);
    });
  }, []);

  // Refresh Firebase ID token every 50 minutes (tokens expire after 1 hour)
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const interval = setInterval(() => {
      refreshAuthUser().then((updated) => {
        if (updated) setAuthUser(updated);
      });
    }, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // FR-113: Capture UTM parameters from URL on first visit
  useEffect(() => {
    captureUTM();
  }, []);

  // Handle ?view= query param from external pages (landing page footer links)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const view = params.get('view');
      if (view === 'impressum') {
        setView('impressum');
      } else if (view === 'datenschutz') {
        setView('datenschutz');
      } else if (view === 'cookies') {
        setCookieModalOpen(true);
      }
      // Clean up URL without reload
      if (view) {
        window.history.replaceState({}, '', window.location.pathname);
      }
    } catch { /* ignore */ }
  }, []);

  // FR-119/FR-120: Detect ?partner= and ?partner-admin= URL params
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const partner = params.get('partner');
      const partnerAdmin = params.get('partner-admin');
      if (partner) {
        setPartnerSlug(partner);
      } else if (partnerAdmin) {
        setPartnerAdminSlug(partnerAdmin);
      }
    } catch { /* ignore */ }
  }, []);

  // FR-113: Initialize Meta Pixel after marketing consent
  useEffect(() => {
    if (!hasMarketingConsent()) return;
    fetch('/api/config').then((res) => res.json()).then((cfg) => {
      const pixelId = cfg?.tracking?.metaPixelId;
      if (pixelId) {
        initMetaPixel(pixelId);
        trackPixelPageView();
      }
    }).catch(() => { /* ignore — pixel is best-effort */ });
  }, []);

  const setView = useCallback((view: ViewState) => {
    setState((prev) => {
      trackPageView(prev.view, view);
      return { ...prev, view };
    });
  }, []);

  // Auth handlers
  const handleLogin = useCallback((user: AuthUser) => {
    // 1. Set current user ID for all storage operations
    setCurrentUserId(user.id);

    // 2. Migrate any anonymous data to user-keyed storage (first-time only)
    migrateAnonymousToUser(user.id);

    // 3. Load the user's persisted state
    const userState = loadState(true, user.id);

    // 4. Transfer any intro XP/interests into the profile
    const introResult = transferIntroToProfile();
    trackPageView('login', 'landing');
    trackPixelCompleteRegistration(introResult?.interests?.join(', '));

    const profile = { ...userState.profile };
    if (introResult) {
      if (introResult.coachId) {
        profile.coachId = introResult.coachId;
        profile.voiceDialect = getDialectForCoach(introResult.coachId);
      }
      profile.onboardingInsights = profile.onboardingInsights || {
        interests: introResult.interests,
        strengths: [],
        preferredStyle: 'hands-on' as const,
        recommendedJourney: 'vuca' as const,
        summary: '',
      };
    }

    // 5. Load user's voice preference
    setVoiceEnabled(loadUserData<string>(VOICE_STORAGE_KEY, 'false', user.id) === 'true');

    setAuthUser(user);
    setState({ ...userState, view: 'landing' as ViewState, profile });
  }, []);

  const handleLogout = useCallback(async () => {
    authLogout();
    // Clear anonymous keys so the next user doesn't see stale data
    clearCurrentSession();
    setCurrentUserId(null);
    setAuthUser(null);
    // Reset React state to fresh defaults
    setState({
      view: 'welcome',
      profile: createInitialProfile(),
      stationResults: [],
      activeJourney: null,
      activeStation: null,
    });
    setVoiceEnabled(false);
  }, []);

  // Landing -> Onboarding
  const handleStartJourney = useCallback(() => {
    trackOnboardingStart();
    onboardingStartTime.current = Date.now();
    setView('onboarding');
  }, [setView]);

  // Onboarding -> Journey Select
  const handleOnboardingComplete = useCallback(
    (insights: OnboardingInsights, messageCount?: number) => {
      const duration = onboardingStartTime.current
        ? Date.now() - onboardingStartTime.current
        : 0;
      trackOnboardingComplete(duration, messageCount ?? 0);
      setState((prev) => {
        trackPageView(prev.view, 'journey-select');
        return {
          ...prev,
          view: 'journey-select' as ViewState,
          profile: { ...prev.profile, onboardingInsights: insights },
        };
      });
    },
    []
  );

  // Journey Select -> Station
  const handleSelectJourney = useCallback((journeyType: JourneyType) => {
    const stations = getStationsAsRecord();
    const station = stations[journeyType];
    if (!station) return;
    trackJourneySelect(journeyType);
    trackStationStart(station.id, journeyType);
    stationStartTime.current = Date.now();
    setState((prev) => {
      trackPageView(prev.view, 'station');
      return {
        ...prev,
        view: 'station' as ViewState,
        activeJourney: journeyType,
        activeStation: station,
      };
    });
  }, []);

  // Station -> Journey Complete
  const handleStationComplete = useCallback((result: StationResult) => {
    const duration = stationStartTime.current
      ? Date.now() - stationStartTime.current
      : 0;
    trackStationComplete(result.stationId, result.journeyType, duration, result.dimensionScores);
    setState((prev) => {
      const newResults = [...prev.stationResults, result];
      const newProfile = { ...prev.profile };
      newProfile.completedStations = [
        ...newProfile.completedStations,
        result.stationId,
      ];

      const jp = { ...newProfile.journeyProgress[result.journeyType] };
      jp.started = true;
      jp.stationsCompleted += 1;

      const scores = { ...jp.dimensionScores };
      for (const [dim, score] of Object.entries(result.dimensionScores)) {
        scores[dim] = Math.max(scores[dim] || 0, score as number);
      }
      jp.dimensionScores = scores;
      newProfile.journeyProgress[result.journeyType] = jp;

      return {
        ...prev,
        view: 'journey-complete' as ViewState,
        profile: newProfile,
        stationResults: newResults,
        activeStation: null,
      };
    });
  }, []);

  // Back to journey selection
  const handleBackToSelect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      view: 'journey-select',
      activeStation: null,
      activeJourney: null,
    }));
  }, []);

  const handleViewProfile = useCallback(() => {
    const journeysStarted = (
      Object.values(state.profile.journeyProgress) as { stationsCompleted: number }[]
    ).filter((p) => p.stationsCompleted > 0).length;
    trackProfileView(state.profile.completedStations.length, journeysStarted);
    setView('profile');
  }, [setView, state.profile]);

  const handleCoachChange = useCallback((newCoachId: CoachId) => {
    setState((prev) => {
      if (prev.profile.coachId === newCoachId) return prev;
      trackCoachChange(prev.profile.coachId, newCoachId);
      return {
        ...prev,
        profile: {
          ...prev.profile,
          coachId: newCoachId,
          voiceDialect: getDialectForCoach(newCoachId),
        },
      };
    });
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      saveUserData(VOICE_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Partner click — navigate to partner preview page
  const handlePartnerClick = useCallback((slug: string) => {
    setPartnerSlug(slug);
    window.history.pushState({}, '', `?partner=${encodeURIComponent(slug)}`);
  }, []);

  // Completed journeys (at least 1 station)
  const completedJourneys = (
    Object.entries(state.profile.journeyProgress) as [JourneyType, any][]
  )
    .filter(([, p]) => p.stationsCompleted > 0)
    .map(([type]) => type);

  // Legal navigation handler — remembers which view to return to
  const handleLegalNavigate = useCallback((page: 'datenschutz' | 'impressum') => {
    setLegalReturnView(state.view);
    setView(page);
  }, [state.view, setView]);

  const handleLegalBack = useCallback(() => {
    setView(legalReturnView);
  }, [legalReturnView, setView]);

  // FR-119: Partner preview page (public, no auth required)
  if (partnerSlug) {
    return (
      <PartnerPreviewPage
        partnerSlug={partnerSlug}
        onBack={() => {
          setPartnerSlug(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
        onStartJourney={(slug) => {
          setPartnerSlug(null);
          // Set sponsor param so BrandContext picks up the partner branding
          const url = new URL(window.location.href);
          url.searchParams.delete('partner');
          url.searchParams.set('sponsor', slug);
          window.location.href = url.toString();
        }}
      />
    );
  }

  // FR-120: Partner admin page (requires admin role)
  if (partnerAdminSlug) {
    if (authUser?.role !== 'admin') {
      return (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-6xl">🔒</div>
            <h1 className="text-2xl font-bold text-white">Zugriff verweigert</h1>
            <p className="text-slate-400">Admin-Berechtigung erforderlich.</p>
            <button
              onClick={() => {
                setPartnerAdminSlug(null);
                window.history.replaceState({}, '', window.location.pathname);
              }}
              className="mt-4 px-6 py-2.5 rounded-xl glass text-sm text-slate-300 hover:text-white transition-colors"
            >
              Zurueck
            </button>
          </div>
        </div>
      );
    }
    return (
      <PartnerAdminPage
        partnerSlug={partnerAdminSlug}
        onBack={() => {
          setPartnerAdminSlug(null);
          window.history.replaceState({}, '', window.location.pathname);
        }}
      />
    );
  }

  // Show welcome, intro, and login pages without layout chrome
  if (state.view === 'welcome') {
    return (
      <>
        <WelcomePage
          onGetStarted={() => setView('intro-coach-select')}
          onLogin={() => setView('login')}
          onPartnerClick={handlePartnerClick}
          onNavigate={handleLegalNavigate}
          onOpenCookieSettings={() => setCookieModalOpen(true)}
        />
        <CookieSettingsModal
          open={cookieModalOpen}
          onClose={() => setCookieModalOpen(false)}
          onConsentChange={() => setCookieModalOpen(false)}
        />
      </>
    );
  }

  if (state.view === 'intro-coach-select') {
    return (
      <CoachSelectPage
        onSelect={(coachId) => {
          setIntroCoachId(coachId);
          updateIntroCoach(coachId);
          trackPixelViewContent(coachId);
          trackPixelInitiateCheckout(coachId, 0);
          setView('intro-chat');
        }}
        onBack={() => setView('welcome')}
      />
    );
  }

  if (state.view === 'intro-chat' && introCoachId) {
    return (
      <IntroChat
        coachId={introCoachId}
        onComplete={() => setView('intro-register')}
        onBack={() => setView('intro-coach-select')}
      />
    );
  }

  if (state.view === 'intro-register') {
    const introState = loadIntroState();
    return (
      <IntroRegisterPage
        onRegister={handleLogin}
        onLoginInstead={() => setView('login')}
        earnedXP={introState?.earnedXP ?? 0}
      />
    );
  }

  if (state.view === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  if (state.view === 'datenschutz') {
    return (
      <>
        <DatenschutzPage
          onBack={handleLegalBack}
          onNavigate={handleLegalNavigate}
          onOpenCookieSettings={() => setCookieModalOpen(true)}
        />
        <CookieSettingsModal
          open={cookieModalOpen}
          onClose={() => setCookieModalOpen(false)}
          onConsentChange={() => setCookieModalOpen(false)}
        />
      </>
    );
  }

  if (state.view === 'impressum') {
    return (
      <>
        <ImpressumPage
          onBack={handleLegalBack}
          onNavigate={handleLegalNavigate}
          onOpenCookieSettings={() => setCookieModalOpen(true)}
        />
        <CookieSettingsModal
          open={cookieModalOpen}
          onClose={() => setCookieModalOpen(false)}
          onConsentChange={() => setCookieModalOpen(false)}
        />
      </>
    );
  }

  const hasActivity =
    state.stationResults.length > 0 ||
    state.profile.onboardingInsights !== null;

  const showBack =
    state.view !== 'landing' &&
    state.view !== 'onboarding';

  return (
    <>
    <Layout
      showBackButton={showBack}
      showProfileButton={hasActivity}
      onProfileClick={handleViewProfile}
      showJourneyButton={!!authUser}
      journeySelectActive={state.view === 'journey-select'}
      onSelectJourney={handleBackToSelect}
      onBack={
        showBack
          ? () => {
              if (state.view === 'profile') {
                setView('landing');
              } else if (state.view === 'station') {
                handleBackToSelect();
              } else if (state.view === 'journey-complete') {
                setView('journey-select');
              } else {
                setView('landing');
              }
            }
          : undefined
      }
      authUser={authUser}
      onLogout={handleLogout}
      voiceEnabled={voiceEnabled}
      onToggleVoice={handleToggleVoice}
      onNavigate={handleLegalNavigate}
      onOpenCookieSettings={() => setCookieModalOpen(true)}
    >
      {state.view === 'landing' && (
        <LandingPage onStart={handleStartJourney} onSelectJourney={handleSelectJourney} onViewProfile={handleViewProfile} onPartnerClick={handlePartnerClick} journeyProgress={state.profile.journeyProgress} />
      )}

      {state.view === 'onboarding' && (
        <OnboardingChat
          onComplete={handleOnboardingComplete}
          onBack={() => setView('landing')}
          voiceEnabled={voiceEnabled}
          voiceDialect={state.profile.voiceDialect}
        />
      )}

      {state.view === 'journey-select' && (
        <GlobeNavigation
          insights={state.profile.onboardingInsights}
          completedJourneys={completedJourneys}
          completedStations={state.profile.completedStations}
          onSelect={handleSelectJourney}
          onViewProfile={handleViewProfile}
        />
      )}

      {state.view === 'station' &&
        state.activeStation &&
        state.activeJourney === 'vuca' && (
          <VucaStation
            station={state.activeStation}
            onComplete={handleStationComplete}
            onBack={handleBackToSelect}
            voiceEnabled={voiceEnabled}
            voiceDialect={state.profile.voiceDialect}
            coachId={state.profile.coachId ?? undefined}
          />
        )}

      {state.view === 'station' &&
        state.activeStation &&
        state.activeJourney === 'entrepreneur' && (
          <EntrepreneurStation
            station={state.activeStation}
            onComplete={handleStationComplete}
            onBack={handleBackToSelect}
            voiceEnabled={voiceEnabled}
            voiceDialect={state.profile.voiceDialect}
            coachId={state.profile.coachId ?? undefined}
          />
        )}

      {state.view === 'station' &&
        state.activeStation &&
        state.activeJourney === 'self-learning' && (
          <SelfLearningStation
            station={state.activeStation}
            onComplete={handleStationComplete}
            onBack={handleBackToSelect}
            voiceEnabled={voiceEnabled}
            voiceDialect={state.profile.voiceDialect}
            coachId={state.profile.coachId ?? undefined}
          />
        )}

      {state.view === 'journey-complete' && (
        <div className="max-w-2xl mx-auto text-center py-16 space-y-8">
          <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_60px_rgba(16,185,129,0.4)]">
            <span className="text-6xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold">Station abgeschlossen!</h1>
          <p className="text-slate-400 max-w-md mx-auto">
            {state.stationResults.length > 0 &&
              state.stationResults[state.stationResults.length - 1].summary}
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <button
              onClick={handleViewProfile}
              className="glass px-6 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Mein Profil ansehen
            </button>
            <button
              onClick={handleBackToSelect}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all"
            >
              Naechste Reise waehlen
            </button>
          </div>
        </div>
      )}

      {state.view === 'profile' && (
        <CombinedProfile
          profile={state.profile}
          stationResults={state.stationResults}
          onBack={() => setView('landing')}
          onSelectJourney={handleBackToSelect}
          onCoachChange={handleCoachChange}
        />
      )}

    </Layout>
    <CookieSettingsModal
      open={cookieModalOpen}
      onClose={() => setCookieModalOpen(false)}
      onConsentChange={() => setCookieModalOpen(false)}
    />
    </>
  );
};

export default App;
