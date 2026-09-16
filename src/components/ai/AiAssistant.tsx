import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles,
  Send,
  Activity,
  MessageSquare,
  ClipboardList,
  CreditCard,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StaffApiLogin, readStaffUser } from '../staff/StaffApiLogin';
import { McSelect } from '../ui/McSelect';
import { api, getApiToken } from '../../lib/api';
import { motion } from 'motion/react';
import { fadeUp, staggerContainer } from '../ui/AnimatedPage';
import { useTheme } from '../../context/ThemeContext';

type AiIntent = 'chat' | 'explain_vitals' | 'draft_summary' | 'draft_message' | 'billing_help';

type ChatTurn = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  intent?: string;
  provider?: string;
};

const QUICK: Array<{ label: string; intent: AiIntent; message: string; staffOnly?: boolean }> = [
  {
    label: 'Explain vitals',
    intent: 'explain_vitals',
    message: 'Explain the latest vitals and whether anything looks urgent.',
  },
  {
    label: 'Draft message',
    intent: 'draft_message',
    message: 'Draft a short secure message to the care team about my current concern.',
  },
  {
    label: 'Billing help',
    intent: 'billing_help',
    message: 'Explain my recent invoices and what I still owe in plain language.',
  },
  {
    label: 'After-visit draft',
    intent: 'draft_summary',
    message: 'Draft an after-visit summary from the current chart context for clinician review.',
    staffOnly: true,
  },
];

