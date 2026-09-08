import React, { useEffect, useMemo, useRef, useState } from 'react';

const SAMPLE_HZ = 60;
const WINDOW_SEC = 3.2;

function ecgMorphology(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.1) return 0.12 * Math.sin((p / 0.1) * Math.PI);
  if (p < 0.16) return 0;
  if (p < 0.18) return -0.18;
  if (p < 0.205) return 1.05;
  if (p < 0.23) return -0.28;
  if (p < 0.28) return 0;
  if (p < 0.45) return 0.28 * Math.sin(((p - 0.28) / 0.17) * Math.PI);
  return 0;
}

function plethMorphology(phase: number): number {
  const p = ((phase % 1) + 1) % 1;
  if (p < 0.35) return Math.sin((p / 0.35) * Math.PI) ** 1.35;
  if (p < 0.55) return 0.35 * Math.sin(((p - 0.35) / 0.2) * Math.PI);
  return 0.02;
}

type Props = {
  heartRate: number;
  spO2: number;
  streaming?: boolean;
  height?: number;
};

/** Bedside-style live ECG + SpO₂ traces (real-time buffer, not CSS dash loop). */
export function LiveMonitorTrace({
  heartRate,
  spO2,
  streaming = true,
  height = 168,
}: Props) {
  const width = 320;
  const ecgH = Math.floor(height * 0.55);
  const plethH = height - ecgH - 8;
  const capacity = Math.floor(SAMPLE_HZ * WINDOW_SEC);

  const ecgBuf = useRef<number[]>(Array.from({ length: capacity }, () => 0));
  const plethBuf = useRef<number[]>(Array.from({ length: capacity }, () => 0));
  const phaseRef = useRef(0);
  const [tick, setTick] = useState(0);
  const hrRef = useRef(heartRate);
  const spoRef = useRef(spO2);
  hrRef.current = heartRate;
  spoRef.current = spO2;

  useEffect(() => {
    if (!streaming) return;
    const stepMs = 1000 / SAMPLE_HZ;
    const id = window.setInterval(() => {
      const hr = Math.max(40, Math.min(180, hrRef.current || 72));
      const rr = 60 / hr;
      phaseRef.current = (phaseRef.current + stepMs / 1000 / rr) % 1;
      const phase = phaseRef.current;
      const noise = (Math.random() - 0.5) * 0.02;
      const ecg = ecgMorphology(phase) + noise;
      const amp = 0.55 + (spoRef.current / 100) * 0.45;
      const pleth = plethMorphology(phase) * amp + (Math.random() - 0.5) * 0.015;

      ecgBuf.current.push(ecg);
      plethBuf.current.push(pleth);
      if (ecgBuf.current.length > capacity) ecgBuf.current.shift();
      if (plethBuf.current.length > capacity) plethBuf.current.shift();
      setTick((t) => t + 1);
    }, stepMs);
    return () => window.clearInterval(id);
  }, [streaming, capacity]);

  const { ecgPoints, plethPoints, gridLines } = useMemo(() => {
    const mapY = (v: number, mid: number, scale: number) => mid - v * scale;
    const w = width - 16;

    const ecgPts = ecgBuf.current
      .map((v, i) => {
        const x = (i / Math.max(1, capacity - 1)) * w;
        const y = mapY(v, ecgH * 0.58, ecgH * 0.38);
        return `${x},${y}`;
      })
      .join(' ');

    const plethPts = plethBuf.current
      .map((v, i) => {
        const x = (i / Math.max(1, capacity - 1)) * w;
        const y = mapY(v, plethH * 0.72, plethH * 0.55) + ecgH + 6;
        return `${x},${y}`;
      })
      .join(' ');

    const grids: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];
    const totalH = ecgH + plethH + 8;
    for (let x = 0; x < w; x += 24) grids.push({ x1: x, y1: 0, x2: x, y2: totalH });
    for (let y = 0; y < totalH; y += 16) grids.push({ x1: 0, y1: y, x2: w, y2: y });

    return { ecgPoints: ecgPts, plethPoints: plethPts, gridLines: grids };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ecgH, plethH, capacity]);

  const sweepX = ((tick % capacity) / capacity) * (width - 16);
  const totalH = ecgH + plethH + 8;

  return (
    <div
      className="rounded-2xl overflow-hidden border border-[var(--mc-line)] bg-[#020617]"
      aria-label="Live ECG and SpO2 monitor"
    >
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <span className="text-[10px] font-bold tracking-wider text-slate-400">BEDSIDE TRACE · II / PLETH</span>
        <span className={`text-[10px] font-bold ${streaming ? 'text-emerald-400' : 'text-slate-500'}`}>
          {streaming ? '● STREAMING' : '■ PAUSED'}
        </span>
      </div>
      <div className="flex items-baseline gap-4 px-3 pb-2">
        <div className="flex items-baseline gap-1">
          <span className="text-[9px] font-bold text-rose-400">HR</span>
          <span className="text-lg font-bold tabular-nums text-rose-200">{Math.round(heartRate)}</span>
          <span className="text-[9px] text-slate-500">bpm</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-[9px] font-bold text-sky-400">SpO₂</span>
          <span className="text-lg font-bold tabular-nums text-sky-200">{Math.round(spO2)}</span>
          <span className="text-[9px] text-slate-500">%</span>
        </div>
      </div>
      <div className="px-2 pb-2.5">
        <svg width="100%" viewBox={`0 0 ${width - 16} ${totalH}`} className="block" aria-hidden>
          <rect x={0} y={0} width={width - 16} height={totalH} fill="#020617" />
          {gridLines.map((g, i) => (
            <line
              key={`g-${i}`}
              x1={g.x1}
              y1={g.y1}
              x2={g.x2}
              y2={g.y2}
              stroke="rgba(45,212,191,0.12)"
              strokeWidth={1}
            />
          ))}
          <polyline
            points={ecgPoints}
            fill="none"
            stroke="#4ade80"
            strokeWidth={1.6}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <polyline
            points={plethPoints}
            fill="none"
            stroke="#38bdf8"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {streaming ? (
            <line
              x1={sweepX}
              y1={0}
              x2={sweepX}
              y2={totalH}
              stroke="rgba(248,250,252,0.35)"
              strokeWidth={2}
            />
          ) : null}
        </svg>
      </div>
    </div>
  );
}

