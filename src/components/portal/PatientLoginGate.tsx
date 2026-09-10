import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { api, setApiToken } from '../../lib/api';

export const PATIENT_SESSION_KEY = 'medicore_patient_session';
export const DEMO_PATIENT_EMAIL = 'thiri.supyae@gmail.com';
export const DEMO_PATIENT_PASSWORD = 'patient123';
export const DEMO_PATIENT_USER_ID = 'u-6';
export const DEMO_PATIENT_ID = 'pat-001';

export type PatientSession = {
  authenticated: true;
  patientUserId: string;
  patientId: string;
  email: string;
  token?: string;
};

export function readPatientSession(): PatientSession | null {
  try {
    const raw = sessionStorage.getItem(PATIENT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PatientSession;
    if (parsed?.authenticated && parsed.patientId && parsed.patientUserId) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function writePatientSession(session: PatientSession) {
  sessionStorage.setItem(PATIENT_SESSION_KEY, JSON.stringify(session));
  if (session.token) setApiToken(session.token);
}

export function clearPatientSession() {
  sessionStorage.removeItem(PATIENT_SESSION_KEY);
  setApiToken(null);
}

interface PatientLoginGateProps {
  allowStaffDemo?: boolean;
  onAuthenticated: (session: PatientSession) => void;
}

export const PatientLoginGate: React.FC<PatientLoginGateProps> = ({
  allowStaffDemo = true,
  onAuthenticated,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const complete = (session: PatientSession) => {
    writePatientSession(session);
    onAuthenticated(session);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.login(email.trim(), password);
      if (user.role !== 'patient' || !user.patientId) {
        setApiToken(null);
        setError('Use a patient account to access the portal.');
        return;
      }
      complete({
        authenticated: true,
        patientUserId: user.id,
        patientId: user.patientId,
        email: user.email,
        token,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const staffDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const { token, user } = await api.login(DEMO_PATIENT_EMAIL, DEMO_PATIENT_PASSWORD);
      complete({
        authenticated: true,
        patientUserId: user.id,
        patientId: user.patientId || DEMO_PATIENT_ID,
        email: user.email,
        token,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in. Is the API running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="portal-hero p-6 sm:p-10 max-w-md mx-auto rise-in">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-12 w-12 rounded-2xl brand-mark flex items-center justify-center text-white font-display text-xl font-bold shadow-lg shadow-teal-900/15">
          M
        </div>
        <div>
          <h2 className="font-display text-2xl text-[var(--mc-ink)] dark:text-slate-100 tracking-tight">
            Medicore
          </h2>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-400">
            Patient portal sign-in
          </p>
        </div>
      </div>

      <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
        Sign in to view records, visits, billing, and secure care-team messages.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
        <div className="space-y-1">
          <label className="block font-bold text-slate-700 dark:text-slate-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60"
            autoComplete="username"
            placeholder="name@email.com"
          />
        </div>
        <div className="space-y-1">
          <label className="block font-bold text-slate-700 dark:text-slate-300">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60"
            autoComplete="current-password"
            placeholder="Enter password"
          />
        </div>

        {error && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-[11px]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="mt-1 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs shadow-sm"
        >
          <Lock className="h-3.5 w-3.5" />
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {allowStaffDemo && (
        <button
          type="button"
          disabled={loading}
          onClick={staffDemo}
          className="mt-2.5 w-full py-2.5 rounded-lg border border-teal-200 dark:border-teal-800 text-[11px] font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/30 disabled:opacity-60"
        >
          Staff demo: continue as Thiri Su Pyae
        </button>
      )}
    </div>
  );
};
