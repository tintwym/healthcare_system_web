import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Calendar,
  CreditCard,
  FileText,
  Pill,
  Clock,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  Download,
  Plus,
  ArrowRight,
  Sparkles,
  Activity,
  Heart,
  ChevronRight,
  DollarSign,
  MessageSquare,
  RefreshCw,
  Send,
  X,
  Moon,
  Sun,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { useTheme } from '../../context/ThemeContext';
import { Appointment, Invoice, PatientRecord } from '../../types';
import { McSelect } from '../ui/McSelect';
import { PushNotificationsToggle } from '../PushNotificationsToggle';
import {
  PatientLoginGate,
  clearPatientSession,
  readPatientSession,
  type PatientSession,
  DEMO_PATIENT_USER_ID,
} from './PatientLoginGate';
import { PatientMessagesPanel } from './PatientMessagesPanel';
import { usePatientApiSession } from '../../hooks/usePatientApiSession';
import { api } from '../../lib/api';
import { BOOK_SLOTS, RESCHEDULE_SLOTS, doctorForDepartment } from '../../lib/doctors';

export const PatientPortal: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const {
    currentUser,
    patients,
    appointments,
    invoices,
    messages,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointmentByPatient,
    payInvoice,
    requestRefill,
    isMfaAuthenticated,
    setMfaModalOpen,
    sendMessage,
    markMessageRead,
    updatePatientProfile,
    logAudit,
  } = useHospital();

  const [session, setSession] = useState<PatientSession | null>(() => readPatientSession());
  const { apiPatient, apiAppointments, apiInvoices, apiMessages, apiReady, refresh: refreshApi } =
    usePatientApiSession(session);

  // Active patient selection (session patient by default; staff may demo-switch)
  const [activePatientId, setActivePatientId] = useState<string>(
    () => readPatientSession()?.patientId || 'pat-001'
  );
  const mockPatient = patients.find((p) => p.id === activePatientId) || patients[0];
  const patientUserId = session?.patientUserId || DEMO_PATIENT_USER_ID;
  const isStaffViewer = currentUser.role !== 'patient';

  // Active portal tab
  const [activeTab, setActiveTab] = useState<'records' | 'appointments' | 'billing' | 'messages'>('records');

  // Appointment scheduling modal state
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [newAptDoctor, setNewAptDoctor] = useState('Dr. Aye Myat Thu, MD');
  const [newAptDept, setNewAptDept] = useState('Cardiology');
  const [newAptDate, setNewAptDate] = useState('2026-09-22');
  const [newAptTime, setNewAptTime] = useState(BOOK_SLOTS[0]);
  const [newAptDoctorId, setNewAptDoctorId] = useState('u-1');
  const [newAptReason, setNewAptReason] = useState('Routine 6-month cardiovascular checkup and medication review.');
  const [actionError, setActionError] = useState<string | null>(null);

  // Reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('2026-09-20');
  const [rescheduleTime, setRescheduleTime] = useState(RESCHEDULE_SLOTS[2]);

  // Refill request modal state
  const [refillModalOpen, setRefillModalOpen] = useState(false);
  const [refillMedName, setRefillMedName] = useState('');
  const [refillNotes, setRefillNotes] = useState('');
  const [refillSuccessMsg, setRefillSuccessMsg] = useState<string | null>(null);

  // Billing payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'hsa' | 'card'>('hsa');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentReceiptId, setPaymentReceiptId] = useState<string | null>(null);
  const [paymentReceiptAmount, setPaymentReceiptAmount] = useState(0);

  // Profile self-service
  const [editingProfile, setEditingProfile] = useState(false);
  const [profilePhone, setProfilePhone] = useState('');
  const [profileEcName, setProfileEcName] = useState('');
  const [profileEcPhone, setProfileEcPhone] = useState('');
  const [profileEcRel, setProfileEcRel] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);

  // Prefer API lists only for the authenticated patient (staff demo switch uses mock).
  const useApiLists = Boolean(
    apiReady && (!isStaffViewer || activePatientId === session?.patientId)
  );
  const patient =
    useApiLists && apiPatient && apiPatient.id === activePatientId ? apiPatient : mockPatient;
  const patientAppointments = useApiLists && apiAppointments
    ? apiAppointments
    : appointments.filter((a) => a.patientId === patient.id);
  const patientInvoices = useApiLists && apiInvoices
    ? apiInvoices
    : invoices.filter((inv) => inv.patientId === patient.id);
  const portalMessages = useApiLists && apiMessages ? apiMessages : messages;
  const invoiceBalance = (inv: Invoice) =>
    Math.max(0, inv.patientResponsibility - inv.amountPaid);
  const totalBalanceDue = patientInvoices.reduce((acc, inv) => acc + invoiceBalance(inv), 0);
  const latestVital = patient.vitals[patient.vitals.length - 1];

  // Handlers
  const handleScheduleAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (apiReady) {
        await api.bookAppointment({
          doctorId: newAptDoctorId,
          department: newAptDept,
          date: newAptDate,
          time: newAptTime,
          reason: newAptReason,
          type: 'Follow-up',
        });
        await refreshApi();
      } else {
        bookAppointment({
          patientId: patient.id,
          patientName: `${patient.firstName} ${patient.lastName}`,
          patientMrn: patient.mrn,
          doctorId: newAptDoctorId,
          doctorName: newAptDoctor,
          department: newAptDept,
          date: newAptDate,
          time: newAptTime,
          durationMinutes: 30,
          type: 'Follow-up',
          priority: 'routine',
          reason: newAptReason,
          room: 'Outpatient Clinic',
        });
      }
      setBookModalOpen(false);
      logAudit(
        'PATIENT_PORTAL_ACCESS',
        `Patient Scheduled Appointment: ${newAptDept} with ${newAptDoctor}`,
        'Patient self-service portal appointment scheduling',
        patient.id,
        `${patient.firstName} ${patient.lastName}`,
        'NORMAL'
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not book appointment.');
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedAptId) return;
    setActionError(null);
    try {
      if (apiReady) {
        await api.updateAppointment(selectedAptId, { date: rescheduleDate, time: rescheduleTime });
        await refreshApi();
      } else {
        rescheduleAppointment(selectedAptId, rescheduleDate, rescheduleTime);
      }
      setRescheduleModalOpen(false);
      setSelectedAptId(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reschedule.');
    }
  };

  const handleOpenRefill = (medName: string) => {
    setRefillMedName(medName);
    setRefillNotes('30-day supply requested via Patient Self-Service Portal.');
    setRefillModalOpen(true);
  };

  const handleSubmitRefill = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (apiReady) {
        await api.requestRefill(refillMedName, refillNotes);
        await refreshApi();
      } else {
        requestRefill(patient.id, refillMedName, refillNotes);
      }
      setRefillModalOpen(false);
      setRefillSuccessMsg(`Refill request for ${refillMedName} successfully routed to the network pharmacy.`);
      setTimeout(() => setRefillSuccessMsg(null), 5000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not submit refill.');
    }
  };

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setPaymentSuccess(false);
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;
    const amount = invoiceBalance(selectedInvoice);
    if (amount <= 0) return;
    setActionError(null);
    try {
      if (apiReady) {
        const result = await api.payInvoice(selectedInvoice.id, paymentMethod);
        setPaymentReceiptId(result.receiptId);
        setPaymentReceiptAmount(amount);
        await refreshApi();
      } else {
        payInvoice(selectedInvoice.id, amount);
        setPaymentReceiptId(`RCPT-${Date.now().toString(36).toUpperCase()}`);
        setPaymentReceiptAmount(amount);
      }
      setPaymentSuccess(true);
      setTimeout(() => {
        setPaymentModalOpen(false);
        setSelectedInvoice(null);
        setPaymentSuccess(false);
        setPaymentReceiptId(null);
      }, 2800);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Payment failed.');
    }
  };

  const handleSignOut = async () => {
    try {
      if (apiReady) await api.logout();
    } catch {
      /* ignore */
    }
    clearPatientSession();
    setSession(null);
  };

  const startEditProfile = () => {
    setProfilePhone(patient.phone);
    setProfileEcName(patient.emergencyContact.name);
    setProfileEcPhone(patient.emergencyContact.phone);
    setProfileEcRel(patient.emergencyContact.relationship);
    setEditingProfile(true);
    setProfileSaved(false);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    try {
      if (apiReady) {
        await api.updatePatientProfile({
          phone: profilePhone,
          emergencyContact: {
            name: profileEcName,
            phone: profileEcPhone,
            relationship: profileEcRel,
          },
        });
        await refreshApi();
      }
      updatePatientProfile(patient.id, {
        phone: profilePhone,
        emergencyContact: {
          name: profileEcName,
          phone: profileEcPhone,
          relationship: profileEcRel,
        },
      });
      setEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not save profile.');
    }
  };

  if (!session) {
    return (
      <PatientLoginGate
        allowStaffDemo={isStaffViewer}
        onAuthenticated={(s) => {
          setSession(s);
          setActivePatientId(s.patientId);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Portal Header & MFA Banner */}
      <div className="portal-hero p-6 sm:p-8 rise-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="h-12 w-12 rounded-2xl brand-mark flex items-center justify-center text-white font-display text-xl font-bold shrink-0 shadow-lg shadow-teal-900/15">
              M
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl sm:text-3xl text-[var(--mc-ink)] dark:text-slate-100 tracking-tight">
                  Medicore
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-600/10 text-teal-800 dark:text-teal-300 uppercase tracking-[0.12em]">
                  Patient portal
                </span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 max-w-xl leading-relaxed">
                Hello {patient.firstName} — records, monitoring, visits, billing, and care-team messaging in one place.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white/80 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-pressed={darkMode}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            {!isMfaAuthenticated && (
              <button
                onClick={() => setMfaModalOpen(true)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
              >
                <Lock className="h-3.5 w-3.5" />
                <span>Verify MFA Login</span>
              </button>
            )}
            <button
              onClick={() => {
                setActionError(null);
                setBookModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Calendar className="h-4 w-4" />
              <span>Schedule Appointment</span>
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Demo patient switcher + identity — kept below hero copy */}
        <div className="flex flex-wrap items-center gap-2.5 mt-5 pt-4 border-t border-[var(--mc-line)] text-xs">
          {isStaffViewer ? (
            <div className="mc-chip-select text-xs dark:bg-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Demo patient</span>
              <McSelect
                value={activePatientId}
                onChange={setActivePatientId}
                options={patients.map((p) => ({
                  value: p.id,
                  label: `${p.firstName} ${p.lastName} (${p.mrn})`,
                }))}
                variant="ghost"
                className="min-w-[10rem]"
                menuClassName="min-w-[16rem]"
                aria-label="Select active patient"
              />
            </div>
          ) : (
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 font-semibold">
              {patient.firstName} {patient.lastName}
            </span>
          )}

          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium ${
              isMfaAuthenticated
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
            <span>{isMfaAuthenticated ? 'MFA verified' : 'MFA pending'}</span>
          </span>

          <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-mono">
            MRN {patient.mrn}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400">
            Signed in as {session.email}
          </span>
        </div>

        {refillSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{refillSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 rise-in-delay">
        <button
          id="portal-tab-records"
          onClick={() => setActiveTab('records')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'records'
              ? 'portal-tab-active'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/60'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Records</span>
        </button>

        <button
          id="portal-tab-appointments"
          onClick={() => setActiveTab('appointments')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'appointments'
              ? 'portal-tab-active'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Appointments ({patientAppointments.length})</span>
        </button>

        <button
          id="portal-tab-billing"
          onClick={() => setActiveTab('billing')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'billing'
              ? 'portal-tab-active'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/60'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Billing</span>
          {totalBalanceDue > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-white text-[10px]">
              ${totalBalanceDue.toFixed(0)} due
            </span>
          )}
        </button>

        <button
          id="portal-tab-messages"
          onClick={() => setActiveTab('messages')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'messages'
              ? 'portal-tab-active'
              : 'text-slate-600 dark:text-slate-300 hover:bg-white/70 dark:hover:bg-slate-800/60'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Messages</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: MEDICAL RECORDS */}
      {/* ======================================================== */}
      {activeTab === 'records' && (
        <div className="space-y-6">
          {/* Monitoring snapshot */}
          <div className="panel p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 rounded-xl bg-teal-600/10 text-teal-700 flex items-center justify-center shrink-0">
                <Heart className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-slate-100">Health monitoring</div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Latest reading syncs with the Medicore patient mobile app.
                  {latestVital?.isAbnormal ? ' Alert flagged for care team review.' : ' Status within expected range.'}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[280px]">
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">HR</div>
                <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {latestVital?.heartRate ?? '—'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">BP</div>
                <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {latestVital
                    ? `${latestVital.bloodPressureSys}/${latestVital.bloodPressureDia}`
                    : '—'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-[10px] font-bold uppercase text-slate-400">SpO₂</div>
                <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {latestVital ? `${latestVital.spO2}%` : '—'}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Health Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Primary Physician</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{patient.primaryDoctor}</p>
              <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">{patient.department}</span>
            </div>

            <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Blood Type & Rh</span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{patient.bloodType}</p>
              <span className="text-[11px] text-slate-500 font-medium">Verified Inpatient Lab</span>
            </div>

            <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Documented Allergies</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {patient.allergies.length === 0 ? (
                  <span className="text-xs text-slate-500 italic">None (NKDA)</span>
                ) : (
                  patient.allergies.map((allergy, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200"
                    >
                      {allergy}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase">Contact & emergency</span>
                {!editingProfile && (
                  <button
                    type="button"
                    onClick={startEditProfile}
                    className="text-[10px] font-bold text-teal-700 dark:text-teal-300 hover:underline"
                  >
                    Edit
                  </button>
                )}
              </div>
              {editingProfile ? (
                <form onSubmit={saveProfile} className="mt-2 space-y-2 text-[11px]">
                  <input
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50"
                    placeholder="Your phone"
                    aria-label="Phone"
                  />
                  <input
                    value={profileEcName}
                    onChange={(e) => setProfileEcName(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50"
                    placeholder="Emergency contact name"
                    aria-label="Emergency contact name"
                  />
                  <input
                    value={profileEcRel}
                    onChange={(e) => setProfileEcRel(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50"
                    placeholder="Relationship"
                    aria-label="Relationship"
                  />
                  <input
                    value={profileEcPhone}
                    onChange={(e) => setProfileEcPhone(e.target.value)}
                    className="w-full px-2 py-1.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900/50"
                    placeholder="Emergency phone"
                    aria-label="Emergency phone"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="px-2.5 py-1 rounded bg-teal-600 text-white font-bold">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingProfile(false)}
                      className="px-2.5 py-1 rounded border border-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">{patient.emergencyContact.name}</p>
                  <span className="text-[11px] text-slate-500 block">
                    {patient.emergencyContact.relationship} · {patient.emergencyContact.phone}
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-1">You: {patient.phone}</span>
                  {profileSaved && (
                    <span className="text-[10px] font-semibold text-emerald-700 mt-1 block">Profile saved</span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-[var(--mc-elevated)] p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Push notifications</span>
            <p className="text-[11px] text-slate-500 mt-1 mb-2">
              Care messages, abnormal vitals, and visit reminders in this browser.
            </p>
            <PushNotificationsToggle />
          </div>

          {/* Active Medications & Refill Requests */}
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-slate-200 dark:border-[var(--mc-line)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Pill className="h-5 w-5 text-teal-700 dark:text-teal-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Active Prescriptions & Medications</h3>
              </div>
              <span className="text-xs text-slate-400">Synced directly with network pharmacy</span>
            </div>

            {patient.medications.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No active medications currently on file.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {patient.medications.map((med, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{med.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                          {med.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        <strong>Dosage:</strong> {med.dosage} ({med.route}) &bull; <strong>Frequency:</strong> {med.frequency}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Prescribed by: {med.prescribedBy} &bull; Started {med.startDate}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                      <span className="text-[11px] text-slate-500 font-medium">Routine refill available</span>
                      <button
                        id={`request-refill-btn-${i}`}
                        onClick={() => handleOpenRefill(med.name)}
                        className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 dark:text-teal-300 text-xs font-bold transition-colors border border-teal-200 dark:border-teal-800"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>Request Refill</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Visits & Clinical Encounters */}
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-slate-200 dark:border-[var(--mc-line)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Past Visits & Clinical Notes</h3>
              </div>
              <span className="text-xs text-slate-400">Electronic Health Record (EHR) Summaries</span>
            </div>

            {patient.clinicalNotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No visit notes on record.</p>
            ) : (
              <div className="space-y-3">
                {patient.clinicalNotes.map((note) => (
                  <div key={note.id} className="p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] bg-white dark:bg-[var(--mc-elevated)] space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">{note.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                          {note.authorRole}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {note.date} &bull; Attending: <strong>{note.author}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-700 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">Subjective & Objective:</strong>
                        <p>{note.soapSubjective}</p>
                        <p className="mt-1 text-slate-600 font-mono text-[11px]">{note.soapObjective}</p>
                      </div>
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <strong className="text-slate-900 dark:text-slate-100 block mb-0.5">Clinical Assessment & Care Plan:</strong>
                        <p>{note.soapAssessment}</p>
                        <p className="mt-1 text-teal-800 font-semibold">{note.soapPlan}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Diagnostic Lab Results */}
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-slate-200 dark:border-[var(--mc-line)] p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Diagnostic Laboratory Results</h3>
              </div>
              <span className="text-xs text-slate-400">Specimen Analysis & Reference Ranges</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3">Test Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Result Value</th>
                    <th className="py-2.5 px-3">Standard Reference Range</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Ordering Physician</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patient.labResults.map((lab) => (
                    <tr key={lab.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-slate-100">{lab.testName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{lab.category}</td>
                      <td className="py-2.5 px-3 text-slate-500">{lab.date}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{lab.value}</td>
                      <td className="py-2.5 px-3 text-slate-500">{lab.referenceRange}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            lab.status === 'normal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : lab.status === 'critical'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {lab.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{lab.orderedBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: APPOINTMENT SCHEDULING & MANAGEMENT */}
      {/* ======================================================== */}
      {activeTab === 'appointments' && (
        <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-slate-200 dark:border-[var(--mc-line)] p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Scheduled & Upcoming Appointments
              </h3>
              <p className="text-xs text-slate-500">
                Manage your hospital and specialist clinical visits, reschedule time slots, or cancel reservations directly.
              </p>
            </div>
            <button
              onClick={() => {
                setActionError(null);
                setBookModalOpen(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Book New Appointment</span>
            </button>
          </div>

          {patientAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm text-slate-600">No scheduled appointments</p>
              <p className="text-xs text-slate-400 mt-1">Click above to schedule your next visit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {patientAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] bg-white dark:bg-[var(--mc-elevated)] hover:border-slate-300 transition-all flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                >
                  <div className="flex items-start space-x-3">
                    <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700 border border-teal-100 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{apt.type} - {apt.department}</h4>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            apt.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : apt.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {apt.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        With <strong>{apt.doctorName}</strong> &bull; {apt.room ? `Room: ${apt.room}` : 'Main Clinic'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        <strong className="text-slate-700">Reason:</strong> {apt.reason}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end md:self-center">
                    <div className="text-right">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{apt.date}</div>
                      <div className="text-xs font-semibold text-teal-700">{apt.time}</div>
                    </div>

                    {apt.status === 'scheduled' && (
                      <div className="flex items-center space-x-1.5 border-l border-slate-200 pl-3">
                        <button
                          onClick={() => {
                            setSelectedAptId(apt.id);
                            setRescheduleDate(apt.date);
                            setRescheduleTime(apt.time);
                            setRescheduleModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('Are you sure you want to cancel this appointment?')) {
                              if (apiReady) {
                                await api.updateAppointment(apt.id, { status: 'cancelled' });
                                await refreshApi();
                              } else {
                                cancelAppointmentByPatient(apt.id);
                              }
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BILLING STATEMENTS & PAYMENT HISTORY */}
      {/* ======================================================== */}
      {activeTab === 'billing' && (
        <div className="space-y-6">
          {/* Summary Balance Ribbon */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-[var(--mc-elevated)] p-5 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Patient Balance Due</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                ${totalBalanceDue.toFixed(2)}
              </div>
              <span className="text-xs text-amber-600 font-medium">HSA / FSA eligible for payment</span>
            </div>

            <div className="bg-white dark:bg-[var(--mc-elevated)] p-5 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Active Insurance Payer</span>
              <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1">
                {patient.insurance.provider}
              </div>
              <span className="text-xs text-slate-500">
                Policy: {patient.insurance.policyNumber} &bull; Copay: ${patient.insurance.copay}
              </span>
            </div>

            <div className="bg-white dark:bg-[var(--mc-elevated)] p-5 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] shadow-sm">
              <span className="text-[11px] font-bold uppercase text-slate-400">Total Invoices On Record</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                {patientInvoices.length} Statements
              </div>
              <span className="text-xs text-emerald-600 font-medium">Itemized HIPAA Billing Statements</span>
            </div>
          </div>

          {/* Statements Table */}
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-slate-200 dark:border-[var(--mc-line)] p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 border-b border-slate-100 pb-3">
              Itemized Clinical Billing Statements & Claims
            </h3>

            {patientInvoices.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No billing statements available.</p>
            ) : (
              <div className="space-y-4">
                {patientInvoices.map((inv) => {
                  const balance = invoiceBalance(inv);
                  return (
                  <div
                    key={inv.id}
                    className="p-5 rounded-xl border border-slate-200 dark:border-[var(--mc-line)] bg-white dark:bg-[var(--mc-elevated)] space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">{inv.invoiceNumber}</span>
                        <span className="text-xs text-slate-500 ml-2">Issued {inv.date} &bull; Due {inv.dueDate}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                            inv.status === 'paid'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status.replace('_', ' ')}
                        </span>
                        {balance > 0 && (
                          <button
                            id={`pay-btn-${inv.id}`}
                            onClick={() => handleOpenPayment(inv)}
                            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs"
                          >
                            <DollarSign className="h-3.5 w-3.5" />
                            <span>Pay Patient Share (${balance.toFixed(2)})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Line items */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="text-slate-400 uppercase text-[10px] font-bold">
                            <th className="py-1">Description</th>
                            <th className="py-1">Service Code</th>
                            <th className="py-1">Total Charge</th>
                            <th className="py-1">Qty</th>
                            <th className="py-1">Line Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {inv.items.map((item) => (
                            <tr key={item.id}>
                              <td className="py-1.5 font-medium text-slate-800 dark:text-slate-200">{item.description}</td>
                              <td className="py-1.5 font-mono text-slate-500 text-[11px]">{item.code}</td>
                              <td className="py-1.5 text-slate-600">${item.unitPrice.toFixed(2)}</td>
                              <td className="py-1.5 text-slate-600">{item.quantity}</td>
                              <td className="py-1.5 font-bold text-slate-900 dark:text-slate-100">${item.total.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-slate-600 gap-1">
                      <span>
                        Total Billed: <strong>${inv.subtotal.toFixed(2)}</strong> &bull; Insurance Covered:{' '}
                        <strong>${inv.insuranceCovered.toFixed(2)}</strong> ({inv.insuranceClaim.status})
                      </span>
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        Patient responsibility: ${inv.patientResponsibility.toFixed(2)}
                        {balance > 0 ? ` · $${balance.toFixed(2)} due` : ' · Paid'}
                      </span>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SECURE MESSAGING */}
      {/* ======================================================== */}
      {activeTab === 'messages' && (
        <PatientMessagesPanel
          messages={portalMessages}
          patientUserId={patientUserId}
          onSend={async (recipientId, subject, body) => {
            if (apiReady) {
              await api.sendMessage({ recipientId, subject, body });
              await refreshApi();
            } else {
              sendMessage(recipientId, subject, body, false, patientUserId);
            }
          }}
          onMarkRead={async (messageId) => {
            if (apiReady) {
              await api.markMessageRead(messageId);
              await refreshApi();
            } else {
              markMessageRead(messageId);
            }
          }}
        />
      )}

      {/* ======================================================== */}
      {/* MODAL: BOOK APPOINTMENT */}
      {/* ======================================================== */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[var(--mc-line)] max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-teal-600 border-b border-slate-100 pb-3">
              <Calendar className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Schedule New Appointment</h3>
            </div>

            <form onSubmit={handleScheduleAppointment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Department:</label>
                <select
                  value={newAptDept}
                  onChange={(e) => {
                    const dept = e.target.value;
                    setNewAptDept(dept);
                    const doctor = doctorForDepartment(dept);
                    setNewAptDoctor(doctor.name);
                    setNewAptDoctorId(doctor.id);
                  }}
                  className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/50"
                >
                  <option value="Cardiology">Cardiology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="General Medicine">General Internal Medicine</option>
                  <option value="Neurology">Neurology</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Attending Physician:</label>
                <input
                  type="text"
                  value={newAptDoctor}
                  readOnly
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Preferred Date:</label>
                  <input
                    type="date"
                    value={newAptDate}
                    onChange={(e) => setNewAptDate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/50"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Time Slot:</label>
                  <select
                    value={newAptTime}
                    onChange={(e) => setNewAptTime(e.target.value)}
                    className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/50"
                  >
                    {BOOK_SLOTS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {actionError && (
                <p className="text-rose-600 text-[11px] font-semibold">{actionError}</p>
              )}

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Reason for Visit:</label>
                <textarea
                  value={newAptReason}
                  onChange={(e) => setNewAptReason(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBookModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESCHEDULE APPOINTMENT */}
      {/* ======================================================== */}
      {rescheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[var(--mc-line)] max-w-sm w-full space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base border-b border-slate-100 pb-2">
              Reschedule Appointment
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Date:</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/50"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">New Time Slot:</label>
                <select
                  value={rescheduleTime}
                  onChange={(e) => setRescheduleTime(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900/50"
                >
                  {RESCHEDULE_SLOTS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {actionError && (
              <p className="text-rose-600 text-[11px] font-semibold">{actionError}</p>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
              >
                Save New Time
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: REQUEST REFILL */}
      {/* ======================================================== */}
      {refillModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[var(--mc-line)] max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-teal-700 dark:text-teal-400 border-b border-slate-100 pb-3">
              <Pill className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Request Medication Refill</h3>
            </div>

            <form onSubmit={handleSubmitRefill} className="space-y-3 text-xs">
              <p className="text-slate-500">
                Submitting a refill request will queue an electronic prescription review directly with the network central pharmacy and your prescribing physician.
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Medication:</label>
                <input
                  type="text"
                  value={refillMedName}
                  onChange={(e) => setRefillMedName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Pharmacy Instructions:</label>
                <textarea
                  value={refillNotes}
                  onChange={(e) => setRefillNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefillModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm"
                >
                  Submit Refill Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: PAY INVOICE */}
      {/* ======================================================== */}
      {paymentModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-[var(--mc-line)] max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-emerald-600 border-b border-slate-100 pb-3">
              <CreditCard className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">Pay patient balance</h3>
            </div>

            {paymentSuccess ? (
              <div className="py-6 text-center space-y-2 animate-in zoom-in">
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">Payment Confirmed!</h4>
                <p className="text-xs text-slate-500">
                  {paymentMethod === 'hsa' ? 'HSA / FSA' : 'Card'} payment approved for $
                  {paymentReceiptAmount.toFixed(2)}.
                </p>
                {paymentReceiptId && (
                  <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 mt-2">
                    Receipt {paymentReceiptId} · {new Date().toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice:</span>
                    <span className="font-mono font-bold text-slate-800">{selectedInvoice.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Patient Due:</span>
                    <span className="text-base font-bold text-emerald-700">
                      ${invoiceBalance(selectedInvoice).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Payment Method:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('hsa')}
                      className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                        paymentMethod === 'hsa'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      HSA / FSA Account
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-lg border text-center font-semibold transition-all ${
                        paymentMethod === 'card'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Credit / Debit Card
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Card / Account Number:</label>
                  <input
                    type="text"
                    defaultValue="•••• •••• •••• 4092"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setPaymentModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPayment}
                    className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                  >
                    Authorize & Pay ${invoiceBalance(selectedInvoice).toFixed(2)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
