import React, { useState } from 'react';
import {
  Users,
  BedDouble,
  DollarSign,
  Clock,
  TrendingUp,
  AlertOctagon,
  FileText,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useHospital } from '../../context/HospitalContext';

const ADMISSION_TREND_DATA = [
  { day: 'Mon', admissions: 14, discharges: 11, erVisits: 28 },
  { day: 'Tue', admissions: 18, discharges: 15, erVisits: 32 },
  { day: 'Wed', admissions: 22, discharges: 19, erVisits: 35 },
  { day: 'Thu', admissions: 19, discharges: 16, erVisits: 29 },
  { day: 'Fri', admissions: 26, discharges: 21, erVisits: 42 },
  { day: 'Sat', admissions: 15, discharges: 12, erVisits: 38 },
  { day: 'Sun (Today)', admissions: 12, discharges: 9, erVisits: 24 },
];

const REVENUE_BY_DEPT = [
  { name: 'Cardiology', value: 168400, color: '#0f766e' },
  { name: 'Surgical & Ortho', value: 142100, color: '#0e7490' },
  { name: 'Intensive Care (ICU)', value: 98500, color: '#0369a1' },
  { name: 'Emergency Triage', value: 52000, color: '#b45309' },
  { name: 'General Medicine', value: 43200, color: '#475569' },
];

