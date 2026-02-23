import React, { useRef, useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { getJourneysAsDefinitions, getStationsAsRecord } from '../services/contentResolver';
import { STATION_COORDINATES } from '../constants/stationCoordinates';
import { DEFAULT_LERNREISEN } from '../constants/lernreisen';
import { fetchContentPack } from '../services/contentPack';
import type { JourneyType, Station, LernreiseDefinition } from '../types/journey';
import type { OnboardingInsights } from '../types/user';

const Globe = React.lazy(() => import('react-globe.gl'));

interface GlobeNavigationProps {
  insights: OnboardingInsights | null;
  completedJourneys: JourneyType[];
  completedStations: string[];
  onSelect: (journey: JourneyType) => void;
  onViewProfile: () => void;
}

interface PointData {
  lat: number;
  lng: number;
  city: string;
  stationId: string;
  journeyType: string;
  title: string;
  color: string;
  size: number;
  completed: boolean;
}

const JOURNEY_COLORS: Record<string, string> = {
  vuca: '#60A5FA',         // blue-400
  entrepreneur: '#FB923C', // orange-400
  'self-learning': '#C084FC', // purple-400
};

const JOURNEY_HEX_GLOW: Record<string, string> = {
  vuca: 'rgba(96, 165, 250, 0.4)',
  entrepreneur: 'rgba(251, 146, 60, 0.4)',
  'self-learning': 'rgba(192, 132, 252, 0.4)',
};

/** Compute center lat/lng for a journey (average of its station coords). */
function getJourneyCenter(journeyType: string): { lat: number; lng: number } {
  const coords = STATION_COORDINATES.filter((c) => c.journeyType === journeyType);
  if (coords.length === 0) return { lat: 48, lng: 10 };
  const lat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
  const lng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
  return { lat, lng };
}

function GlobeInner({
  insights,
  completedJourneys,
  completedStations,
  onSelect,
  onViewProfile,
}: GlobeNavigationProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [selectedStation, setSelectedStation] = useState<PointData | null>(null);
  const [selectedJourney, setSelectedJourney] = useState<string | null>(null);
  const [selectedLernreise, setSelectedLernreise] = useState<LernreiseDefinition | null>(null);
  const [lernreisen, setLernreisen] = useState<LernreiseDefinition[]>(DEFAULT_LERNREISEN);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, window.innerHeight * 0.45);
        setDimensions({ width: rect.width, height: size });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Fetch content pack from API (falls back to defaults)
  useEffect(() => {
    fetchContentPack().then(setLernreisen);
  }, []);

  const JOURNEYS = useMemo(() => getJourneysAsDefinitions(), []);
  const STATIONS = useMemo(() => getStationsAsRecord(), []);
  const journeyList = useMemo(() => Object.values(JOURNEYS), [JOURNEYS]);

  // Build point data from station coordinates
  const pointsData: PointData[] = useMemo(() => {
    return STATION_COORDINATES.map((coord) => {
      const station = STATIONS[coord.journeyType];
      const isCompleted = completedStations.includes(coord.stationId);
      return {
        lat: coord.lat,
        lng: coord.lng,
        city: coord.city,
        stationId: coord.stationId,
        journeyType: coord.journeyType,
        title: station?.title || coord.city,
        color: JOURNEY_COLORS[coord.journeyType] || '#94A3B8',
        size: isCompleted ? 0.6 : 1.0,
        completed: isCompleted,
      };
    });
  }, [STATIONS, completedStations]);

  // Build arcs between completed stations
  const arcsData = useMemo(() => {
    const completed = pointsData.filter((p) => p.completed);
    if (completed.length < 2) return [];
    const arcs = [];
    for (let i = 0; i < completed.length - 1; i++) {
      arcs.push({
        startLat: completed[i].lat,
        startLng: completed[i].lng,
        endLat: completed[i + 1].lat,
        endLng: completed[i + 1].lng,
        color: [completed[i].color, completed[i + 1].color],
      });
    }
    return arcs;
  }, [pointsData]);

  // Auto-rotate and initial position (Europe-centered)
  useEffect(() => {
    if (!globeRef.current || !globeReady) return;
    const globe = globeRef.current;
    globe.pointOfView({ lat: 48, lng: 10, altitude: 2.2 }, 0);
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.3;
    globe.controls().enableZoom = true;
    globe.controls().minDistance = 101;
    globe.controls().maxDistance = 600;
  }, [globeReady]);

  // Fly globe to a journey's center
  const flyToJourney = useCallback((journeyType: string) => {
    if (!globeRef.current) return;
    const center = getJourneyCenter(journeyType);
    globeRef.current.controls().autoRotate = false;
    globeRef.current.pointOfView({ lat: center.lat, lng: center.lng, altitude: 1.4 }, 800);
  }, []);

  // Fly globe to a specific lat/lng
  const flyToPoint = useCallback((lat: number, lng: number) => {
    if (!globeRef.current) return;
    globeRef.current.controls().autoRotate = false;
    globeRef.current.pointOfView({ lat, lng, altitude: 1.4 }, 800);
  }, []);

  // Select journey from carousel or filter
  const handleSelectJourney = useCallback((journeyType: string) => {
    setSelectedJourney(journeyType);
    setSelectedStation(null);
    setSelectedLernreise(null);
    flyToJourney(journeyType);
  }, [flyToJourney]);

  // Select a Lernreise card
  const handleSelectLernreise = useCallback((lr: LernreiseDefinition) => {
    if (selectedLernreise?.id === lr.id) {
      // Deselect
      setSelectedLernreise(null);
      setSelectedJourney(null);
      if (globeRef.current) {
        globeRef.current.controls().autoRotate = true;
        globeRef.current.pointOfView({ lat: 48, lng: 10, altitude: 2.2 }, 800);
      }
      return;
    }
    setSelectedLernreise(lr);
    setSelectedJourney(lr.journeyType);
    setSelectedStation(null);
    flyToPoint(lr.lat, lr.lng);
  }, [selectedLernreise, flyToPoint]);

  // Fly to selected station (point click on globe)
  const handlePointClick = useCallback(
    (point: any) => {
      const p = point as PointData;
      setSelectedStation(p);
      setSelectedJourney(p.journeyType);
      if (globeRef.current) {
        globeRef.current.controls().autoRotate = false;
        globeRef.current.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.2 }, 800);
      }
    },
    []
  );

  const handleStartJourney = useCallback(() => {
    const type = selectedStation?.journeyType || selectedJourney;
    if (type) onSelect(type as JourneyType);
  }, [selectedStation, selectedJourney, onSelect]);

  const handleClosePanel = useCallback(() => {
    setSelectedStation(null);
    setSelectedLernreise(null);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.pointOfView({ lat: 48, lng: 10, altitude: 2.2 }, 800);
    }
  }, []);

  const handleClearJourney = useCallback(() => {
    setSelectedJourney(null);
    setSelectedStation(null);
    setSelectedLernreise(null);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.pointOfView({ lat: 48, lng: 10, altitude: 2.2 }, 800);
    }
  }, []);

  const recommended = insights?.recommendedJourney || 'vuca';

  // Dimensions for the selected journey (level-2 filter labels)
  const selectedJourneyDef = selectedJourney ? JOURNEYS[selectedJourney] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 py-2">
      {/* Summary — hidden in globe view to reduce visual clutter */}

      <h2 className="text-2xl font-bold text-center">Wähle dein Reiseziel</h2>

      {/* Globe Container */}
      <div ref={containerRef} className="relative flex justify-center">
        <Suspense
          fallback={
            <div
              className="flex items-center justify-center"
              style={{ width: dimensions.width, height: dimensions.height }}
            >
              <div className="animate-pulse text-slate-400 text-sm">Lade Weltkarte...</div>
            </div>
          }
        >
          <Globe
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundImageUrl="https://unpkg.com/three-globe/example/img/night-sky.png"
            pointsData={pointsData}
            pointLat="lat"
            pointLng="lng"
            pointColor="color"
            pointAltitude={0.01}
            pointRadius={(d: any) => (d as PointData).completed ? 0.4 : 0.6}
            pointLabel={(d: any) => {
              const p = d as PointData;
              const journey = JOURNEYS[p.journeyType];
              return `<div style="text-align:center;padding:4px 8px;background:rgba(0,0,0,0.8);border-radius:8px;border:1px solid ${p.color}">
                <div style="color:${p.color};font-weight:bold;font-size:12px">${p.city}</div>
                <div style="color:#cbd5e1;font-size:11px">${p.title}</div>
                <div style="color:#64748b;font-size:10px">${journey?.title || ''}</div>
                ${p.completed ? '<div style="color:#4ade80;font-size:10px">&#x2713; Abgeschlossen</div>' : ''}
              </div>`;
            }}
            onPointClick={handlePointClick}
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={1500}
            arcStroke={0.5}
            atmosphereColor="#3B82F6"
            atmosphereAltitude={0.15}
            animateIn={true}
            onGlobeReady={() => setGlobeReady(true)}
          />
        </Suspense>

        {/* Passport stamp count */}
        <div className="absolute top-2 right-2 glass rounded-lg px-3 py-2 text-xs">
          <span className="text-slate-400">Stempel: </span>
          <span className="text-yellow-400 font-bold">{completedStations.length}</span>
          <span className="text-slate-500">/{STATION_COORDINATES.length}</span>
        </div>

        {/* Zoom full-out button */}
        <button
          onClick={handleClearJourney}
          className="absolute bottom-2 right-2 glass rounded-lg px-2.5 py-2 text-slate-400 hover:text-white transition-colors"
          title="Gesamtansicht"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 14 4 20 10 20" />
            <polyline points="20 10 20 4 14 4" />
            <line x1="14" y1="10" x2="21" y2="3" />
            <line x1="3" y1="21" x2="10" y2="14" />
          </svg>
        </button>
      </div>

      {/* Journey Carousel */}
      <div className="relative group">
        {/* Scroll left arrow */}
        <button
          onClick={() => {
            if (carouselRef.current) {
              carouselRef.current.scrollBy({ left: -240, behavior: 'smooth' });
            }
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-lg backdrop-blur-sm"
          aria-label="Scroll left"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Scroll right arrow */}
        <button
          onClick={() => {
            if (carouselRef.current) {
              carouselRef.current.scrollBy({ left: 240, behavior: 'smooth' });
            }
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all shadow-lg backdrop-blur-sm"
          aria-label="Scroll right"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div
          ref={carouselRef}
          className="flex gap-4 overflow-x-auto pb-2 px-10 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent"
        >
          {journeyList.map((journey) => {
            const isSelected = selectedJourney === journey.type;
            const isRecommended = journey.type === recommended;
            const stationsInJourney = STATION_COORDINATES.filter((c) => c.journeyType === journey.type);
            const completedCount = stationsInJourney.filter((c) => completedStations.includes(c.stationId)).length;
            const color = JOURNEY_COLORS[journey.type] || '#94A3B8';
            const glowColor = JOURNEY_HEX_GLOW[journey.type] || 'rgba(148,163,184,0.3)';

            return (
              <button
                key={journey.type}
                onClick={() => isSelected ? handleClearJourney() : handleSelectJourney(journey.type)}
                className={`snap-start shrink-0 w-56 glass rounded-2xl p-4 text-left transition-all hover:scale-[1.02] ${
                  isSelected ? 'ring-2' : 'hover:ring-1 hover:ring-slate-600'
                }`}
                style={isSelected ? {
                  ringColor: color,
                  boxShadow: `0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  borderColor: color,
                  outline: `2px solid ${color}`,
                  outlineOffset: '-2px',
                } : undefined}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{journey.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color }}>
                      {journey.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">{journey.subtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{journey.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">
                      {completedCount}/{stationsInJourney.length} Stationen
                    </span>
                  </div>
                  {isRecommended && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                      Empfohlen
                    </span>
                  )}
                </div>
                {/* Mini progress bar */}
                <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${stationsInJourney.length > 0 ? (completedCount / stationsInJourney.length) * 100 : 0}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </button>
            );
          })}

          {/* Lernreise cards */}
          {lernreisen.map((lr) => {
            const isSelected = selectedLernreise?.id === lr.id;
            const color = JOURNEY_COLORS[lr.journeyType] || '#94A3B8';
            const glowColor = JOURNEY_HEX_GLOW[lr.journeyType] || 'rgba(148,163,184,0.3)';

            return (
              <button
                key={lr.id}
                onClick={() => handleSelectLernreise(lr)}
                className={`snap-start shrink-0 w-56 glass rounded-2xl p-4 text-left transition-all hover:scale-[1.02] ${
                  isSelected ? 'ring-2' : 'hover:ring-1 hover:ring-slate-600'
                }`}
                style={isSelected ? {
                  boxShadow: `0 0 20px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`,
                  borderColor: color,
                  outline: `2px solid ${color}`,
                  outlineOffset: '-2px',
                } : undefined}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{lr.icon}</span>
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm truncate" style={{ color }}>
                      {lr.title}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">{lr.subtitle}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-3">{lr.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                    📍 {lr.location}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two-Level Label Filter */}
      <div className="space-y-3">
        {/* Level 1: Journey type pills */}
        <div className="flex flex-wrap gap-2 justify-center">
          {journeyList.map((journey) => {
            const isActive = selectedJourney === journey.type;
            const color = JOURNEY_COLORS[journey.type] || '#94A3B8';
            return (
              <button
                key={journey.type}
                onClick={() => isActive ? handleClearJourney() : handleSelectJourney(journey.type)}
                className={`text-xs px-4 py-1.5 rounded-full border font-medium transition-all ${
                  isActive
                    ? 'border-current'
                    : 'border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                }`}
                style={isActive ? { color, borderColor: color, backgroundColor: color + '15' } : undefined}
              >
                {journey.icon} {journey.title}
              </button>
            );
          })}
        </div>

        {/* Level 2: Dimension pills (shown when a journey is selected) */}
        {selectedJourneyDef && selectedJourneyDef.dimensions.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center animate-in fade-in duration-300">
            {selectedJourneyDef.dimensions.map((dim) => (
              <span
                key={dim.key}
                className="text-[11px] px-3 py-1 rounded-full border border-slate-700/30 text-slate-400 bg-slate-800/40"
                title={dim.description}
              >
                {dim.experienceLabel}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Station Info Panel (slide up on globe point click) */}
      {selectedStation && (
        <StationInfoPanel
          station={selectedStation}
          journey={JOURNEYS[selectedStation.journeyType]}
          onStart={handleStartJourney}
          onClose={handleClosePanel}
        />
      )}

      {/* Lernreise Info Panel */}
      {selectedLernreise && !selectedStation && (
        <div className="glass rounded-2xl p-5 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: (JOURNEY_COLORS[selectedLernreise.journeyType] || '#94A3B8') + '20' }}
              >
                {selectedLernreise.icon}
              </div>
              <div>
                <h3 className="font-bold" style={{ color: JOURNEY_COLORS[selectedLernreise.journeyType] }}>
                  {selectedLernreise.title}
                </h3>
                <p className="text-xs text-slate-400">
                  📍 {selectedLernreise.location} &middot; {JOURNEYS[selectedLernreise.journeyType]?.title}
                </p>
              </div>
            </div>
            <button
              onClick={handleClosePanel}
              className="text-slate-500 hover:text-white transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-slate-300">{selectedLernreise.description}</p>
          <p className="text-xs text-slate-500 italic">{selectedLernreise.setting}</p>
          <p className="text-xs text-slate-400">🧑‍🏫 {selectedLernreise.character}</p>
          <button
            onClick={() => onSelect(selectedLernreise.journeyType)}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all text-sm"
          >
            Lernreise starten
          </button>
        </div>
      )}

      {/* Start Journey CTA (when journey selected via carousel but no specific station) */}
      {selectedJourney && !selectedStation && !selectedLernreise && (
        <div className="text-center animate-in fade-in duration-300">
          <button
            onClick={handleStartJourney}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all text-sm"
          >
            {selectedJourneyDef?.icon} {selectedJourneyDef?.title} starten
          </button>
        </div>
      )}

      {/* Profile Button */}
      {completedJourneys.length > 0 && (
        <div className="text-center pt-2">
          <button
            onClick={onViewProfile}
            className="glass px-6 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Mein Profil ansehen
          </button>
        </div>
      )}
    </div>
  );
}

/** Slide-up panel shown when a station is tapped on the globe. */
function StationInfoPanel({
  station,
  journey,
  onStart,
  onClose,
}: {
  station: PointData;
  journey: any;
  onStart: () => void;
  onClose: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-5 space-y-3 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
            style={{ backgroundColor: station.color + '20' }}
          >
            {journey?.icon || '📍'}
          </div>
          <div>
            <h3 className="font-bold" style={{ color: station.color }}>
              {station.title}
            </h3>
            <p className="text-xs text-slate-400">
              {station.city} &middot; {journey?.title || station.journeyType}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-white transition-colors p-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {station.completed ? (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <span>&#x2713;</span>
          <span>Station abgeschlossen</span>
        </div>
      ) : (
        <button
          onClick={onStart}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all text-sm"
        >
          Reise starten
        </button>
      )}
    </div>
  );
}

/** 2D Fallback for devices without WebGL */
function Globe2DFallback({
  insights,
  completedJourneys,
  completedStations,
  onSelect,
  onViewProfile,
}: GlobeNavigationProps) {
  const JOURNEYS = getJourneysAsDefinitions();
  const STATIONS = getStationsAsRecord();
  const recommended = insights?.recommendedJourney || 'vuca';

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {insights && (
        <div className="glass rounded-2xl p-6 space-y-3 text-center">
          <h2 className="text-xl font-bold">Dein Profil-Zwischenergebnis</h2>
          <p className="text-slate-300 text-sm">{insights.summary}</p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-center">Waehle dein Reiseziel</h2>

      <div className="grid gap-4">
        {STATION_COORDINATES.map((coord) => {
          const station = STATIONS[coord.journeyType];
          const journey = JOURNEYS[coord.journeyType];
          const isCompleted = completedStations.includes(coord.stationId);
          const isRecommended = coord.journeyType === recommended;

          return (
            <button
              key={coord.stationId}
              onClick={() => onSelect(coord.journeyType as JourneyType)}
              className={`glass rounded-2xl p-5 text-left transition-all hover:scale-[1.01] ${
                isRecommended ? journey?.glowClass || '' : ''
              } ${isCompleted ? 'opacity-70' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="text-3xl">{journey?.icon || '📍'}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold" style={{ color: JOURNEY_COLORS[coord.journeyType] }}>
                      {coord.city}
                    </span>
                    <span className="text-slate-500 text-xs">&middot;</span>
                    <span className="text-slate-400 text-sm">{station?.title}</span>
                    {isRecommended && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 font-medium">
                        Empfohlen
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 font-medium">
                        &#x2713;
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{journey?.title}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {completedJourneys.length > 0 && (
        <div className="text-center pt-4">
          <button
            onClick={onViewProfile}
            className="glass px-6 py-3 rounded-xl text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Mein Profil ansehen
          </button>
        </div>
      )}
    </div>
  );
}

/** Detect WebGL support. */
function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

/** Main export: renders 3D globe if WebGL available, else 2D fallback. */
export const GlobeNavigation: React.FC<GlobeNavigationProps> = (props) => {
  const [webgl] = useState(() => hasWebGL());
  if (!webgl) return <Globe2DFallback {...props} />;
  return <GlobeInner {...props} />;
};
