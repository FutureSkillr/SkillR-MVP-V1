import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole, deleteUser } from '../../services/auth';
import type { AuthUser, UserRole } from '../../types/auth';

interface UserAdminProps {
  currentUser: AuthUser;
}

export const UserAdmin: React.FC<UserAdminProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => setUsers(await getAllUsers());

  useEffect(() => {
    refresh();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser.id) return;
    try {
      await updateUserRole(userId, newRole);
      await refresh();
      setMessage('Rolle aktualisiert.');
    } catch (err: any) {
      setMessage(err.message);
    }
    setTimeout(() => setMessage(null), 2000);
  };

  const handleDelete = async (userId: string) => {
    if (userId === currentUser.id) return;
    if (!confirm('Benutzer wirklich loeschen?')) return;
    try {
      await deleteUser(userId);
      await refresh();
      setMessage('Benutzer geloescht.');
    } catch (err: any) {
      setMessage(err.message);
    }
    setTimeout(() => setMessage(null), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Benutzer verwalten</h3>
      <p className="text-xs text-slate-500">{users.length} Benutzer registriert</p>

      {message && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-blue-400 text-xs text-center">
          {message}
        </div>
      )}

      <div className="space-y-2">
        {users.map((user) => {
          const isSelf = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              className={`glass-light rounded-xl p-4 flex items-center justify-between gap-4 ${isSelf ? 'border border-blue-500/20' : ''}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate">
                    {user.displayName}
                  </span>
                  {isSelf && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      Du
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                <p className="text-[10px] text-slate-600">
                  Registriert: {new Date(user.createdAt).toLocaleDateString('de-DE')}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <select
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                  disabled={isSelf}
                  className="text-xs bg-slate-800/50 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 disabled:opacity-40 focus:outline-none focus:border-blue-500/50"
                >
                  <option value="admin">Admin</option>
                  <option value="user">User</option>
                </select>

                <button
                  onClick={() => handleDelete(user.id)}
                  disabled={isSelf}
                  className="text-xs px-2 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  Loeschen
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
