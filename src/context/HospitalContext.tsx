import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  PatientRecord,
  Appointment,
  Invoice,
  AuditLog,
  UrgentAlert,
  SecureMessage,
  EhrIntegration,
  User,
  UserRole,
  VitalReading,
  InvoiceItem,
  EPrescription,
  PharmacyInventoryItem,
  TreatmentRecommendation,
  Shift,
  TimeOffRequest,
  StaffMember,
  ExpirationNotification,
  DicomStudy,
  DicomAnnotation,
  DischargeSummary,
  OfflineCacheStatus,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_APPOINTMENTS,
  INITIAL_INVOICES,
  INITIAL_AUDIT_LOGS,
  INITIAL_ALERTS,
  INITIAL_MESSAGES,
  INITIAL_EHR_INTEGRATIONS,
} from '../data/mockData';
import {
  PHARMACIST_USER,
  INITIAL_E_PRESCRIPTIONS,
  INITIAL_PHARMACY_INVENTORY,
} from '../data/pharmacyAndCdsData';
import {
  INITIAL_STAFF_MEMBERS,
  INITIAL_SHIFTS,
  INITIAL_TIMEOFF_REQUESTS,
  INITIAL_EXPIRATION_NOTIFICATIONS,
} from '../data/staffAndRosterData';
import { INITIAL_DICOM_STUDIES } from '../data/radiologyData';
import {
  syncCriticalClinicalData,
  subscribeOnlineStatus,
  getCache,
} from '../utils/offlineCache';

interface HospitalContextType {
  currentUser: User;
  switchUser: (userId: string) => void;
  users: User[];
  isMfaAuthenticated: boolean;
  mfaModalOpen: boolean;
  setMfaModalOpen: (open: boolean) => void;
  verifyMfa: (code: string) => boolean;
  requestMfaChallenge: () => void;
  lockWorkstationSession: () => void;
  
  // Patients
  patients: PatientRecord[];
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  addPatient: (patient: Omit<PatientRecord, 'id' | 'mrn' | 'vitals' | 'medications' | 'labResults' | 'clinicalNotes'>) => PatientRecord;
  updatePatient: (id: string, updates: Partial<PatientRecord>) => void;
  updatePatientProfile: (
    patientId: string,
    profile: {
      phone?: string;
      emergencyContact?: Partial<PatientRecord['emergencyContact']>;
    }
  ) => void;
  addVitalReading: (patientId: string, reading: Omit<VitalReading, 'id' | 'timestamp' | 'recordedBy'>) => void;
  addMedication: (patientId: string, med: any) => void;
  addClinicalNote: (patientId: string, note: any) => void;
  
  // Appointments
  appointments: Appointment[];
  bookAppointment: (apt: Omit<Appointment, 'id' | 'status' | 'automatedBillingTriggered'>) => Appointment;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  
  // Invoices & Billing
  invoices: Invoice[];
  createInvoice: (patientId: string, items: InvoiceItem[], appointmentId?: string) => Invoice;
  payInvoice: (invoiceId: string, amount: number) => void;
  submitInsuranceClaim: (invoiceId: string) => void;
  
  // Audit Logs & HIPAA Compliance
  auditLogs: AuditLog[];
  logAudit: (action: AuditLog['action'], resource: string, justification: string, patientId?: string, patientName?: string, complianceFlag?: AuditLog['complianceFlag']) => void;
  deIdentifyPhi: boolean;
  setDeIdentifyPhi: (val: boolean) => void;
  
  // Alerts & Push Notifications
  alerts: UrgentAlert[];
  unreadAlertCount: number;
  acknowledgeAlert: (alertId: string) => void;
  broadcastEmergencyAlert: (severity: UrgentAlert['severity'], title: string, message: string, location: string, codeColor?: 'red' | 'blue' | 'yellow') => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  
  // EHR Integrations
  ehrIntegrations: EhrIntegration[];
  syncEhrSystem: (systemId: string) => Promise<void>;
  
  // Messaging
  messages: SecureMessage[];
  sendMessage: (
    recipientId: string,
    subject: string,
    body: string,
    isUrgent?: boolean,
    senderId?: string
  ) => void;
  markMessageRead: (messageId: string) => void;
  activeMessageRecipientId: string | null;
  setActiveMessageRecipientId: (id: string | null) => void;
  
  // Patient Mobile App Simulator
  mobileSimulatorOpen: boolean;
  setMobileSimulatorOpen: (open: boolean) => void;

  // Pharmacist Module & Formulary
  ePrescriptions: EPrescription[];
  pharmacyInventory: PharmacyInventoryItem[];
  verifyPrescription: (prescriptionId: string, overrideReason?: string) => void;
  dispensePrescription: (prescriptionId: string, details: { lotNumber: string; quantity: number; notes?: string }) => void;
  rejectPrescription: (prescriptionId: string, reason: string) => void;
  holdPrescriptionForClarification: (prescriptionId: string, reason: string) => void;
  restockInventory: (itemId: string, addQuantity: number) => void;
  addEPrescription: (rx: Omit<EPrescription, 'id' | 'prescriptionNumber' | 'dispenseHistory'>) => EPrescription;
  sendPrescriptionInquiry: (prescriptionId: string, doctorId: string, question: string, suggestedAlternative?: string) => void;

  // Pharmacy Expiration Notifications
  expirationNotifications: ExpirationNotification[];
  sendExpirationNotification: (item: PharmacyInventoryItem, notificationType: 'email_and_system' | 'system_only', recipients: string[], customActionPlan?: string) => void;
  quarantineExpiringInventory: (itemId: string, lotNumber: string, reason: string) => void;

  // Shift Planning & Rostering
  shifts: Shift[];
  timeOffRequests: TimeOffRequest[];
  addShift: (shift: Omit<Shift, 'id'>) => Shift;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  requestTimeOff: (req: Omit<TimeOffRequest, 'id' | 'requestedAt' | 'status'>) => TimeOffRequest;
  reviewTimeOffRequest: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
  autoGenerateRoster: (department: string, startDate: string, daysCount: number) => void;

  // Staff Directory
  staffMembers: StaffMember[];
  updateStaffAvailability: (staffId: string, status: StaffMember['availabilityStatus']) => void;

  // Radiology & DICOM
  dicomStudies: DicomStudy[];
  addDicomAnnotation: (
    studyId: string,
    seriesId: string,
    annotation: Omit<DicomAnnotation, 'id' | 'createdAt'>
  ) => void;
  removeDicomAnnotation: (studyId: string, seriesId: string, annotationId: string) => void;
  linkStudyToPatientRecord: (studyId: string, linked: boolean) => void;

  // Discharge Summaries
  dischargeSummaries: DischargeSummary[];
  generateDischargeSummary: (
    patientId: string,
    draft: Omit<DischargeSummary, 'id' | 'generatedAt' | 'status'>
  ) => DischargeSummary;
  finalizeDischargeSummary: (summaryId: string) => void;
  transmitDischargeSummary: (summaryId: string) => void;

  // Offline-first cache
  offlineStatus: OfflineCacheStatus;
  syncOfflineCache: () => Promise<void>;
  forceOfflinePreview: boolean;
  setForceOfflinePreview: (val: boolean) => void;

  // Patient Self-Service Portal
  requestRefill: (patientId: string, medicationName: string, notes?: string) => void;
  cancelAppointmentByPatient: (appointmentId: string) => void;
  rescheduleAppointment: (appointmentId: string, newDate: string, newTime: string) => void;

