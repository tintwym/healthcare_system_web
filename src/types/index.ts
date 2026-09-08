export type UserRole = 'admin' | 'doctor' | 'nurse' | 'billing' | 'pharmacist' | 'patient';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl: string;
  mfaEnabled: boolean;
  licenseNumber?: string;
}

export interface VitalReading {
  id: string;
  timestamp: string;
  heartRate: number; // bpm (normal: 60-100)
  bloodPressureSys: number; // mmHg (normal: 90-120)
  bloodPressureDia: number; // mmHg (normal: 60-80)
  spO2: number; // % (normal: 95-100)
  temperature: number; // °F (normal: 97.8 - 99.1)
  respRate: number; // breaths/min (normal: 12-20)
  notes?: string;
  recordedBy: string;
  isAbnormal?: boolean;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  startDate: string;
  endDate?: string;
  prescribedBy: string;
  status: 'active' | 'completed' | 'discontinued';
}

export interface LabResult {
  id: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Microbiology' | 'Radiology' | 'Cardiology' | 'Consultation';
  date: string;
  value: string;
  referenceRange: string;
  status: 'normal' | 'flagged' | 'critical';
  notes?: string;
  orderedBy: string;
}

export interface ClinicalNote {
  id: string;
  date: string;
  author: string;
  authorRole: string;
  title: string;
  soapSubjective: string;
  soapObjective: string;
  soapAssessment: string;
  soapPlan: string;
}

export interface PatientRecord {
  id: string;
  mrn: string; // Medical Record Number
  firstName: string;
  lastName: string;
  dob: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  email: string;
  address: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  allergies: string[];
  chronicConditions: string[];
  primaryDoctor: string;
  department: string;
  room?: string;
  bed?: string;
  admissionStatus: 'Outpatient' | 'Inpatient' | 'ICU' | 'Discharged' | 'Emergency';
  admissionDate?: string;
  insurance: {
    provider: string;
    policyNumber: string;
    groupNumber: string;
    verified: boolean;
    copay: number;
  };
  vitals: VitalReading[];
  medications: Medication[];
  labResults: LabResult[];
  clinicalNotes: ClinicalNote[];
  fhirId?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  doctorId: string;
  doctorName: string;
  department: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  type: 'General Checkup' | 'Follow-up' | 'Cardiology Consult' | 'Post-Op Review' | 'Diagnostic' | 'Emergency Triage' | 'Inpatient Consult';
  status: 'scheduled' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  reason: string;
  room: string;
  notes?: string;
  automatedBillingTriggered?: boolean;
}

export interface InvoiceItem {
  id: string;
  code: string; // CPT or HCPCS
  description: string;
  category: 'Consultation' | 'Laboratory' | 'Medication' | 'Room & Board' | 'Radiology' | 'Surgical';
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  appointmentId?: string;
  date: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  insuranceAdjustment: number;
  insuranceCovered: number;
  patientResponsibility: number;
  amountPaid: number;
  status: 'paid' | 'pending' | 'insurance_processing' | 'overdue';
  insuranceClaim: {
    claimId: string;
    payerName: string;
    submittedDate: string;
    status: 'Submitted' | 'In Review' | 'Approved' | 'Denied';
    eobReference?: string;
  };
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action:
    | 'READ_EHR'
    | 'UPDATE_VITALS'
    | 'CREATE_APPOINTMENT'
    | 'GENERATE_INVOICE'
    | 'EXPORT_FHIR'
    | 'MFA_AUTH'
    | 'EMERGENCY_OVERRIDE'
    | 'DISCHARGE'
    | 'REVIEW_E_PRESCRIPTION'
    | 'DISPENSE_MEDICATION'
    | 'CDS_ALERT_OVERRIDE'
    | 'PATIENT_PORTAL_ACCESS'
    | 'PAY_BILL'
    | 'EXPORT_AUDIT_LOGS'
    | 'ROSTER_UPDATE'
    | 'INVENTORY_AUDIT'
    | 'BLEEP_PAGER_DISPATCH'
    | 'GENERATE_DISCHARGE_SUMMARY'
    | 'VIEW_DICOM'
    | 'ANNOTATE_DICOM'
    | 'OFFLINE_CACHE_SYNC';
  resource: string;
  patientId?: string;
  patientName?: string;
  ipHash: string;
  justification: string;
  complianceFlag: 'NORMAL' | 'ELEVATED_PRIVILEGE' | 'STAT_OVERRIDE';
}

export interface UrgentAlert {
  id: string;
  timestamp: string;
  severity: 'critical' | 'urgent' | 'warning' | 'info';
  title: string;
  message: string;
  location: string;
  patientId?: string;
  patientName?: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  codeColor?: 'red' | 'blue' | 'yellow';
}

export interface SecureMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId: string;
  recipientName: string;
  timestamp: string;
  subject: string;
  body: string;
  read: boolean;
  isUrgent?: boolean;
}

