import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUserRole } from '../../services/auth';
import type { AuthUser, UserRole } from '../../types/auth';

interface RoleManagerProps {
  currentUser: AuthUser;
}

export const RoleManager: React.FC<RoleManagerProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = async () => setUsers(await getAllUsers());

  useEffect(() => {
    refresh();
  }, []);

  const admins = users.filter((u) => u.role === 'admin');
  const regularUsers = users.filter((u) => u.role === 'user');

  const toggleRole = async (userId: string, currentRole: UserRole) => {
    if (userId === currentUser.id) return;
    const newRole: UserRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await updateUserRole(userId, newRole);
      await refresh();
      setMessage(`Rolle auf ${newRole === 'admin' ? 'Admin' : 'User'} geaendert.`);
    } catch (err: any) {
      setMessage(err.message);
    }
    setTimeout(() => setMessage(null), 2000);
  };

  const RoleCard: React.FC<{ title: string; role: UserRole; members: AuthUser[]; color: string }> = ({
    title,
    role,
    members,
    color,
  }) => (
    <div className="glass rounded-2xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className={`font-bold ${color}`}>{title}</h4>
        <span className="text-xs text-slate-500">{members.length} Mitglieder</span>
      </div>
      {members.length === 0 ? (
        <p className="text-xs text-slate-600">Keine Mitglieder</p>
      ) : (
        <div className="space-y-2">
          {members.map((user) => {
            const isSelf = user.id === currentUser.id;
            return (
              <div
                key={user.id}
                className="flex items-center justify-between glass-light rounded-lg p-3"
              >
                <div>
                  <span className="text-sm text-white">{user.displayName}</span>
                  {isSelf && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                      Du
                    </span>
                  )}
                  <p className="text-[10px] text-slate-500">{user.email}</p>
                </div>
                {!isSelf && (
                  <button
                    onClick={() => toggleRole(user.id, user.role)}
                    className="text-[10px] px-3 py-1 rounded-lg bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 transition-colors"
                  >
                    {role === 'admin' ? 'Zum User' : 'Zum Admin'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Rollen verwalten</h3>

      {message && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-2 text-blue-400 text-xs text-center">
          {message}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <RoleCard title="Administratoren" role="admin" members={admins} color="text-purple-400" />
        <RoleCard title="Benutzer" role="user" members={regularUsers} color="text-blue-400" />
      </div>
    </div>
  );
};