  // Clinical Decision Support (CDS)
  orderDiagnosticTest: (patientId: string, testName: string, category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Radiology' | 'Cardiology' | 'Consultation', indication: string) => void;
  applyTreatmentGuideline: (patientId: string, treatment: TreatmentRecommendation) => void;
  
  // Reset
  resetToDefault: () => void;
}

const HospitalContext = createContext<HospitalContextType | undefined>(undefined);

const STORAGE_KEY = 'apex_hospital_os_v1';

export const HospitalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users] = useState<User[]>([...INITIAL_USERS, PHARMACIST_USER]);
  const [currentUserId, setCurrentUserId] = useState<string>('u-1'); // Default to Dr. Aye Myat Thu
  const [isMfaAuthenticated, setIsMfaAuthenticated] = useState<boolean>(true);
  const [mfaModalOpen, setMfaModalOpen] = useState<boolean>(false);
  const [deIdentifyPhi, setDeIdentifyPhi] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [mobileSimulatorOpen, setMobileSimulatorOpen] = useState<boolean>(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>('pat-001');

  // Load from localStorage or defaults
  const [patients, setPatients] = useState<PatientRecord[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_patients`);
    return saved ? JSON.parse(saved) : INITIAL_PATIENTS;
  });

  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_appointments`);
    return saved ? JSON.parse(saved) : INITIAL_APPOINTMENTS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_invoices`);
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_audit`);
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [alerts, setAlertS] = useState<UrgentAlert[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_alerts`);
    return saved ? JSON.parse(saved) : INITIAL_ALERTS;
  });

  const [messages, setMessages] = useState<SecureMessage[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_messages`);
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [ehrIntegrations, setEhrIntegrations] = useState<EhrIntegration[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_ehr`);
    return saved ? JSON.parse(saved) : INITIAL_EHR_INTEGRATIONS;
  });

  const [ePrescriptions, setEPrescriptions] = useState<EPrescription[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_eprescriptions`);
    return saved ? JSON.parse(saved) : INITIAL_E_PRESCRIPTIONS;
  });

  const [pharmacyInventory, setPharmacyInventory] = useState<PharmacyInventoryItem[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_inventory`);
    return saved ? JSON.parse(saved) : INITIAL_PHARMACY_INVENTORY;
  });

  const [shifts, setShifts] = useState<Shift[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_shifts`);
    return saved ? JSON.parse(saved) : INITIAL_SHIFTS;
  });

  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_timeoff`);
    return saved ? JSON.parse(saved) : INITIAL_TIMEOFF_REQUESTS;
  });

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_staff`);
    return saved ? JSON.parse(saved) : INITIAL_STAFF_MEMBERS;
  });

  const [expirationNotifications, setExpirationNotifications] = useState<ExpirationNotification[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_exp_notifications`);
    return saved ? JSON.parse(saved) : INITIAL_EXPIRATION_NOTIFICATIONS;
  });

  const [dicomStudies, setDicomStudies] = useState<DicomStudy[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_dicom`);
    return saved ? JSON.parse(saved) : INITIAL_DICOM_STUDIES;
  });

  const [dischargeSummaries, setDischargeSummaries] = useState<DischargeSummary[]>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_discharge`);
    return saved ? JSON.parse(saved) : [];
  });

  const [offlineStatus, setOfflineStatus] = useState<OfflineCacheStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncedAt: null,
    cachedPatientCount: 0,
    cachedDashboardReady: false,
    pendingSyncCount: 0,
  });
  const [forceOfflinePreview, setForceOfflinePreview] = useState(false);

  const [activeMessageRecipientId, setActiveMessageRecipientId] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_patients`, JSON.stringify(patients));
  }, [patients]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_appointments`, JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_invoices`, JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_audit`, JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_eprescriptions`, JSON.stringify(ePrescriptions));
  }, [ePrescriptions]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_inventory`, JSON.stringify(pharmacyInventory));
  }, [pharmacyInventory]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_shifts`, JSON.stringify(shifts));
  }, [shifts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_timeoff`, JSON.stringify(timeOffRequests));
  }, [timeOffRequests]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_staff`, JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_exp_notifications`, JSON.stringify(expirationNotifications));
  }, [expirationNotifications]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_dicom`, JSON.stringify(dicomStudies));
  }, [dicomStudies]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_discharge`, JSON.stringify(dischargeSummaries));
  }, [dischargeSummaries]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_alerts`, JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_messages`, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_ehr`, JSON.stringify(ehrIntegrations));
  }, [ehrIntegrations]);

  // Subscribe to browser online/offline events for offline-first UX
  useEffect(() => {
    const unsub = subscribeOnlineStatus((isOnline) => {
      setOfflineStatus((prev) => ({ ...prev, isOnline }));
    });
    // Hydrate last sync metadata from IndexedDB
    getCache<{ syncedAt: string; patientCount: number }>('meta').then((meta) => {
      if (meta?.data) {
        setOfflineStatus((prev) => ({
          ...prev,
          lastSyncedAt: meta.data.syncedAt,
          cachedPatientCount: meta.data.patientCount || 0,
          cachedDashboardReady: true,
        }));
      }
    });
    return unsub;
  }, []);

  // Auto-sync critical clinical data to IndexedDB when online state data changes
  useEffect(() => {
    if (!offlineStatus.isOnline && !forceOfflinePreview) return;
    const timer = setTimeout(() => {
      syncCriticalClinicalData({
        patients,
        appointments,
        pharmacyInventory,
        staffMembers,
        shifts,
        dicomStudies,
      }).then(({ syncedAt }) => {
        setOfflineStatus((prev) => ({
          ...prev,
          lastSyncedAt: syncedAt,
          cachedPatientCount: patients.length,
          cachedDashboardReady: true,
          pendingSyncCount: 0,
        }));
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [
    patients,
    appointments,
    pharmacyInventory,
    staffMembers,
    shifts,
    dicomStudies,
    offlineStatus.isOnline,
    forceOfflinePreview,
  ]);

  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const logAudit = (
    action: AuditLog['action'],
    resource: string,
    justification: string,
    patientId?: string,
    patientName?: string,
    complianceFlag: AuditLog['complianceFlag'] = 'NORMAL'
  ) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      resource,
      patientId,
      patientName,
      ipHash: `192.168.${Math.floor(Math.random() * 5 + 1)}.${Math.floor(Math.random() * 200 + 10)}::SHA256(${Math.random().toString(36).substr(2, 4)})`,
      justification,
      complianceFlag,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const switchUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUserId(userId);
      logAudit(
        'MFA_AUTH',
        `Role Switch to ${target.role.toUpperCase()} (${target.name})`,
        `Demonstration of RBAC profile shift with verified token`,
        undefined,
        undefined,
        'NORMAL'
      );
    }
  };

  const requestMfaChallenge = () => {
    setMfaModalOpen(true);
  };

  const lockWorkstationSession = () => {
    setIsMfaAuthenticated(false);
    setMfaModalOpen(true);
  };

  const verifyMfa = (code: string): boolean => {
    // Accepts "123456" or any 6-digit numeric string for easy demoing
    if (/^\d{6}$/.test(code)) {
      setIsMfaAuthenticated(true);
      setMfaModalOpen(false);
      logAudit(
        'MFA_AUTH',
        'Multi-Factor Authentication (TOTP Authenticator)',
        'Biometric + TOTP 6-digit cryptographic verification accepted',
        undefined,
        undefined,
        'NORMAL'
      );
      return true;
    }
    return false;
  };

  const broadcastEmergencyAlert = (
    severity: UrgentAlert['severity'],
    title: string,
    message: string,
    location: string,
    codeColor?: 'red' | 'blue' | 'yellow'
  ) => {
    const newAlert: UrgentAlert = {
      id: `alt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      severity,
      title,
      message,
      location,
      acknowledged: false,
      codeColor,
    };
    setAlertS((prev) => [newAlert, ...prev]);
    logAudit(
      'EMERGENCY_OVERRIDE',
      `Emergency Broadcast [${severity.toUpperCase()}] - ${title}`,
      `Immediate clinical dispatch to ${location}`,
      undefined,
      undefined,
      'STAT_OVERRIDE'
    );
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlertS((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? {
              ...a,
              acknowledged: true,
              acknowledgedBy: currentUser.name,
              acknowledgedAt: new Date().toISOString(),
            }
          : a
      )
    );
  };

  const addPatient = (
    patientData: Omit<PatientRecord, 'id' | 'mrn' | 'vitals' | 'medications' | 'labResults' | 'clinicalNotes'>
  ): PatientRecord => {
    const newMrn = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
    const newPatient: PatientRecord = {
      ...patientData,
      id: `pat-${Date.now()}`,
      mrn: newMrn,
      fhirId: `FHIR-PAT-${newMrn}-USA`,
      vitals: [
        {
          id: `v-${Date.now()}`,
          timestamp: new Date().toISOString(),
          heartRate: 72,
          bloodPressureSys: 120,
          bloodPressureDia: 80,
          spO2: 98,
          temperature: 98.6,
          respRate: 16,
          recordedBy: currentUser.name,
          isAbnormal: false,
        },
      ],
      medications: [],
      labResults: [],
      clinicalNotes: [],
    };
    setPatients((prev) => [newPatient, ...prev]);
    logAudit(
      'READ_EHR',
      `Patient Enrolled: ${newPatient.firstName} ${newPatient.lastName} (${newPatient.mrn})`,
      'New patient registration under HIPAA Privacy Rule 45 CFR 164.502',
      newPatient.id,
      `${newPatient.firstName} ${newPatient.lastName}`
    );
    return newPatient;
  };

  const updatePatient = (id: string, updates: Partial<PatientRecord>) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          return updated;
        }
        return p;
      })
    );
  };

  const updatePatientProfile = (
    patientId: string,
    profile: {
      phone?: string;
      emergencyContact?: Partial<PatientRecord['emergencyContact']>;
    }
  ) => {
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          phone: profile.phone ?? p.phone,
          emergencyContact: profile.emergencyContact
            ? { ...p.emergencyContact, ...profile.emergencyContact }
            : p.emergencyContact,
        };
      })
    );
    logAudit(
      'UPDATE_VITALS',
      `Patient profile self-service update (${patientId})`,
      'Patient portal demographics / emergency contact update',
      patientId
    );
  };

  const addVitalReading = (
    patientId: string,
    readingData: Omit<VitalReading, 'id' | 'timestamp' | 'recordedBy'>
  ) => {
    const isAbnormal =
      readingData.heartRate > 100 ||
      readingData.heartRate < 55 ||
      readingData.bloodPressureSys > 140 ||
      readingData.bloodPressureDia > 90 ||
      readingData.spO2 < 94 ||
      readingData.temperature > 100.4;

    const newReading: VitalReading = {
      ...readingData,
      id: `v-${Date.now()}`,
      timestamp: new Date().toISOString(),
      recordedBy: currentUser.name,
      isAbnormal,
    };

    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            vitals: [...p.vitals, newReading],
          };
        }
        return p;
      })
    );

    const targetPatient = patients.find((p) => p.id === patientId);
    const patientName = targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : 'Unknown Patient';

    logAudit(
      'UPDATE_VITALS',
      `Vitals Logged for ${patientName}: HR ${newReading.heartRate} bpm, BP ${newReading.bloodPressureSys}/${newReading.bloodPressureDia}, SpO2 ${newReading.spO2}%`,
      'Routine telemetry & bedside vital check',
      patientId,
      patientName,
      isAbnormal ? 'STAT_OVERRIDE' : 'NORMAL'
    );

    // If abnormal reading, automatically dispatch an urgent notification
    if (isAbnormal) {
      broadcastEmergencyAlert(
        'urgent',
        `Critical Vitals Alert: ${patientName}`,
        `Systolic BP: ${newReading.bloodPressureSys} mmHg, HR: ${newReading.heartRate} bpm, SpO2: ${newReading.spO2}%. Immediate clinical review recommended.`,
        targetPatient?.room || 'Outpatient Clinic',
        'yellow'
      );
    }
  };

  const addMedication = (patientId: string, med: any) => {
    const newMed = {
      ...med,
      id: `med-${Date.now()}`,
      startDate: new Date().toISOString().split('T')[0],
      prescribedBy: currentUser.name,
      status: 'active',
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            medications: [newMed, ...p.medications],
          };
        }
        return p;
      })
    );
    const targetPatient = patients.find((p) => p.id === patientId);
    logAudit(
      'UPDATE_VITALS',
      `Prescription Added: ${newMed.name} ${newMed.dosage}`,
      'Medication order and e-Prescribe transmission',
      patientId,
      targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : ''
    );
  };

  const addClinicalNote = (patientId: string, note: any) => {
    const newNote = {
      ...note,
      id: `cn-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: currentUser.name,
      authorRole: currentUser.role === 'doctor' ? 'Attending Physician' : 'Clinical Nurse',
    };
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id === patientId) {
          return {
            ...p,
            clinicalNotes: [newNote, ...p.clinicalNotes],
          };
        }
        return p;
      })
    );
    const targetPatient = patients.find((p) => p.id === patientId);
    logAudit(
      'UPDATE_VITALS',
      `SOAP Clinical Note Signed: ${newNote.title}`,
      'Encounters documentation signed with electronic signature token',
      patientId,
      targetPatient ? `${targetPatient.firstName} ${targetPatient.lastName}` : ''
    );
  };

  const bookAppointment = (
    aptData: Omit<Appointment, 'id' | 'status' | 'automatedBillingTriggered'>
  ): Appointment => {
    const newApt: Appointment = {
      ...aptData,
      id: `apt-${Date.now()}`,
      status: 'scheduled',
      automatedBillingTriggered: false,
    };
    setAppointments((prev) => [newApt, ...prev]);
    logAudit(
      'CREATE_APPOINTMENT',
      `Appointment Booked for ${newApt.patientName} with ${newApt.doctorName} (${newApt.department}) on ${newApt.date} at ${newApt.time}`,
      'Clinical scheduling coordination',
      newApt.patientId,
      newApt.patientName
    );
    return newApt;
  };

  const createInvoice = (
    patientId: string,
    items: InvoiceItem[],
    appointmentId?: string
  ): Invoice => {
    const patient = patients.find((p) => p.id === patientId);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : 'Patient';
    const patientMrn = patient ? patient.mrn : 'MRN-PENDING';

    const subtotal = items.reduce((acc, item) => acc + item.total, 0);
    // Automatic insurance calculation: 50% adjustment, 40% insurance coverage, 10% patient copay/deductible
    const insuranceAdjustment = Math.round(subtotal * 0.45);
    const insuranceCovered = Math.round((subtotal - insuranceAdjustment) * 0.8);
    const patientResponsibility = subtotal - insuranceAdjustment - insuranceCovered;

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId,
      patientName,
      patientMrn,
      appointmentId,
      date: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items,
      subtotal,
      insuranceAdjustment,
      insuranceCovered,
      patientResponsibility,
      amountPaid: 0,
      status: 'pending',
      insuranceClaim: {
        claimId: `CLM-EDI-${Math.floor(100000 + Math.random() * 900000)}`,
        payerName: patient?.insurance.provider || 'Commercial Insurance Payer',
        submittedDate: new Date().toISOString(),
        status: 'In Review',
      },
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    logAudit(
      'GENERATE_INVOICE',
      `Automated Invoice ${newInvoice.invoiceNumber} ($${newInvoice.subtotal} Subtotal, $${newInvoice.patientResponsibility} Patient Due)`,
      'HIPAA EDI-837 Healthcare Claims Generation',
      patientId,
      patientName
    );
    return newInvoice;
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments((prev) =>
      prev.map((apt) => {
        if (apt.id === id) {
          const updated = { ...apt, status };

          // If marked completed and automated billing not yet triggered, generate invoice!
          if (status === 'completed' && !apt.automatedBillingTriggered) {
            updated.automatedBillingTriggered = true;
            // Generate standard automated encounter invoice
            setTimeout(() => {
              createInvoice(
                apt.patientId,
                [
                  {
                    id: `item-${Date.now()}-1`,
                    code: '99214',
                    description: `${apt.type} - Physician Level 4 Evaluation & Management`,
                    category: 'Consultation',
                    quantity: 1,
                    unitPrice: 240,
                    total: 240,
                  },
                  {
                    id: `item-${Date.now()}-2`,
                    code: '99050',
                    description: 'Hospital Clinical Facility Fee & Diagnostic Assessment',
                    category: 'Room & Board',
                    quantity: 1,
                    unitPrice: 85,
                    total: 85,
                  },
                ],
                apt.id
              );
            }, 50);
          }
          return updated;
        }
        return apt;
      })
    );
  };

  const payInvoice = (invoiceId: string, amount: number) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          const newPaid = inv.amountPaid + amount;
          const status = newPaid >= inv.patientResponsibility ? 'paid' : 'pending';
          return {
            ...inv,
            amountPaid: newPaid,
            status,
          };
        }
        return inv;
      })
    );
    const target = invoices.find((i) => i.id === invoiceId);
    logAudit(
      'GENERATE_INVOICE',
      `Payment of MMK ${amount} recorded for Invoice ${target?.invoiceNumber}`,
      'PCI-DSS and HIPAA compliant electronic payment processing',
      target?.patientId,
      target?.patientName
    );
  };

  const submitInsuranceClaim = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            insuranceClaim: {
              ...inv.insuranceClaim,
              status: 'Approved',
              eobReference: `EOB-${Date.now().toString().slice(-6)}-EDI`,
            },
            status: inv.amountPaid >= inv.patientResponsibility ? 'paid' : 'pending',
          };
        }
        return inv;
      })
    );
    const target = invoices.find((i) => i.id === invoiceId);
    logAudit(
      'GENERATE_INVOICE',
      `Insurance Claim Approved for Invoice ${target?.invoiceNumber}`,
      'Direct EDI 835 remittance received',
      target?.patientId,
      target?.patientName
    );
  };

  const syncEhrSystem = async (systemId: string) => {
    // Set system to syncing
    setEhrIntegrations((prev) =>
      prev.map((s) => (s.id === systemId ? { ...s, status: 'Syncing' } : s))
    );

    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1400));

    setEhrIntegrations((prev) =>
      prev.map((s) =>
        s.id === systemId
          ? {
              ...s,
              status: 'Connected',
              lastSyncTime: new Date().toISOString(),
              recordsSyncedToday: s.recordsSyncedToday + 12,
              latencyMs: Math.floor(30 + Math.random() * 25),
            }
          : s
      )
    );

    const system = ehrIntegrations.find((s) => s.id === systemId);
    logAudit(
      'EXPORT_FHIR',
      `EHR Interoperability Sync: ${system?.name} (${system?.fhirVersion})`,
      'Bidirectional HL7 FHIR resource bundle synchronization',
      undefined,
      undefined,
      'NORMAL'
    );
  };

  const sendMessage = (
    recipientId: string,
    subject: string,
    body: string,
    isUrgent = false,
    senderId?: string
  ) => {
    const target = users.find((u) => u.id === recipientId);
    const sender = (senderId && users.find((u) => u.id === senderId)) || currentUser;
    const newMsg: SecureMessage = {
      id: `msg-${Date.now()}`,
      senderId: sender.id,
      senderName: sender.name,
      senderRole: sender.role === 'patient' ? 'Patient' : sender.department,
      recipientId,
      recipientName: target ? target.name : 'Care Team',
      timestamp: new Date().toISOString(),
      subject,
      body,
      read: false,
      isUrgent,
    };
    setMessages((prev) => [newMsg, ...prev]);

    if (isUrgent) {
      broadcastEmergencyAlert(
        'urgent',
        `Urgent Secure Message from ${sender.name}`,
        body.slice(0, 80) + '...',
        sender.role === 'patient' ? 'Patient Portal' : sender.department
      );
    }
  };

  const markMessageRead = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, read: true } : m))
    );
  };

  // ==========================================
  // PHARMACIST MODULE & FORMULARY HANDLERS
  // ==========================================

  const verifyPrescription = (prescriptionId: string, overrideReason?: string) => {
    setEPrescriptions((prev) =>
      prev.map((rx) => {
        if (rx.id === prescriptionId) {
          return {
            ...rx,
            status: 'verified',
            overrideReason: overrideReason || rx.overrideReason,
            overrideBy: overrideReason ? currentUser.name : rx.overrideBy,
            overrideTimestamp: overrideReason ? new Date().toISOString() : rx.overrideTimestamp,
            pharmacistNotes: overrideReason
              ? `Clinical override approved: ${overrideReason}`
              : rx.pharmacistNotes || 'Verified by pharmacist.',
          };
        }
        return rx;
      })
    );

    const targetRx = ePrescriptions.find((r) => r.id === prescriptionId);
    logAudit(
      'REVIEW_E_PRESCRIPTION',
      `e-Prescription Verified: ${targetRx?.medicationName} (${targetRx?.prescriptionNumber})`,
      overrideReason
        ? `Pharmacist Clinical Override documented: ${overrideReason}`
        : 'Pharmacist verified drug interactions, dosage, and allergy checks',
      targetRx?.patientId,
      targetRx?.patientName,
      overrideReason ? 'ELEVATED_PRIVILEGE' : 'NORMAL'
    );
  };

  const dispensePrescription = (
    prescriptionId: string,
    details: { lotNumber: string; quantity: number; notes?: string }
  ) => {
    const rx = ePrescriptions.find((r) => r.id === prescriptionId);
    if (!rx) return;

    // Deduct stock from pharmacy inventory
    setPharmacyInventory((prev) =>
      prev.map((item) => {
        if (
          item.medicationName.toLowerCase().includes(rx.genericName.toLowerCase()) ||
          rx.medicationName.toLowerCase().includes(item.genericName.toLowerCase())
        ) {
          const newStock = Math.max(0, item.currentStock - details.quantity);
          const newStatus =
            newStock === 0
              ? 'Out of Stock'
              : newStock < item.reorderThreshold
              ? 'Low Stock'
              : 'In Stock';
          return { ...item, currentStock: newStock, status: newStatus };
        }
        return item;
      })
    );

    // Create dispense event record with cryptographic digital signature hash
    const signatureHash = `SHA256:${Math.random().toString(36).substring(2, 10)}${Date.now().toString(36)}${Math.random().toString(36).substring(2, 8)}`;
    const dispenseEvent = {
      id: `disp-${Date.now()}`,
      prescriptionId: rx.id,
      timestamp: new Date().toISOString(),
      pharmacistId: currentUser.id,
      pharmacistName: currentUser.name,
      pharmacistLicense: currentUser.licenseNumber || 'MMP-RPH-74912',
      quantityDispensed: details.quantity,
      lotNumber: details.lotNumber,
      ndc: '00781-1852-20',
      expirationDate: '2027-12-31',
      patientCounselingCompleted: true,
      digitalSignatureHash: signatureHash,
    };

    setEPrescriptions((prev) =>
      prev.map((r) => {
        if (r.id === prescriptionId) {
          return {
            ...r,
            status: 'dispensed',
            refillsRemaining: Math.max(0, r.refillsRemaining - 1),
            dispenseHistory: [dispenseEvent, ...r.dispenseHistory],
            pharmacistNotes: details.notes || r.pharmacistNotes,
          };
        }
        return r;
      })
    );

    // Sync dispensed medication into patient's active EHR medications
    addMedication(rx.patientId, {
      name: rx.medicationName,
      dosage: rx.dosage,
      frequency: rx.frequency,
      route: rx.route,
      prescribedBy: rx.doctorName,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
    });

    logAudit(
      'DISPENSE_MEDICATION',
      `Medication Dispensed: ${rx.medicationName} (${details.quantity} units, Lot: ${details.lotNumber})`,
      `Final pharmacist verification and dispensing with digital signature ${signatureHash.slice(0, 16)}...`,
      rx.patientId,
      rx.patientName,
      'NORMAL'
    );
  };

  const rejectPrescription = (prescriptionId: string, reason: string) => {
    setEPrescriptions((prev) =>
      prev.map((rx) =>
        rx.id === prescriptionId
          ? { ...rx, status: 'rejected', pharmacistNotes: `Rejected by pharmacist: ${reason}` }
          : rx
      )
    );

    const rx = ePrescriptions.find((r) => r.id === prescriptionId);
    logAudit(
      'REVIEW_E_PRESCRIPTION',
      `e-Prescription Rejected: ${rx?.medicationName} (${rx?.prescriptionNumber})`,
      `Pharmacist refused dispensing due to clinical safety: ${reason}`,
      rx?.patientId,
      rx?.patientName,
      'STAT_OVERRIDE'
    );
  };

  const holdPrescriptionForClarification = (prescriptionId: string, reason: string) => {
    setEPrescriptions((prev) =>
      prev.map((rx) =>
        rx.id === prescriptionId
          ? { ...rx, status: 'held_for_clarification', pharmacistNotes: reason }
          : rx
      )
    );

    const rx = ePrescriptions.find((r) => r.id === prescriptionId);
    logAudit(
      'REVIEW_E_PRESCRIPTION',
      `Prescription Held for Physician Clarification: ${rx?.medicationName}`,
      reason,
      rx?.patientId,
      rx?.patientName,
      'NORMAL'
    );
  };

  const restockInventory = (itemId: string, addQuantity: number) => {
    setPharmacyInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newStock = item.currentStock + addQuantity;
          const newStatus =
            newStock >= item.reorderThreshold ? 'In Stock' : 'Low Stock';
          return { ...item, currentStock: newStock, status: newStatus };
        }
        return item;
      })
    );

    const item = pharmacyInventory.find((i) => i.id === itemId);
    logAudit(
      'MFA_AUTH',
      `Pharmacy Inventory Restock: ${item?.medicationName} (+${addQuantity} units)`,
      'Routine hospital formulary replenishment authorized by licensed pharmacist',
      undefined,
      undefined,
      'NORMAL'
    );
  };

  const addEPrescription = (
    rx: Omit<EPrescription, 'id' | 'prescriptionNumber' | 'dispenseHistory'>
  ): EPrescription => {
    const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newRx: EPrescription = {
      ...rx,
      id: `rx-${Date.now()}`,
      prescriptionNumber: rxNumber,
      dispenseHistory: [],
    };

    setEPrescriptions((prev) => [newRx, ...prev]);

    logAudit(
      'REVIEW_E_PRESCRIPTION',
      `New e-Prescription Received: ${newRx.medicationName} (${rxNumber})`,
      `Submitted by ${newRx.doctorName} (NPI: ${newRx.doctorNpi})`,
      newRx.patientId,
      newRx.patientName,
      'NORMAL'
    );

    return newRx;
  };

  const sendPrescriptionInquiry = (
    prescriptionId: string,
    doctorId: string,
    question: string,
    suggestedAlternative?: string
  ) => {
    const rx = ePrescriptions.find((r) => r.id === prescriptionId);
    const doctor = users.find((u) => u.id === doctorId);
    const subject = `Clinical Clarification on Rx ${rx?.prescriptionNumber || ''}: ${rx?.medicationName || ''} for ${rx?.patientName || ''}`;
    const body = `Pharmacist Inquiry:\n${question}\n\n${
      suggestedAlternative ? `Suggested Clinical Alternative:\n${suggestedAlternative}\n\n` : ''
    }Patient: ${rx?.patientName} (${rx?.patientMrn})\nAllergies: ${rx?.patientAllergies.join(', ') || 'None'}\nPrescribed Sig: ${rx?.sigInstructions || ''}`;

    sendMessage(doctorId, subject, body, true);
    holdPrescriptionForClarification(
      prescriptionId,
      `Paging prescriber ${doctor?.name || 'Physician'} regarding: ${question}`
    );
  };

  // ==========================================
  // PATIENT SELF-SERVICE PORTAL HANDLERS
  // ==========================================

  const requestRefill = (patientId: string, medicationName: string, notes?: string) => {
    const patient = patients.find((p) => p.id === patientId);
    const rx = ePrescriptions.find(
      (r) =>
        r.patientId === patientId &&
        r.medicationName.toLowerCase().includes(medicationName.toLowerCase())
    );

    const refillRx: EPrescription = {
      id: `rx-${Date.now()}`,
      prescriptionNumber: `RX-REFILL-${Math.floor(1000 + Math.random() * 9000)}`,
      patientId: patient?.id || 'pat-001',
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient',
      patientMrn: patient?.mrn || 'MRN-89412',
      patientDob: patient?.dob || '1986-11-23',
      patientAllergies: patient?.allergies || [],
      doctorId: rx?.doctorId || 'u-1',
      doctorName: rx?.doctorName || 'Dr. Aye Myat Thu, MD',
      doctorDea: rx?.doctorDea || 'BC9284102',
      doctorNpi: rx?.doctorNpi || '1093849102',
      datePrescribed: new Date().toISOString(),
      medicationName: medicationName,
      genericName: rx?.genericName || medicationName,
      dosage: rx?.dosage || 'Standard Dose',
      route: rx?.route || 'Oral (PO)',
      frequency: rx?.frequency || 'Once daily',
      quantity: rx?.quantity || 30,
      refillsAllowed: rx?.refillsAllowed || 1,
      refillsRemaining: Math.max(0, (rx?.refillsRemaining || 1) - 1),
      daysSupply: rx?.daysSupply || 30,
      icd10Diagnosis: rx?.icd10Diagnosis || 'Z76.0 - Issue of repeat prescription',
      sigInstructions: rx?.sigInstructions || 'Take as directed on original prescription.',
      status: 'pending_review',
      priority: 'routine',
      potentialInteractions: rx?.potentialInteractions || [],
      dispenseHistory: [],
      pharmacistNotes: `Patient self-service refill request initiated via Patient Portal. Notes: ${notes || 'None'}`,
    };

    setEPrescriptions((prev) => [refillRx, ...prev]);

    logAudit(
      'PATIENT_PORTAL_ACCESS',
      `Patient Refill Requested: ${medicationName}`,
      'Patient self-service portal refill submission routed to central inpatient pharmacy',
      patientId,
      patient ? `${patient.firstName} ${patient.lastName}` : undefined,
      'NORMAL'
    );
  };

  const cancelAppointmentByPatient = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
    const apt = appointments.find((a) => a.id === appointmentId);
    logAudit(
      'PATIENT_PORTAL_ACCESS',
      `Patient Cancelled Appointment: ${apt?.type} on ${apt?.date}`,
      'Patient self-service portal appointment cancellation',
      apt?.patientId,
      apt?.patientName,
      'NORMAL'
    );
  };

  const rescheduleAppointment = (appointmentId: string, newDate: string, newTime: string) => {
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.id === appointmentId
          ? { ...apt, date: newDate, time: newTime, status: 'scheduled' }
          : apt
      )
    );
    const apt = appointments.find((a) => a.id === appointmentId);
    logAudit(
      'PATIENT_PORTAL_ACCESS',
      `Patient Rescheduled Appointment: ${apt?.type} to ${newDate} at ${newTime}`,
      'Patient self-service portal appointment reschedule confirmed',
      apt?.patientId,
      apt?.patientName,
      'NORMAL'
    );
  };

  // ==========================================
  // CLINICAL DECISION SUPPORT (CDS) HANDLERS
  // ==========================================

  const orderDiagnosticTest = (
    patientId: string,
    testName: string,
    category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Radiology' | 'Cardiology' | 'Consultation',
    indication: string
  ) => {
    const newLab = {
      id: `lab-${Date.now()}`,
      testName,
      category,
      date: new Date().toISOString().split('T')[0],
      value: 'Order Dispatched - In Process',
      referenceRange: 'Clinical Specimen Collection Queued',
      status: 'normal' as const,
      notes: `CDS Indication: ${indication}`,
      orderedBy: currentUser.name,
    };

    setPatients((prev) =>
      prev.map((p) =>
        p.id === patientId ? { ...p, labResults: [newLab, ...p.labResults] } : p
      )
    );

    const patient = patients.find((p) => p.id === patientId);
    logAudit(
      'UPDATE_VITALS',
      `CDS Recommended Diagnostic Test Ordered: ${testName}`,
      `Clinical Decision Support tool order placed for indication: ${indication}`,
      patientId,
      patient ? `${patient.firstName} ${patient.lastName}` : undefined,
      'NORMAL'
    );
  };

  const applyTreatmentGuideline = (
    patientId: string,
    treatment: TreatmentRecommendation
  ) => {
    const newNote = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      author: currentUser.name,
      authorRole: currentUser.role.toUpperCase(),
      title: `CDS Guideline Plan: ${treatment.condition}`,
      soapSubjective: `Clinical decision support review for evidence-based management of MMK {treatment.condition}.`,
      soapObjective: `Referencing ${treatment.guidelineName} (${treatment.evidenceGrade}).`,
      soapAssessment: `Patient meets criteria for ${treatment.condition} clinical intervention.`,
      soapPlan: `Adopted Recommendation: ${treatment.recommendation}\nFirst-Line Regimen: ${treatment.firstLineTherapy}`,
    };

    addClinicalNote(patientId, newNote);

    const patient = patients.find((p) => p.id === patientId);
    logAudit(
      'UPDATE_VITALS',
      `CDS Clinical Guideline Plan Documented: ${treatment.guidelineName}`,
      `Evidence-based guideline recommendations adopted into patient clinical record`,
      patientId,
      patient ? `${patient.firstName} ${patient.lastName}` : undefined,
      'NORMAL'
    );
  };

  // ========================================================
  // PHARMACY EXPIRATION SURVEILLANCE & NOTIFICATIONS
  // ========================================================
  const sendExpirationNotification = (
    item: PharmacyInventoryItem,
    notificationType: 'email_and_system' | 'system_only',
    recipients: string[],
    customActionPlan?: string
  ) => {
    const today = new Date('2026-09-03');
    const expDate = new Date(item.expirationDate);
    const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    const severity: ExpirationNotification['severity'] =
      diffDays <= 30 ? 'critical' : diffDays <= 60 ? 'warning' : 'advisory';
    const actionPlan =
      customActionPlan || (diffDays <= 30 ? 'Quarantine & Return' : 'Expedite Ward Distribution');
    const sentAt = new Date().toISOString();

    setExpirationNotifications((prev) => {
      const existingIdx = prev.findIndex(
        (n) =>
          n.inventoryItemId === item.id &&
          (n.status === 'pending' || n.status === 'sent')
      );
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          daysUntilExpiration: diffDays,
          currentStock: item.currentStock,
          severity,
          status: 'sent',
          recipients,
          sentAt,
          actionPlan,
        };
        return next;
      }
      const newNotification: ExpirationNotification = {
        id: `exp-${Date.now()}`,
        inventoryItemId: item.id,
        medicationName: item.medicationName,
        ndc: item.ndc,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate,
        daysUntilExpiration: diffDays,
        currentStock: item.currentStock,
        severity,
        status: 'sent',
        recipients,
        sentAt,
        actionPlan,
      };
      return [newNotification, ...prev];
    });

    // Dispatch system alert
    broadcastEmergencyAlert(
      severity === 'critical' ? 'critical' : 'warning',
      `Medication Expiry Alert: ${item.medicationName}`,
      `Lot ${item.lotNumber} (${item.currentStock} units) expires in ${diffDays} days (${item.expirationDate}). ${actionPlan}`,
      `Pharmacy Central Vault / ${item.storageCondition}`,
      severity === 'critical' ? 'red' : 'yellow'
    );

    logAudit(
      'INVENTORY_AUDIT',
      `Pharmacy Expiration Surveillance Notification Dispatched: ${item.medicationName}`,
      `Dispatched formal ${notificationType} notification to ${recipients.join(', ')} for lot ${item.lotNumber} (Days remaining: ${diffDays})`,
      undefined,
      undefined,
      'NORMAL'
    );
  };

  const quarantineExpiringInventory = (itemId: string, lotNumber: string, reason: string) => {
    setPharmacyInventory((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            status: 'Out of Stock',
            currentStock: 0,
            lotNumber: `${lotNumber}-QUARANTINED`,
          };
        }
        return item;
      })
    );

    setExpirationNotifications((prev) =>
      prev.map((n) => (n.inventoryItemId === itemId ? { ...n, status: 'quarantined' as const } : n))
    );

    logAudit(
      'INVENTORY_AUDIT',
      `Medication Quarantined: ${itemId} (Lot: ${lotNumber})`,
      `Quarantined expiring pharmaceutical stock from active dispensing. Reason: ${reason}`,
      undefined,
      undefined,
      'ELEVATED_PRIVILEGE'
    );
  };

  // ========================================================
  // SHIFT PLANNING & STAFF ROSTERING
  // ========================================================
  const addShift = (shiftData: Omit<Shift, 'id'>): Shift => {
    const newShift: Shift = {
      ...shiftData,
      id: `sh-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };
    setShifts((prev) => [newShift, ...prev]);

    logAudit(
      'ROSTER_UPDATE',
      `Roster Shift Scheduled: ${shiftData.staffName}`,
      `Scheduled ${shiftData.shiftType} shift for ${shiftData.staffName} on ${shiftData.date} in ${shiftData.department}`,
      undefined,
      undefined,
      'NORMAL'
    );

    return newShift;
  };

  const updateShift = (id: string, updates: Partial<Shift>) => {
    setShifts((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteShift = (id: string) => {
    const target = shifts.find((s) => s.id === id);
    setShifts((prev) => prev.filter((s) => s.id !== id));

    if (target) {
      logAudit(
        'ROSTER_UPDATE',
        `Roster Shift Cancelled: ${target.staffName}`,
        `Removed ${target.shiftType} shift on ${target.date} from ${target.department}`,
        undefined,
        undefined,
        'NORMAL'
      );
    }
  };

  const requestTimeOff = (reqData: Omit<TimeOffRequest, 'id' | 'requestedAt' | 'status'>): TimeOffRequest => {
    const newReq: TimeOffRequest = {
      ...reqData,
      id: `pto-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };
    setTimeOffRequests((prev) => [newReq, ...prev]);

    logAudit(
      'ROSTER_UPDATE',
      `Time-Off Request Submitted: ${reqData.staffName}`,
      `Requested leave (${reqData.reason}) from ${reqData.startDate} to ${reqData.endDate}`,
      undefined,
      undefined,
      'NORMAL'
    );

    return newReq;
  };

  const reviewTimeOffRequest = (id: string, status: 'approved' | 'rejected', notes?: string) => {
    setTimeOffRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status,
              reviewedBy: currentUser.name,
              reviewNotes: notes || `Reviewed and ${status} by department leadership.`,
            }
          : r
      )
    );

    const targetReq = timeOffRequests.find((r) => r.id === id);
    if (targetReq) {
      logAudit(
        'ROSTER_UPDATE',
        `Time-Off Request ${status.toUpperCase()}: ${targetReq.staffName}`,
        `Administrative decision by ${currentUser.name}. Notes: ${notes || 'None'}`,
        undefined,
        undefined,
        'NORMAL'
      );
    }
  };

  const autoGenerateRoster = (department: string, startDate: string, daysCount: number = 7) => {
    const deptStaff = staffMembers.filter((s) => s.department.includes(department) || department.includes(s.department));
    if (deptStaff.length === 0) return;

    const newShifts: Shift[] = [];
    // Parse YYYY-MM-DD as local calendar date to avoid UTC day skew
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const baseDate = new Date(sy, sm - 1, sd);

    const isOnApprovedLeave = (staffId: string, dateStr: string) =>
      timeOffRequests.some(
        (r) =>
          r.staffId === staffId &&
          r.status === 'approved' &&
          dateStr >= r.startDate &&
          dateStr <= r.endDate
      );

    const formatLocalDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    for (let d = 0; d < daysCount; d++) {
      const curDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + d);
      const dateStr = formatLocalDate(curDate);

      deptStaff.forEach((staff, idx) => {
        if (isOnApprovedLeave(staff.id, dateStr)) return;

        // Simple balanced distribution
        const shiftTypes: Array<'Day' | 'Evening' | 'Night' | 'On-Call'> = ['Day', 'Evening', 'Night', 'On-Call'];
        const shiftType = shiftTypes[(idx + d) % shiftTypes.length];
        
        let startTime = '07:00';
        let endTime = '15:30';
        if (shiftType === 'Evening') {
          startTime = '15:00';
          endTime = '23:30';
        } else if (shiftType === 'Night') {
          startTime = '23:00';
          endTime = '07:30';
        } else if (shiftType === 'On-Call') {
          startTime = '08:00';
          endTime = '20:00';
        }

        newShifts.push({
          id: `sh-auto-${Date.now()}-${idx}-${d}`,
          staffId: staff.id,
          staffName: staff.name,
          staffRole: staff.role,
          department,
          date: dateStr,
          shiftType,
          startTime,
          endTime,
          status: 'scheduled',
          isLead: idx === 0,
          unitLocation: staff.officeLocation || 'Main Unit',
          notes: 'Auto-generated via algorithmic compliance balance engine.',
        });
      });
    }

    setShifts((prev) => [...newShifts, ...prev]);

    logAudit(
      'ROSTER_UPDATE',
      `Auto-Generated Roster for ${department}`,
      `Created ${newShifts.length} automated shifts covering ${daysCount} days from ${startDate}`,
      undefined,
      undefined,
      'NORMAL'
    );
  };

  // ========================================================
  // STAFF DIRECTORY AVAILABILITY UPDATE
  // ========================================================
  const updateStaffAvailability = (staffId: string, status: StaffMember['availabilityStatus']) => {
    setStaffMembers((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, availabilityStatus: status } : s))
    );
  };

  // ========================================================
  // RADIOLOGY & DICOM
  // ========================================================
  const addDicomAnnotation = (
    studyId: string,
    seriesId: string,
    annotation: Omit<DicomAnnotation, 'id' | 'createdAt'>
  ) => {
    const newAnn: DicomAnnotation = {
      ...annotation,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setDicomStudies((prev) =>
      prev.map((study) => {
        if (study.id !== studyId) return study;
        return {
          ...study,
          series: study.series.map((ser) =>
            ser.id === seriesId
              ? { ...ser, annotations: [...ser.annotations, newAnn] }
              : ser
          ),
        };
      })
    );

    const study = dicomStudies.find((s) => s.id === studyId);
    logAudit(
      'ANNOTATE_DICOM',
      `DICOM annotation added on ${study?.accessionNumber || studyId}: ${annotation.label}`,
      'Diagnostic overlay recorded for clinical communication',
      study?.patientId,
      study?.patientName
    );
  };

  const removeDicomAnnotation = (studyId: string, seriesId: string, annotationId: string) => {
    setDicomStudies((prev) =>
      prev.map((study) => {
        if (study.id !== studyId) return study;
        return {
          ...study,
          series: study.series.map((ser) =>
            ser.id === seriesId
              ? { ...ser, annotations: ser.annotations.filter((a) => a.id !== annotationId) }
              : ser
          ),
        };
      })
    );
  };

  const linkStudyToPatientRecord = (studyId: string, linked: boolean) => {
    setDicomStudies((prev) =>
      prev.map((s) => (s.id === studyId ? { ...s, linkedToChart: linked } : s))
    );
    const study = dicomStudies.find((s) => s.id === studyId);
    if (study) {
      logAudit(
        'VIEW_DICOM',
        `DICOM study ${study.accessionNumber} ${linked ? 'linked to' : 'unlinked from'} patient chart`,
        'Longitudinal imaging history association with EHR',
        study.patientId,
        study.patientName
      );
    }
  };

  // ========================================================
  // DISCHARGE SUMMARIES
  // ========================================================
  const generateDischargeSummary = (
    patientId: string,
    draft: Omit<DischargeSummary, 'id' | 'generatedAt' | 'status'>
  ): DischargeSummary => {
    const summary: DischargeSummary = {
      ...draft,
      id: `ds-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      status: 'draft',
      generatedBy: currentUser.name,
      patientId,
    };
    setDischargeSummaries((prev) => [summary, ...prev]);

    // Mark patient discharged when summary is generated for inpatient
    updatePatient(patientId, { admissionStatus: 'Discharged' });

    logAudit(
      'GENERATE_DISCHARGE_SUMMARY',
      `Discharge summary draft generated for ${summary.patientName} (${summary.patientMrn})`,
      'Automated continuity-of-care document assembled from EHR, medications, and visit notes',
      patientId,
      summary.patientName
    );

    return summary;
  };

  const finalizeDischargeSummary = (summaryId: string) => {
    setDischargeSummaries((prev) =>
      prev.map((s) => (s.id === summaryId ? { ...s, status: 'finalized' as const } : s))
    );
    const summary = dischargeSummaries.find((s) => s.id === summaryId);
    if (summary) {
      logAudit(
        'GENERATE_DISCHARGE_SUMMARY',
        `Discharge summary finalized for ${summary.patientName}`,
        'Attending electronic signature applied; document ready for transmission',
        summary.patientId,
        summary.patientName,
        'ELEVATED_PRIVILEGE'
      );
    }
  };

  const transmitDischargeSummary = (summaryId: string) => {
    setDischargeSummaries((prev) =>
      prev.map((s) => (s.id === summaryId ? { ...s, status: 'transmitted' as const } : s))
    );
    const summary = dischargeSummaries.find((s) => s.id === summaryId);
    if (summary) {
      logAudit(
        'GENERATE_DISCHARGE_SUMMARY',
        `Discharge summary transmitted to PCP ${summary.primaryCareProvider}`,
        `Secure Direct/fax delivery of HIPAA-compliant summary (Fax: ${summary.pcpFaxNumber || 'N/A'})`,
        summary.patientId,
        summary.patientName
      );
    }
  };

  // ========================================================
  // OFFLINE CACHE SYNC
  // ========================================================
  const syncOfflineCache = async () => {
    const { syncedAt } = await syncCriticalClinicalData({
      patients,
      appointments,
      pharmacyInventory,
      staffMembers,
      shifts,
      dicomStudies,
    });
    setOfflineStatus((prev) => ({
      ...prev,
      lastSyncedAt: syncedAt,
      cachedPatientCount: patients.length,
      cachedDashboardReady: true,
      pendingSyncCount: 0,
    }));
    logAudit(
      'OFFLINE_CACHE_SYNC',
      `Offline IndexedDB cache refreshed (${patients.length} patient charts)`,
      'Critical clinical dashboards and patient records synced for network-outage resilience',
      undefined,
      undefined
    );
  };

  const resetToDefault = () => {
    localStorage.removeItem(`${STORAGE_KEY}_patients`);
    localStorage.removeItem(`${STORAGE_KEY}_appointments`);
    localStorage.removeItem(`${STORAGE_KEY}_invoices`);
    localStorage.removeItem(`${STORAGE_KEY}_audit`);
    localStorage.removeItem(`${STORAGE_KEY}_alerts`);
    localStorage.removeItem(`${STORAGE_KEY}_messages`);
    localStorage.removeItem(`${STORAGE_KEY}_ehr`);
    localStorage.removeItem(`${STORAGE_KEY}_eprescriptions`);
    localStorage.removeItem(`${STORAGE_KEY}_inventory`);
    localStorage.removeItem(`${STORAGE_KEY}_shifts`);
    localStorage.removeItem(`${STORAGE_KEY}_timeoff`);
    localStorage.removeItem(`${STORAGE_KEY}_staff`);
    localStorage.removeItem(`${STORAGE_KEY}_exp_notifications`);
    localStorage.removeItem(`${STORAGE_KEY}_dicom`);
    localStorage.removeItem(`${STORAGE_KEY}_discharge`);

    setPatients(INITIAL_PATIENTS);
    setAppointments(INITIAL_APPOINTMENTS);
    setInvoices(INITIAL_INVOICES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    setAlertS(INITIAL_ALERTS);
    setMessages(INITIAL_MESSAGES);
    setEhrIntegrations(INITIAL_EHR_INTEGRATIONS);
    setEPrescriptions(INITIAL_E_PRESCRIPTIONS);
    setPharmacyInventory(INITIAL_PHARMACY_INVENTORY);
    setShifts(INITIAL_SHIFTS);
    setTimeOffRequests(INITIAL_TIMEOFF_REQUESTS);
    setStaffMembers(INITIAL_STAFF_MEMBERS);
    setExpirationNotifications(INITIAL_EXPIRATION_NOTIFICATIONS);
    setDicomStudies(INITIAL_DICOM_STUDIES);
    setDischargeSummaries([]);
    setActiveMessageRecipientId(null);
  };

  const unreadAlertCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <HospitalContext.Provider
      value={{
        currentUser,
        switchUser,
        users,
        isMfaAuthenticated,
        mfaModalOpen,
        setMfaModalOpen,
        verifyMfa,
        requestMfaChallenge,
        lockWorkstationSession,
        patients,
        selectedPatientId,
        setSelectedPatientId,
        addPatient,
        updatePatient,
        updatePatientProfile,
        addVitalReading,
        addMedication,
        addClinicalNote,
        appointments,
        bookAppointment,
        updateAppointmentStatus,
        invoices,
        createInvoice,
        payInvoice,
        submitInsuranceClaim,
        auditLogs,
        logAudit,
        deIdentifyPhi,
        setDeIdentifyPhi,
        alerts,
        unreadAlertCount,
        acknowledgeAlert,
        broadcastEmergencyAlert,
        soundEnabled,
        setSoundEnabled,
        ehrIntegrations,
        syncEhrSystem,
        messages,
        sendMessage,
        markMessageRead,
        activeMessageRecipientId,
        setActiveMessageRecipientId,
        mobileSimulatorOpen,
        setMobileSimulatorOpen,
        ePrescriptions,
        pharmacyInventory,
        verifyPrescription,
        dispensePrescription,
        rejectPrescription,
        holdPrescriptionForClarification,
        restockInventory,
        addEPrescription,
        sendPrescriptionInquiry,
        expirationNotifications,
        sendExpirationNotification,
        quarantineExpiringInventory,
        shifts,
        timeOffRequests,
        addShift,
        updateShift,
        deleteShift,
        requestTimeOff,
        reviewTimeOffRequest,
        autoGenerateRoster,
        staffMembers,
        updateStaffAvailability,
        dicomStudies,
        addDicomAnnotation,
        removeDicomAnnotation,
        linkStudyToPatientRecord,
        dischargeSummaries,
        generateDischargeSummary,
        finalizeDischargeSummary,
        transmitDischargeSummary,
        offlineStatus,
        syncOfflineCache,
        forceOfflinePreview,
        setForceOfflinePreview,
        requestRefill,
        cancelAppointmentByPatient,
        rescheduleAppointment,
        orderDiagnosticTest,
        applyTreatmentGuideline,
        resetToDefault,
      }}
    >
      {children}
    </HospitalContext.Provider>
  );
};

export const useHospital = () => {
  const context = useContext(HospitalContext);
  if (!context) {
    throw new Error('useHospital must be used within a HospitalProvider');
  }
  return context;
};
