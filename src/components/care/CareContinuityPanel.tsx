import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Pill,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { McSelect } from '../ui/McSelect';
import { StaffApiLogin, readStaffUser } from '../staff/StaffApiLogin';
import { api, getApiToken } from '../../lib/api';

type VisitSummaryRow = {
  id: string;
  patientId: string;
  date: string;
  author: string;
  authorRole: string;
  title: string;
  summaryBody: string;
  instructions: string;
  warningSigns: string;
  status: string;
  createdAt?: string;
};

type DoseLogRow = {
  id: string;
  patientId: string;
  medicationId: string;
  medicationName: string;
  status: string;
  notes?: string | null;
  loggedAt: string;
};

export const CareContinuityPanel: React.FC = () => {
  const { patients, selectedPatientId, setSelectedPatientId, logAudit } = useHospital();

  const patientId = selectedPatientId || patients[0]?.id || '';
  const patient = patients.find((p) => p.id === patientId) || patients[0];
  const [apiStaffName, setApiStaffName] = useState<string | null>(
    () => (getApiToken() ? readStaffUser()?.name ?? null : null)
  );

  const [summaries, setSummaries] = useState<VisitSummaryRow[]>([]);
  const [doses, setDoses] = useState<DoseLogRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [title, setTitle] = useState('After-visit summary');
  const [summaryBody, setSummaryBody] = useState('');
  const [instructions, setInstructions] = useState('');
  const [warningSigns, setWarningSigns] = useState(
    'Fever, chest pain, shortness of breath, or uncontrolled bleeding — seek care immediately.'
  );

  const load = useCallback(async () => {
    if (!getApiToken() || !patientId) {
      setSummaries([]);
      setDoses([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [s, d] = await Promise.all([
        api.listVisitSummaries(patientId) as Promise<VisitSummaryRow[]>,
        api.listMedDoses(patientId) as Promise<DoseLogRow[]>,
      ]);
      setSummaries(s);
      setDoses(d);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load care loop data');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!patient) return;
    const latestNote = patient.clinicalNotes[0];
    setTitle(`Visit summary — ${patient.firstName} ${patient.lastName}`);
    setSummaryBody(
      latestNote?.soapAssessment ||
        `You were seen for follow-up related to ${
          patient.chronicConditions.join(', ') || 'your recent visit'
        }. Your care team reviewed vitals, labs, and your current medications.`
    );
    setInstructions(
      latestNote?.soapPlan ||
        `Continue prescribed medications as directed. Follow up with ${patient.primaryDoctor} as scheduled. Bring questions to your next visit.`
    );
  }, [patient?.id]);

  const adherence = useMemo(() => {
    const taken = doses.filter((d) => d.status === 'taken').length;
    const skipped = doses.filter((d) => d.status === 'skipped').length;
    const total = taken + skipped;
    const rate = total === 0 ? null : Math.round((taken / total) * 100);
    return { taken, skipped, total, rate };
  }, [doses]);

  const publish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!getApiToken()) {
      setError('Sign in with staff API credentials first');
      return;
    }
    if (!patientId) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await api.createVisitSummary({
        patientId,
        title,
        summaryBody,
        instructions,
        warningSigns,
        status: 'finalized',
      });
      logAudit(
        'GENERATE_DISCHARGE_SUMMARY',
        `After-visit summary for ${patient?.firstName} ${patient?.lastName}`,
        title,
        patientId,
        patient ? `${patient.firstName} ${patient.lastName}` : undefined
      );
      setNotice('After-visit summary published — patient notified on mobile.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not publish summary');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--mc-text)] flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            Care loop
          </h2>
          <p className="text-sm text-[var(--mc-muted)] mt-1 max-w-xl">
            Publish after-visit summaries to the patient app and review home medication adherence
            logged from mobile.
          </p>
        </div>
        <div className="w-full lg:w-80">
          <StaffApiLogin
            allowedRoles={['doctor', 'nurse', 'admin', 'pharmacist']}
            defaultEmail="aye.myatthu@medicore.mm"
            onAuthed={(u) => {
              setApiStaffName(u.name);
              void load();
            }}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--mc-muted)] mb-1">
            Patient
          </div>
          <McSelect
            aria-label="Select patient for care loop"
            value={patientId}
            onChange={(v) => setSelectedPatientId(v)}
            options={patients.map((p) => ({
              value: p.id,
              label: `${p.firstName} ${p.lastName} · ${p.mrn}`,
            }))}
          />
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg border border-[var(--mc-line)] bg-[var(--mc-elevated)] text-sm font-semibold text-[var(--mc-text)] hover:bg-[var(--mc-surface)]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl px-3 py-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}
      {notice && (
        <div className="flex items-start gap-2 text-sm text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl px-3 py-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          {notice}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <form
          onSubmit={publish}
          className="rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-elevated)] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-[var(--mc-text)]">Publish after-visit summary</h3>
          </div>
          <p className="text-xs text-[var(--mc-muted)]">
            {apiStaffName
              ? `Publishing as ${apiStaffName} (API session). `
              : 'Sign in with staff API credentials to publish. '}
            Finalized summaries appear on the patient Home screen and trigger a push notification
            when devices are registered.
          </p>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">
            Title
            <input
              className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-3 py-2 text-sm text-[var(--mc-text)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">
            Visit summary
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-3 py-2 text-sm text-[var(--mc-text)] min-h-[96px]"
              value={summaryBody}
              onChange={(e) => setSummaryBody(e.target.value)}
              required
            />
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">
            Home instructions
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-3 py-2 text-sm text-[var(--mc-text)] min-h-[72px]"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              required
            />
          </label>
          <label className="block text-[11px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">
            Warning signs
            <textarea
              className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-3 py-2 text-sm text-[var(--mc-text)] min-h-[64px]"
              value={warningSigns}
              onChange={(e) => setWarningSigns(e.target.value)}
              required
            />
          </label>
          <button
            type="submit"
            disabled={saving || !getApiToken()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5"
          >
            <Send className="w-4 h-4" />
            {saving ? 'Publishing…' : 'Publish to patient app'}
          </button>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-elevated)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Pill className="w-4 h-4 text-teal-600" />
              <h3 className="font-semibold text-[var(--mc-text)]">Medication adherence</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-[var(--mc-surface)] border border-[var(--mc-line)] p-3 text-center">
                <div className="text-[10px] font-bold uppercase text-[var(--mc-muted)]">Taken</div>
                <div className="text-xl font-semibold text-[var(--mc-text)]">{adherence.taken}</div>
              </div>
              <div className="rounded-xl bg-[var(--mc-surface)] border border-[var(--mc-line)] p-3 text-center">
                <div className="text-[10px] font-bold uppercase text-[var(--mc-muted)]">Skipped</div>
                <div className="text-xl font-semibold text-[var(--mc-text)]">{adherence.skipped}</div>
              </div>
              <div className="rounded-xl bg-[var(--mc-surface)] border border-[var(--mc-line)] p-3 text-center">
                <div className="text-[10px] font-bold uppercase text-[var(--mc-muted)]">Rate</div>
                <div className="text-xl font-semibold text-[var(--mc-text)]">
                  {adherence.rate == null ? '—' : `${adherence.rate}%`}
                </div>
              </div>
            </div>
            <ul className="divide-y divide-[var(--mc-line)] max-h-56 overflow-y-auto">
              {doses.length === 0 && (
                <li className="py-3 text-sm text-[var(--mc-muted)]">
                  No dose logs yet for this patient.
                </li>
              )}
              {doses.slice(0, 12).map((d) => (
                <li key={d.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="font-medium text-[var(--mc-text)] truncate">
                      {d.medicationName}
                    </div>
                    <div className="text-[11px] text-[var(--mc-muted)]">
                      {new Date(d.loggedAt).toLocaleString()}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                      d.status === 'taken'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200'
                    }`}
                  >
                    {d.status}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[var(--mc-line)] bg-[var(--mc-elevated)] p-5">
            <h3 className="font-semibold text-[var(--mc-text)] mb-3">Published summaries</h3>
            <ul className="divide-y divide-[var(--mc-line)] max-h-64 overflow-y-auto">
              {summaries.length === 0 && (
                <li className="py-3 text-sm text-[var(--mc-muted)]">No summaries for this patient.</li>
              )}
              {summaries.map((s) => (
                <li key={s.id} className="py-3">
                  <div className="font-medium text-[var(--mc-text)]">{s.title}</div>
                  <div className="text-[11px] text-[var(--mc-muted)] mt-0.5">
                    {s.date} · {s.author} · {s.status}
                  </div>
                  <p className="text-xs text-[var(--mc-muted)] mt-2 line-clamp-2">{s.summaryBody}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
