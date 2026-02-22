import React, { useState } from 'react';
import { UserAdmin } from './UserAdmin';
import { RoleManager } from './RoleManager';
import { MetaKursEditor } from './MetaKursEditor';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import type { AuthUser } from '../../types/auth';
import type { AdminTab } from '../../types/admin';

interface AdminConsoleProps {
  currentUser: AuthUser;
  onBack: () => void;
}

const TABS: { key: AdminTab; label: string }[] = [
  { key: 'users', label: 'Benutzer' },
  { key: 'roles', label: 'Rollen' },
  { key: 'meta-kurs', label: 'Meta Kurs Editor' },
  { key: 'analytics', label: 'Analytics' },
];

export const AdminConsole: React.FC<AdminConsoleProps> = ({
  currentUser,
  onBack,
}) => {
  const [tab, setTab] = useState<AdminTab>('users');

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Management Console</h2>
          <p className="text-xs text-slate-500">
            Angemeldet als {currentUser.displayName} (Admin)
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-xs px-4 py-2 rounded-lg glass text-slate-300 hover:text-white transition-colors"
        >
          Zurueck zur App
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-slate-800/60 text-white border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass rounded-2xl p-6">
        {tab === 'users' && <UserAdmin currentUser={currentUser} />}
        {tab === 'roles' && <RoleManager currentUser={currentUser} />}
        {tab === 'meta-kurs' && <MetaKursEditor />}
        {tab === 'analytics' && <AnalyticsDashboard />}
      </div>
    </div>
  );
};
