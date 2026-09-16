import type { TreatmentRecommendation } from '../types';

/** Static CDS guideline catalog (not patient PHI). */
export const INITIAL_TREATMENT_GUIDELINES: TreatmentRecommendation[] = [
  {
    id: 'guide-htn-001',
    condition: 'Hypertension (Stage 2 / Urgency without end-organ damage)',
    guidelineName: 'Hypertensive Urgency — Oral Agent Protocol',
    recommendation:
      'Reduce BP gradually over 24–48h. Avoid IV bolus unless true emergency. Re-check in 1 hour.',
    firstLineTherapy: 'Labetalol 200mg PO once, may repeat in 2h',
    alternativeTherapy: 'Clonidine 0.1–0.2mg PO; avoid if stroke suspected',
    contraindications: ['Active ACS', 'Acute stroke (unless permissive HTN)'],
    evidenceGrade: 'AHA 2017 / ACC',
  },
  {
    id: 'guide-afib-001',
    condition: 'Atrial Fibrillation with RVR',
    guidelineName: 'Atrial Fibrillation Rate Control',
    recommendation: 'Target resting HR <110 bpm. Consider beta-blocker or non-DHP CCB.',
    firstLineTherapy: 'Metoprolol 25mg PO BID',
    alternativeTherapy: 'Diltiazem 30mg PO QID (if no HF)',
    contraindications: ['Decompensated HF', 'High-grade AV block'],
    evidenceGrade: 'ACC/AHA/HRS 2023',
  },
];

/** Roster planning reference thresholds (not seeded staff). */
export const DEPARTMENT_STAFFING_REQUIREMENTS: Record<
  string,
  {
    department: string;
    targetNurseToPatientRatio: string;
    minDayStaff: number;
    minEveningStaff: number;
    minNightStaff: number;
    minDoctors: number;
    minNurses: number;
  }
> = {
  Cardiology: {
    department: 'Cardiology',
    targetNurseToPatientRatio: '1:4',
    minDayStaff: 4,
    minEveningStaff: 3,
    minNightStaff: 2,
    minDoctors: 2,
    minNurses: 4,
  },
  'Internal Medicine': {
    department: 'Internal Medicine',
    targetNurseToPatientRatio: '1:5',
    minDayStaff: 5,
    minEveningStaff: 4,
    minNightStaff: 3,
    minDoctors: 2,
    minNurses: 5,
  },
  Pharmacy: {
    department: 'Pharmacy',
    targetNurseToPatientRatio: '1:8',
    minDayStaff: 3,
    minEveningStaff: 2,
    minNightStaff: 1,
    minDoctors: 0,
    minNurses: 2,
  },
  'Emergency Department': {
    department: 'Emergency Department',
    targetNurseToPatientRatio: '1:3',
    minDayStaff: 6,
    minEveningStaff: 5,
    minNightStaff: 4,
    minDoctors: 3,
    minNurses: 6,
  },
};
