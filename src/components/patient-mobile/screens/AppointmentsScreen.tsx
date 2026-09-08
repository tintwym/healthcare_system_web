import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X, ChevronDown } from 'lucide-react';
import type { Appointment } from '../../../types';
import { BOOK_SLOTS, RESCHEDULE_SLOTS, doctorForDepartment } from '../../../lib/doctors';

interface AppointmentsScreenProps {
  appointments: Appointment[];
  onBook: (input: {
    department: string;
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    reason: string;
  }) => void | Promise<void>;
  onReschedule: (appointmentId: string, date: string, time: string) => void | Promise<void>;
  onCancel: (appointmentId: string) => void | Promise<void>;
  onCheckIn: (appointmentId: string) => void | Promise<void>;
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function defaultBookDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function isUpcoming(a: Appointment) {
  return a.status === 'scheduled' || a.status === 'checked_in' || a.status === 'in_progress';
}

function isPast(a: Appointment) {
  return a.status === 'completed' || a.status === 'cancelled';
}

function formatFriendly(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DEPTS = ['Cardiology', 'General Medicine', 'Endocrinology'] as const;

export const AppointmentsScreen: React.FC<AppointmentsScreenProps> = ({
  appointments,
  onBook,
  onReschedule,
  onCancel,
  onCheckIn,
}) => {
  const [segment, setSegment] = useState<'upcoming' | 'past'>('upcoming');
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [dept, setDept] = useState('Cardiology');
  const [date, setDate] = useState(defaultBookDate);
  const [time, setTime] = useState(BOOK_SLOTS[1]);
  const [reason, setReason] = useState('Follow-up visit');
  const [rDate, setRDate] = useState(defaultBookDate);
  const [rTime, setRTime] = useState(RESCHEDULE_SLOTS[2]);
  const [deptOpen, setDeptOpen] = useState(false);

  const doctor = doctorForDepartment(dept);
  const today = todayIso();

  const { upcoming, past } = useMemo(() => {
    const up = appointments
      .filter(isUpcoming)
      .sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    const pa = appointments
      .filter(isPast)
      .sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
    for (const a of appointments) {
      if (isUpcoming(a) || isPast(a)) continue;
      if (a.date >= today) up.push(a);
      else pa.push(a);
    }
    return { upcoming: up, past: pa };
  }, [appointments, today]);

  const list = segment === 'upcoming' ? upcoming : past;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl text-[var(--mc-text)] tracking-tight">Visits</h3>
          <p className="text-[11px] text-[var(--mc-muted)] mt-0.5">
            Check in today or book your next follow-up
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setDate(defaultBookDate());
            setBookOpen(true);
          }}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--mc-accent)] text-white text-[11px] font-bold"
        >
          <Plus className="h-3.5 w-3.5" />
          Book
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl border border-[var(--mc-line)] bg-[var(--mc-elevated)]">
        {(
          [
            ['upcoming', `Upcoming (${upcoming.length})`],
            ['past', `Past (${past.length})`],
          ] as const
        ).map(([key, label]) => {
          const on = segment === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSegment(key)}
              className={`flex-1 py-2 rounded-lg text-[11px] font-semibold transition-colors ${
                on
                  ? 'bg-[var(--mc-accent-muted)] text-[var(--mc-accent)]'
                  : 'text-[var(--mc-muted)]'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-[var(--mc-muted)] leading-relaxed">
        {segment === 'upcoming'
          ? 'Most patients visit every 3–6 months. Keep the next appointment here; use Book when it is time to schedule.'
          : 'Completed and cancelled visits stay on this tab for reference.'}
      </p>

      {list.length === 0 && (
        <p className="text-[12px] text-[var(--mc-muted)] py-8 text-center">
          {segment === 'upcoming'
            ? 'No upcoming visits. Book your next follow-up when you are ready.'
            : 'No past visits yet.'}
        </p>
      )}

      <div className="space-y-3">
        {list.map((a, i) => {
          const todayVisit = a.date === today && isUpcoming(a);
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-2xl border p-3.5 backdrop-blur-sm ${
                todayVisit
                  ? 'bg-[var(--mc-accent-muted)] border-[var(--mc-accent)]'
                  : 'bg-[var(--mc-elevated)] border-[var(--mc-line)]'
              }`}
            >
              {todayVisit && (
                <p className="text-[9px] uppercase font-bold tracking-wide text-[var(--mc-accent)] mb-2">
                  Today · check in here
                </p>
              )}
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="text-[13px] font-bold text-[var(--mc-text)]">{a.type}</div>
                  <div className="text-[11px] text-[var(--mc-muted)] mt-0.5">{a.doctorName}</div>
                </div>
                <span className="text-[9px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-md bg-[var(--mc-accent-muted)] text-[var(--mc-accent)] shrink-0">
                  {a.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-2.5 flex justify-between text-[11px] text-[var(--mc-muted)]">
                <span>
                  {formatFriendly(a.date)} · {a.time}
                </span>
                <span>{a.room}</span>
              </div>
              {(a.status === 'scheduled' || a.status === 'checked_in') && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.status === 'scheduled' && (
                    <button
                      type="button"
                      onClick={() => onCheckIn(a.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-[var(--mc-ink)] text-white text-[10px] font-bold"
                    >
                      Check in
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleId(a.id);
                      setRDate(a.date);
                      setRTime(RESCHEDULE_SLOTS[0]);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-[var(--mc-line)] text-[10px] font-bold text-[var(--mc-text)]"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => onCancel(a.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-[10px] font-bold text-rose-700 dark:border-rose-900 dark:text-rose-300"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {bookOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-[var(--mc-elevated)] rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-xl border border-[var(--mc-line)]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[var(--mc-text)]">Book visit</h4>
              <button type="button" onClick={() => { setBookOpen(false); setDeptOpen(false); }} aria-label="Close">
                <X className="h-4 w-4 text-[var(--mc-muted)]" />
              </button>
            </div>
            <p className="text-[11px] text-[var(--mc-muted)] leading-relaxed">
              Follow-ups are often 3 or 6 months out. Pick a date, then a time.
            </p>
            <label className="block text-[10px] font-bold text-[var(--mc-muted)] uppercase">
              Department
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setDeptOpen((o) => !o)}
                className="w-full flex items-center justify-between gap-2 text-xs border border-[var(--mc-line)] rounded-xl px-3 py-2.5 bg-[var(--mc-surface)] text-[var(--mc-text)] font-semibold"
              >
                <span>{dept}</span>
                <ChevronDown
                  className={`h-4 w-4 text-[var(--mc-muted)] transition-transform ${deptOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {deptOpen && (
                <div className="mt-1.5 rounded-xl border border-[var(--mc-line)] bg-[var(--mc-elevated)] overflow-hidden shadow-sm">
                  {DEPTS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => {
                        setDept(d);
                        setDeptOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 text-xs font-semibold border-b border-[var(--mc-line)] last:border-b-0 ${
                        dept === d
                          ? 'bg-[var(--mc-accent-muted)] text-[var(--mc-accent)]'
                          : 'text-[var(--mc-text)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-[11px] text-[var(--mc-muted)]">Physician: {doctor.name}</p>
            <label className="block text-[10px] font-bold text-[var(--mc-muted)] uppercase">Date</label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-xs border border-[var(--mc-line)] rounded-lg px-2 py-2 bg-[var(--mc-surface)] text-[var(--mc-text)]"
            />
            <label className="block text-[10px] font-bold text-[var(--mc-muted)] uppercase">Time</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full text-xs border border-[var(--mc-line)] rounded-lg px-2 py-2 bg-[var(--mc-surface)] text-[var(--mc-text)]"
            >
              {BOOK_SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full text-xs border border-[var(--mc-line)] rounded-lg px-2 py-2 bg-[var(--mc-surface)] text-[var(--mc-text)]"
              placeholder="Reason"
            />
            <button
              type="button"
              onClick={async () => {
                try {
                  await onBook({
                    department: dept,
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    date,
                    time,
                    reason,
                  });
                  setBookOpen(false);
                  setSegment('upcoming');
                } catch {
                  /* keep modal open */
                }
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--mc-accent)] text-white text-xs font-bold"
            >
              Confirm booking
            </button>
          </div>
        </div>
      )}

      {rescheduleId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-end sm:items-center justify-center p-3">
          <div className="bg-[var(--mc-elevated)] rounded-2xl p-4 w-full max-w-sm space-y-3 shadow-xl border border-[var(--mc-line)]">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[var(--mc-text)]">Reschedule</h4>
              <button type="button" onClick={() => setRescheduleId(null)} aria-label="Close">
                <X className="h-4 w-4 text-[var(--mc-muted)]" />
              </button>
            </div>
            <input
              type="date"
              value={rDate}
              min={today}
              onChange={(e) => setRDate(e.target.value)}
              className="w-full text-xs border border-[var(--mc-line)] rounded-lg px-2 py-2 bg-[var(--mc-surface)] text-[var(--mc-text)]"
            />
            <select
              value={rTime}
              onChange={(e) => setRTime(e.target.value)}
              className="w-full text-xs border border-[var(--mc-line)] rounded-lg px-2 py-2 bg-[var(--mc-surface)] text-[var(--mc-text)]"
            >
              {RESCHEDULE_SLOTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={async () => {
                try {
                  await onReschedule(rescheduleId, rDate, rTime);
                  setRescheduleId(null);
                } catch {
                  /* keep modal open */
                }
              }}
              className="w-full py-2.5 rounded-xl bg-[var(--mc-accent)] text-white text-xs font-bold"
            >
              Save new time
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};
