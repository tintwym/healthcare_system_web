import React, { useMemo, useState } from 'react';
import {
  Users,
  Calendar,
  Stethoscope,
  CheckCircle2,
  TrendingUp,
  FileText,
  Download,
  Printer,
  BedDouble,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useHospital } from '../../context/HospitalContext';

const VISIT_TREND = [
  { month: 'Jan', visits: 1180 },
  { month: 'Feb', visits: 1320 },
  { month: 'Mar', visits: 1410 },
  { month: 'Apr', visits: 1280 },
  { month: 'May', visits: 1560 },
  { month: 'Jun', visits: 1680 },
  { month: 'Jul', visits: 1842 },
  { month: 'Aug', visits: 1720 },
  { month: 'Sep', visits: 1590 },
  { month: 'Oct', visits: 1650 },
  { month: 'Nov', visits: 1480 },
  { month: 'Dec', visits: 1380 },
];

const TOTAL_BEDS = 400;

function statusBadge(status: string) {
  switch (status) {
    case 'Inpatient':
      return 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300';
    case 'ICU':
      return 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
    case 'Emergency':
      return 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-300';
    case 'Discharged':
      return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
    default:
      return 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300';
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'Inpatient':
      return 'Under Care';
    case 'ICU':
      return 'Critical';
    case 'Emergency':
      return 'Emergency';
    case 'Discharged':
      return 'Recovering';
    default:
      return 'Stable';
  }
}

function apptTypeBadge(type: string) {
  if (type.includes('Follow')) return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300';
  if (type.includes('Emergency') || type.includes('Post-Op'))
    return 'bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300';
  if (type.includes('Cardiology') || type.includes('Diagnostic'))
    return 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300';
  return 'bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300';
}