/** Compact scrolling ECG for Home — sample buffer, not dash-offset GIF. */
export function EcgWave({
  heartRate = 72,
  streaming = true,
  height = 32,
}: {
  heartRate?: number;
  streaming?: boolean;
  height?: number;
}) {
  const width = 280;
  const capacity = Math.max(48, Math.floor(width / 3));
  const buf = useRef<number[]>(Array.from({ length: capacity }, () => 0));
  const phase = useRef(0);
  const [tick, setTick] = useState(0);
  const hrRef = useRef(heartRate);
  hrRef.current = heartRate;

  useEffect(() => {
    if (!streaming) return;
    const id = window.setInterval(() => {
      const hr = Math.max(45, Math.min(160, hrRef.current));
      const rr = 60 / hr;
      phase.current = (phase.current + 0.04 / rr) % 1;
      const p = phase.current;
      let v = 0;
      if (p < 0.1) v = 0.12 * Math.sin((p / 0.1) * Math.PI);
      else if (p >= 0.16 && p < 0.18) v = -0.18;
      else if (p >= 0.18 && p < 0.205) v = 1;
      else if (p >= 0.205 && p < 0.23) v = -0.25;
      else if (p >= 0.28 && p < 0.45) v = 0.25 * Math.sin(((p - 0.28) / 0.17) * Math.PI);
      v += (Math.random() - 0.5) * 0.03;
      buf.current.push(v);
      if (buf.current.length > capacity) buf.current.shift();
      setTick((t) => t + 1);
    }, 40);
    return () => window.clearInterval(id);
  }, [streaming, capacity]);

  const points = useMemo(
    () =>
      buf.current
        .map((v, i) => {
          const x = (i / Math.max(1, capacity - 1)) * width;
          const y = height * 0.55 - v * (height * 0.4);
          return `${x},${y}`;
        })
        .join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tick, capacity, height]
  );

  return (
    <svg className="w-full mt-3 text-[var(--mc-accent)]" viewBox={`0 0 ${width} ${height}`} fill="none" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.85}
      />
    </svg>
  );
}
