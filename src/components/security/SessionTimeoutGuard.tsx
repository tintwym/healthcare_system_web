import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ShieldAlert, Clock, Lock, LogOut, RefreshCw } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

/** HIPAA workstation inactivity controls (demo defaults; tune per policy). */
const IDLE_WARNING_MS = 4 * 60 * 1000; // warn after 4 minutes
const IDLE_LOGOUT_MS = 5 * 60 * 1000; // auto-lock at 5 minutes
const COUNTDOWN_SECONDS = Math.round((IDLE_LOGOUT_MS - IDLE_WARNING_MS) / 1000);

const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

export const SessionTimeoutGuard: React.FC = () => {
  const { currentUser, lockWorkstationSession, logAudit, setMfaModalOpen, isMfaAuthenticated } =
    useHospital();

  const [warningOpen, setWarningOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [locked, setLocked] = useState(false);

  const warningTimerRef = useRef<number | null>(null);
  const logoutTimerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    if (warningTimerRef.current) window.clearTimeout(warningTimerRef.current);
    if (logoutTimerRef.current) window.clearTimeout(logoutTimerRef.current);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    warningTimerRef.current = null;
    logoutTimerRef.current = null;
    countdownRef.current = null;
  }, []);

  const lockSession = useCallback(() => {
    clearTimers();
    setWarningOpen(false);
    setLocked(true);
    logAudit(
      'MFA_AUTH',
      'Workstation session locked due to inactivity',
      `HIPAA Security Rule § 164.312(a)(2)(iii) automatic logoff after ${IDLE_LOGOUT_MS / 60000} minutes idle — user ${currentUser.name}`,
      undefined,
      undefined,
      'ELEVATED_PRIVILEGE'
    );
    lockWorkstationSession();
  }, [clearTimers, currentUser.name, logAudit, lockWorkstationSession]);

  const startCountdown = useCallback(() => {
    setSecondsLeft(COUNTDOWN_SECONDS);
    if (countdownRef.current) window.clearInterval(countdownRef.current);
    countdownRef.current = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          if (countdownRef.current) window.clearInterval(countdownRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }, []);

  const armTimers = useCallback(() => {
    clearTimers();
    setWarningOpen(false);
    warningTimerRef.current = window.setTimeout(() => {
      setWarningOpen(true);
      startCountdown();
      logoutTimerRef.current = window.setTimeout(() => {
        lockSession();
      }, IDLE_LOGOUT_MS - IDLE_WARNING_MS);
    }, IDLE_WARNING_MS);
  }, [clearTimers, lockSession, startCountdown]);

  const registerActivity = useCallback(() => {
    if (locked || warningOpen) return;
    armTimers();
  }, [armTimers, locked, warningOpen]);

  const continueSession = () => {
    setWarningOpen(false);
    setSecondsLeft(COUNTDOWN_SECONDS);
    armTimers();
    logAudit(
      'MFA_AUTH',
      'Inactivity warning dismissed — session extended',
      'Clinician confirmed presence at workstation prior to automatic logoff',
      undefined,
      undefined,
      'NORMAL'
    );
  };

  useEffect(() => {
    if (locked && isMfaAuthenticated) {
      setLocked(false);
      armTimers();
    }
  }, [locked, isMfaAuthenticated, armTimers]);

  useEffect(() => {
    armTimers();
    const handler = () => registerActivity();
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, handler, { passive: true }));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, handler));
    };
  }, [armTimers, clearTimers, registerActivity]);

  if (!warningOpen && !locked) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 mb-3">
          <ShieldAlert className="h-7 w-7" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {locked ? 'Session Locked' : 'Inactivity Warning'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              HIPAA § 164.312(a)(2)(iii) — Automatic Logoff
            </p>
          </div>
        </div>

        {locked ? (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p>
              Your clinical workstation session for <strong>{currentUser.name}</strong> was locked
              after prolonged inactivity to protect PHI on unattended terminals.
            </p>
            <p className="flex items-center gap-1.5 text-slate-500">
              <Lock className="h-3.5 w-3.5" />
              Re-authenticate with MFA to resume access.
            </p>
            <button
              onClick={() => {
                setMfaModalOpen(true);
              }}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Unlock with MFA
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
            <p>
              No keyboard or pointer activity detected. This session will lock automatically to
              prevent unauthorized PHI exposure on shared clinical workstations.
            </p>
            <div className="flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <span className="text-2xl font-bold tabular-nums text-amber-900 dark:text-amber-200">
                {secondsLeft}s
              </span>
              <span className="text-amber-700 dark:text-amber-300 font-medium">until lock</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={lockSession}
                className="flex-1 py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <LogOut className="h-3.5 w-3.5" />
                Lock Now
              </button>
              <button
                onClick={continueSession}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                Continue Working
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
