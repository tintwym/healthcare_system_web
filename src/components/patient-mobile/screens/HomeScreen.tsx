import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, MapPin, ChevronRight, HeartPulse, Pill, Sparkles, FileText } from 'lucide-react';
import type { Appointment, PatientRecord } from '../../../types';
import type { PatientMobileTab } from '../types';
import { EcgWave } from '../LiveMonitorTrace';

function formatVisitDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

interface HomeScreenProps {
  patient: PatientRecord;
  nextAppointment?: Appointment;
  onCheckIn: (appointmentId: string) => void | Promise<void>;
  onNavigate: (tab: PatientMobileTab) => void;
  onRequestRefill: (medicationName: string) => void | Promise<void>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  patient,
  nextAppointment,
  onCheckIn,
  onNavigate,
  onRequestRefill,
}) => {
  const latest = patient.vitals[patient.vitals.length - 1];
  const activeMeds = patient.medications.filter((m) => m.status === 'active').slice(0, 3);
  const latestLab = patient.labResults[0];
  const latestNote = patient.clinicalNotes[0];
  const [refillToast, setRefillToast] = useState<string | null>(null);

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div>
        <p className="font-display text-[1.65rem] leading-tight text-[var(--mc-text)] tracking-tight">
          Your care,
          <br />
          <span className="text-[var(--mc-accent)]">at a glance</span>
        </p>
        <p className="text-[12px] text-[var(--mc-muted)] mt-1.5 leading-relaxed">
          Linked with {patient.primaryDoctor.split(',')[0]}
        </p>
      </div>

      {latest?.isAbnormal && (
        <button
          type="button"
          onClick={() => onNavigate('monitor')}
          className="w-full text-left rounded-2xl px-3.5 py-3 bg-rose-500/10 border border-rose-200/80"
        >
          <div className="flex items-center gap-2 text-rose-700 text-[11px] font-bold uppercase tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="pm-pulse-ring absolute inline-flex h-full w-full rounded-full bg-rose-400" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
            </span>
            Monitoring alert
          </div>
          <p className="text-[12px] text-rose-800/90 mt-1">
            A recent reading needs review — open live monitor.
          </p>
        </button>
      )}

      <button
        type="button"
        onClick={() => onNavigate('monitor')}
        className="w-full text-left rounded-2xl p-4 bg-[var(--mc-elevated)] border border-[var(--mc-line)] shadow-[0_12px_40px_-28px_rgba(15,23,42,0.45)] backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-[var(--mc-accent-muted)] text-[var(--mc-accent)] flex items-center justify-center">
              <HeartPulse className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-[var(--mc-text)]">Live monitoring</div>
              <div className="text-[10px] text-[var(--mc-muted)]">Tap to open stream</div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-[var(--mc-muted)]" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'HR', value: latest ? `${latest.heartRate}` : '—', unit: 'bpm' },
            {
              label: 'BP',
              value: latest ? `${latest.bloodPressureSys}/${latest.bloodPressureDia}` : '—',
              unit: 'mmHg',
            },
            { label: 'SpO₂', value: latest ? `${latest.spO2}` : '—', unit: '%' },
          ].map((m) => (
            <div key={m.label} className="rounded-xl bg-[var(--mc-surface)] px-2 py-2.5 text-center">
              <div className="text-[9px] font-bold uppercase tracking-wider text-[var(--mc-muted)]">{m.label}</div>
              <div className="text-[15px] font-bold text-[var(--mc-text)] tabular-nums mt-0.5">{m.value}</div>
              <div className="text-[9px] text-[var(--mc-muted)]">{m.unit}</div>
            </div>
          ))}
        </div>
        <EcgWave heartRate={latest?.heartRate ?? 72} streaming />
      </button>

      {nextAppointment && (
        <div className="rounded-2xl p-4 bg-[var(--mc-ink)] text-white overflow-hidden relative">
          <div className="absolute -right-6 -top-8 h-28 w-28 rounded-full bg-teal-400/20 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200/90 mb-2">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                Next visit
              </span>
              <span>{formatVisitDate(nextAppointment.date)}</span>
            </div>
            <div className="font-display text-lg leading-snug">{nextAppointment.type}</div>
            <div className="text-[12px] text-slate-300 mt-1">
              {nextAppointment.doctorName} · {nextAppointment.department}
            </div>
            <div className="mt-3 flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {nextAppointment.time}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {nextAppointment.room}
              </span>
            </div>
            {nextAppointment.status === 'scheduled' ? (
              <button
                type="button"
                onClick={() => onCheckIn(nextAppointment.id)}
                className="mt-3.5 w-full py-2 rounded-xl bg-white text-slate-900 dark:bg-white dark:text-slate-900 text-[12px] font-bold transition-colors hover:bg-slate-100"
              >
                Express check-in
              </button>
            ) : nextAppointment.status === 'checked_in' ||
              nextAppointment.status === 'in_progress' ? (
              <div className="mt-3 text-center text-[12px] font-semibold text-emerald-300 bg-white/5 py-2 rounded-xl">
                Checked in · Lobby seating
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] p-3.5 space-y-2.5">
        <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--mc-text)]">
          <FileText className="h-3.5 w-3.5 text-[var(--mc-accent)]" />
          Your records
        </div>
        <div className="text-[11px] text-[var(--mc-muted)]">
          <span className="font-semibold text-[var(--mc-text)]">Allergies:</span>{' '}
          {patient.allergies.length ? patient.allergies.join(', ') : 'NKDA'}
        </div>
        <div className="text-[11px] text-[var(--mc-muted)]">
          <span className="font-semibold text-[var(--mc-text)]">Blood type:</span> {patient.bloodType} ·{' '}
          <span className="font-semibold text-[var(--mc-text)]">Phone:</span> {patient.phone}
        </div>
        {latestLab && (
          <div className="text-[11px] text-[var(--mc-muted)]">
            <span className="font-semibold text-[var(--mc-text)]">Latest lab:</span> {latestLab.testName} —{' '}
            {latestLab.value}
            {latestLab.referenceRange ? ` (ref ${latestLab.referenceRange})` : ''} ({latestLab.status})
          </div>
        )}
        {latestNote && (
          <div className="text-[11px] text-[var(--mc-muted)]">
            <span className="font-semibold text-[var(--mc-text)]">Note:</span> {latestNote.title} · {latestNote.date}
          </div>
        )}
        <div className="text-[11px] text-[var(--mc-muted)]">
          Emergency: {patient.emergencyContact.name} ({patient.emergencyContact.phone})
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--mc-text)]">
            <Pill className="h-3.5 w-3.5 text-[var(--mc-accent)]" />
            Active medications
          </div>
          <span className="text-[10px] text-[var(--mc-muted)]">{activeMeds.length} on file</span>
        </div>
        {refillToast && (
          <p className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1.5 mb-2">
            {refillToast}
          </p>
        )}
        <div className="space-y-2">
          {activeMeds.length === 0 && (
            <p className="text-[12px] text-[var(--mc-muted)] py-2">No active medications on file.</p>
          )}
          {activeMeds.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center justify-between gap-2 py-2 border-b border-[var(--mc-line)] last:border-0"
            >
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-[var(--mc-text)]">{m.name}</div>
                <div className="text-[10px] text-[var(--mc-muted)]">{m.dosage}</div>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onRequestRefill(m.name);
                    setRefillToast(`Refill requested for ${m.name}`);
                    setTimeout(() => setRefillToast(null), 3000);
                  } catch {
                    setRefillToast(`Could not request refill for ${m.name}`);
                    setTimeout(() => setRefillToast(null), 3000);
                  }
                }}
                className="shrink-0 px-2 py-1 rounded-lg bg-[var(--mc-accent-muted)] text-[var(--mc-accent)] text-[10px] font-bold border border-[var(--mc-line)]"
              >
                Refill
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 text-[11px] text-[var(--mc-muted)]">
        <Sparkles className="h-3.5 w-3.5 text-[var(--mc-accent)] shrink-0 mt-0.5" />
        <p>Abnormal home readings sync instantly to your care team under HIPAA audit.</p>
      </div>
    </motion.div>
  );
};
