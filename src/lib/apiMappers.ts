import type {
  Appointment,
  AuditLog,
  Invoice,
  PatientRecord,
  SecureMessage,
  User,
  UserRole,
} from '../types';

const EMPTY_EC = { name: '', relationship: '', phone: '' };
const EMPTY_INSURANCE = {
  provider: '',
  policyNumber: '',
  groupNumber: '',
  verified: false,
  copay: 0,
};

export function mapApiPatient(raw: Record<string, unknown>): PatientRecord {
  const r = raw as any;
  return {
    id: r.id,
    mrn: r.mrn,
    firstName: r.firstName,
    lastName: r.lastName,
    dob: r.dob,
    age: r.age,
    gender: r.gender,
    bloodType: r.bloodType,
    phone: r.phone || '',
    email: r.email || '',
    address: r.address || '',
    emergencyContact: r.emergencyContact || EMPTY_EC,
    allergies: Array.isArray(r.allergies) ? r.allergies : [],
    chronicConditions: Array.isArray(r.chronicConditions) ? r.chronicConditions : [],
    primaryDoctor: r.primaryDoctor || '',
    department: r.department || '',
    room: r.room || '',
    bed: r.bed || '',
    admissionStatus: r.admissionStatus || 'Outpatient',
    admissionDate: r.admissionDate || '',
    insurance: r.insurance ? { ...EMPTY_INSURANCE, ...r.insurance } : EMPTY_INSURANCE,
    fhirId: r.fhirId || '',
    medications: Array.isArray(r.medications) ? r.medications : [],
    vitals: (Array.isArray(r.vitals) ? r.vitals : []).map((v: any) => ({
      ...v,
      timestamp: typeof v.timestamp === 'string' ? v.timestamp : new Date(v.timestamp).toISOString(),
    })),
    labResults: Array.isArray(r.labResults) ? r.labResults : [],
    clinicalNotes: Array.isArray(r.clinicalNotes) ? r.clinicalNotes : [],
  } as PatientRecord;
}

export function mapApiUser(raw: Record<string, unknown>): User {
  const r = raw as any;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: (r.role || 'doctor') as UserRole,
    department: r.department || '',
    avatarUrl: r.avatarUrl || '',
    mfaEnabled: Boolean(r.mfaEnabled),
    licenseNumber: r.licenseNumber || undefined,
  };
}

export function mapApiAppointment(raw: Record<string, unknown>): Appointment {
  const r = raw as any;
  return {
    id: r.id,
    patientId: r.patientId,
    patientName: r.patientName,
    patientMrn: r.patientMrn,
    doctorId: r.doctorId,
    doctorName: r.doctorName,
    department: r.department,
    date: r.date,
    time: r.time,
    durationMinutes: r.durationMinutes ?? r.duration ?? 30,
    type: r.type,
    status: r.status,
    priority: r.priority || 'routine',
    reason: r.reason || '',
    room: r.room || '',
    notes: r.notes || '',
    automatedBillingTriggered: Boolean(r.automatedBillingTriggered),
  } as Appointment;
}

export function mapApiInvoice(raw: Record<string, unknown>): Invoice {
  const r = raw as any;
  return {
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    patientId: r.patientId,
    patientName: r.patientName,
    patientMrn: r.patientMrn,
    appointmentId: r.appointmentId,
    date: r.date,
    dueDate: r.dueDate,
    items: Array.isArray(r.items) ? r.items : [],
    subtotal: r.subtotal ?? 0,
    insuranceAdjustment: r.insuranceAdjustment ?? 0,
    insuranceCovered: r.insuranceCovered ?? 0,
    patientResponsibility: r.patientResponsibility ?? 0,
    amountPaid: r.amountPaid ?? 0,
    status: r.status,
    insuranceClaim: r.insuranceClaim || {
      claimId: '',
      payerName: '',
      submittedDate: '',
      status: 'Submitted',
    },
    receiptId: r.receiptId,
  } as Invoice;
}

export function mapApiMessage(raw: Record<string, unknown>): SecureMessage {
  const r = raw as any;
  return {
    id: r.id,
    senderId: r.senderId,
    senderName: r.senderName,
    senderRole: r.senderRole,
    recipientId: r.recipientId,
    recipientName: r.recipientName,
    subject: r.subject,
    body: r.body,
    read: Boolean(r.read),
    isUrgent: Boolean(r.isUrgent),
    timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date(r.timestamp).toISOString(),
  } as SecureMessage;
}

export function mapApiAudit(raw: Record<string, unknown>): AuditLog {
  const r = raw as any;
  return {
    id: r.id,
    timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date(r.timestamp).toISOString(),
    userId: r.userId,
    userName: r.userName,
    userRole: r.userRole,
    action: r.action,
    resource: r.resource,
    patientId: r.patientId || undefined,
    patientName: undefined,
    ipHash: r.ipHash || 'api',
    justification: r.details || r.resource || '',
    complianceFlag: 'NORMAL',
  } as AuditLog;
}
