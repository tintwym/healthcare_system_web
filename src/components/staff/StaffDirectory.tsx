import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Radio,
  MapPin,
  ShieldCheck,
  MessageSquare,
  Send,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  X,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Award,
  Globe,
  Briefcase,
  Activity,
  UserCheck,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { StaffMember, UserRole } from '../../types';
import { McSelect } from '../ui/McSelect';

interface StaffDirectoryProps {
  onOpenDirectMessage?: (recipientUserId: string) => void;
}

export const StaffDirectory: React.FC<StaffDirectoryProps> = ({ onOpenDirectMessage }) => {
  const {
    currentUser,
    staffMembers,
    shifts,
    users,
    sendMessage,
    updateStaffAvailability,
    logAudit,
  } = useHospital();

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Detail Drawer State
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Quick Secure Message Modal State
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);
  const [targetStaff, setTargetStaff] = useState<StaffMember | null>(null);
  const [msgSubject, setMsgSubject] = useState<string>('Clinical Care Coordination');
  const [msgBody, setMsgBody] = useState<string>('');
  const [msgUrgent, setMsgUrgent] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);

  // STAT Page / Bleep Modal State
  const [bleepModalOpen, setBleepModalOpen] = useState<boolean>(false);
  const [bleepMessage, setBleepMessage] = useState<string>('');
  const [bleepCallbackExt, setBleepCallbackExt] = useState<string>('x4412');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct Departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffMembers.forEach((s) => set.add(s.department));
    return Array.from(set).sort();
  }, [staffMembers]);

  // Filtered staff list
  const filteredStaff = useMemo(() => {
    return staffMembers.filter((staff) => {
      // Role Filter
      if (selectedRole !== 'all' && staff.role !== selectedRole) {
        return false;
      }
      // Department Filter
      if (selectedDepartment !== 'all' && staff.department !== selectedDepartment) {
        return false;
      }
      // Availability Status Filter
      if (selectedStatus !== 'all' && staff.availabilityStatus !== selectedStatus) {
        return false;
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = staff.name.toLowerCase().includes(q);
        const matchesTitle = staff.title.toLowerCase().includes(q);
        const matchesSpecialty = staff.specialty.toLowerCase().includes(q);
        const matchesDept = staff.department.toLowerCase().includes(q);
        const matchesBleep = staff.bleepNumber.toLowerCase().includes(q);
        const matchesEmail = staff.email.toLowerCase().includes(q);
        const matchesSkills = staff.skills.some((sk) => sk.toLowerCase().includes(q));
        return (
          matchesName ||
          matchesTitle ||
          matchesSpecialty ||
          matchesDept ||
          matchesBleep ||
          matchesEmail ||
          matchesSkills
        );
      }
      return true;
    });
  }, [staffMembers, selectedRole, selectedDepartment, selectedStatus, searchQuery]);

  // Quick stats
  const totalStaffCount = staffMembers.length;
  const onDutyCount = staffMembers.filter((s) => s.availabilityStatus === 'On Duty').length;
  const inSurgeryCount = staffMembers.filter((s) => s.availabilityStatus === 'In Surgery').length;
  const onCallCount = staffMembers.filter((s) => s.availabilityStatus === 'On Call').length;

  const getStatusBadge = (status: StaffMember['availabilityStatus']) => {
    switch (status) {
      case 'On Duty':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Available':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'In Surgery':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'On Call':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Busy':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'On Leave':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Off Duty':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const getStatusDotColor = (status: StaffMember['availabilityStatus']) => {
    switch (status) {
      case 'On Duty':
        return 'bg-emerald-500 ring-emerald-200';
      case 'Available':
        return 'bg-teal-500 ring-teal-200';
      case 'In Surgery':
        return 'bg-purple-500 ring-purple-200';
      case 'On Call':
        return 'bg-amber-500 ring-amber-200';
      case 'Busy':
        return 'bg-rose-500 ring-rose-200';
      case 'On Leave':
        return 'bg-blue-500 ring-blue-200';
      case 'Off Duty':
      default:
        return 'bg-slate-400 ring-slate-200';
    }
  };

  const handleOpenSendMessage = (staff: StaffMember) => {
    if (!staff.userId) {
      showToast(`${staff.name} has no linked system account for secure messaging`);
      return;
    }
    setTargetStaff(staff);
    setMsgSubject(`Clinical Consult: ${currentUser.name}`);
    setMsgBody('');
    setMsgUrgent(false);
    setMessageModalOpen(true);
  };

  const handleSendQuickMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStaff || !msgBody.trim() || !targetStaff.userId) return;

    setIsSending(true);
    sendMessage(targetStaff.userId, msgSubject.trim(), msgBody.trim(), msgUrgent);

    setTimeout(() => {
      setIsSending(false);
      setMessageModalOpen(false);
      showToast(`Encrypted message dispatched to ${targetStaff.name}`);
      if (onOpenDirectMessage && targetStaff.userId) {
        onOpenDirectMessage(targetStaff.userId);
      }
    }, 400);
  };

  const handleOpenBleep = (staff: StaffMember) => {
    setTargetStaff(staff);
    setBleepMessage(`STAT clinical consult requested by ${currentUser.name} (${currentUser.role.toUpperCase()})`);
    setBleepModalOpen(true);
  };

  const handleSendBleep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStaff) return;

    logAudit(
      'BLEEP_PAGER_DISPATCH',
      `STAT Bleep to ${targetStaff.name} (Pager ${targetStaff.bleepNumber})`,
      `Callback ${bleepCallbackExt}: ${bleepMessage}`
    );

    if (targetStaff.userId) {
      sendMessage(
        targetStaff.userId,
        `[STAT BLEEP] Pager Alert to ${targetStaff.bleepNumber}`,
        `STAT BLEEP ALERT: ${bleepMessage}\nPlease call back urgently on: ${bleepCallbackExt}. Dispatched by: ${currentUser.name}`,
        true
      );
    }

    setBleepModalOpen(false);
    showToast(`🚨 STAT Bleep broadcast to ${targetStaff.name} (Pager ${targetStaff.bleepNumber})`);
  };

  return (
    <div className="space-y-6">
      {/* Toast alert notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center space-x-2 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Fast Navigation */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 shrink-0">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold text-slate-900">Care Team Directory</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Care Team Directory
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Instant clinician contacts, duty availability status, unit assignments, and direct integrated secure communication.
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{onDutyCount} On Duty</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-200 text-xs font-semibold text-purple-800">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>{inSurgeryCount} In Surgery</span>
            </div>
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-800">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>{onCallCount} On-Call</span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold">
              <span>Total: {totalStaffCount}</span>
            </div>
          </div>
        </div>

        {/* Search and Filters Deck */}
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-3">
          {/* Main Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              id="staff-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by physician/nurse name, specialty, department, bleep/pager, skill (e.g., 'Cath Lab', 'ECMO', '7701')..."
              className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 bg-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Chips Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Role Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-slate-500 mr-1">Role:</span>
              {[
                { id: 'all', label: 'All Roles' },
                { id: 'doctor', label: 'Doctors (MD/DO)' },
                { id: 'nurse', label: 'Nurses (RN/NP)' },
                { id: 'pharmacist', label: 'Pharmacists (PharmD)' },
                { id: 'admin', label: 'Admin / Ops' },
                { id: 'billing', label: 'Billing' },
              ].map((r) => (
                <button
                  key={r.id}
                  id={`filter-role-${r.id}`}
                  onClick={() => setSelectedRole(r.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedRole === r.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Department and Status Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <McSelect
                id="filter-dept-select"
                value={selectedDepartment}
                onChange={setSelectedDepartment}
                options={[
                  { value: 'all', label: 'All Departments' },
                  ...departments.map((d) => ({ value: d, label: d })),
                ]}
                className="min-w-[10.5rem]"
                aria-label="Filter by department"
              />
              <McSelect
                id="filter-status-select"
                value={selectedStatus}
                onChange={setSelectedStatus}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'On Duty', label: 'On Duty' },
                  { value: 'Available', label: 'Available' },
                  { value: 'In Surgery', label: 'In Surgery' },
                  { value: 'On Call', label: 'On Call' },
                  { value: 'Busy', label: 'Busy' },
                  { value: 'Off Duty', label: 'Off Duty' },
                  { value: 'On Leave', label: 'On Leave' },
                ]}
                className="min-w-[9.5rem]"
                aria-label="Filter by status"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Staff Grid View */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-sm">No clinical staff matched your criteria</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query, role filters, or department parameters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedRole('all');
              setSelectedDepartment('all');
              setSelectedStatus('all');
            }}
            className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStaff.map((staff) => (
            <div
              key={staff.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Header: Photo, Name, Role & Status */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={staff.avatarUrl}
                        alt={staff.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-100 shadow-2xs"
                      />
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-white ${getStatusDotColor(
                          staff.availabilityStatus
                        )}`}
                        title={staff.availabilityStatus}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {staff.name}
                        </h3>
                      </div>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {staff.title}
                      </p>
                      <span className="text-[10px] text-blue-600 font-semibold block">
                        {staff.specialty}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${getStatusBadge(
                      staff.availabilityStatus
                    )}`}
                  >
                    {staff.availabilityStatus}
                  </span>
                </div>

                {/* Location & Department */}
                <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{staff.department}</span>
                  </div>

                  <div className="flex items-center space-x-1.5 truncate">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {staff.currentLocation || staff.officeLocation}
                    </span>
                  </div>
                </div>

                {/* Contact Points */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <Phone className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate font-mono">{staff.phone}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 text-slate-700">
                    <Radio className="h-3 w-3 text-indigo-500 shrink-0" />
                    <span className="truncate font-mono">
                      Pager: <strong>{staff.bleepNumber}</strong>
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1.5 text-slate-500 truncate">
                    <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="truncate text-[10px]">{staff.email}</span>
                  </div>
                </div>

                {/* Skills / Badges Preview */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {staff.skills.slice(0, 3).map((sk) => (
                    <span
                      key={sk}
                      className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                    >
                      {sk}
                    </span>
                  ))}
                  {staff.skills.length > 3 && (
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-400 text-[10px]">
                      +{staff.skills.length - 3}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons Deck */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  id={`btn-message-${staff.id}`}
                  onClick={() => handleOpenSendMessage(staff)}
                  disabled={!staff.userId}
                  className={`flex-1 flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-colors shadow-2xs ${
                    staff.userId
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                  title={
                    staff.userId
                      ? 'Send Encrypted Care Team Message'
                      : 'No linked system account for messaging'
                  }
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Secure Message</span>
                </button>

                <button
                  id={`btn-bleep-${staff.id}`}
                  onClick={() => handleOpenBleep(staff)}
                  className="flex items-center space-x-1 py-1.5 px-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition-colors"
                  title="STAT Bleep / Page Clinician"
                >
                  <Radio className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Page</span>
                </button>

                <button
                  id={`btn-profile-${staff.id}`}
                  onClick={() => setSelectedStaff(staff)}
                  className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200"
                  title="View Full Clinician Credentials"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SEND SECURE ENCRYPTED MESSAGE */}
      {/* ======================================================== */}
      {messageModalOpen && targetStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Secure Care Team Message
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    End-to-end encrypted under HIPAA § 164.312
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMessageModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Recipient Card */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img
                  src={targetStaff.avatarUrl}
                  alt={targetStaff.name}
                  className="w-10 h-10 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{targetStaff.name}</h4>
                  <p className="text-[11px] text-slate-500">{targetStaff.title} • {targetStaff.department}</p>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(targetStaff.availabilityStatus)}`}>
                {targetStaff.availabilityStatus}
              </span>
            </div>

            <form onSubmit={handleSendQuickMessage} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject / Clinical Context:
                </label>
                <input
                  type="text"
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message Body:
                </label>
                <textarea
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  rows={4}
                  placeholder="Enter clinical consultation notes, patient handover details, or medication inquiries..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white placeholder-slate-400 focus:ring-1 focus:ring-blue-500 focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="msg-urgent"
                  checked={msgUrgent}
                  onChange={(e) => setMsgUrgent(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="msg-urgent" className="text-xs font-bold text-rose-700 flex items-center space-x-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Flag as STAT / Urgent Priority (Pushes high-decibel alarm to recipient)</span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Audit Logged & Encrypted</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setMessageModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>{isSending ? 'Transmitting...' : 'Send Secure Message'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: STAT BLEEP / PAGER DISPATCH */}
      {/* ======================================================== */}
      {bleepModalOpen && targetStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
              <Radio className="h-6 w-6 text-indigo-600" />
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  STAT Clinician Pager / Bleep
                </h3>
                <p className="text-[11px] text-slate-500">
                  Target Bleep: <strong>{targetStaff.bleepNumber}</strong> ({targetStaff.name})
                </p>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-xl text-xs text-indigo-900 space-y-1">
              <p className="font-bold">
                Paging {targetStaff.name} ({targetStaff.title})
              </p>
              <p className="text-[11px]">
                Currently assigned to: <strong>{targetStaff.currentLocation || targetStaff.department}</strong>
              </p>
            </div>

            <form onSubmit={handleSendBleep} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Callback Extension / Station Phone:
                </label>
                <input
                  type="text"
                  value={bleepCallbackExt}
                  onChange={(e) => setBleepCallbackExt(e.target.value)}
                  placeholder="e.g. x4412 or ED Desk 2"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-mono font-bold text-slate-800 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bleep Message (Max 120 chars on pager):
                </label>
                <textarea
                  value={bleepMessage}
                  onChange={(e) => setBleepMessage(e.target.value)}
                  maxLength={120}
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white"
                  required
                />
                <span className="text-[10px] text-slate-400 block text-right">
                  {bleepMessage.length} / 120 characters
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBleepModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Radio className="h-4 w-4" />
                  <span>Transmit Pager Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DRAWER / MODAL: FULL CLINICIAN CREDENTIALS & PROFILE */}
      {/* ======================================================== */}
      {selectedStaff && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 overflow-y-auto">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
              <div className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Staff Credential & Duty Dossier
                </h3>
              </div>
              <button
                onClick={() => setSelectedStaff(null)}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 flex-1">
              {/* Profile Card */}
              <div className="flex items-start space-x-4">
                <img
                  src={selectedStaff.avatarUrl}
                  alt={selectedStaff.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg font-bold text-slate-900 truncate">
                      {selectedStaff.name}
                    </h2>
                    <span className="text-xs text-slate-500 font-semibold">
                      {selectedStaff.credentials}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium">{selectedStaff.title}</p>
                  <p className="text-xs font-semibold text-blue-600">{selectedStaff.specialty}</p>

                  <div className="mt-2 flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                        selectedStaff.availabilityStatus
                      )}`}
                    >
                      {selectedStaff.availabilityStatus}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ID: {selectedStaff.id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct Contact Matrix */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400">
                  Direct Clinical Contacts
                </h4>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center space-x-1.5">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span>Direct Dial / Extension:</span>
                    </span>
                    <strong className="text-slate-900 font-mono">{selectedStaff.phone}</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center space-x-1.5">
                      <Radio className="h-3.5 w-3.5 text-indigo-500" />
                      <span>Care Team Bleep / Pager:</span>
                    </span>
                    <strong className="text-indigo-700 font-mono">{selectedStaff.bleepNumber}</strong>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center space-x-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>Secure Exchange:</span>
                    </span>
                    <span className="text-slate-800 font-medium">{selectedStaff.email}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 flex items-center space-x-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      <span>Primary Station:</span>
                    </span>
                    <span className="text-slate-800 font-medium">{selectedStaff.officeLocation}</span>
                  </div>
                </div>
              </div>

              {/* Credentials & Statutory Licensing */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400">
                  Licensing & Verified Qualifications
                </h4>
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">State Medical Board License:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedStaff.licenseNumber}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Assigned Department:</span>
                    <span className="font-semibold text-slate-800">{selectedStaff.department}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Active Inpatient Panel:</span>
                    <span className="font-bold text-slate-900">{selectedStaff.activePatientCount || 0} Patients</span>
                  </div>
                </div>
              </div>

              {/* Clinical Skills & Procedural Competencies */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400">
                  Procedural Competencies & Skills
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStaff.skills.map((sk) => (
                    <span
                      key={sk}
                      className="px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-slate-400">
                  Fluency & Language Capabilities
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStaff.languages.map((lang) => (
                    <span
                      key={lang}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium flex items-center space-x-1"
                    >
                      <Globe className="h-3 w-3 text-slate-400" />
                      <span>{lang}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-2">
              <button
                onClick={() => {
                  const staff = selectedStaff;
                  setSelectedStaff(null);
                  handleOpenSendMessage(staff);
                }}
                disabled={!selectedStaff.userId}
                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1.5 ${
                  selectedStaff.userId
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Message Clinician</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStaff(null);
                  handleOpenBleep(selectedStaff);
                }}
                className="py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1.5"
              >
                <Radio className="h-4 w-4" />
                <span>Page</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
