import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  Legend,
  Brush,
} from 'recharts';
import {
  Activity,
  Heart,
  Droplets,
  Thermometer,
  Wind,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  Info,
  Layers,
} from 'lucide-react';
import { generatePatientHistoricalVitals } from '../../data/staffAndRosterData';
import { PatientRecord } from '../../types';

interface HistoricalVitalsChartsProps {
  patient: PatientRecord;
  deIdentifyPhi?: boolean;
}

type TimeFrame = '24h' | '7d' | '14d' | '30d';
type MetricView = 'cardio' | 'pulmonary' | 'temp' | 'all';

export const HistoricalVitalsCharts: React.FC<HistoricalVitalsChartsProps> = ({
  patient,
  deIdentifyPhi = false,
}) => {
  const [timeframe, setTimeframe] = useState<TimeFrame>('7d');
  const [activeView, setActiveView] = useState<MetricView>('cardio');
  const [showReferenceZones, setShowReferenceZones] = useState<boolean>(true);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);

  // Active metrics visibility toggles for 'all' mode
  const [showHR, setShowHR] = useState<boolean>(true);
  const [showSBP, setShowSBP] = useState<boolean>(true);
  const [showDBP, setShowDBP] = useState<boolean>(true);
  const [showSpO2, setShowSpO2] = useState<boolean>(true);
  const [showTemp, setShowTemp] = useState<boolean>(true);
  const [showRR, setShowRR] = useState<boolean>(true);

  // Generate historical data points according to chosen timeframe
  const dataPoints = useMemo(() => {
    const days = timeframe === '24h' ? 1 : timeframe === '7d' ? 7 : timeframe === '14d' ? 14 : 30;

    // Use current patient's latest vital as baseline guide
    const latest = patient.vitals[patient.vitals.length - 1];
    const baseBP = latest ? { sys: latest.bloodPressureSys, dia: latest.bloodPressureDia } : { sys: 124, dia: 80 };
    const baseHR = latest?.heartRate || 74;
    const baseSpO2 = latest?.spO2 || 98;
    const baseTemp = latest?.temperature || 98.6;
    const baseRR = latest?.respRate || 16;

    return generatePatientHistoricalVitals(patient.id, days, baseBP, baseHR, baseSpO2, baseTemp, baseRR);
  }, [patient.id, patient.vitals, timeframe]);

  // Statistical calculations across the historical window
  const stats = useMemo(() => {
    if (dataPoints.length === 0) return null;

    const totalPoints = dataPoints.length;
    const avgHR = Math.round(dataPoints.reduce((acc, p) => acc + p.heartRate, 0) / totalPoints);
    const avgSBP = Math.round(dataPoints.reduce((acc, p) => acc + p.bpSys, 0) / totalPoints);
    const avgDBP = Math.round(dataPoints.reduce((acc, p) => acc + p.bpDia, 0) / totalPoints);
    const avgMAP = Math.round(dataPoints.reduce((acc, p) => acc + p.map, 0) / totalPoints);
    const avgSpO2 = (dataPoints.reduce((acc, p) => acc + p.spO2, 0) / totalPoints).toFixed(1);
    const minSpO2 = Math.min(...dataPoints.map((p) => p.spO2));
    const maxTemp = Math.max(...dataPoints.map((p) => p.temp));
    const abnormalCount = dataPoints.filter((p) => p.isAbnormal).length;

    // Determine trajectory: compare first third with last third
    const third = Math.max(1, Math.floor(totalPoints / 3));
    const earlySBP = dataPoints.slice(0, third).reduce((a, b) => a + b.bpSys, 0) / third;
    const lateSBP = dataPoints.slice(-third).reduce((a, b) => a + b.bpSys, 0) / third;
    const sbpDiff = lateSBP - earlySBP;

    let trajectory = 'Stable & Within Expected Limits';
    let trajectoryColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (sbpDiff < -6) {
      trajectory = 'Improving / Responding to Therapy';
      trajectoryColor = 'text-blue-700 bg-blue-50 border-blue-200';
    } else if (sbpDiff > 8 || minSpO2 < 93 || maxTemp > 101) {
      trajectory = 'Elevated Risk / Clinically Volatile';
      trajectoryColor = 'text-rose-700 bg-rose-50 border-rose-200';
    }

    return {
      avgHR,
      avgSBP,
      avgDBP,
      avgMAP,
      avgSpO2,
      minSpO2,
      maxTemp,
      abnormalCount,
      trajectory,
      trajectoryColor,
    };
  }, [dataPoints]);

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'Date', 'Time', 'Heart Rate (bpm)', 'Systolic BP (mmHg)', 'Diastolic BP (mmHg)', 'MAP (mmHg)', 'SpO2 (%)', 'Core Temp (°F)', 'Resp Rate (bpm)', 'Status', 'Clinical Note'];
    const rows = dataPoints.map((p) => [
      p.timestamp,
      p.dateLabel,
      p.timeLabel,
      p.heartRate,
      p.bpSys,
      p.bpDia,
      p.map,
      p.spO2,
      p.temp,
      p.respRate,
      p.isAbnormal ? 'FLAGGED_ABNORMAL' : 'NORMAL',
      p.notes ? `"${p.notes.replace(/"/g, '""')}"` : '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Historical_Vitals_${patient.id}_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom rich tooltip for clinician inspection
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs space-y-2 min-w-[200px] backdrop-blur-xs">
          <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
            <span className="font-bold text-slate-200">{data.dateLabel} • {data.timeLabel}</span>
            {data.isAbnormal && (
              <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40">
                Flagged
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span className="text-slate-400">HR:</span>
              <span className="font-bold text-slate-100">{data.heartRate} bpm</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span className="text-slate-400">BP:</span>
              <span className="font-bold text-slate-100">{data.bpSys}/{data.bpDia}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-slate-400">SpO2:</span>
              <span className="font-bold text-slate-100">{data.spO2}%</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span className="text-slate-400">Temp:</span>
              <span className="font-bold text-slate-100">{data.temp}°F</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-400"></span>
              <span className="text-slate-400">Resp:</span>
              <span className="font-bold text-slate-100">{data.respRate}/m</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span className="text-slate-400">MAP:</span>
              <span className="font-bold text-slate-100">{data.map} mmHg</span>
            </div>
          </div>

          {data.notes && (
            <div className="pt-1.5 border-t border-slate-700/80 text-[10px] text-amber-200">
              <span className="font-semibold text-amber-300">Clinical Event: </span>
              {data.notes}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      {/* Header & Control Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Activity className="h-4 w-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Longitudinal Historical Vitals Trajectory
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {dataPoints.length} Time-Series Epochs
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Visualizes multi-day telemetry, circadian oscillations, therapeutic titration, and threshold violations.
          </p>
        </div>

        {/* Timeframe & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Switcher */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            {(['24h', '7d', '14d', '30d'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => setTimeframe(tf)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                  timeframe === tf
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tf === '24h' ? '24 Hours' : tf === '7d' ? '7 Days' : tf === '14d' ? '14 Days' : '30 Days'}
              </button>
            ))}
          </div>

          {/* Reference Zones Toggle */}
          <button
            type="button"
            onClick={() => setShowReferenceZones(!showReferenceZones)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center space-x-1.5 ${
              showReferenceZones
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>Ref Zones</span>
          </button>

          {/* Export CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-900 text-white shadow-xs transition-colors flex items-center space-x-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Trend CSV</span>
          </button>
        </div>
      </div>

      {/* Statistical Analytics Bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Arterial BP</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {stats.avgSBP}/{stats.avgDBP} <span className="text-xs text-slate-500 font-normal">mmHg</span>
            </div>
            <div className="text-[10px] text-slate-500">MAP: ~{stats.avgMAP} mmHg</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Avg Heart Rate</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {stats.avgHR} <span className="text-xs text-slate-500 font-normal">bpm</span>
            </div>
            <div className="text-[10px] text-slate-500">Normal resting: 60-100</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Oxygen Nadir</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {stats.minSpO2}% <span className="text-xs text-slate-500 font-normal">SpO2</span>
            </div>
            <div className="text-[10px] text-slate-500">Mean: {stats.avgSpO2}%</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Peak Core Temp</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {stats.maxTemp}°F
            </div>
            <div className="text-[10px] text-slate-500">{stats.maxTemp >= 100.4 ? 'Febrile episode detected' : 'Afebrile trajectory'}</div>
          </div>

          <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Flagged Epochs</div>
            <div className="text-base font-bold text-slate-900 mt-0.5">
              {stats.abnormalCount} <span className="text-xs text-slate-500 font-normal">of {dataPoints.length}</span>
            </div>
            <div className="text-[10px] text-slate-500">Exceeded clinical thresholds</div>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-between ${stats.trajectoryColor}`}>
            <div className="text-[10px] font-bold uppercase tracking-wider">Clinical Trajectory</div>
            <div className="text-xs font-bold leading-snug mt-0.5">
              {stats.trajectory}
            </div>
            <div className="text-[10px] opacity-80 mt-1">Based on {timeframe.toUpperCase()} moving avg</div>
          </div>
        </div>
      )}

      {/* Metric View Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveView('cardio')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'cardio'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            <span>Cardiovascular (BP & HR)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('pulmonary')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'pulmonary'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wind className="h-3.5 w-3.5 text-teal-500" />
            <span>Pulmonary (SpO2 & Resp)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('temp')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'temp'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Thermometer className="h-3.5 w-3.5 text-amber-500" />
            <span>Thermoregulation (Temp)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('all')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'all'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="h-3.5 w-3.5 text-indigo-500" />
            <span>Synchronized Multi-Parameter</span>
          </button>
        </div>

        {/* Legend / Filter toggles when in 'all' view */}
        {activeView === 'all' && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setShowHR(!showHR)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                showHR ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
              }`}
            >
              • HR
            </button>
            <button
              type="button"
              onClick={() => setShowSBP(!showSBP)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                showSBP ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
              }`}
            >
              • SBP
            </button>
            <button
              type="button"
              onClick={() => setShowDBP(!showDBP)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                showDBP ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
              }`}
            >
              • DBP
            </button>
            <button
              type="button"
              onClick={() => setShowSpO2(!showSpO2)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                showSpO2 ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
              }`}
            >
              • SpO2
            </button>
            <button
              type="button"
              onClick={() => setShowTemp(!showTemp)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                showTemp ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
              }`}
            >
              • Temp
            </button>
            <button
              type="button"
              onClick={() => setShowRR(!showRR)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-colors ${
                showRR ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
              }`}
            >
              • Resp
            </button>
          </div>
        )}
      </div>

      {/* Main Interactive Chart Viewport */}
      <div className="h-80 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {activeView === 'cardio' ? (
            <LineChart
              data={dataPoints}
              margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
              onClick={(e: any) => e?.activePayload?.[0]?.payload && setSelectedPoint(e.activePayload[0].payload)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[40, 190]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'mmHg / bpm', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />

              {/* Clinical Reference Lines */}
              {showReferenceZones && (
                <>
                  <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Hypertensive Alert (140+ SBP)', fill: '#dc2626', fontSize: 9 }} />
                  <ReferenceLine y={120} stroke="#3b82f6" strokeDasharray="3 3" label={{ value: 'Target SBP (120)', fill: '#2563eb', fontSize: 9 }} />
                  <ReferenceLine y={100} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Tachycardia (100 bpm)', fill: '#e11d48', fontSize: 9 }} />
                  <ReferenceLine y={60} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Bradycardia (60 bpm)', fill: '#e11d48', fontSize: 9 }} />
                </>
              )}

              <Line
                type="monotone"
                dataKey="bpSys"
                name="Systolic BP (mmHg)"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const isFlag = props.payload.bpSys >= 140;
                  return (
                    <circle
                      key={`dot-sbp-${props.cx}-${props.cy}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={isFlag ? 4.5 : 2.5}
                      fill={isFlag ? '#ef4444' : '#2563eb'}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="bpDia"
                name="Diastolic BP (mmHg)"
                stroke="#6366f1"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="heartRate"
                name="Heart Rate (bpm)"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={(props: any) => {
                  const isFlag = props.payload.heartRate >= 100 || props.payload.heartRate < 60;
                  return (
                    <circle
                      key={`dot-hr-${props.cx}-${props.cy}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={isFlag ? 4.5 : 2.5}
                      fill={isFlag ? '#ef4444' : '#f43f5e'}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="map"
                name="Mean Arterial Pressure (MAP)"
                stroke="#94a3b8"
                strokeDasharray="3 3"
                strokeWidth={1.5}
                dot={false}
              />
              <Brush dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'} height={20} stroke="#cbd5e1" fill="#f8fafc" />
            </LineChart>
          ) : activeView === 'pulmonary' ? (
            <LineChart
              data={dataPoints}
              margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
              onClick={(e: any) => e?.activePayload?.[0]?.payload && setSelectedPoint(e.activePayload[0].payload)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                domain={[85, 100]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'SpO2 (%)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#06b6d4' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[8, 32]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Resp Rate (bpm)', angle: 90, position: 'insideRight', fontSize: 10, fill: '#14b8a6' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />

              {showReferenceZones && (
                <>
                  <ReferenceLine yAxisId="left" y={95} stroke="#f87171" strokeDasharray="4 4" label={{ value: 'Critical Hypoxia Alert (<95%)', fill: '#ef4444', fontSize: 9 }} />
                  <ReferenceLine yAxisId="right" y={20} stroke="#fb923c" strokeDasharray="4 4" label={{ value: 'Tachypnea Threshold (>20 bpm)', fill: '#ea580c', fontSize: 9 }} />
                </>
              )}

              <Line
                yAxisId="left"
                type="monotone"
                dataKey="spO2"
                name="Oxygen Saturation (SpO2 %)"
                stroke="#06b6d4"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const isLow = props.payload.spO2 < 95;
                  return (
                    <circle
                      key={`dot-spo2-${props.cx}-${props.cy}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={isLow ? 5 : 2.5}
                      fill={isLow ? '#ef4444' : '#06b6d4'}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="respRate"
                name="Respiratory Rate (bpm)"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ r: 2 }}
              />
              <Brush dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'} height={20} stroke="#cbd5e1" fill="#f8fafc" />
            </LineChart>
          ) : activeView === 'temp' ? (
            <LineChart
              data={dataPoints}
              margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
              onClick={(e: any) => e?.activePayload?.[0]?.payload && setSelectedPoint(e.activePayload[0].payload)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[96, 103]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Core Temperature (°F)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#f59e0b' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />

              {showReferenceZones && (
                <>
                  <ReferenceLine y={100.4} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Febrile Spike Threshold (100.4°F)', fill: '#dc2626', fontSize: 9 }} />
                  <ReferenceLine y={98.6} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Baseline Afebrile (98.6°F)', fill: '#059669', fontSize: 9 }} />
                </>
              )}

              <Line
                type="monotone"
                dataKey="temp"
                name="Core Temperature (°F)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const isFever = props.payload.temp >= 100.4;
                  return (
                    <circle
                      key={`dot-temp-${props.cx}-${props.cy}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={isFever ? 5 : 2.5}
                      fill={isFever ? '#ef4444' : '#f59e0b'}
                      stroke="#fff"
                      strokeWidth={1.5}
                    />
                  );
                }}
              />
              <Brush dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'} height={20} stroke="#cbd5e1" fill="#f8fafc" />
            </LineChart>
          ) : (
            /* Synchronized All-in-One */
            <LineChart
              data={dataPoints}
              margin={{ top: 10, right: 20, left: 0, bottom: 25 }}
              onClick={(e: any) => e?.activePayload?.[0]?.payload && setSelectedPoint(e.activePayload[0].payload)}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[30, 190]}
                tick={{ fontSize: 10, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px' }} />

              {showHR && <Line type="monotone" dataKey="heartRate" name="Heart Rate (bpm)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} />}
              {showSBP && <Line type="monotone" dataKey="bpSys" name="Systolic BP (mmHg)" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 2 }} />}
              {showDBP && <Line type="monotone" dataKey="bpDia" name="Diastolic BP (mmHg)" stroke="#6366f1" strokeWidth={1.5} dot={{ r: 2 }} />}
              {showSpO2 && <Line type="monotone" dataKey="spO2" name="SpO2 (%)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />}
              {showTemp && <Line type="monotone" dataKey="temp" name="Core Temp (°F)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />}
              {showRR && <Line type="monotone" dataKey="respRate" name="Resp Rate (bpm)" stroke="#14b8a6" strokeWidth={1.5} dot={{ r: 2 }} />}

              <Brush dataKey={timeframe === '24h' ? 'timeLabel' : 'dateLabel'} height={20} stroke="#cbd5e1" fill="#f8fafc" />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Selected Data Point Detail Card */}
      {selectedPoint && (
        <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl flex items-center justify-between animate-in fade-in text-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="font-bold text-slate-900">
                Epoch Inspection: {selectedPoint.dateLabel} at {selectedPoint.timeLabel}
              </div>
              <div className="text-slate-600 mt-0.5 flex items-center space-x-3">
                <span>HR: <strong>{selectedPoint.heartRate} bpm</strong></span>
                <span>BP: <strong>{selectedPoint.bpSys}/{selectedPoint.bpDia} mmHg</strong></span>
                <span>SpO2: <strong>{selectedPoint.spO2}%</strong></span>
                <span>Temp: <strong>{selectedPoint.temp}°F</strong></span>
                <span>Resp: <strong>{selectedPoint.respRate} bpm</strong></span>
              </div>
              {selectedPoint.notes && (
                <div className="text-amber-800 font-medium mt-1">
                  Note: {selectedPoint.notes}
                </div>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedPoint(null)}
            className="px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-100 font-medium"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