export interface EhrIntegration {
  id: string;
  name: string;
  type: 'Epic Systems' | 'Cerner Millennium' | 'AthenaHealth' | 'Allscripts';
  status: 'Connected' | 'Syncing' | 'Offline' | 'Error';
  lastSyncTime: string;
  endpointUrl: string;
  recordsSyncedToday: number;
  latencyMs: number;
  fhirVersion: 'R4' | 'R5';
}

// ==========================================
// PHARMACIST MODULE & FORMULARY TYPES
// ==========================================

export interface DispenseEvent {
  id: string;
  prescriptionId: string;
  timestamp: string;
  pharmacistId: string;
  pharmacistName: string;
  pharmacistLicense: string;
  quantityDispensed: number;
  lotNumber: string;
  ndc: string;
  expirationDate: string;
  patientCounselingCompleted: boolean;
  digitalSignatureHash: string;
}

export interface DrugInteraction {
  id: string;
  type: 'drug_drug' | 'drug_allergy' | 'drug_condition';
  severity: 'severe' | 'moderate' | 'minor';
  title: string;
  description: string;
  clinicalRecommendation: string;
  substanceA: string;
  substanceB: string;
}

export interface EPrescription {
  id: string;
  prescriptionNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  patientDob: string;
  patientAllergies: string[];
  doctorId: string;
  doctorName: string;
  doctorDea: string;
  doctorNpi: string;
  datePrescribed: string;
  medicationName: string;
  genericName: string;
  dosage: string;
  route: string;
  frequency: string;
  quantity: number;
  refillsAllowed: number;
  refillsRemaining: number;
  daysSupply: number;
  icd10Diagnosis: string;
  sigInstructions: string;
  status: 'pending_review' | 'verified' | 'dispensed' | 'rejected' | 'held_for_clarification';
  priority: 'routine' | 'urgent' | 'stat';
  potentialInteractions: DrugInteraction[];
  dispenseHistory: DispenseEvent[];
  pharmacistNotes?: string;
  overrideReason?: string;
  overrideBy?: string;
  overrideTimestamp?: string;
}

export interface PharmacyInventoryItem {
  id: string;
  medicationName: string;
  genericName: string;
  ndc: string;
  category: 'Cardiovascular' | 'Antimicrobial' | 'Endocrine' | 'Analgesic' | 'Respiratory' | 'Central Nervous System' | 'Gastrointestinal';
  controlledSchedule: 'Non-controlled' | 'Schedule II' | 'Schedule III' | 'Schedule IV';
  dosageForm: string;
  strength: string;
  currentStock: number;
  reorderThreshold: number;
  unitCost: number;
  packageUnit: string;
  lotNumber: string;
  expirationDate: string;
  storageCondition: 'Room Temperature (15-25°C)' | 'Refrigerated (2-8°C)' | 'Controlled Narcotic Safe';
  status: 'In Stock' | 'Low Stock' | 'Reorder Required' | 'Out of Stock';
}

// ==========================================
// CLINICAL DECISION SUPPORT (CDS) TYPES
// ==========================================

export interface CdsAlert {
  id: string;
  patientId: string;
  patientName?: string;
  category: 'Drug Interaction' | 'Early Warning / Sepsis' | 'Diagnostic Testing' | 'Clinical Guideline' | 'Renal / Hepatic Dosing' | 'vital_abnormality' | 'lab_abnormality' | 'guideline_adherence';
  severity: 'critical' | 'warning' | 'advisory';
  title: string;
  message?: string;
  summary?: string;
  evidenceGrade?: 'Class I (Level A)' | 'Class I (Level B)' | 'Class IIa' | 'Expert Consensus';
  evidenceSource?: string;
  ruleId?: string;
  timestamp?: string;
  findings?: string[];
  recommendedActions: (
    | string
    | {
        label: string;
        actionType: 'order_test' | 'modify_rx' | 'consult' | 'dismiss';
        details: string;
      }
  )[];
  orderableDiagnostics?: string[];
  clinicalRationale?: string;
  guidelineSource?: string;
}

export interface CdsScore {
  name: string;
  shortName: string;
  score: number;
  maxScore: number;
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  interpretation: string;
  color: string;
  criteriaBreakdown: { parameter: string; value: string | number; points: number }[];
}

export interface DiagnosticRecommendation {
  id: string;
  testName: string;
  category: 'Hematology' | 'Biochemistry' | 'Radiology' | 'Cardiology' | 'Microbiology' | 'Consultation';
  indication: string;
  evidenceLevel: string;
  urgency: 'STAT' | 'Urgent' | 'Routine';
  ordered: boolean;
}

export interface TreatmentRecommendation {
  id: string;
  condition: string;
  guidelineName: string;
  recommendation: string;
  firstLineTherapy: string;
  alternativeTherapy?: string;
  contraindications: string[];
  evidenceGrade: string;
}

// ==========================================
// SHIFT PLANNING & STAFF ROSTERING
// ==========================================
export type ShiftType = 'Day' | 'Evening' | 'Night' | 'On-Call';
export type StaffRole = 'doctor' | 'nurse' | 'pharmacist' | 'technician' | 'admin' | 'billing';
export type StaffAvailability =
  | 'On Duty'
  | 'Available'
  | 'In Surgery'
  | 'On Break'
  | 'Busy'
  | 'On Call'
  | 'On Leave'
  | 'Off Duty';

