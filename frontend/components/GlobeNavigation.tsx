import React, { useRef, useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { getJourneysAsDefinitions, getStationsAsRecord } from '../services/contentResolver';
import { STATION_COORDINATES } from '../constants/stationCoordinates';
import type { JourneyType, Station } from '../types/journey';
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

function GlobeInner({
  insights,
  completedJourneys,
  completedStations,
  onSelect,
  onViewProfile,
}: GlobeNavigationProps) {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedStation, setSelectedStation] = useState<PointData | null>(null);
  const [globeReady, setGlobeReady] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Responsive sizing
  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width, window.innerHeight * 0.55);
        setDimensions({ width: rect.width, height: size });
      }
    }
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const JOURNEYS = useMemo(() => getJourneysAsDefinitions(), []);
  const STATIONS = useMemo(() => getStationsAsRecord(), []);

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
    globe.controls().minDistance = 150;
    globe.controls().maxDistance = 500;
  }, [globeReady]);

  // Fly to selected station
  const handlePointClick = useCallback(
    (point: any) => {
      const p = point as PointData;
      setSelectedStation(p);
      if (globeRef.current) {
        globeRef.current.controls().autoRotate = false;
        globeRef.current.pointOfView({ lat: p.lat, lng: p.lng, altitude: 1.2 }, 800);
      }
    },
    []
  );

  const handleStartStation = useCallback(() => {
    if (selectedStation) {
      onSelect(selectedStation.journeyType as JourneyType);
    }
  }, [selectedStation, onSelect]);

  const handleClosePanel = useCallback(() => {
    setSelectedStation(null);
    if (globeRef.current) {
      globeRef.current.controls().autoRotate = true;
      globeRef.current.pointOfView({ lat: 48, lng: 10, altitude: 2.2 }, 800);
    }
  }, []);

  const recommended = insights?.recommendedJourney || 'vuca';

  return (
    <div className="max-w-5xl mx-auto space-y-4 py-2">
      {/* Summary */}
      {insights && (
        <div className="glass rounded-2xl p-4 space-y-2 text-center">
          <h2 className="text-lg font-bold">Dein Profil-Zwischenergebnis</h2>
          <p className="text-slate-300 text-sm">{insights.summary}</p>
          {insights.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center pt-1">
              {insights.interests.map((interest, i) => (
                <span
                  key={i}
                  className="text-xs px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300"
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <h2 className="text-2xl font-bold text-center">Waehle dein Reiseziel</h2>

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
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            // Points (station markers)
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
            // Arcs (travel history)
            arcsData={arcsData}
            arcColor="color"
            arcDashLength={0.4}
            arcDashGap={0.2}
            arcDashAnimateTime={1500}
            arcStroke={0.5}
            // Atmosphere
            atmosphereColor="#3B82F6"
            atmosphereAltitude={0.15}
            // Performance: 30 FPS cap
            animateIn={true}
            onGlobeReady={() => setGlobeReady(true)}
          />
        </Suspense>

        {/* Legend */}
        <div className="absolute bottom-2 left-2 glass rounded-lg px-3 py-2 text-xs space-y-1">
          {Object.entries(JOURNEYS).map(([type, j]) => (
            <div key={type} className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: JOURNEY_COLORS[type] }}
              />
              <span className="text-slate-300">{j.title}</span>
              {type === recommended && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                  Empfohlen
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Passport stamp count */}
        <div className="absolute top-2 right-2 glass rounded-lg px-3 py-2 text-xs">
          <span className="text-slate-400">Stempel: </span>
          <span className="text-yellow-400 font-bold">{completedStations.length}</span>
          <span className="text-slate-500">/{STATION_COORDINATES.length}</span>
        </div>
      </div>

      {/* Station Info Panel (slide up on click) */}
      {selectedStation && (
        <StationInfoPanel
          station={selectedStation}
          journey={JOURNEYS[selectedStation.journeyType]}
          onStart={handleStartStation}
          onClose={handleClosePanel}
        />
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
