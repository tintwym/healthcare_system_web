import React, { useState } from 'react';
import { HospitalProvider, useHospital } from './context/HospitalContext';
import { Header } from './components/Header';
import { Sidebar, TabType } from './components/Sidebar';
import { AdminOverview } from './components/dashboard/AdminOverview';
import { VitalsDashboard } from './components/vitals/VitalsDashboard';
import { PatientRecords } from './components/patients/PatientRecords';
import { AppointmentScheduler } from './components/appointments/AppointmentScheduler';
import { BillingDashboard } from './components/billing/BillingDashboard';
import { HipaaCompliance } from './components/compliance/HipaaCompliance';
import { EhrInteroperability } from './components/ehr/EhrInteroperability';
import { SecureMessaging } from './components/messages/SecureMessaging';
import { PatientMobileApp } from './components/patient-mobile';
import { PharmacistDashboard } from './components/pharmacy/PharmacistDashboard';
import { PatientPortal } from './components/portal/PatientPortal';
import { ClinicalDecisionSupport } from './components/cds/ClinicalDecisionSupport';
import { ShiftPlanningDashboard } from './components/roster/ShiftPlanningDashboard';
import { StaffDirectory } from './components/staff/StaffDirectory';
import { RadiologyImaging } from './components/radiology/RadiologyImaging';
import { DischargeSummaryTool } from './components/discharge/DischargeSummaryTool';
import { MfaModal } from './components/mfa/MfaModal';
import { SessionTimeoutGuard } from './components/security/SessionTimeoutGuard';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  AlertTriangle,
  Bell,
  X,
  CheckCircle2,
  Radio,
} from 'lucide-react';

