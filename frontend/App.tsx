import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout } from './components/Layout';
import { WelcomePage } from './components/WelcomePage';
import { LoginPage } from './components/LoginPage';
import { LandingPage } from './components/LandingPage';
import { OnboardingChat } from './components/OnboardingChat';
import { JourneySelector } from './components/JourneySelector';
import { VucaStation } from './components/stations/VucaStation';
import { EntrepreneurStation } from './components/stations/EntrepreneurStation';
import { SelfLearningStation } from './components/stations/SelfLearningStation';
import { CombinedProfile } from './components/CombinedProfile';
import { AdminConsole } from './components/admin/AdminConsole';
import { getStationsAsRecord } from './services/contentResolver';
import { getCurrentUser, logout as authLogout, seedDefaultAdmin } from './services/auth';
import { refreshAuthUser } from './services/firebaseAuth';
import { isFirebaseConfigured } from './services/firebase';
import type { UserProfile, OnboardingInsights, VoiceDialect } from './types/user';
import type { JourneyType, Station, StationResult } from './types/journey';
import type { AuthUser } from './types/auth';
import { createInitialProfile } from './types/user';
import {
  trackPageView,
  trackOnboardingStart,
  trackOnboardingComplete,
  trackJourneySelect,
  trackStationStart,
  trackStationComplete,
  trackProfileView,
} from './services/analytics';

type ViewState =
  | 'welcome'
  | 'login'
  | 'landing'
  | 'onboarding'
  | 'journey-select'
  | 'station'
  | 'profile'
  | 'journey-complete'
  | 'admin';

const STORAGE_KEY = 'future-skiller-state';
const VOICE_STORAGE_KEY = 'future-skiller-voice-enabled';

interface AppState {
  view: ViewState;
  profile: UserProfile;
  stationResults: StationResult[];
  activeJourney: JourneyType | null;
  activeStation: Station | null;
}

function loadState(isLoggedIn: boolean): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const storedView = parsed.view as ViewState;
      let view: ViewState;
      if (isLoggedIn) {
        // Logged in: skip welcome and login, restore saved view or go to landing
        view = storedView === 'welcome' || storedView === 'login' ? 'landing' : storedView;
      } else {
        // Not logged in: always start at the public welcome page
        view = 'welcome';
      }
      return {
        ...parsed,
        view,
        activeStation: parsed.activeStation || null,
      };
    }
  } catch {
    // ignore
  }
  return {
    view: isLoggedIn ? 'landing' : 'welcome',
    profile: createInitialProfile(),
    stationResults: [],
    activeJourney: null,
    activeStation: null,
  };
}

function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// Seed default admin user for local development (no-op if users exist)
seedDefaultAdmin();

const App: React.FC = () => {
  const [authUser, setAuthUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [state, setState] = useState<AppState>(() => loadState(!!getCurrentUser()));
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(() => {
    try { return localStorage.getItem(VOICE_STORAGE_KEY) === 'true'; } catch { return false; }
  });
  const onboardingStartTime = useRef<number>(0);
  const stationStartTime = useRef<number>(0);

  // Persist on change
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Refresh admin role from Firebase custom claims on mount
  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    refreshAuthUser().then((updated) => {
      if (updated) setAuthUser(updated);
    });
  }, []);

  const setView = useCallback((view: ViewState) => {
    setState((prev) => {
      trackPageView(prev.view, view);
      return { ...prev, view };
    });
  }, []);

  // Auth handlers
  const handleLogin = useCallback((user: AuthUser) => {
    setAuthUser(user);
    trackPageView('login', 'landing');
    setState((prev) => ({ ...prev, view: 'landing' }));
  }, []);

  const handleLogout = useCallback(async () => {
    authLogout();
    setAuthUser(null);
    setState((prev) => ({ ...prev, view: 'welcome' }));
  }, []);

  const handleAdminClick = useCallback(() => {
    setView('admin');
  }, [setView]);

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

  const handleDialectChange = useCallback((dialect: VoiceDialect) => {
    setState((prev) => ({
      ...prev,
      profile: { ...prev.profile, voiceDialect: dialect },
    }));
  }, []);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => {
      const next = !prev;
      try { localStorage.setItem(VOICE_STORAGE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Completed journeys (at least 1 station)
  const completedJourneys = (
    Object.entries(state.profile.journeyProgress) as [JourneyType, any][]
  )
    .filter(([, p]) => p.stationsCompleted > 0)
    .map(([type]) => type);

  // Show welcome and login pages without layout chrome
  if (state.view === 'welcome') {
    return <WelcomePage onGetStarted={() => setView('login')} />;
  }

  if (state.view === 'login') {
    return <LoginPage onLogin={handleLogin} />;
  }

  const hasActivity =
    state.stationResults.length > 0 ||
    state.profile.onboardingInsights !== null;

  const showBack =
    state.view !== 'landing' &&
    state.view !== 'onboarding' &&
    state.view !== 'admin';

  return (
    <Layout
      showBackButton={showBack}
      showProfileButton={hasActivity}
      onProfileClick={handleViewProfile}
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
      onAdminClick={handleAdminClick}
      voiceEnabled={voiceEnabled}
      onToggleVoice={handleToggleVoice}
    >
      {state.view === 'landing' && (
        <LandingPage onStart={handleStartJourney} onSelectJourney={handleSelectJourney} onViewProfile={handleViewProfile} journeyProgress={state.profile.journeyProgress} />
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
        <JourneySelector
          insights={state.profile.onboardingInsights}
          completedJourneys={completedJourneys}
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
          onDialectChange={handleDialectChange}
        />
      )}

      {state.view === 'admin' && authUser && authUser.role === 'admin' && (
        <AdminConsole
          currentUser={authUser}
          onBack={() => setView('landing')}
        />
      )}
    </Layout>
  );
};

export default App;