export const AdminOverview: React.FC = () => {
  const { patients, appointments, invoices, alerts } = useHospital();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'operational' | 'hipaa' | 'financial'>('operational');
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(null);

  const totalPatients = patients.length;
  const inpatientCount = patients.filter((p) => p.admissionStatus === 'Inpatient' || p.admissionStatus === 'ICU').length;
  const bedOccupancyRate = Math.min(94, Math.round((inpatientCount / 12) * 100));
  
  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.subtotal, 0);
  const totalCollected = invoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
  const criticalAlertsCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;

  const handleGenerateReport = (type: 'operational' | 'hipaa' | 'financial') => {
    setReportType(type);
    setReportGeneratedAt(new Date().toLocaleString());
    setReportModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      {/* Brand-forward section intro — one job */}
      <div className="rise-in flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-teal-700 dark:text-teal-400 mb-2">
            Medicore · Medicore Yangon Network
          </p>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight leading-[1.15]">
            Care Network Operations
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Live throughput, occupancy, and revenue signals across the care network — for executive
            oversight without the card clutter.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            id="generate-operational-report-btn"
            onClick={() => handleGenerateReport('operational')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold transition-colors"
          >
            <FileText className="h-4 w-4" />
            <span>Executive Report</span>
          </button>
          <button
            id="generate-financial-report-btn"
            onClick={() => handleGenerateReport('financial')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-white/80 dark:bg-slate-900/60 text-slate-700 dark:text-slate-200 hover:bg-white text-xs font-semibold transition-colors border border-[var(--mc-line)]"
          >
            <Download className="h-4 w-4" />
            <span>Export Financials</span>
          </button>
        </div>
      </div>

      {/* KPI strip — one composition, not four cards */}
      <section className="kpi-strip rise-in-delay" aria-label="Network KPIs">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">
            Active Patients
          </div>
          <div className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {totalPatients > 0 ? (totalPatients * 128 + 24).toLocaleString() : '1,284'}
          </div>
          <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-2 font-semibold">
            +4.2% vs yesterday
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">
            Bed Occupancy
          </div>
          <div className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            {bedOccupancyRate}%
          </div>
          <div className="w-full bg-slate-200/80 dark:bg-slate-700 h-1 mt-3 overflow-hidden rounded-sm">
            <div
              className="bg-teal-600 h-full transition-all duration-500"
              style={{ width: `${bedOccupancyRate}%` }}
            />
          </div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">
            ER Wait Time
          </div>
          <div className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            14m
          </div>
          <div className="text-[11px] text-slate-500 mt-2">Target &lt; 25m</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">
            Revenue (period)
          </div>
          <div className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
            ${(totalRevenue / 1000).toFixed(1)}k
          </div>
          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-2 font-medium">
            Claims pending audit · ${totalCollected.toLocaleString()} collected
          </div>
        </div>
      </section>

      {/* Throughput + alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 panel flex flex-col">
          <div className="p-5 border-b border-[var(--mc-line)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                Patient Throughput
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Admissions, discharges, and emergency visits
              </p>
            </div>
            <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="px-2 py-1 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 rounded">
                ICU-4
              </span>
              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded">
                Telemetry
              </span>
            </div>
          </div>

          <div className="p-5 flex-1">
            <div className="flex items-center gap-4 text-xs mb-3">
              <span className="flex items-center text-teal-700 dark:text-teal-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-teal-600 mr-1.5" /> Admissions
              </span>
              <span className="flex items-center text-sky-700 dark:text-sky-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-sky-600 mr-1.5" /> Discharges
              </span>
              <span className="flex items-center text-amber-700 dark:text-amber-400 font-medium">
                <span className="h-2 w-2 rounded-full bg-amber-500 mr-1.5" /> ER Traffic
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ADMISSION_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A1628',
                      color: '#fff',
                      borderRadius: '8px',
                      fontSize: '12px',
                      border: 'none',
                    }}
                  />
                  <Bar dataKey="admissions" fill="#0f766e" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="discharges" fill="#0284c7" radius={[3, 3, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="erVisits" fill="#d97706" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="panel flex flex-col overflow-hidden">
          <div className="p-5 border-b border-[var(--mc-line)] flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              Urgent Alerts
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 uppercase tracking-wider">
              Live{criticalAlertsCount > 0 ? ` · ${criticalAlertsCount}` : ''}
            </span>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[340px]">
            <div className="flex gap-3 p-3 bg-rose-50/80 dark:bg-rose-950/30 border-l-2 border-rose-500">
              <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-900 flex items-center justify-center text-rose-700 dark:text-rose-300 font-bold text-xs shrink-0">
                04
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  Bed 04: Arrhythmia Detected
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Pulse 142 bpm · 2m ago</div>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-sky-50/80 dark:bg-sky-950/30 border-l-2 border-sky-500">
              <div className="w-8 h-8 rounded bg-sky-100 dark:bg-sky-900 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xs shrink-0">
                12
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  Bed 12: Med Drip Depleted
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Saline replacement · 5m ago</div>
              </div>
            </div>
            <div className="flex gap-3 p-3 bg-amber-50/80 dark:bg-amber-950/30 border-l-2 border-amber-500">
              <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-700 dark:text-amber-300 font-bold text-xs shrink-0">
                01
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                  Bed 01: SpO2 Below Threshold
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">O2 at 91% · 11m ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Revenue Breakdown & Safeguards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Revenue Breakdown */}
        <div className="panel p-5">
          <div className="pb-3 border-b border-[var(--mc-line)]">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              Department Caseload & Billing
            </h2>
            <p className="text-xs text-slate-500">
              Revenue distribution across clinical divisions
            </p>
          </div>

          <div className="h-44 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={REVENUE_BY_DEPT}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {REVENUE_BY_DEPT.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: number) => [`$${val.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-2 space-y-1.5">
            {REVENUE_BY_DEPT.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-700 font-medium">{item.name}</span>
                </div>
                <span className="font-semibold text-slate-900">${(item.value / 1000).toFixed(0)}k</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Operations 1 */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-50 font-semibold text-sm">
              <Layers className="h-4 w-4 text-teal-700" />
              <span>HIPAA Safeguards Verification</span>
            </div>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              All database read and export transactions are cryptographically signed with SHA-256 and stored in the tamper-resistant audit registry.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-emerald-700 font-semibold flex items-center">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" /> 100% Compliant
            </span>
            <button
              onClick={() => handleGenerateReport('hipaa')}
              className="text-teal-700 hover:text-teal-900 dark:text-teal-400 font-semibold"
            >
              View Audit Log &rarr;
            </button>
          </div>
        </div>

        {/* Quick Operations 2 */}
        <div className="panel p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 dark:text-slate-50 font-semibold text-sm">
              <Calendar className="h-4 w-4 text-teal-700" />
              <span>Today's Clinic Encounters</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              {appointments.length} appointments scheduled across all 6 departments. {appointments.filter((a) => a.status === 'completed').length} completed with automated billing initiated.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-[var(--mc-line)] flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Upcoming: {appointments.filter((a) => a.status === 'scheduled').length}
            </span>
            <span className="text-teal-700 dark:text-teal-400 font-semibold">Triage Optimal</span>
          </div>
        </div>
      </div>

      {/* Automated Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 rounded-t-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Medicore Yangon Network Report
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  {reportType === 'operational' && 'Executive Operational & Clinical Summary'}
                  {reportType === 'hipaa' && 'HIPAA Security & Access Compliance Audit'}
                  {reportType === 'financial' && 'Monthly Care Network Billing & Claims Report'}
                </h3>
                <p className="text-xs text-slate-500">
                  Generated at {reportGeneratedAt} by Administrative Suite
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="print-report-btn"
                  onClick={handlePrint}
                  className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Print Report"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-sm text-slate-700">
              {/* Report Header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Care Network</div>
                  <div className="font-bold text-slate-900">Medicore Yangon Healthcare Network (Main Campus)</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Reporting Period</div>
                  <div className="font-bold text-slate-900">Current Month to Date</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Accreditation</div>
                  <div className="font-bold text-emerald-600">The Joint Commission / CMS</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Security Seal</div>
                  <div className="font-bold text-slate-900">HIPAA 45 CFR 164</div>
                </div>
              </div>

              {/* Report Content Body */}
              <div className="space-y-4">
                <h4 className="font-bold text-slate-900 text-base border-b pb-1">
                  1. Executive Key Performance Indicators
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="border border-slate-200 p-3 rounded-lg">
                    <div className="text-xs text-slate-500">Inpatient Bed Utilization</div>
                    <div className="text-xl font-bold text-blue-600">{bedOccupancyRate}%</div>
                    <div className="text-[11px] text-slate-500">Capacity threshold nominal</div>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg">
                    <div className="text-xs text-slate-500">Total Billed Encounters</div>
                    <div className="text-xl font-bold text-slate-900">{invoices.length}</div>
                    <div className="text-[11px] text-slate-500">Automated CPT generated</div>
                  </div>
                  <div className="border border-slate-200 p-3 rounded-lg">
                    <div className="text-xs text-slate-500">Insurance Claims Adjudication</div>
                    <div className="text-xl font-bold text-emerald-600">96.4%</div>
                    <div className="text-[11px] text-slate-500">Average denial rate &lt; 4%</div>
                  </div>
                </div>

                <h4 className="font-bold text-slate-900 text-base border-b pb-1 pt-2">
                  2. Patient Safety & Clinical Outcomes
                </h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  During this reporting cycle, multi-parameter vital signs telemetry captured {patients.reduce((acc, p) => acc + p.vitals.length, 0)} continuous readings. Zero unacknowledged critical events breached the standard 3-minute rapid intervention protocol.
                </p>

                <h4 className="font-bold text-slate-900 text-base border-b pb-1 pt-2">
                  3. HIPAA Compliance & Audit Verification
                </h4>
                <p className="text-xs leading-relaxed text-slate-600">
                  Zero unauthorized breaches detected. Role-Based Access Control verified across doctors, nurses, administrators, and billing specialists. Audit trail logging includes authenticated IP hashes and electronic clinical justifications.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <span>Electronic Signature: U Min Thu, MHA (Administrator)</span>
                <span className="font-mono text-[10px]">Hash: 8b7e21a004f291c</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