function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = ((h + 11) % 12) + 1;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${ampm}`;
}

function greetingForHour(hour: number) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

export const AdminOverview: React.FC = () => {
  const { patients, appointments, invoices, alerts, users } = useHospital();
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'operational' | 'hipaa' | 'financial'>('operational');
  const [reportGeneratedAt, setReportGeneratedAt] = useState<string | null>(null);
  const [range, setRange] = useState<'mtd' | '30d' | '90d'>('mtd');

  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const todayIso = now.toISOString().slice(0, 10);

  const rangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    if (range === 'mtd') start.setDate(1);
    else if (range === '30d') start.setDate(start.getDate() - 29);
    else start.setDate(start.getDate() - 89);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }, [range]);

  const totalPatientsDisplay =
    patients.length > 0 ? patients.length * 128 + 24 : 12480;
  const appointmentCount = appointments.length > 0 ? appointments.length * 97 + 41 : 2941;
  const activeDoctors = users.filter((u) => u.role === 'doctor').length || 186;
  const treatmentsDone =
    appointments.filter((a) => a.status === 'completed').length * 48 + 320 || 4320;

  const occupiedBeds = Math.min(
    TOTAL_BEDS,
    Math.max(
      1,
      patients.filter((p) => p.admissionStatus === 'Inpatient' || p.admissionStatus === 'ICU').length *
        26
    )
  );
  const bedOccupancyRate = Math.round((occupiedBeds / TOTAL_BEDS) * 100);
  const availableBeds = TOTAL_BEDS - occupiedBeds;

  const bedDonut = [
    { name: 'Occupied', value: occupiedBeds, color: '#0f766e' },
    { name: 'Available', value: availableBeds, color: '#99f6e4' },
  ];

  const outcomes = useMemo(() => {
    const successful = patients.filter((p) => p.admissionStatus === 'Discharged' || p.admissionStatus === 'Outpatient').length;
    const underCare = patients.filter((p) => p.admissionStatus === 'Inpatient' || p.admissionStatus === 'Emergency').length;
    const complications = patients.filter((p) => p.admissionStatus === 'ICU').length;
    const s = Math.max(successful, 1) * 18;
    const u = Math.max(underCare, 1) * 6;
    const c = Math.max(complications, 1) * 2;
    const total = s + u + c;
    return {
      rate: Math.round((s / total) * 100),
      slices: [
        { name: 'Successful', value: s, color: '#0f766e' },
        { name: 'Under Treatment', value: u, color: '#14b8a6' },
        { name: 'Complications', value: c, color: '#e11d48' },
      ],
    };
  }, [patients]);

  const deptPerformance = useMemo(() => {
    const counts = new Map<string, number>();
    patients.forEach((p) => {
      const d = p.department || 'General Medicine';
      counts.set(d, (counts.get(d) || 0) + 1);
    });
    const waitByDept: Record<string, number> = {
      'General Medicine': 18,
      Cardiology: 22,
      Orthopedics: 15,
      Pediatrics: 12,
      Emergency: 9,
      Endocrinology: 20,
      Neurology: 19,
    };
    const satisfactionByDept: Record<string, number> = {
      'General Medicine': 92,
      Cardiology: 95,
      Orthopedics: 89,
      Pediatrics: 96,
      Emergency: 84,
      Endocrinology: 91,
      Neurology: 88,
    };
    const rows = [...counts.entries()]
      .map(([name, patientCount]) => ({
        name,
        patients: patientCount * 42 + 80,
        wait: waitByDept[name] ?? 16,
        satisfaction: satisfactionByDept[name] ?? 90,
      }))
      .sort((a, b) => b.patients - a.patients)
      .slice(0, 5);

    if (rows.length === 0) {
      return [
        { name: 'General Medicine', patients: 420, wait: 18, satisfaction: 92 },
        { name: 'Cardiology', patients: 312, wait: 22, satisfaction: 95 },
        { name: 'Orthopedics', patients: 268, wait: 15, satisfaction: 89 },
        { name: 'Pediatrics', patients: 241, wait: 12, satisfaction: 96 },
        { name: 'Emergency', patients: 198, wait: 9, satisfaction: 84 },
      ];
    }
    return rows;
  }, [patients]);

  const recentAdmissions = useMemo(() => {
    return [...patients]
      .filter((p) => p.admissionDate || p.admissionStatus !== 'Outpatient')
      .sort((a, b) => (b.admissionDate || '').localeCompare(a.admissionDate || ''))
      .slice(0, 5);
  }, [patients]);

  const todaysSchedule = useMemo(() => {
    const todays = appointments
      .filter((a) => a.date === todayIso && a.status !== 'cancelled')
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 5);
    if (todays.length > 0) return todays;
    return appointments.filter((a) => a.status === 'scheduled').slice(0, 5);
  }, [appointments, todayIso]);

  const totalRevenue = invoices.reduce((acc, inv) => acc + inv.subtotal, 0);
  const criticalAlertsCount = alerts.filter((a) => !a.acknowledged && a.severity === 'critical').length;

  const handleGenerateReport = (type: 'operational' | 'hipaa' | 'financial') => {
    setReportType(type);
    setReportGeneratedAt(new Date().toLocaleString());
    setReportModalOpen(true);
  };

  const kpiCards = [
    {
      label: 'Total Patients',
      value: totalPatientsDisplay.toLocaleString(),
      trend: '+12.5%',
      icon: Users,
      hint: 'vs last month',
    },
    {
      label: 'Appointments',
      value: appointmentCount.toLocaleString(),
      trend: '+8.3%',
      icon: Calendar,
      hint: 'vs last month',
    },
    {
      label: 'Active Doctors',
      value: String(activeDoctors),
      trend: '+6.1%',
      icon: Stethoscope,
      hint: 'vs last month',
    },
    {
      label: 'Treatments Completed',
      value: treatmentsDone.toLocaleString(),
      trend: '+14.8%',
      icon: CheckCircle2,
      hint: 'vs last month',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Greeting + range — one calm header */}
      <div className="rise-in flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tracking-tight">
            {greeting}. Here&apos;s your hospital overview
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Track patient care, operations, and performance in real time.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <label className="sr-only" htmlFor="overview-range">
            Date range
          </label>
          <select
            id="overview-range"
            value={range}
            onChange={(e) => setRange(e.target.value as 'mtd' | '30d' | '90d')}
            className="pl-3 pr-9 py-2 text-xs font-medium rounded-xl border border-[var(--mc-line)] bg-[var(--mc-elevated)] text-slate-700 dark:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
          >
            <option value="mtd">Month to date · {rangeLabel}</option>
            <option value="30d">Last 30 days · {rangeLabel}</option>
            <option value="90d">Last 90 days · {rangeLabel}</option>
          </select>
          <button
            type="button"
            onClick={() => handleGenerateReport('operational')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-teal-800 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 transition-colors"
            title="Executive report"
          >
            <FileText className="h-3.5 w-3.5" />
            Report
          </button>
        </div>
      </div>

      {/* Four KPI cards */}
      <section
        className="rise-in-delay grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
        aria-label="Network KPIs"
      >
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="panel p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {kpi.label}
                  </p>
                  <p className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums tracking-tight">
                    {kpi.value}
                  </p>
                  <p className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="h-3 w-3" />
                    {kpi.trend}
                    <span className="font-medium text-slate-400 dark:text-slate-500">
                      {kpi.hint}
                    </span>
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Visits chart + bed occupancy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 panel flex flex-col">
          <div className="px-5 pt-5 pb-2 flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                Patient visits
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Visit volume across the care network</p>
            </div>
            <button
              type="button"
              className="text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline"
              onClick={() => handleGenerateReport('operational')}
            >
              View all
            </button>
          </div>
          <div className="px-2 pb-4 h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VISIT_TREND} margin={{ top: 12, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f766e" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#0f766e" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--mc-line)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0a1628',
                    color: '#fff',
                    borderRadius: '10px',
                    fontSize: '12px',
                    border: 'none',
                  }}
                  formatter={(val: number) => [val.toLocaleString(), 'Visits']}
                />
                <Area
                  type="monotone"
                  dataKey="visits"
                  stroke="#0f766e"
                  strokeWidth={2.5}
                  fill="url(#visitsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              Bed occupancy
            </h2>
            <BedDouble className="h-4 w-4 text-teal-700 dark:text-teal-400" />
          </div>
          <p className="text-xs text-slate-500 mb-2">
            {occupiedBeds} / {TOTAL_BEDS} beds in use
          </p>
          <div className="relative flex-1 min-h-[180px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={bedDonut}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {bedDonut.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-3xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                {bedOccupancyRate}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Occupied
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-700" /> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-teal-200" /> Available
            </span>
          </div>
        </div>
      </div>

      {/* Department performance + treatment outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 panel overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                Department performance
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Caseload, wait time, satisfaction</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-y border-[var(--mc-line)]">
                  <th className="px-5 py-2.5 font-bold">Department</th>
                  <th className="px-3 py-2.5 font-bold">Patients</th>
                  <th className="px-3 py-2.5 font-bold">Avg wait</th>
                  <th className="px-5 py-2.5 font-bold min-w-[140px]">Satisfaction</th>
                </tr>
              </thead>
              <tbody>
                {deptPerformance.map((row) => (
                  <tr
                    key={row.name}
                    className="border-b border-[var(--mc-line)] last:border-0 text-slate-700 dark:text-slate-200"
                  >
                    <td className="px-5 py-3 font-semibold text-slate-900 dark:text-slate-50">
                      {row.name}
                    </td>
                    <td className="px-3 py-3 tabular-nums">{row.patients.toLocaleString()}</td>
                    <td className="px-3 py-3 tabular-nums text-slate-500">{row.wait} min</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-teal-600"
                            style={{ width: `${row.satisfaction}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums w-8">
                          {row.satisfaction}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel p-5 flex flex-col">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
            Treatment outcomes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-2">Network clinical result mix</p>
          <div className="relative flex-1 min-h-[160px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={outcomes.slices}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {outcomes.slices.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-50 tabular-nums">
                {outcomes.rate}%
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-500 text-center px-6">
                Successful
              </span>
            </div>
          </div>
          <ul className="space-y-1.5 mt-1">
            {outcomes.slices.map((s) => (
              <li key={s.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
              </li>
            ))}
          </ul>
          {criticalAlertsCount > 0 && (
            <p className="mt-3 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
              {criticalAlertsCount} critical alert{criticalAlertsCount === 1 ? '' : 's'} need review
            </p>
          )}
        </div>
      </div>

      {/* Recent admissions + today's schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="panel overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              Recent admissions
            </h2>
            <span className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
              Live
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-slate-500 border-y border-[var(--mc-line)]">
                  <th className="px-5 py-2.5 font-bold">Patient</th>
                  <th className="px-3 py-2.5 font-bold">Age</th>
                  <th className="px-3 py-2.5 font-bold">Dept</th>
                  <th className="px-5 py-2.5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentAdmissions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-500 text-xs">
                      No recent admissions in this view.
                    </td>
                  </tr>
                )}
                {recentAdmissions.map((p) => {
                  const initials = `${p.firstName[0] || ''}${p.lastName[0] || ''}`.toUpperCase();
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-[var(--mc-line)] last:border-0 text-slate-700 dark:text-slate-200"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                            {initials}
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-slate-50 truncate">
                              {p.firstName} {p.lastName}
                            </p>
                            <p className="text-[10px] text-slate-500">{p.admissionDate || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 tabular-nums">{p.age}</td>
                      <td className="px-3 py-3 text-xs text-slate-500 max-w-[7rem] truncate">
                        {p.department}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadge(p.admissionStatus)}`}
                        >
                          {statusLabel(p.admissionStatus)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              Today&apos;s doctor schedule
            </h2>
            <span className="text-[11px] text-slate-500 font-medium">
              {todaysSchedule.length} slots
            </span>
          </div>
          <ul className="divide-y divide-[var(--mc-line)]">
            {todaysSchedule.length === 0 && (
              <li className="px-5 py-8 text-center text-slate-500 text-xs">
                No appointments scheduled for today.
              </li>
            )}
            {todaysSchedule.map((a) => {
              const docInitials = a.doctorName
                .replace(/^Dr\.\s*/i, '')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              return (
                <li key={a.id} className="px-5 py-3 flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-500 w-16 shrink-0 tabular-nums">
                    {formatTime(a.time)}
                  </span>
                  <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {docInitials}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {a.doctorName}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">{a.department}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${apptTypeBadge(a.type)}`}
                  >
                    {a.type.includes('Follow')
                      ? 'Follow-up'
                      : a.type.includes('Emergency')
                        ? 'Triage'
                        : a.type.includes('Cardiology')
                          ? 'Consult'
                          : 'Visit'}
                  </span>
                </li>
              );
            })}
          </ul>
          <div className="px-5 py-3 border-t border-[var(--mc-line)] flex justify-end">
            <button
              type="button"
              onClick={() => handleGenerateReport('financial')}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-teal-700 dark:text-teal-400 hover:underline"
            >
              <Download className="h-3 w-3" />
              Export financials
            </button>
          </div>
        </div>
      </div>

      {reportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80 rounded-t-xl">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Medicore Yangon Network Report
                </span>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  {reportType === 'operational' && 'Executive Operational & Clinical Summary'}
                  {reportType === 'hipaa' && 'HIPAA Security & Access Compliance Audit'}
                  {reportType === 'financial' && 'Monthly Care Network Billing & Claims Report'}
                </h3>
                <p className="text-xs text-slate-500">
                  Generated at {reportGeneratedAt} · {rangeLabel}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="print-report-btn"
                  onClick={() => window.print()}
                  className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                  title="Print Report"
                >
                  <Printer className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setReportModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 text-sm text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Care Network</div>
                  <div className="font-bold text-slate-900 dark:text-slate-50">Medicore Yangon</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Period</div>
                  <div className="font-bold text-slate-900 dark:text-slate-50">{rangeLabel}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Bed occupancy</div>
                  <div className="font-bold text-teal-700 dark:text-teal-400">{bedOccupancyRate}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Billed</div>
                  <div className="font-bold text-slate-900 dark:text-slate-50">
                    ${(totalRevenue / 1000).toFixed(1)}k
                  </div>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                Multi-parameter telemetry and appointment throughput for this period. Role-based access
                and audit logging remain enforced across clinical and billing workflows.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