export interface Shift {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  department: string;
  date: string; // YYYY-MM-DD
  shiftType: ShiftType;
  startTime: string; // e.g. '07:00'
  endTime: string; // e.g. '15:30'
  status: 'scheduled' | 'active' | 'completed' | 'swapped';
  isLead?: boolean;
  unitLocation?: string;
  patientAssignmentCount?: number;
  notes?: string;
}

export interface TimeOffRequest {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  department: string;
  startDate: string;
  endDate: string;
  reason: 'Vacation' | 'Medical / Sick' | 'CME / Conference' | 'Personal' | 'Family Emergency';
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewNotes?: string;
}

export interface DepartmentStaffingRequirement {
  department: string;
  targetNurseToPatientRatio: string;
  minDayStaff: number;
  minEveningStaff: number;
  minNightStaff: number;
  minDoctors: number;
  minNurses: number;
}

// ==========================================
// SEARCHABLE STAFF DIRECTORY
// ==========================================
export interface StaffMember {
  id: string;
  userId?: string; // Links to system User for messaging
  name: string;
  credentials: string; // e.g. 'MD, FACC', 'PharmD, BCPS', 'BSN, RN'
  role: StaffRole;
  department: string;
  title: string;
  specialty: string;
  availabilityStatus: StaffAvailability;
  currentShiftType?: ShiftType;
  currentLocation?: string;
  email: string;
  phone: string;
  bleepNumber: string; // Pager / Bleep
  officeLocation: string;
  licenseNumber: string;
  avatarUrl: string;
  skills: string[];
  languages: string[];
  activePatientCount?: number;
}

// ==========================================
// PHARMACY EXPIRATION SURVEILLANCE
// ==========================================
export interface ExpirationNotification {
  id: string;
  inventoryItemId: string;
  medicationName: string;
  ndc: string;
  lotNumber: string;
  expirationDate: string;
  daysUntilExpiration: number;
  currentStock: number;
  severity: 'critical' | 'warning' | 'advisory';
  status: 'pending' | 'sent' | 'quarantined' | 'disposed';
  recipients: string[];
  sentAt?: string;
  actionPlan?: string;
}

// ==========================================
// HIPAA AUDIT EXPORT OPTIONS
// ==========================================
export interface AuditExportOptions {
  format: 'pdf' | 'csv';
  password?: string;
  requirePassword?: boolean;
  filterAction?: string;
  startDate?: string;
  endDate?: string;
  deIdentifyPhi: boolean;
  includeForensicHash: boolean;
  exportReason: string;
  reviewerName: string;
}

// ==========================================
// RADIOLOGY & DICOM IMAGING
// ==========================================
export type ModalityType = 'CT' | 'MRI' | 'XR' | 'US' | 'PET' | 'MG' | 'NM';
export type StudyStatus = 'final' | 'preliminary' | 'addendum' | 'cancelled';

export interface DicomAnnotation {
  id: string;
  type: 'measurement' | 'roi' | 'arrow' | 'text' | 'findings_marker';
  label: string;
  x: number; // % of image width
  y: number; // % of image height
  width?: number;
  height?: number;
  value?: string;
  color: string;
  createdBy: string;
  createdAt: string;
}

export interface DicomSeries {
  id: string;
  seriesNumber: number;
  description: string;
  imageCount: number;
  thumbnailUrl: string;
  fullImageUrl: string;
  annotations: DicomAnnotation[];
}

export interface DicomStudy {
  id: string;
  accessionNumber: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  studyDate: string;
  studyTime: string;
  modality: ModalityType;
  bodyPart: string;
  studyDescription: string;
  referringPhysician: string;
  readingRadiologist: string;
  status: StudyStatus;
  dicomUid: string;
  series: DicomSeries[];
  reportFindings: string;
  reportImpression: string;
  linkedToChart: boolean;
  priority: 'routine' | 'urgent' | 'stat';
}

// ==========================================
// DISCHARGE SUMMARY
// ==========================================
export interface DischargeSummary {
  id: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  generatedAt: string;
  generatedBy: string;
  admissionDate: string;
  dischargeDate: string;
  admittingDiagnosis: string;
  dischargeDiagnosis: string[];
  hospitalCourse: string;
  proceduresPerformed: string[];
  dischargeMedications: {
    name: string;
    dosage: string;
    frequency: string;
    route: string;
    instructions: string;
  }[];
  allergies: string[];
  followUpInstructions: string;
  dietRestrictions: string;
  activityRestrictions: string;
  warningSignsToReturn: string[];
  primaryCareProvider: string;
  pcpFaxNumber?: string;
  attendingPhysician: string;
  status: 'draft' | 'finalized' | 'transmitted';
  hipaaAcknowledgement: boolean;
}

// ==========================================
// OFFLINE CACHE STATUS
// ==========================================
export interface OfflineCacheStatus {
  isOnline: boolean;
  lastSyncedAt: string | null;
  cachedPatientCount: number;
  cachedDashboardReady: boolean;
  pendingSyncCount: number;
}