const HospitalAppContent: React.FC = () => {
  const {
    currentUser,
    unreadAlertCount,
    patients,
    logAudit,
    mobileSimulatorOpen,
    setMobileSimulatorOpen,
    setActiveMessageRecipientId,
    offlineStatus,
    forceOfflinePreview,
    alerts,
  } = useHospital();
  const { darkMode } = useTheme();

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [emergencyCode, setEmergencyCode] = useState('Code Blue (Cardiac Arrest)');
  const [emergencyLocation, setEmergencyLocation] = useState('ICU Bed 04 - East Wing');
  const [emergencyBroadcasting, setEmergencyBroadcasting] = useState(false);

  // If user role switches to patient or pharmacist, automatically switch to role-relevant view if on restricted tab
  React.useEffect(() => {
    if (currentUser.role === 'patient') {
      if (!['appointments', 'billing', 'messages', 'patient-portal', 'mobile-portal', 'staff-directory'].includes(activeTab)) {
        setActiveTab('patient-portal');
      }
    } else if (currentUser.role === 'pharmacist') {
      if (!['pharmacy', 'patients', 'vitals', 'cds', 'appointments', 'messages', 'hipaa', 'shift-planning', 'staff-directory'].includes(activeTab)) {
        setActiveTab('pharmacy');
      }
    }
  }, [currentUser.role, activeTab]);

  const handleBroadcastEmergency = (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyBroadcasting(true);

    logAudit(
      'EMERGENCY_OVERRIDE',
      `STAT Broadcast: ${emergencyCode} at ${emergencyLocation}`,
      'Immediate Life Safety STAT Dispatch - Facility-Wide PA & Pager Notification',
      undefined,
      undefined
    );

    setTimeout(() => {
      setEmergencyBroadcasting(false);
      setEmergencyModalOpen(false);
      alert(`🚨 STAT HOSPITAL BROADCAST INITIATED:\n${emergencyCode}\nLocation: ${emergencyLocation}\nEmergency Response Team Paged!`);
    }, 600);
  };

  // Abnormal vitals for the notification drawer (latest abnormal reading per patient)
  const criticalAlerts = patients.flatMap((p) => {
    const abnormal = [...p.vitals].reverse().find((v) => v.isAbnormal);
    return abnormal
      ? [
          {
            patient: p,
            vital: abnormal,
          },
        ]
      : [];
  });

  const systemAlerts = alerts.filter((a) => !a.acknowledged);

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const tabTitles: Record<TabType, string> = {
    overview: 'Care Network Overview',
    vitals: 'Clinician Vitals & Trends',
    patients: 'Patient Health Records',
    pharmacy: 'Pharmacy & E-Prescriptions',
    cds: 'Clinical Decision Support (CDS)',
    'shift-planning': 'Shift Planning & Rostering',
    'staff-directory': 'Care Team Directory',
    radiology: 'Radiology & Imaging (DICOM)',
    discharge: 'Automated Discharge Summaries',
    'patient-portal': 'Patient Self-Service Health Portal',
    appointments: 'Appointment Scheduler',
    billing: 'Automated Billing & Claims',
    hipaa: 'HIPAA Compliance & Audit',
    ehr: 'EHR Interoperability API',
    messages: 'Secure Communication',
    'mobile-portal': 'Patient Mobile & Monitoring',
  };

  const isOfflineView = !offlineStatus.isOnline || forceOfflinePreview;

  return (
    <div
      className={`app-shell flex h-screen w-full overflow-hidden antialiased ${
        darkMode ? 'text-slate-100' : 'text-slate-900'
      }`}
    >
      {/* Desktop Navigation Sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] h-full flex">
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileSidebarOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Column */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          activeTabTitle={tabTitles[activeTab]}
          onOpenNotifications={() => setNotificationsOpen(true)}
          onOpenEmergencyModal={() => setEmergencyModalOpen(true)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />

        {isOfflineView && (
          <div className="bg-amber-500 text-amber-950 text-center text-[11px] font-bold py-1.5 px-4 tracking-wide leading-snug whitespace-normal">
            <span className="sm:hidden">OFFLINE — cached session. Writes queue until online.</span>
            <span className="hidden sm:inline">
              OFFLINE / CACHED MODE — Working from locally persisted session data
              {offlineStatus.cachedPatientCount > 0
                ? ` (${offlineStatus.cachedPatientCount} patient charts last synced to IndexedDB)`
                : ' (IndexedDB sync pending — use Sync in the header when online)'}
              . Writes queue until connectivity returns.
            </span>
          </div>
        )}

        {/* Scrollable Main Viewport */}
        <div className="app-viewport flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {activeTab === 'overview' && <AdminOverview />}
            {activeTab === 'vitals' && <VitalsDashboard />}
            {activeTab === 'patients' && <PatientRecords />}
            {activeTab === 'pharmacy' && <PharmacistDashboard />}
            {activeTab === 'cds' && <ClinicalDecisionSupport />}
            {activeTab === 'shift-planning' && <ShiftPlanningDashboard />}
            {activeTab === 'staff-directory' && (
              <StaffDirectory
                onOpenDirectMessage={(recipientUserId) => {
                  setActiveMessageRecipientId(recipientUserId);
                  setActiveTab('messages');
                }}
              />
            )}
            {activeTab === 'radiology' && <RadiologyImaging />}
            {activeTab === 'discharge' && <DischargeSummaryTool />}
            {activeTab === 'patient-portal' && <PatientPortal />}
            {activeTab === 'appointments' && <AppointmentScheduler />}
            {activeTab === 'billing' && <BillingDashboard />}
            {activeTab === 'hipaa' && <HipaaCompliance />}
            {activeTab === 'ehr' && <EhrInteroperability />}
            {activeTab === 'messages' && <SecureMessaging />}
            {activeTab === 'mobile-portal' && <PatientMobileApp />}
          </div>
        </div>

        <footer
          className={`min-h-11 border-t px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 py-2 text-[10px] font-bold tracking-wide shrink-0 ${
            darkMode
              ? 'bg-[var(--mc-elevated)]/80 border-[var(--mc-line)] text-slate-400'
              : 'bg-white/60 border-[var(--mc-line)] text-slate-500 backdrop-blur-sm'
          }`}
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 uppercase min-w-0">
            <span>Nodes: {offlineStatus.isOnline ? '14' : '0'}</span>
            <span className={`hidden xs:inline ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>|</span>
            <span className="hidden sm:inline">Latency: {offlineStatus.isOnline ? '12ms' : 'N/A'}</span>
            <span className={`hidden sm:inline ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>|</span>
            <span className="truncate">EHR: {offlineStatus.isOnline ? 'Synced' : 'Queued'}</span>
            <span className={`hidden md:inline ${darkMode ? 'text-slate-600' : 'text-slate-300'}`}>|</span>
            <span className="hidden md:inline">HIPAA § 164.312</span>
          </div>
          <div className="uppercase text-teal-700 dark:text-teal-400 font-mono tracking-wider shrink-0">
            Medicore · v2.5.0
          </div>
        </footer>
      </main>

      {/* Mobile Simulator Slide-out Drawer / Overlay if toggled from Header */}
      {mobileSimulatorOpen && activeTab !== 'mobile-portal' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-300 dark:border-slate-700 max-w-md w-full relative max-h-[92vh] overflow-y-auto my-auto">
            <button
              onClick={() => setMobileSimulatorOpen(false)}
              className="absolute top-3 right-3 z-10 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-bold text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 rounded"
              aria-label="Close mobile preview"
            >
              &times;
            </button>
            <div className="text-center mb-2 pr-6">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">Patient Mobile App Preview</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Live monitoring & self-service client</p>
            </div>
            <PatientMobileApp previewOnly />
          </div>
        </div>
      )}

      <MfaModal />
      <SessionTimeoutGuard />

      {/* Urgent Notifications Drawer */}
      {notificationsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center space-x-2">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  Urgent Clinical Alerts ({unreadAlertCount})
                </h3>
              </div>
              <button
                onClick={() => setNotificationsOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {criticalAlerts.length === 0 && systemAlerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                  No unacknowledged critical telemetry alerts. All patient vitals within normal parameters.
                </div>
              ) : (
                <>
                  {criticalAlerts.map(({ patient, vital }) => (
                    <div
                      key={vital.id}
                      className="p-3 bg-red-50 dark:bg-red-950/40 rounded-lg border-l-4 border-red-500 flex space-x-3"
                    >
                      <div className="w-8 h-8 rounded bg-red-100 dark:bg-red-900 flex items-center justify-center text-red-600 dark:text-red-300 font-bold text-xs shrink-0">
                        {patient.room ? patient.room.slice(0, 3) : 'EM'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-red-900 dark:text-red-200 truncate">
                            {patient.firstName} {patient.lastName} ({patient.mrn})
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200 uppercase">
                            CRITICAL
                          </span>
                        </div>
                        <p className="text-xs text-red-800 dark:text-red-300 font-medium mt-0.5">
                          {vital.notes ||
                            `Abnormal vitals: HR ${vital.heartRate}, BP ${vital.bloodPressureSys}/${vital.bloodPressureDia}, SpO₂ ${vital.spO2}%, Temp ${vital.temperature}°F, RR ${vital.respRate}`}
                        </p>
                        <div className="text-[10px] text-slate-500 flex justify-between pt-1">
                          <span>Room: {patient.room}</span>
                          <span>{new Date(vital.timestamp).toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {systemAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 flex space-x-3 ${
                        alert.severity === 'critical'
                          ? 'bg-red-50 dark:bg-red-950/40 border-red-500'
                          : 'bg-amber-50 dark:bg-amber-950/40 border-amber-500'
                      }`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {alert.title}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 uppercase shrink-0">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">{alert.message}</p>
                        <div className="text-[10px] text-slate-500 pt-1">{alert.location}</div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-center">
              <button
                onClick={() => setNotificationsOpen(false)}
                className="w-full py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STAT Emergency Code Broadcast Modal */}
      {emergencyModalOpen && (
        <div className="fixed inset-0 z-50 bg-rose-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-500 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-900">
              <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400">
                <AlertTriangle className="h-6 w-6 animate-bounce" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">Facility STAT Emergency Broadcast</h3>
              </div>
              <button
                onClick={() => setEmergencyModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBroadcastEmergency} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Emergency Protocol Code</label>
                <select
                  value={emergencyCode}
                  onChange={(e) => setEmergencyCode(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-rose-300 dark:border-rose-800 font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40"
                >
                  <option value="Code Blue (Cardiac Arrest)">Code Blue (Adult Cardiac Arrest)</option>
                  <option value="Code Red (Fire / Active Smoke Hazard)">Code Red (Fire / Evacuation)</option>
                  <option value="Code STEMI (Acute Myocardial Infarction)">Code STEMI (Cath Lab Prep)</option>
                  <option value="Code Stroke (Hyperacute Neuro Triage)">Code Stroke (CT Scan Priority)</option>
                  <option value="Code Trauma (Mass Casualty Influx)">Code Trauma (Level 1 Resuscitation)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Specific Room / Location</label>
                <input
                  type="text"
                  required
                  value={emergencyLocation}
                  onChange={(e) => setEmergencyLocation(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-[11px] space-y-1 border border-rose-200 dark:border-rose-800">
                <div className="font-bold flex items-center space-x-1">
                  <Radio className="h-3.5 w-3.5 text-rose-600 animate-pulse" />
                  <span>Immediate Dispatch Action:</span>
                </div>
                <p>
                  Broadcasting this alert triggers high-priority overhead audio paging, alerts all registered clinical devices via WebSockets, and writes a tamper-evident audit record under HIPAA § 164.312 emergency override provisions.
                </p>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEmergencyModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={emergencyBroadcasting}
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-sm transition-colors disabled:opacity-50"
                >
                  {emergencyBroadcasting ? 'Broadcasting Code...' : 'Broadcast Code Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <HospitalProvider>
        <HospitalAppContent />
      </HospitalProvider>
    </ThemeProvider>
  );
}
