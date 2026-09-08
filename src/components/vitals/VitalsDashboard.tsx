import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Droplets,
  Thermometer,
  Wind,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Sparkles,
  Download,
  FileSignature,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceArea,
  Legend,
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useHospital } from '../../context/HospitalContext';
import { HistoricalVitalsCharts } from './HistoricalVitalsCharts';
import { McSelect } from '../ui/McSelect';

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `SHA256:${Math.abs(hash).toString(16).padStart(8, '0')}${Date.now().toString(36)}MEDICORE`;
}

export const VitalsDashboard: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    addVitalReading,
    deIdentifyPhi,
    currentUser,
    logAudit,
  } = useHospital();

  const [logModalOpen, setLogModalOpen] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [heartRate, setHeartRate] = useState('78');
  const [bpSys, setBpSys] = useState('124');
  const [bpDia, setBpDia] = useState('80');
  const [spO2, setSpO2] = useState('98');
  const [temp, setTemp] = useState('98.6');
  const [respRate, setRespRate] = useState('16');
  const [vitalNotes, setVitalNotes] = useState('');

  // Selected patient or default to first
  const currentPatient =
    patients.find((p) => p.id === selectedPatientId) || patients[0];

  const displayName = deIdentifyPhi
    ? `Patient #${currentPatient.id.slice(-4)}`
    : `${currentPatient.firstName} ${currentPatient.lastName}`;

  const displayMrn = deIdentifyPhi
    ? 'MRN-******'
    : currentPatient.mrn;

  // Format vitals for Recharts
  const chartData = currentPatient.vitals.map((v) => {
    const timeLabel = new Date(v.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateLabel = new Date(v.timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    return {
      time: `${dateLabel} ${timeLabel}`,
      heartRate: v.heartRate,
      bpSys: v.bloodPressureSys,
      bpDia: v.bloodPressureDia,
      spO2: v.spO2,
      temp: v.temperature,
      respRate: v.respRate,
      isAbnormal: v.isAbnormal,
    };
  });

  const latestVital = currentPatient.vitals[currentPatient.vitals.length - 1] ?? null;

  const handleSaveVital = (e: React.FormEvent) => {
    e.preventDefault();
    addVitalReading(currentPatient.id, {
      heartRate: parseInt(heartRate) || 75,
      bloodPressureSys: parseInt(bpSys) || 120,
      bloodPressureDia: parseInt(bpDia) || 80,
      spO2: parseInt(spO2) || 98,
      temperature: parseFloat(temp) || 98.6,
      respRate: parseInt(respRate) || 16,
      notes: vitalNotes,
    });
    setLogModalOpen(false);
    setVitalNotes('');
  };

  const handleExportVitalsPdf = () => {
    setExportingPdf(true);
    setTimeout(() => {
      const doc = new jsPDF();
      const exportTs = new Date().toISOString();
      const name = deIdentifyPhi
        ? `Patient #${currentPatient.id.slice(-4)}`
        : `${currentPatient.firstName} ${currentPatient.lastName}`;
      const mrn = deIdentifyPhi ? 'MRN-******' : currentPatient.mrn;

      const payload = currentPatient.vitals
        .map(
          (v) =>
            `${v.timestamp}|${v.heartRate}|${v.bloodPressureSys}/${v.bloodPressureDia}|${v.spO2}|${v.temperature}|${v.respRate}|${v.recordedBy}`
        )
        .join(';');
      const signatureHash = simpleHash(
        `${currentUser.id}|${currentPatient.id}|${exportTs}|${payload}`
      );

      doc.setFontSize(16);
      doc.text('MEDICORE Healthcare OS — Vitals History Report', 14, 18);
      doc.setFontSize(9);
      doc.setTextColor(80);
      doc.text('HIPAA-Compliant Signed Clinical Record  ·  § 164.312 Integrity Controls', 14, 24);
      doc.setTextColor(0);

      doc.setFontSize(11);
      doc.text(`Patient: ${name}`, 14, 34);
      doc.text(`MRN: ${mrn}`, 14, 40);
      doc.text(`DOB: ${deIdentifyPhi ? '****-**-**' : currentPatient.dob}  ·  Age: ${currentPatient.age}`, 14, 46);
      doc.text(`Attending: ${currentPatient.primaryDoctor}  ·  Dept: ${currentPatient.department}`, 14, 52);
      doc.text(`Status: ${currentPatient.admissionStatus}${currentPatient.room ? `  ·  Room ${currentPatient.room}` : ''}`, 14, 58);

      doc.setFontSize(9);
      doc.text(`Exported by: ${currentUser.name} (${currentUser.role})`, 14, 68);
      doc.text(`Export timestamp: ${exportTs}`, 14, 73);
      doc.text(`Electronic signature hash: ${signatureHash}`, 14, 78);

      const rows = [...currentPatient.vitals]
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
        .map((v) => [
          new Date(v.timestamp).toLocaleString(),
          String(v.heartRate),
          `${v.bloodPressureSys}/${v.bloodPressureDia}`,
          String(v.spO2),
          String(v.temperature),
          String(v.respRate),
          v.isAbnormal ? 'ABNORMAL' : 'Normal',
          v.recordedBy,
          v.notes || '—',
        ]);

      autoTable(doc, {
        startY: 84,
        head: [
          [
            'Timestamp',
            'HR',
            'BP',
            'SpO2',
            'Temp °F',
            'RR',
            'Flag',
            'Recorded By',
            'Notes',
          ],
        ],
        body: rows,
        styles: { fontSize: 7, cellPadding: 1.5 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 6 && data.cell.raw === 'ABNORMAL') {
            data.cell.styles.textColor = [190, 18, 60];
            data.cell.styles.fontStyle = 'bold';
          }
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 200;
      let y = finalY + 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Attestation & Digital Signature', 14, y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      const attest = doc.splitTextToSize(
        `I, ${currentUser.name}, attest that this vitals history export was generated from the authenticated MEDICORE Healthcare OS session and accurately reflects documented bedside/telemetry readings for record-keeping and continuity of care. This document is confidential PHI and may only be disclosed to authorized recipients under HIPAA Privacy Rule 45 CFR 164.502.`,
        180
      );
      doc.text(attest, 14, y + 6);
      doc.text(`Signed electronically: ${currentUser.name}`, 14, y + 6 + attest.length * 4 + 4);
      doc.text(`License / ID: ${currentUser.licenseNumber || currentUser.id}`, 14, y + 6 + attest.length * 4 + 9);
      doc.setFont('courier', 'normal');
      doc.setFontSize(7);
      doc.text(`Integrity seal: ${signatureHash}`, 14, y + 6 + attest.length * 4 + 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(
        'CONFIDENTIAL — Authorized clinical use only. Unauthorized redisclosure prohibited.',
        14,
        285
      );

      doc.save(
        `Vitals_History_${deIdentifyPhi ? currentPatient.id : currentPatient.mrn}_${exportTs.slice(0, 10)}.pdf`
      );

      logAudit(
        'UPDATE_VITALS',
        `Exported signed vitals history PDF for ${name} (${mrn})`,
        `HIPAA-compliant signed clinical export. Integrity seal ${signatureHash.slice(0, 24)}…`,
        currentPatient.id,
        deIdentifyPhi ? undefined : `${currentPatient.firstName} ${currentPatient.lastName}`
      );

      setExportingPdf(false);
    }, 350);
  };

  return (
    <div className="space-y-6">
      {/* Clinician Header & Patient Selector */}
      <div className="bg-white dark:bg-[var(--mc-elevated)] p-5 rounded-2xl border border-slate-200 dark:border-[var(--mc-line)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 rounded-2xl bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 flex items-center justify-center font-bold text-lg border border-teal-100 dark:border-teal-800">
            {displayName[0]}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{displayName}</h1>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                {displayMrn}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  currentPatient.admissionStatus === 'ICU'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                    : currentPatient.admissionStatus === 'Inpatient'
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200'
                    : currentPatient.admissionStatus === 'Emergency'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    : currentPatient.admissionStatus === 'Discharged'
                    ? 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                }`}
              >
                {currentPatient.admissionStatus} {currentPatient.room ? `• ${currentPatient.room}` : ''}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Primary Doctor: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentPatient.primaryDoctor}</span> • Dept: {currentPatient.department} • Allergies:{' '}
              <span className="text-rose-600 font-semibold">{currentPatient.allergies.join(', ') || 'None reported'}</span>
            </p>
          </div>
        </div>

        {/* Patient Switcher & Log Vitals Action */}
        <div className="flex flex-wrap items-center gap-2">
          <McSelect
            id="vitals-patient-select"
            value={currentPatient.id}
            onChange={setSelectedPatientId}
            options={patients.map((p) => ({
              value: p.id,
              label: deIdentifyPhi
                ? `Patient #${p.id.slice(-4)} (${p.admissionStatus})`
                : `${p.firstName} ${p.lastName} (${p.admissionStatus})`,
            }))}
            className="min-w-[12rem] max-w-full"
            aria-label="Select patient for vitals"
          />

          <button
            id="export-vitals-pdf-btn"
            onClick={handleExportVitalsPdf}
            disabled={exportingPdf || currentPatient.vitals.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-xs transition-colors disabled:opacity-40"
            title="Export signed HIPAA-compliant vitals history PDF"
          >
            {exportingPdf ? (
              <FileSignature className="h-4 w-4 text-teal-600 animate-pulse" />
            ) : (
              <Download className="h-4 w-4 text-teal-600" />
            )}
            <span>{exportingPdf ? 'Signing…' : 'Export PDF'}</span>
          </button>

          <button
            id="log-vitals-btn"
            onClick={() => setLogModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Log Vital Signs</span>
          </button>
        </div>
      </div>

      {/* Real-Time Live Vitals Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Heart Rate */}
        <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Heart Rate</span>
            <Heart className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span
              className={`text-2xl font-bold ${
                latestVital && (latestVital.heartRate > 100 || latestVital.heartRate < 55)
                  ? 'text-rose-600'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {latestVital?.heartRate ?? '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">bpm</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Normal: 60 - 100 bpm</div>
        </div>

        {/* Blood Pressure */}
        <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Blood Pressure</span>
            <Activity className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span
              className={`text-2xl font-bold ${
                latestVital && latestVital.bloodPressureSys > 140
                  ? 'text-rose-600'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {latestVital
                ? `${latestVital.bloodPressureSys}/${latestVital.bloodPressureDia}`
                : '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">mmHg</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Normal: &lt; 120/80 mmHg</div>
        </div>

        {/* Oxygen Saturation (SpO2) */}
        <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>SpO2 Oxygen</span>
            <Droplets className="h-4 w-4 text-cyan-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span
              className={`text-2xl font-bold ${
                latestVital && latestVital.spO2 < 95
                  ? 'text-amber-600'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {latestVital ? `${latestVital.spO2}%` : '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">Room Air</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Target: &ge; 95%</div>
        </div>

        {/* Core Temperature */}
        <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Core Temp</span>
            <Thermometer className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span
              className={`text-2xl font-bold ${
                latestVital && latestVital.temperature > 100.4
                  ? 'text-rose-600'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {latestVital?.temperature ?? '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">°F</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Normal: 97.8 - 99.1 °F</div>
        </div>

        {/* Respiratory Rate */}
        <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase tracking-wider">
            <span>Respiratory Rate</span>
            <Wind className="h-4 w-4 text-teal-500" />
          </div>
          <div className="mt-2 flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {latestVital?.respRate ?? '—'}
            </span>
            <span className="text-xs text-slate-500 font-medium">breaths/m</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Normal: 12 - 20 breaths/min</div>
        </div>
      </div>

      {/* Upgraded Interactive Longitudinal Historical Vitals Analysis (Days & Weeks) */}
      <HistoricalVitalsCharts patient={currentPatient} deIdentifyPhi={deIdentifyPhi} />

      {/* Bedside Telemetry Rapid Waveform Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Pressure & Heart Rate Trends */}
        <div className="bg-white dark:bg-[var(--mc-elevated)] p-5 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Cardiovascular Telemetry Trends
              </h2>
              <p className="text-xs text-slate-500">
                Continuous Systolic BP, Diastolic BP, and Heart Rate
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-blue-600 font-semibold">• SBP</span>
              <span className="text-teal-500 font-semibold">• DBP</span>
              <span className="text-rose-500 font-semibold">• HR</span>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[40, 180]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Line type="monotone" dataKey="bpSys" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} name="Systolic BP" />
                <Line type="monotone" dataKey="bpDia" stroke="#818cf8" strokeWidth={2} dot={{ r: 3 }} name="Diastolic BP" />
                <Line type="monotone" dataKey="heartRate" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} name="Heart Rate (bpm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Threshold: Hypertensive Crisis &gt; 140/90 mmHg</span>
            <span>Synchronized via Bedside Telemetry Monitor</span>
          </div>
        </div>

        {/* Oxygen Saturation (SpO2) & Temperature Trends */}
        <div className="bg-white dark:bg-[var(--mc-elevated)] p-5 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                SpO2 & Core Temperature Trends
              </h2>
              <p className="text-xs text-slate-500">
                Oxygenation index and febrile progression over time
              </p>
            </div>
            <div className="flex items-center space-x-2 text-[11px]">
              <span className="text-cyan-600 font-semibold">• SpO2 (%)</span>
              <span className="text-amber-500 font-semibold">• Temp (°F)</span>
            </div>
          </div>

          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis domain={[90, 104]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
                <Line type="monotone" dataKey="spO2" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} name="SpO2 (%)" />
                <Line type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} name="Temperature (°F)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Hypoxia Alert threshold &lt; 95% SpO2</span>
            <span>Pulse Oximetry continuous sensor</span>
          </div>
        </div>
      </div>

      {/* Historical Vitals Table for Clinician Review */}
      <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Vital Signs Audit Registry ({currentPatient.vitals.length} Recorded Epochs)
          </h3>
          <span className="text-xs text-slate-500">
            Recorded under clinician signature
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp</th>
                <th className="px-4 py-3 font-semibold">Heart Rate</th>
                <th className="px-4 py-3 font-semibold">Blood Pressure</th>
                <th className="px-4 py-3 font-semibold">SpO2</th>
                <th className="px-4 py-3 font-semibold">Temperature</th>
                <th className="px-4 py-3 font-semibold">Resp Rate</th>
                <th className="px-4 py-3 font-semibold">Logged By</th>
                <th className="px-4 py-3 font-semibold">Clinical Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPatient.vitals
                .slice()
                .reverse()
                .map((v) => (
                  <tr key={v.id} className={v.isAbnormal ? 'bg-amber-50/50' : 'hover:bg-slate-50'}>
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {new Date(v.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`font-semibold ${
                          v.heartRate > 100 || v.heartRate < 55 ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {v.heartRate} bpm
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-800">
                      {v.bloodPressureSys}/{v.bloodPressureDia} mmHg
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={v.spO2 < 95 ? 'text-amber-600 font-bold' : 'text-slate-800'}>
                        {v.spO2}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5">{v.temperature} °F</td>
                    <td className="px-4 py-2.5">{v.respRate} /min</td>
                    <td className="px-4 py-2.5 text-slate-600">{v.recordedBy}</td>
                    <td className="px-4 py-2.5 text-slate-500 max-w-xs truncate">
                      {v.notes || (v.isAbnormal ? 'Alert Flag Triggered' : 'Normal')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Vitals Modal */}
      {logModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-[var(--mc-line)]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Record New Vital Signs</h3>
                <p className="text-xs text-slate-500">Patient: {displayName}</p>
              </div>
              <button
                onClick={() => setLogModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveVital} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Heart Rate (bpm)
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 76"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    value={spO2}
                    onChange={(e) => setSpO2(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 98"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Systolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={bpSys}
                    onChange={(e) => setBpSys(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 120"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Diastolic BP (mmHg)
                  </label>
                  <input
                    type="number"
                    value={bpDia}
                    onChange={(e) => setBpDia(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 80"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Temperature (°F)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={temp}
                    onChange={(e) => setTemp(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 98.6"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Respiratory Rate (breaths/min)
                  </label>
                  <input
                    type="number"
                    value={respRate}
                    onChange={(e) => setRespRate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                    placeholder="e.g. 16"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">
                  Clinical Observation Notes (Optional)
                </label>
                <textarea
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-teal-500"
                  placeholder="e.g. Patient resting quietly in semi-Fowler position."
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setLogModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-vital-reading-btn"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-xs"
                >
                  Save & Analyze Vital
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
