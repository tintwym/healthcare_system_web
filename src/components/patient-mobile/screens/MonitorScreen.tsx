import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bluetooth,
  Heart,
  Droplets,
  Thermometer,
  Wind,
  PlusCircle,
  Radio,
  AlertTriangle,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { PatientRecord } from '../../../types';
import { LiveMonitorTrace } from '../LiveMonitorTrace';

interface MonitorScreenProps {
  patient: PatientRecord;
  onLogReading: (reading: {
    heartRate: number;
    bloodPressureSys: number;
    bloodPressureDia: number;
    spO2: number;
    temperature: number;
    respRate: number;
    notes?: string;
  }) => void | Promise<void>;
}

export const MonitorScreen: React.FC<MonitorScreenProps> = ({ patient, onLogReading }) => {
  const latest = patient.vitals[patient.vitals.length - 1];
  const [liveHr, setLiveHr] = useState(latest?.heartRate ?? 72);
  const [liveSpO2, setLiveSpO2] = useState(latest?.spO2 ?? 98);
  const [streaming, setStreaming] = useState(true);
  const [logOpen, setLogOpen] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [heartRate, setHeartRate] = useState(String(latest?.heartRate ?? 78));
  const [bpSys, setBpSys] = useState(String(latest?.bloodPressureSys ?? 120));
  const [bpDia, setBpDia] = useState(String(latest?.bloodPressureDia ?? 78));
  const [spO2, setSpO2] = useState(String(latest?.spO2 ?? 98));
  const [temp, setTemp] = useState(String(latest?.temperature ?? 98.6));
  const [respRate, setRespRate] = useState(String(latest?.respRate ?? 16));
  const [notes, setNotes] = useState('Home monitoring reading');

  useEffect(() => {
    if (!streaming) return;
    const id = window.setInterval(() => {
      setLiveHr((prev) => {
        const next = prev + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 3);
        return Math.max(58, Math.min(110, next));
      });
      setLiveSpO2((prev) => {
        const delta = Math.random() > 0.75 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(92, Math.min(100, prev + delta));
      });
    }, 1400);
    return () => window.clearInterval(id);
  }, [streaming]);

  const chartData = patient.vitals.slice(-8).map((v) => ({
    time: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hr: v.heartRate,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const hr = Number(heartRate);
    const sys = Number(bpSys);
    const dia = Number(bpDia);
    const o2 = Number(spO2);
    const t = Number(temp);
    const rr = Number(respRate);
    if ([hr, sys, dia, o2, t, rr].some((n) => !Number.isFinite(n))) return;
    try {
      await onLogReading({
        heartRate: hr,
        bloodPressureSys: sys,
        bloodPressureDia: dia,
        spO2: o2,
        temperature: t,
        respRate: rr,
        notes: notes.trim() || 'Patient home monitoring',
      });
      setLogOpen(false);
      setSavedFlash(true);
      window.setTimeout(() => setSavedFlash(false), 2200);
    } catch {
      /* parent logs; keep form open */
    }
  };

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-display text-xl text-[var(--mc-text)] tracking-tight">Monitor</h3>
          <p className="text-[11px] text-[var(--mc-muted)] mt-0.5">Bedside stream · home devices</p>
        </div>
        <button
          type="button"
          onClick={() => setStreaming((s) => !s)}
          className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-colors ${
            streaming
              ? 'bg-emerald-500/15 text-emerald-800'
              : 'bg-[var(--mc-surface)] text-[var(--mc-muted)]'
          }`}
        >
          <Radio className={`h-3 w-3 ${streaming ? 'animate-pulse' : ''}`} />
          {streaming ? 'Live' : 'Paused'}
        </button>
      </div>

      <AnimatePresence>
        {savedFlash && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-3 py-2 text-[11px] font-semibold text-emerald-800"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Reading synced to care team
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="relative overflow-hidden rounded-2xl bg-[var(--mc-ink)] text-white p-3.5">
          <div className="absolute -right-4 -bottom-4 h-16 w-16 rounded-full bg-rose-500/30 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-rose-300">
              <Heart className="h-3 w-3" /> Heart rate
            </div>
            <motion.div
              key={liveHr}
              initial={{ scale: 1.04 }}
              animate={{ scale: 1 }}
              className="text-[2rem] font-bold tabular-nums leading-none mt-2"
            >
              {liveHr}
            </motion.div>
            <div className="text-[10px] text-slate-400 mt-1">bpm</div>
          </div>
        </div>
        <div className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] p-3.5 backdrop-blur-sm">
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700">
            <Droplets className="h-3 w-3" /> SpO₂
          </div>
          <div className="text-[2rem] font-bold tabular-nums leading-none mt-2 text-[var(--mc-text)]">{liveSpO2}</div>
          <div className="text-[10px] text-[var(--mc-muted)] mt-1">% saturation</div>
        </div>
      </div>

      <LiveMonitorTrace heartRate={liveHr} spO2={liveSpO2} streaming={streaming} />

      {latest && (
        <div className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[12px] font-bold text-[var(--mc-text)]">Latest saved reading</span>
            {latest.isAbnormal ? (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded-md">
                <AlertTriangle className="h-3 w-3" /> Alert
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                <CheckCircle2 className="h-3 w-3" /> Normal
              </span>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[9px] uppercase text-[var(--mc-muted)] font-bold">BP</div>
              <div className="text-[13px] font-bold tabular-nums text-[var(--mc-text)]">
                {latest.bloodPressureSys}/{latest.bloodPressureDia}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-[var(--mc-muted)] font-bold flex items-center justify-center gap-0.5">
                <Thermometer className="h-2.5 w-2.5" /> Temp
              </div>
              <div className="text-[13px] font-bold tabular-nums text-[var(--mc-text)]">{latest.temperature}°</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-[var(--mc-muted)] font-bold flex items-center justify-center gap-0.5">
                <Wind className="h-2.5 w-2.5" /> Resp
              </div>
              <div className="text-[13px] font-bold tabular-nums text-[var(--mc-text)]">{latest.respRate}</div>
            </div>
          </div>
        </div>
      )}

      {chartData.length > 1 && (
        <div className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] p-3">
          <div className="text-[11px] font-bold text-[var(--mc-text)] mb-1 px-1">Heart rate trend</div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mc-accent)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--mc-accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 9, fill: 'var(--mc-muted)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide domain={['dataMin - 8', 'dataMax + 8']} />
                <Tooltip
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: '1px solid var(--mc-line)',
                    background: 'var(--mc-elevated)',
                    color: 'var(--mc-text)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hr"
                  stroke="var(--mc-accent)"
                  strokeWidth={2}
                  fill="url(#hrFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--mc-text)] mb-2">
          <Bluetooth className="h-3.5 w-3.5 text-sky-600" />
          Devices
        </div>
        <div className="space-y-0">
          {[
            { name: 'Medicore Pulse Ox', status: streaming ? 'Streaming' : 'Idle' },
            { name: 'Home BP Cuff', status: 'Paired' },
          ].map((d) => (
            <div
              key={d.name}
              className="flex items-center justify-between py-2.5 border-b border-[var(--mc-line)] last:border-0"
            >
              <span className="text-[12px] font-semibold text-[var(--mc-text)]">{d.name}</span>
              <span className="text-[10px] font-bold text-emerald-700">{d.status}</span>
            </div>
          ))}
        </div>
      </div>

      {!logOpen ? (
        <button
          type="button"
          onClick={() => setLogOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[var(--mc-accent)] hover:opacity-90 text-white text-[12px] font-bold transition-colors"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          Log home vitals
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] p-3.5 space-y-2.5 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-bold text-[var(--mc-text)]">New home reading</div>
            <button type="button" onClick={() => setLogOpen(false)} className="text-[var(--mc-muted)]" aria-label="Close">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['HR', heartRate, setHeartRate],
                ['SpO2', spO2, setSpO2],
                ['BP sys', bpSys, setBpSys],
                ['BP dia', bpDia, setBpDia],
                ['Temp', temp, setTemp],
                ['Resp', respRate, setRespRate],
              ] as const
            ).map(([label, value, setValue]) => (
              <label key={label} className="text-[10px] font-semibold text-[var(--mc-muted)]">
                {label}
                <input
                  className="mt-1 w-full rounded-lg bg-[var(--mc-surface)] border border-[var(--mc-line)] px-2.5 py-1.5 text-[12px] text-[var(--mc-text)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mc-accent)_40%,transparent)]"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  inputMode="decimal"
                />
              </label>
            ))}
          </div>
          <label className="block text-[10px] font-semibold text-[var(--mc-muted)]">
            Notes
            <input
              className="mt-1 w-full rounded-lg bg-[var(--mc-surface)] border border-[var(--mc-line)] px-2.5 py-1.5 text-[12px] text-[var(--mc-text)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mc-accent)_40%,transparent)]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
          <button
            type="submit"
            className="w-full py-2 rounded-xl bg-[var(--mc-accent)] text-white text-[12px] font-bold"
          >
            Save & sync to care team
          </button>
        </form>
      )}
    </motion.div>
  );
};
