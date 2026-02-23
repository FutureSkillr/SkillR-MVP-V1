import React, { useState, useRef, useEffect } from 'react';

interface GeoSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (location: string, lat: number, lng: number) => void;
  initialQuery?: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export const GeoSearchModal: React.FC<GeoSearchModalProps> = ({
  open,
  onClose,
  onSelect,
  initialQuery,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery(initialQuery || '');
      setResults([]);
      setSearched(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, initialQuery]);

  async function handleSearch() {
    const q = query.trim();
    if (!q) return;

    setLoading(true);
    setSearched(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&addressdetails=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'SkillR-Admin/1.0' },
      });
      const data: NominatimResult[] = await res.json();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handlePick(r: NominatimResult) {
    onSelect(r.display_name, parseFloat(r.lat), parseFloat(r.lon));
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <h2 className="text-white font-semibold">Ort suchen</h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search bar */}
        <div className="px-6 pb-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="z.B. 06217 Frankleben DE"
              className="flex-1 bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors min-h-[40px]"
            >
              {loading ? 'Suche...' : 'Suchen'}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-1">
            Powered by OpenStreetMap Nominatim
          </p>
        </div>

        {/* Results */}
        <div className="px-6 pb-6 overflow-y-auto space-y-2">
          {loading && (
            <div className="flex flex-col items-center py-6 gap-3">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-slate-500 text-sm">Suche laeuft...</p>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-6">
              <p className="text-slate-500 text-sm">Keine Ergebnisse</p>
              <p className="text-slate-600 text-xs mt-1">
                Versuche einen anderen Suchbegriff.
              </p>
            </div>
          )}

          {!loading && results.map((r) => (
            <button
              key={r.place_id}
              onClick={() => handlePick(r)}
              className="w-full text-left glass rounded-lg p-3 hover:bg-white/5 transition-colors group"
            >
              <p className="text-sm text-white group-hover:text-blue-300 transition-colors">
                {r.display_name}
              </p>
              <p className="text-[10px] text-slate-500 mt-1">
                {parseFloat(r.lat).toFixed(5)}, {parseFloat(r.lon).toFixed(5)}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
