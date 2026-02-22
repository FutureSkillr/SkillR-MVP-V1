import React, { useEffect, useState } from 'react';

interface ConfigField {
  key: string;
  label: string;
  required?: boolean;
}

const FIELDS: ConfigField[] = [
  { key: 'company_name', label: 'Firmenname', required: true },
  { key: 'company_address', label: 'Adresse (Strasse, PLZ, Ort)', required: true },
  { key: 'company_country', label: 'Land' },
  { key: 'contact_email', label: 'Kontakt E-Mail', required: true },
  { key: 'contact_phone', label: 'Telefon' },
  { key: 'legal_representative', label: 'Vertretungsberechtigte Person' },
  { key: 'register_entry', label: 'Registereintrag (HRB, etc.)' },
  { key: 'vat_id', label: 'Umsatzsteuer-ID' },
  { key: 'content_responsible', label: 'Verantwortlich fuer den Inhalt' },
  { key: 'content_responsible_address', label: 'Anschrift Verantwortlicher' },
  { key: 'dpo_name', label: 'Datenschutzbeauftragter (Name)' },
  { key: 'dpo_email', label: 'Datenschutzbeauftragter (E-Mail)' },
];

export const BusinessConfigTab: React.FC = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch('/api/config/legal')
      .then((r) => r.json())
      .then((data) => setValues(data))
      .catch(() => {});
  }, []);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (status === 'saved' || status === 'error') setStatus('idle');
  };

  const handleSave = async () => {
    setStatus('saving');
    setErrorMsg('');
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/config/legal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Speichern fehlgeschlagen' }));
        throw new Error(body.error || 'Speichern fehlgeschlagen');
      }
      setStatus('saved');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'Speichern fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white">Geschaeftsdaten</h3>
        <p className="text-sm text-slate-400 mt-1">
          Diese Daten werden im Impressum und in der Datenschutzerklaerung angezeigt.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            <input
              type="text"
              value={values[field.key] || ''}
              onChange={(e) => handleChange(field.key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800/60 border border-white/10 text-base text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none transition-colors"
              placeholder={`[${field.label}]`}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={status === 'saving'}
          className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium text-white transition-colors min-h-[44px]"
        >
          {status === 'saving' ? 'Speichern...' : 'Speichern'}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-green-400">Gespeichert</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-red-400">{errorMsg}</span>
        )}
      </div>
    </div>
  );
};
