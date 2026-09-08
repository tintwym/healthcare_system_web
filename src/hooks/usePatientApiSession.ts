import { useCallback, useEffect, useState } from 'react';
import type { Appointment, Invoice, PatientRecord, SecureMessage } from '../types';
import { api, getApiToken, setApiToken } from '../lib/api';
import type { PatientSession } from '../components/portal/PatientLoginGate';

const EMPTY_EC = { name: '', relationship: '', phone: '' };
const EMPTY_INSURANCE = {
  provider: '',
  policyNumber: '',
  groupNumber: '',
  verified: false,
  copay: 0,
};

function mapApiPatient(raw: Record<string, unknown> | null | undefined): PatientRecord | null {
  if (!raw || typeof raw !== 'object') return null;
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

export function usePatientApiSession(session: PatientSession | null) {
  const [apiPatient, setApiPatient] = useState<PatientRecord | null>(null);
  const [apiAppointments, setApiAppointments] = useState<Appointment[] | null>(null);
  const [apiInvoices, setApiInvoices] = useState<Invoice[] | null>(null);
  const [apiMessages, setApiMessages] = useState<SecureMessage[] | null>(null);
  const [apiReady, setApiReady] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session?.token && !getApiToken()) {
      setApiReady(false);
      return;
    }
    if (session?.token) setApiToken(session.token);
    try {
      const [p, a, i, m] = await Promise.all([
        api.patientMe(),
        api.listAppointments(),
        api.listInvoices(),
        api.listMessages(),
      ]);
      setApiPatient(mapApiPatient(p as Record<string, unknown>));
      setApiAppointments(a as Appointment[]);
      setApiInvoices(
        (i as any[]).map((inv) => ({
          ...inv,
          items: inv.items || [],
          insuranceClaim: inv.insuranceClaim || {
            claimId: '',
            payerName: '',
            submittedDate: '',
            status: 'Submitted' as const,
          },
        }))
      );
      setApiMessages(m as SecureMessage[]);
      setApiReady(true);
      setApiError(null);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'API unavailable');
      setApiReady(false);
    }
  }, [session?.token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    apiPatient,
    apiAppointments,
    apiInvoices,
    apiMessages,
    apiReady,
    apiError,
    refresh,
  };
}
