import React, { useState } from 'react';
import { api, getApiToken, setApiToken, type ApiUser } from '../../lib/api';

const STAFF_USER_KEY = 'medicore_staff_user';

export function readStaffUser(): ApiUser | null {
  try {
    const raw = localStorage.getItem(STAFF_USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

export function clearStaffSession() {
  localStorage.removeItem(STAFF_USER_KEY);
}

interface StaffApiLoginProps {
  allowedRoles?: string[];
  onAuthed?: (user: ApiUser) => void;
  /** Prefill email (defaults to pharmacy demo account). */
  defaultEmail?: string;
}

/** Compact staff sign-in against Medicore API (roles: doctor, pharmacist, admin, …). */
export const StaffApiLogin: React.FC<StaffApiLoginProps> = ({
  allowedRoles,
  onAuthed,
  defaultEmail = 'khin.sandar@medicore.mm',
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('staff123');
  const [user, setUser] = useState<ApiUser | null>(() =>
    getApiToken() ? readStaffUser() : null
  );
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !password) {
      setError('Enter staff email and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token, user: u } = await api.login(trimmed, password);
      if (allowedRoles && !allowedRoles.includes(u.role)) {
        setApiToken(null);
        setError(`Role ${u.role} not allowed here`);
        return;
      }
      setApiToken(token);
      localStorage.setItem(STAFF_USER_KEY, JSON.stringify(u));
      setUser(u);
      onAuthed?.(u);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setApiToken(null);
    clearStaffSession();
    setUser(null);
  };

  if (user) {
    return (
      <div className="flex items-center justify-between gap-3 text-[11px] px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
        <span>
          API staff: <strong>{user.name}</strong> ({user.role})
        </span>
        <button type="button" onClick={logout} className="font-semibold underline">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={login}
      className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/40 text-[11px]"
    >
      <div className="w-full sm:w-auto min-w-0 flex-1">
        <label className="block font-bold text-slate-600 dark:text-slate-300 mb-0.5">
          Staff email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="username"
          disabled={loading}
          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 disabled:opacity-60"
        />
      </div>
      <div className="w-full sm:w-auto">
        <label className="block font-bold text-slate-600 dark:text-slate-300 mb-0.5">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={loading}
          className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 disabled:opacity-60"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        aria-busy={loading}
        className="w-full sm:w-auto px-3 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold disabled:opacity-60"
      >
        {loading ? 'Signing in…' : 'API sign-in'}
      </button>
      {error && <span className="text-rose-600 w-full">{error}</span>}
    </form>
  );
};
