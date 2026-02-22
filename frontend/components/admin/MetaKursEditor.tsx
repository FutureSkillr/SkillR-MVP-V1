import React, { useState, useRef } from 'react';
import {
  getPrompts, savePrompts, resetPrompts, getDefaultPrompts,
  getJourneys, saveJourneys, resetJourneys, getDefaultJourneys,
  getStations, saveStations, resetStations, getDefaultStations,
  resetAll, exportAllAsJSON, importAllFromJSON,
} from '../../services/contentResolver';
import type { EditablePrompts, EditableJourney, EditableStation } from '../../types/admin';

type Section = 'prompts' | 'journeys' | 'stations';

const PROMPT_LABELS: Record<keyof EditablePrompts, string> = {
  onboarding: 'Onboarding-Prompt',
  vucaStation: 'VUCA-Station-Prompt',
  entrepreneurStation: 'Gruender-Station-Prompt',
  selfLearningStation: 'Lern-Labor-Prompt',
};

const STYLE_PRESETS = [
  { colorClass: 'text-blue-400', glowClass: 'glow-blue', gradientClass: 'gradient-blue', bgClass: 'bg-blue-500/10', label: 'Blau' },
  { colorClass: 'text-orange-400', glowClass: 'glow-orange', gradientClass: 'gradient-orange', bgClass: 'bg-orange-500/10', label: 'Orange' },
  { colorClass: 'text-purple-400', glowClass: 'glow-purple', gradientClass: 'gradient-purple', bgClass: 'bg-purple-500/10', label: 'Lila' },
];

