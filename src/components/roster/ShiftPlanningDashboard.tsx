import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Filter,
  Check,
  X,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Activity,
  ArrowRightLeft,
  Trash2,
  Edit3,
  Info,
  CalendarCheck,
  Percent,
  Search,
  CheckCheck,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { Shift, ShiftType, TimeOffRequest } from '../../types';
import { DEPARTMENT_STAFFING_REQUIREMENTS } from '../../data/staffAndRosterData';
import { McSelect } from '../ui/McSelect';

export const ShiftPlanningDashboard: React.FC = () => {
  const {
    currentUser,
    staffMembers,
    shifts,
    timeOffRequests,
    addShift,
    updateShift,
    deleteShift,
    autoGenerateRoster,
    reviewTimeOffRequest,
    requestTimeOff,
    logAudit,
  } = useHospital();

  // Active department filter (defaults to current user's department or Emergency Department)
  const [selectedDept, setSelectedDept] = useState<string>('Emergency Department (ED)');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-03'); // Anchor date matching clinical records
  const [viewMode, setViewMode] = useState<'roster' | 'timeoff' | 'density-report'>('roster');

  // Modal States
  const [addShiftModalOpen, setAddShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [autoRosterModalOpen, setAutoRosterModalOpen] = useState(false);
  const [timeOffRejectModalOpen, setTimeOffRejectModalOpen] = useState(false);
  const [ptoRequestModalOpen, setPtoRequestModalOpen] = useState(false);
  const [selectedTimeOff, setSelectedTimeOff] = useState<TimeOffRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Form State for Adding/Editing Shift
  const [formStaffId, setFormStaffId] = useState('');
  const [formDate, setFormDate] = useState(selectedDate);
  const [formShiftType, setFormShiftType] = useState<ShiftType>('Day');
  const [formStartTime, setFormStartTime] = useState('07:00');
  const [formEndTime, setFormEndTime] = useState('15:30');
  const [formUnitLocation, setFormUnitLocation] = useState('Main Station');
  const [formIsLead, setFormIsLead] = useState(false);

  // PTO request form
  const [ptoStaffId, setPtoStaffId] = useState('');
  const [ptoStartDate, setPtoStartDate] = useState(selectedDate);
  const [ptoEndDate, setPtoEndDate] = useState(selectedDate);
  const [ptoReason, setPtoReason] = useState<TimeOffRequest['reason']>('Vacation');

  const shiftLocalDate = (isoDate: string, deltaDays: number) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + deltaDays);
    const yy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, '0');
    const dd = String(next.getDate()).padStart(2, '0');
    return `${yy}-${mm}-${dd}`;
  };

  // Filtered lists
  const departmentList = Object.keys(DEPARTMENT_STAFFING_REQUIREMENTS);
  const deptStaff = useMemo(
    () => staffMembers.filter((s) => s.department === selectedDept),
    [staffMembers, selectedDept]
  );

  const deptShiftsOnDate = useMemo(
    () => shifts.filter((s) => s.department === selectedDept && s.date === selectedDate),
    [shifts, selectedDept, selectedDate]
  );

  // Staffing requirements for selected department
  const staffingReq = DEPARTMENT_STAFFING_REQUIREMENTS[selectedDept] || {
    department: selectedDept,
    targetNurseToPatientRatio: '1:4',
    minDayStaff: 5,
    minEveningStaff: 4,
    minNightStaff: 3,
    minDoctors: 1,
    minNurses: 3,
  };

  // Coverage Density Calculations
  const dayShifts = deptShiftsOnDate.filter((s) => s.shiftType === 'Day');
  const eveningShifts = deptShiftsOnDate.filter((s) => s.shiftType === 'Evening');
  const nightShifts = deptShiftsOnDate.filter((s) => s.shiftType === 'Night');
  const onCallShifts = deptShiftsOnDate.filter((s) => s.shiftType === 'On-Call');

  const doctorCount = deptShiftsOnDate.filter((s) => s.staffRole === 'doctor').length;
  const nurseCount = deptShiftsOnDate.filter((s) => s.staffRole === 'nurse').length;

  const dayCoveragePct = Math.round((dayShifts.length / Math.max(1, staffingReq.minDayStaff)) * 100);
  const eveningCoveragePct = Math.round((eveningShifts.length / Math.max(1, staffingReq.minEveningStaff)) * 100);
  const nightCoveragePct = Math.round((nightShifts.length / Math.max(1, staffingReq.minNightStaff)) * 100);

  const totalAssignedStaff = deptShiftsOnDate.length;
  const totalRequiredStaff = staffingReq.minDayStaff + staffingReq.minEveningStaff + staffingReq.minNightStaff;
  const overallCoveragePct = Math.round((totalAssignedStaff / Math.max(1, totalRequiredStaff)) * 100);

  // Time-off requests for this department
  const deptTimeOffRequests = useMemo(
    () => timeOffRequests.filter((t) => t.department === selectedDept),
    [timeOffRequests, selectedDept]
  );

  const pendingTimeOffCount = deptTimeOffRequests.filter((t) => t.status === 'pending').length;

  // Helpers
  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handlePrevDay = () => {
    setSelectedDate(shiftLocalDate(selectedDate, -1));
  };

  const handleNextDay = () => {
    setSelectedDate(shiftLocalDate(selectedDate, 1));
  };

  const handleOpenAddShift = () => {
    setEditingShift(null);
    setFormStaffId(deptStaff[0]?.id || '');
    setFormDate(selectedDate);
    setFormShiftType('Day');
    setFormStartTime('07:00');
    setFormEndTime('15:30');
    setFormUnitLocation('Triage / Main Station');
    setFormIsLead(false);
    setAddShiftModalOpen(true);
  };

  const handleEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setFormStaffId(shift.staffId);
    setFormDate(shift.date);
    setFormShiftType(shift.shiftType);
    setFormStartTime(shift.startTime);
    setFormEndTime(shift.endTime);
    setFormUnitLocation(shift.unitLocation || 'Main Station');
    setFormIsLead(!!shift.isLead);
    setAddShiftModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffMembers.find((s) => s.id === formStaffId);
    if (!staff) return;

    if (editingShift) {
      updateShift(editingShift.id, {
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        department: selectedDept,
        date: formDate,
        shiftType: formShiftType,
        startTime: formStartTime,
        endTime: formEndTime,
        unitLocation: formUnitLocation,
        isLead: formIsLead,
      });
      showToast(`Shift updated for ${staff.name}`);
    } else {
      addShift({
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        department: selectedDept,
        date: formDate,
        shiftType: formShiftType,
        startTime: formStartTime,
        endTime: formEndTime,
        status: 'scheduled',
        isLead: formIsLead,
        unitLocation: formUnitLocation,
      });
      showToast(`Shift assigned to ${staff.name}`);
    }

    setAddShiftModalOpen(false);
  };

  const handleDeleteShift = (id: string, staffName: string) => {
    if (window.confirm(`Remove scheduled shift for ${staffName}?`)) {
      deleteShift(id);
      showToast(`Shift removed for ${staffName}`);
    }
  };

  const handleRunAutoRoster = () => {
    autoGenerateRoster(selectedDept, selectedDate, 7);
    setAutoRosterModalOpen(false);
    showToast(`Weekly roster automated for ${selectedDept} starting ${selectedDate}`);
  };

  const handleApprovePTO = (request: TimeOffRequest) => {
    reviewTimeOffRequest(request.id, 'approved', `Approved by ${currentUser.name}`);
    showToast(`Approved time-off request for ${request.staffName}`);
  };

  const handleOpenRejectPTO = (request: TimeOffRequest) => {
    setSelectedTimeOff(request);
    setRejectionReason('Department coverage minimum would be breached on requested dates.');
    setTimeOffRejectModalOpen(true);
  };

  const handleConfirmRejectPTO = () => {
    if (!selectedTimeOff) return;
    reviewTimeOffRequest(selectedTimeOff.id, 'rejected', rejectionReason);
    setTimeOffRejectModalOpen(false);
    setSelectedTimeOff(null);
    showToast(`Rejected time-off request with clinical lead review notes.`);
  };

  const handleSubmitPtoRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = staffMembers.find((s) => s.id === ptoStaffId);
    if (!staff || !ptoStartDate || !ptoEndDate) return;
    if (ptoEndDate < ptoStartDate) {
      showToast('End date must be on or after start date');
      return;
    }
    requestTimeOff({
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      department: selectedDept,
      startDate: ptoStartDate,
      endDate: ptoEndDate,
      reason: ptoReason,
    });
    setPtoRequestModalOpen(false);
    showToast(`PTO request submitted for ${staff.name}`);
  };

  const getCoverageColor = (pct: number) => {
    if (pct >= 100) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (pct >= 75) return 'text-amber-700 bg-amber-50 border-amber-200';
    return 'text-rose-700 bg-rose-50 border-rose-200';
  };

  const getCoverageBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 75) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  return (
    <div className="space-y-6">
      {/* Toast feedback */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner & Control Deck */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-700 shrink-0">
              <CalendarCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">
                  Department Shift Planning & Staff Rostering
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Lead Management Deck
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                Automated clinical staff scheduling, density monitoring against minimum nurse-to-patient mandates, and real-time time-off workflow adjudication.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="auto-generate-roster-btn"
              onClick={() => setAutoRosterModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              <span>Auto-Roster Week</span>
            </button>
            <button
              id="add-manual-shift-btn"
              onClick={handleOpenAddShift}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Add Shift</span>
            </button>
          </div>
        </div>

        {/* Filters Deck: Department & Date */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-5 pt-5 border-t border-slate-100">
          <div className="md:col-span-6 flex flex-col sm:flex-row items-start sm:items-center gap-2 min-w-0">
            <label
              htmlFor="roster-department-select"
              className="text-xs font-bold text-slate-600 dark:text-slate-300 shrink-0"
            >
              Department Unit:
            </label>
            <McSelect
              id="roster-department-select"
              value={selectedDept}
              onChange={setSelectedDept}
              options={departmentList.map((dept) => ({ value: dept, label: dept }))}
              className="w-full sm:w-auto sm:min-w-[17.5rem] sm:flex-1"
              aria-label="Department unit"
            />
          </div>

          <div className="md:col-span-6 flex items-center justify-between sm:justify-end space-x-2">
            <span className="text-xs font-bold text-slate-600">Date:</span>
            <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg p-1">
              <button
                onClick={handlePrevDay}
                className="p-1 rounded hover:bg-slate-200 text-slate-600"
                title="Previous Day"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:outline-hidden"
              />
              <button
                onClick={handleNextDay}
                className="p-1 rounded hover:bg-slate-200 text-slate-600"
                title="Next Day"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setSelectedDate('2026-09-03')}
                className="px-2 py-0.5 text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 rounded"
              >
                Today
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Shift Coverage Density & Acuity KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Overall Coverage Density */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">
              Shift Coverage Density
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCoverageColor(
                overallCoveragePct
              )}`}
            >
              {overallCoveragePct}% Target
            </span>
          </div>
          <div className="flex items-baseline space-x-2 mt-2">
            <span className="text-2xl font-bold text-slate-900">{totalAssignedStaff}</span>
            <span className="text-xs text-slate-500 font-medium">
              / {totalRequiredStaff} minimum clinical staff
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getCoverageBarColor(
                overallCoveragePct
              )}`}
              style={{ width: `${Math.min(100, overallCoveragePct)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-400 mt-2 flex justify-between">
            <span>Minimum: {totalRequiredStaff} needed</span>
            <span>{overallCoveragePct >= 100 ? 'Fully Compliant' : 'Density Shortfall'}</span>
          </div>
        </div>

        {/* Metric 2: Day Shift Coverage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Day Shift (07-15:30)</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getCoverageColor(
                dayCoveragePct
              )}`}
            >
              {dayShifts.length}/{staffingReq.minDayStaff}
            </span>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {dayShifts.length}{' '}
            <span className="text-xs font-normal text-slate-500">assigned</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full ${getCoverageBarColor(dayCoveragePct)}`}
              style={{ width: `${Math.min(100, dayCoveragePct)}%` }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center justify-between">
            <span>Min Req: {staffingReq.minDayStaff} staff</span>
            <span className="font-semibold text-slate-700">{dayCoveragePct}% density</span>
          </div>
        </div>

        {/* Metric 3: Evening & Night Coverage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Evening & Night</span>
            <div className="flex space-x-1">
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getCoverageColor(eveningCoveragePct)}`}>
                Eve {eveningShifts.length}/{staffingReq.minEveningStaff}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getCoverageColor(nightCoveragePct)}`}>
                Noc {nightShifts.length}/{staffingReq.minNightStaff}
              </span>
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {eveningShifts.length + nightShifts.length}{' '}
            <span className="text-xs font-normal text-slate-500">after-hours</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full ${getCoverageBarColor(
                Math.round(
                  ((eveningShifts.length + nightShifts.length) /
                    Math.max(1, staffingReq.minEveningStaff + staffingReq.minNightStaff)) *
                    100
                )
              )}`}
              style={{
                width: `${Math.min(
                  100,
                  Math.round(
                    ((eveningShifts.length + nightShifts.length) /
                      Math.max(1, staffingReq.minEveningStaff + staffingReq.minNightStaff)) *
                      100
                  )
                )}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex justify-between">
            <span>On-Call Pool: {onCallShifts.length} active</span>
            <span className="font-semibold text-slate-700">Night Safe</span>
          </div>
        </div>

        {/* Metric 4: Mandated Ratio & Role Mix */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase text-slate-500">Acuity & Mandates</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">
              State Ratio
            </span>
          </div>
          <div className="mt-2 text-xs font-bold text-slate-800">
            {staffingReq.targetNurseToPatientRatio}
          </div>
          <div className="flex items-center space-x-3 mt-3 pt-2 border-t border-slate-100 text-xs font-semibold">
            <span className="flex items-center space-x-1 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>MDs: {doctorCount}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (req {staffingReq.minDoctors})
              </span>
            </span>
            <span className="flex items-center space-x-1 text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>RNs: {nurseCount}</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (req {staffingReq.minNurses})
              </span>
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            {nurseCount >= staffingReq.minNurses ? (
              <span className="text-emerald-600 font-medium">✓ Acuity staffing satisfied</span>
            ) : (
              <span className="text-rose-600 font-medium">⚠ Short on registered nursing</span>
            )}
          </div>
        </div>
      </div>

      {/* Sub-Nav View Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          id="view-tab-roster"
          onClick={() => setViewMode('roster')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'roster'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Active Roster Schedule ({deptShiftsOnDate.length} Shifts)</span>
        </button>

        <button
          id="view-tab-timeoff"
          onClick={() => setViewMode('timeoff')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'timeoff'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="h-4 w-4" />
          <span>Time-Off Requests ({deptTimeOffRequests.length})</span>
          {pendingTimeOffCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
              {pendingTimeOffCount} Pending
            </span>
          )}
        </button>

        <button
          id="view-tab-density-report"
          onClick={() => setViewMode('density-report')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            viewMode === 'density-report'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Coverage Density Matrix</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: ACTIVE ROSTER SCHEDULE */}
      {/* ======================================================== */}
      {viewMode === 'roster' && (
        <div className="space-y-4">
          {/* Shift Type Buckets */}
          {(['Day', 'Evening', 'Night', 'On-Call'] as ShiftType[]).map((st) => {
            const shiftsInBucket = deptShiftsOnDate.filter((s) => s.shiftType === st);
            const isUnderstaffed =
              st === 'Day'
                ? shiftsInBucket.length < staffingReq.minDayStaff
                : st === 'Evening'
                ? shiftsInBucket.length < staffingReq.minEveningStaff
                : st === 'Night'
                ? shiftsInBucket.length < staffingReq.minNightStaff
                : false;

            const timeLabel =
              st === 'Day'
                ? '07:00 – 15:30'
                : st === 'Evening'
                ? '15:00 – 23:30'
                : st === 'Night'
                ? '23:00 – 07:30'
                : 'Standby / Immediate Recall';

            return (
              <div key={st} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-3 h-3 rounded-full ${
                        st === 'Day'
                          ? 'bg-amber-400'
                          : st === 'Evening'
                          ? 'bg-indigo-400'
                          : st === 'Night'
                          ? 'bg-purple-600'
                          : 'bg-emerald-500'
                      }`}
                    />
                    <h3 className="font-bold text-sm text-slate-900">{st} Shift</h3>
                    <span className="text-xs text-slate-500 font-mono">({timeLabel})</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-slate-600">
                      Rostered: <strong className="text-slate-900">{shiftsInBucket.length}</strong>
                    </span>
                    {isUnderstaffed && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Coverage Alert: Below Minimum</span>
                      </span>
                    )}
                    {!isUnderstaffed && shiftsInBucket.length > 0 && (
                      <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                        <Check className="h-3 w-3" />
                        <span>Staffed</span>
                      </span>
                    )}
                  </div>
                </div>

                {shiftsInBucket.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No clinical personnel currently scheduled for this shift. Click &quot;Add Shift&quot; or &quot;Auto-Roster Week&quot; to assign personnel.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {shiftsInBucket.map((shift) => (
                      <div
                        key={shift.id}
                        className="p-3 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
                            {shift.staffName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-xs text-slate-900 truncate">
                                {shift.staffName}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  shift.staffRole === 'doctor'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : shift.staffRole === 'nurse'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-purple-100 text-purple-800 border border-purple-200'
                                }`}
                              >
                                {shift.staffRole}
                              </span>
                              {shift.isLead && (
                                <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                                  ★ Shift Lead
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center space-x-3 mt-0.5">
                              <span>Station: {shift.unitLocation}</span>
                              <span>•</span>
                              <span>Hours: {shift.startTime} – {shift.endTime}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 self-end md:self-center">
                          <button
                            id={`edit-shift-${shift.id}`}
                            onClick={() => handleEditShift(shift)}
                            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
                            title="Edit Shift"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            id={`delete-shift-${shift.id}`}
                            onClick={() => handleDeleteShift(shift.id, shift.staffName)}
                            className="p-1.5 rounded hover:bg-rose-100 text-rose-600 transition-colors"
                            title="Delete Shift"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: TIME-OFF (PTO) REQUEST TRACKER */}
      {/* ======================================================== */}
      {viewMode === 'timeoff' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Staff Leave & Time-Off Requests
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review vacation, CME, medical, and personal leave requests with automated coverage validation.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">
                Total Requests: <strong className="text-slate-900">{deptTimeOffRequests.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPtoStaffId(deptStaff[0]?.id || '');
                  setPtoStartDate(selectedDate);
                  setPtoEndDate(selectedDate);
                  setPtoReason('Vacation');
                  setPtoRequestModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" />
                Submit PTO Request
              </button>
            </div>
          </div>

          {deptTimeOffRequests.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              No pending or historical time-off requests logged for {selectedDept}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-2.5 px-3">Staff Member</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Leave Window</th>
                    <th className="py-2.5 px-3">Reason</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Adjudication Notes</th>
                    <th className="py-2.5 px-3 text-right">Lead Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deptTimeOffRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{req.staffName}</span>
                        <span className="text-[10px] text-slate-400">
                          Req on {new Date(req.requestedAt).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="capitalize font-semibold text-slate-700">{req.staffRole}</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {req.startDate} to {req.endDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-[11px]">
                          {req.reason}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : req.status === 'rejected'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {req.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                        {req.reviewNotes || (
                          <span className="text-slate-400 italic">Pending lead review</span>
                        )}
                        {req.reviewedBy && (
                          <span className="block text-[10px] text-slate-400">
                            By {req.reviewedBy}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              id={`approve-pto-${req.id}`}
                              onClick={() => handleApprovePTO(req)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              id={`reject-pto-${req.id}`}
                              onClick={() => handleOpenRejectPTO(req)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[11px] transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Completed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: COVERAGE DENSITY MATRIX & AUDIT */}
      {/* ======================================================== */}
      {viewMode === 'density-report' && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-bold text-slate-900 text-base">
              Weekly Shift Coverage Density Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Cross-shift audit comparing scheduled headcounts against statutory mandates and hospital ICU/ED policies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h4 className="font-bold text-xs text-slate-800 mb-2">Statutory Nurse Mandate</h4>
              <p className="text-sm font-bold text-slate-900">
                {staffingReq.targetNurseToPatientRatio}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Enforced by Department Lead roster scheduler to prevent burnout and sentinel events.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h4 className="font-bold text-xs text-slate-800 mb-2">Shift Minimums (Day / Eve / Noc)</h4>
              <p className="text-sm font-bold text-slate-900">
                {staffingReq.minDayStaff} / {staffingReq.minEveningStaff} / {staffingReq.minNightStaff} personnel
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Calculated from historical admission volume and acuity index tiers.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <h4 className="font-bold text-xs text-slate-800 mb-2">Active Department Pool</h4>
              <p className="text-sm font-bold text-slate-900">
                {deptStaff.length} Credentialed Staff
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {deptStaff.filter((s) => s.availabilityStatus === 'On Duty').length} On-Duty right now.
              </p>
            </div>
          </div>

          {/* Detailed Compliance Table */}
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Shift Interval</th>
                  <th className="py-2.5 px-3">Statutory Minimum</th>
                  <th className="py-2.5 px-3">Assigned Staff</th>
                  <th className="py-2.5 px-3">Doctors Rostered</th>
                  <th className="py-2.5 px-3">Nurses Rostered</th>
                  <th className="py-2.5 px-3">Density Index</th>
                  <th className="py-2.5 px-3 text-right">Compliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Day (07:00–15:30)</td>
                  <td className="py-2.5 px-3 font-semibold">{staffingReq.minDayStaff}</td>
                  <td className="py-2.5 px-3 font-bold">{dayShifts.length}</td>
                  <td className="py-2.5 px-3">{dayShifts.filter((s) => s.staffRole === 'doctor').length}</td>
                  <td className="py-2.5 px-3">{dayShifts.filter((s) => s.staffRole === 'nurse').length}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{dayCoveragePct}%</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCoverageColor(dayCoveragePct)}`}>
                      {dayCoveragePct >= 100 ? 'Compliant' : 'Shortfall'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Evening (15:00–23:30)</td>
                  <td className="py-2.5 px-3 font-semibold">{staffingReq.minEveningStaff}</td>
                  <td className="py-2.5 px-3 font-bold">{eveningShifts.length}</td>
                  <td className="py-2.5 px-3">{eveningShifts.filter((s) => s.staffRole === 'doctor').length}</td>
                  <td className="py-2.5 px-3">{eveningShifts.filter((s) => s.staffRole === 'nurse').length}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{eveningCoveragePct}%</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCoverageColor(eveningCoveragePct)}`}>
                      {eveningCoveragePct >= 100 ? 'Compliant' : 'Shortfall'}
                    </span>
                  </td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3 font-bold text-slate-900">Night (23:00–07:30)</td>
                  <td className="py-2.5 px-3 font-semibold">{staffingReq.minNightStaff}</td>
                  <td className="py-2.5 px-3 font-bold">{nightShifts.length}</td>
                  <td className="py-2.5 px-3">{nightShifts.filter((s) => s.staffRole === 'doctor').length}</td>
                  <td className="py-2.5 px-3">{nightShifts.filter((s) => s.staffRole === 'nurse').length}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{nightCoveragePct}%</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${getCoverageColor(nightCoveragePct)}`}>
                      {nightCoveragePct >= 100 ? 'Compliant' : 'Shortfall'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: ADD / EDIT SHIFT */}
      {/* ======================================================== */}
      {addShiftModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingShift ? 'Edit Scheduled Shift' : 'Add Clinical Shift'}
              </h3>
              <button
                onClick={() => setAddShiftModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Staff Member:
                </label>
                <select
                  value={formStaffId}
                  onChange={(e) => setFormStaffId(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-800 bg-white"
                  required
                >
                  {deptStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role.toUpperCase()} - {s.title})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shift Date:
                  </label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Shift Type:
                  </label>
                  <select
                    value={formShiftType}
                    onChange={(e) => {
                      const st = e.target.value as ShiftType;
                      setFormShiftType(st);
                      if (st === 'Day') {
                        setFormStartTime('07:00');
                        setFormEndTime('15:30');
                      } else if (st === 'Evening') {
                        setFormStartTime('15:00');
                        setFormEndTime('23:30');
                      } else if (st === 'Night') {
                        setFormStartTime('23:00');
                        setFormEndTime('07:30');
                      } else {
                        setFormStartTime('15:30');
                        setFormEndTime('07:00');
                      }
                    }}
                    className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                  >
                    <option value="Day">Day (07:00 - 15:30)</option>
                    <option value="Evening">Evening (15:00 - 23:30)</option>
                    <option value="Night">Night (23:00 - 07:30)</option>
                    <option value="On-Call">On-Call Standby</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Start Time:
                  </label>
                  <input
                    type="time"
                    value={formStartTime}
                    onChange={(e) => setFormStartTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    End Time:
                  </label>
                  <input
                    type="time"
                    value={formEndTime}
                    onChange={(e) => setFormEndTime(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Unit Location / Station:
                </label>
                <input
                  type="text"
                  value={formUnitLocation}
                  onChange={(e) => setFormUnitLocation(e.target.value)}
                  placeholder="e.g. Triage Bay 1, Bed 1-6, Cath Lab 2"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="form-is-lead"
                  checked={formIsLead}
                  onChange={(e) => setFormIsLead(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="form-is-lead" className="text-xs font-semibold text-slate-800">
                  Designate as Shift Lead / Charge Nurse
                </label>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddShiftModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  {editingShift ? 'Update Shift' : 'Assign Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: AUTO-ROSTER CONFIRMATION */}
      {/* ======================================================== */}
      {autoRosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
              <Sparkles className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">
                Automate Weekly Staff Roster
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              The automated scheduler will balance credentialed personnel across Day, Evening, Night, and On-Call shifts for <strong>{selectedDept}</strong> starting from <strong>{selectedDate}</strong>.
            </p>

            <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-xs text-indigo-900 space-y-1">
              <div className="font-bold flex items-center space-x-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Algorithmic Safeguards:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>Guarantees statutory nurse-to-patient ratio ({staffingReq.targetNurseToPatientRatio})</li>
                <li>Respects all approved PTO leave records</li>
                <li>Assigns exactly 1 designated Shift Lead per rotation</li>
                <li>Maintains mandatory 11-hour rest intervals between shifts</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setAutoRosterModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleRunAutoRoster}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5"
              >
                <Sparkles className="h-4 w-4" />
                <span>Execute Auto-Roster</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: TIME-OFF REJECTION NOTE */}
      {/* ======================================================== */}
      {timeOffRejectModalOpen && selectedTimeOff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-rose-600 border-b border-slate-100 pb-3">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">
                Reject Time-Off Request
              </h3>
            </div>

            <div className="text-xs text-slate-700 space-y-1">
              <p>
                Rejecting request for <strong>{selectedTimeOff.staffName}</strong> ({selectedTimeOff.startDate} to {selectedTimeOff.endDate}).
              </p>
              <p className="text-[11px] text-slate-500">
                Reason: {selectedTimeOff.reason}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Clinical Lead Review Notes (Required):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                required
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setTimeOffRejectModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectPTO}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {ptoRequestModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4">
            <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
              <CalendarCheck className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">Submit Time-Off Request</h3>
            </div>
            <form onSubmit={handleSubmitPtoRequest} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Staff Member</label>
                <select
                  value={ptoStaffId}
                  onChange={(e) => setPtoStaffId(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 text-xs"
                  required
                >
                  {deptStaff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start</label>
                  <input
                    type="date"
                    value={ptoStartDate}
                    onChange={(e) => setPtoStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End</label>
                  <input
                    type="date"
                    value={ptoEndDate}
                    onChange={(e) => setPtoEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason</label>
                <select
                  value={ptoReason}
                  onChange={(e) => setPtoReason(e.target.value as TimeOffRequest['reason'])}
                  className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 text-xs"
                >
                  <option value="Vacation">Vacation</option>
                  <option value="Medical / Sick">Medical / Sick</option>
                  <option value="CME / Conference">CME / Conference</option>
                  <option value="Personal">Personal</option>
                  <option value="Family Emergency">Family Emergency</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPtoRequestModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