export const AiAssistant: React.FC = () => {
  const { currentUser, patients, selectedPatientId, setSelectedPatientId, logAudit } = useHospital();
  const { darkMode } = useTheme();
  const isPatientRole = currentUser.role === 'patient';
  const [apiReady, setApiReady] = useState(() => Boolean(getApiToken()));
  const [statusLabel, setStatusLabel] = useState('checking…');
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: isPatientRole
        ? 'Hi — I am Medicore Assist. I can explain vitals, help draft a message to your care team, or clarify billing. I am not a diagnosis and not for emergencies.'
        : 'Medicore Assist for care teams. Select a patient for chart-grounded drafts (vitals explainers, messages, after-visit summaries). Review every reply before charting.',
    },
  ]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const patientId = isPatientRole
    ? selectedPatientId || patients[0]?.id || ''
    : selectedPatientId || patients[0]?.id || '';

  const quickActions = useMemo(
    () => QUICK.filter((q) => !q.staffOnly || !isPatientRole),
    [isPatientRole]
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, busy]);

  useEffect(() => {
    if (!getApiToken()) {
      setStatusLabel('sign in required');
      return;
    }
    let cancelled = false;
    api
      .aiStatus()
      .then((s) => {
        if (cancelled) return;
        setStatusLabel(
          s.configured ? `Gemini · ${s.model}` : `Fallback rules · ${s.model || 'medicore-rules'}`
        );
      })
      .catch(() => {
        if (!cancelled) setStatusLabel('API unreachable');
      });
    return () => {
      cancelled = true;
    };
  }, [apiReady]);

  // Keep apiReady in sync if token is cleared elsewhere
  useEffect(() => {
    const id = window.setInterval(() => {
      const has = Boolean(getApiToken());
      setApiReady((prev) => (prev === has ? prev : has));
    }, 2500);
    return () => window.clearInterval(id);
  }, []);

  const send = async (message: string, intent: AiIntent = 'chat') => {
    const trimmed = message.trim();
    if (!trimmed || busy) return;
    if (!getApiToken()) {
      setError('Sign in to the Medicore API to use Assist.');
      return;
    }

    setError(null);
    setBusy(true);
    setInput('');
    setTurns((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: 'user', text: trimmed, intent },
    ]);

    try {
      const result = await api.aiAssist({
        message: trimmed,
        intent,
        patientId: isPatientRole ? undefined : patientId || undefined,
      });
      setTurns((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: result.reply,
          intent: result.intent,
          provider: result.provider,
        },
      ]);
      logAudit(
        'AI_ASSIST',
        `Assist ${result.intent} (${result.provider})`,
        trimmed.slice(0, 120),
        patientId || undefined,
        undefined
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assist request failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div
      className="space-y-5"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      <motion.div
        variants={fadeUp}
        className={`rounded-2xl border p-5 sm:p-6 ${
          darkMode
            ? 'border-teal-500/20 bg-gradient-to-br from-teal-950/40 via-[var(--mc-elevated)] to-[var(--mc-elevated)]'
            : 'border-teal-200/80 bg-gradient-to-br from-teal-50 via-white to-cyan-50/40'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-teal-600 dark:text-teal-300">
              <Sparkles className="h-5 w-5" />
              <span className="text-[11px] font-bold uppercase tracking-[0.16em]">Medicore Assist</span>
            </div>
            <h2 className="mt-2 font-display text-2xl sm:text-3xl font-semibold tracking-tight">
              Care AI on web &amp; mobile
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Chart-aware helper for vitals, messages, billing language, and clinician drafts. Advisory
              only — not a diagnosis.
            </p>
          </div>
          <div
            className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg border ${
              darkMode
                ? 'border-white/10 bg-white/5 text-slate-300'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            {statusLabel}
          </div>
        </div>
      </motion.div>

      {!isPatientRole && (
        <motion.div variants={fadeUp} className="space-y-3">
          <StaffApiLogin
            allowedRoles={['admin', 'doctor', 'nurse', 'pharmacist', 'billing']}
            onAuthed={() => setApiReady(true)}
            defaultEmail="dr.chen@medicore.mm"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
              Patient context
            </label>
            <div className="min-w-[14rem]">
              <McSelect
                value={patientId}
                onChange={(v) => setSelectedPatientId(v)}
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.firstName} ${p.lastName} · ${p.mrn}`,
                }))}
              />
            </div>
          </div>
        </motion.div>
      )}

      {isPatientRole && !getApiToken() && (
        <motion.div
          variants={fadeUp}
          className="rounded-xl border border-amber-300/60 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 text-sm text-amber-900 dark:text-amber-100"
        >
          Sign in through Patient Portal first so Assist can use your live chart and billing data.
        </motion.div>
      )}

      <motion.div
        variants={fadeUp}
        className={`rounded-2xl border overflow-hidden ${
          darkMode ? 'border-[var(--mc-line)] bg-[var(--mc-elevated)]' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-200/70 dark:border-white/10 flex flex-wrap gap-2">
          {quickActions.map((q) => {
            const Icon =
              q.intent === 'explain_vitals'
                ? Activity
                : q.intent === 'draft_message'
                  ? MessageSquare
                  : q.intent === 'draft_summary'
                    ? ClipboardList
                    : CreditCard;
            return (
              <button
                key={q.label}
                type="button"
                disabled={busy}
                onClick={() => send(q.message, q.intent)}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-teal-500/25 bg-teal-500/10 text-teal-800 dark:text-teal-200 hover:bg-teal-500/20 disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5" />
                {q.label}
              </button>
            );
          })}
        </div>

        <div className="h-[min(52vh,28rem)] overflow-y-auto px-4 py-4 space-y-3">
          {turns.map((t) => (
            <div
              key={t.id}
              className={`flex ${t.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[92%] sm:max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${
                  t.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-md'
                    : darkMode
                      ? 'bg-white/5 text-slate-100 border border-white/10 rounded-bl-md'
                      : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-bl-md'
                }`}
              >
                {t.text}
                {t.provider && (
                  <div className="mt-2 text-[10px] opacity-70 font-semibold uppercase tracking-wide">
                    via {t.provider}
                    {t.intent ? ` · ${t.intent}` : ''}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Thinking…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-rose-300/50 bg-rose-50 dark:bg-rose-950/40 px-3 py-2 text-xs text-rose-800 dark:text-rose-200">
            <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form
          className="border-t border-slate-200/70 dark:border-white/10 p-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send(input, 'chat');
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about vitals, meds, visits, billing…"
            className={`flex-1 min-w-0 rounded-xl px-3.5 py-2.5 text-sm outline-none border ${
              darkMode
                ? 'bg-black/20 border-white/10 text-slate-100 placeholder:text-slate-500'
                : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
            }`}
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white px-4 py-2.5 text-sm font-semibold"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </form>
      </motion.div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0 text-amber-500" />
        For emergencies call local emergency services. Staff must review AI drafts before placing them
        in the chart. Session: {readStaffUser()?.email || currentUser.email}
      </p>
    </motion.div>
  );
};