export const MetaKursEditor: React.FC = () => {
  const [section, setSection] = useState<Section>('prompts');
  const [prompts, setPrompts] = useState<EditablePrompts>(getPrompts);
  const [journeys, setJourneys] = useState<EditableJourney[]>(getJourneys);
  const [stations, setStations] = useState<EditableStation[]>(getStations);
  const [message, setMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const flash = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(null), 2500);
  };

  // --- Prompt handlers ---
  const handlePromptChange = (key: keyof EditablePrompts, value: string) => {
    setPrompts((prev) => ({ ...prev, [key]: value }));
  };

  const handleSavePrompts = () => {
    savePrompts(prompts);
    flash('Prompts gespeichert.');
  };

  const handleResetPrompts = () => {
    resetPrompts();
    setPrompts(getDefaultPrompts());
    flash('Prompts auf Standard zurueckgesetzt.');
  };

  // --- Journey handlers ---
  const handleJourneyChange = (index: number, field: keyof EditableJourney, value: string) => {
    setJourneys((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddJourney = () => {
    const id = `custom-${Date.now()}`;
    const preset = STYLE_PRESETS[journeys.length % STYLE_PRESETS.length];
    const newJourney: EditableJourney = {
      type: id,
      title: 'Neue Reise',
      subtitle: 'Untertitel',
      description: 'Beschreibung der Reise...',
      icon: '✨',
      ...preset,
      dimensions: [
        { key: `${id}-dim1`, label: 'Dimension 1', experienceLabel: 'Dimension 1', description: 'Beschreibung' },
      ],
    };
    setJourneys((prev) => [...prev, newJourney]);
  };

  const handleRemoveJourney = (index: number) => {
    setJourneys((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveJourneys = () => {
    saveJourneys(journeys);
    flash('Reisen gespeichert.');
  };

  const handleResetJourneys = () => {
    resetJourneys();
    setJourneys(getDefaultJourneys());
    flash('Reisen auf Standard zurueckgesetzt.');
  };

  // --- Station handlers ---
  const handleStationChange = (index: number, field: keyof EditableStation, value: string) => {
    setStations((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSaveStations = () => {
    saveStations(stations);
    flash('Stationen gespeichert.');
  };

  const handleResetStations = () => {
    resetStations();
    setStations(getDefaultStations());
    flash('Stationen auf Standard zurueckgesetzt.');
  };

  // --- Global handlers ---
  const handleResetAll = () => {
    if (!confirm('Alle Anpassungen zuruecksetzen? Das kann nicht rueckgaengig gemacht werden.')) return;
    resetAll();
    setPrompts(getDefaultPrompts());
    setJourneys(getDefaultJourneys());
    setStations(getDefaultStations());
    flash('Alles zurueckgesetzt.');
  };

  const handleExport = () => {
    const json = exportAllAsJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `future-skiller-config-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flash('Export heruntergeladen.');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importAllFromJSON(ev.target?.result as string);
        setPrompts(getPrompts());
        setJourneys(getJourneys());
        setStations(getStations());
        flash('Import erfolgreich.');
      } catch {
        flash('Import fehlgeschlagen — ungueltige JSON-Datei.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const sections: { key: Section; label: string }[] = [
    { key: 'prompts', label: 'System Prompts' },
    { key: 'journeys', label: 'Reisen' },
    { key: 'stations', label: 'Stationen' },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Meta Kurs Editor</h3>

      {message && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2 text-green-400 text-xs text-center">
          {message}
        </div>
      )}

      {/* Section tabs */}
      <div className="flex gap-2">
        {sections.map((s) => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium ${
              section === s.key
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-slate-800/30 text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Prompts section */}
      {section === 'prompts' && (
        <div className="space-y-4">
          {(Object.keys(PROMPT_LABELS) as (keyof EditablePrompts)[]).map((key) => (
            <div key={key} className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">{PROMPT_LABELS[key]}</label>
              <textarea
                value={prompts[key]}
                onChange={(e) => handlePromptChange(key, e.target.value)}
                rows={8}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-xs text-slate-300 font-mono leading-relaxed focus:outline-none focus:border-blue-500/50 transition-colors resize-y"
              />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={handleSavePrompts} className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              Speichern
            </button>
            <button onClick={handleResetPrompts} className="text-xs px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors">
              Standard wiederherstellen
            </button>
          </div>
        </div>
      )}

      {/* Journeys section */}
      {section === 'journeys' && (
        <div className="space-y-4">
          {journeys.map((journey, idx) => (
            <div key={journey.type} className="glass-light rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-lg ${journey.colorClass} font-bold`}>
                  {journey.icon} {journey.title}
                </span>
                <button
                  onClick={() => handleRemoveJourney(idx)}
                  className="text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  Entfernen
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Titel</label>
                  <input
                    value={journey.title}
                    onChange={(e) => handleJourneyChange(idx, 'title', e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Icon</label>
                  <input
                    value={journey.icon}
                    onChange={(e) => handleJourneyChange(idx, 'icon', e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-500">Untertitel</label>
                  <input
                    value={journey.subtitle}
                    onChange={(e) => handleJourneyChange(idx, 'subtitle', e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-500">Beschreibung</label>
                  <textarea
                    value={journey.description}
                    onChange={(e) => handleJourneyChange(idx, 'description', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500">
                  Dimensionen ({journey.dimensions.length})
                </label>
                <div className="flex flex-wrap gap-1">
                  {journey.dimensions.map((dim) => (
                    <span
                      key={dim.key}
                      className={`text-[10px] px-2 py-0.5 rounded-full ${journey.bgClass} ${journey.colorClass}`}
                    >
                      {dim.experienceLabel}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={handleAddJourney} className="text-xs px-4 py-2 rounded-lg bg-green-600/80 text-white hover:bg-green-500 transition-colors">
              + Reise hinzufuegen
            </button>
            <button onClick={handleSaveJourneys} className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              Speichern
            </button>
            <button onClick={handleResetJourneys} className="text-xs px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors">
              Standard wiederherstellen
            </button>
          </div>
        </div>
      )}

      {/* Stations section */}
      {section === 'stations' && (
        <div className="space-y-4">
          {stations.map((station, idx) => (
            <div key={station.id} className="glass-light rounded-xl p-4 space-y-3">
              <h4 className="text-sm font-bold text-white">{station.title}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Titel</label>
                  <input
                    value={station.title}
                    onChange={(e) => handleStationChange(idx, 'title', e.target.value)}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500">Reise-Typ</label>
                  <input
                    value={station.journeyType}
                    disabled
                    className="w-full bg-slate-800/30 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-500"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-500">Beschreibung</label>
                  <textarea
                    value={station.description}
                    onChange={(e) => handleStationChange(idx, 'description', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] text-slate-500">Setting</label>
                  <textarea
                    value={station.setting}
                    onChange={(e) => handleStationChange(idx, 'setting', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50 resize-y"
                  />
                </div>
                {station.character !== undefined && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] text-slate-500">Charakter</label>
                    <input
                      value={station.character || ''}
                      onChange={(e) => handleStationChange(idx, 'character', e.target.value)}
                      className="w-full bg-slate-800/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={handleSaveStations} className="text-xs px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors">
              Speichern
            </button>
            <button onClick={handleResetStations} className="text-xs px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors">
              Standard wiederherstellen
            </button>
          </div>
        </div>
      )}

      {/* Global actions */}
      <div className="border-t border-white/5 pt-4 mt-6 flex flex-wrap gap-2">
        <button onClick={handleResetAll} className="text-xs px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors">
          Alles zuruecksetzen
        </button>
        <button onClick={handleExport} className="text-xs px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors">
          JSON exportieren
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="text-xs px-4 py-2 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
        >
          JSON importieren
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
    </div>
  );
};
