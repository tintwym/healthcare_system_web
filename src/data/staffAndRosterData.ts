import {
  StaffMember,
  Shift,
  TimeOffRequest,
  DepartmentStaffingRequirement,
  ExpirationNotification,
  VitalReading,
} from '../types';

export const DEPARTMENT_STAFFING_REQUIREMENTS: Record<string, DepartmentStaffingRequirement> = {
  'Emergency Department (ED)': {
    department: 'Emergency Department (ED)',
    targetNurseToPatientRatio: '1:3 (Acuity Tier II)',
    minDayStaff: 6,
    minEveningStaff: 6,
    minNightStaff: 4,
    minDoctors: 2,
    minNurses: 4,
  },
  'Intensive Care Unit (ICU)': {
    department: 'Intensive Care Unit (ICU)',
    targetNurseToPatientRatio: '1:2 (Critical Care Mandate)',
    minDayStaff: 5,
    minEveningStaff: 5,
    minNightStaff: 4,
    minDoctors: 1,
    minNurses: 4,
  },
  'Cardiology & Telemetry': {
    department: 'Cardiology & Telemetry',
    targetNurseToPatientRatio: '1:4 (Step-down Monitoring)',
    minDayStaff: 5,
    minEveningStaff: 4,
    minNightStaff: 3,
    minDoctors: 1,
    minNurses: 3,
  },
  'Surgical Suite & OR': {
    department: 'Surgical Suite & OR',
    targetNurseToPatientRatio: '1:1 (Intraoperative Scrub/Circulating)',
    minDayStaff: 6,
    minEveningStaff: 4,
    minNightStaff: 2,
    minDoctors: 3,
    minNurses: 3,
  },
  'Inpatient Pharmacy': {
    department: 'Inpatient Pharmacy',
    targetNurseToPatientRatio: 'N/A (Clinical Pharmacist Consult)',
    minDayStaff: 3,
    minEveningStaff: 2,
    minNightStaff: 1,
    minDoctors: 0,
    minNurses: 0,
  },
  'General Internal Medicine': {
    department: 'General Internal Medicine',
    targetNurseToPatientRatio: '1:5 (Med-Surg Floor Standard)',
    minDayStaff: 6,
    minEveningStaff: 5,
    minNightStaff: 3,
    minDoctors: 2,
    minNurses: 4,
  },
};

export const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'staff-001',
    userId: 'u-1',
    name: 'Dr. Aye Myat Thu',
    credentials: 'MD, FACC, FSCAI',
    role: 'doctor',
    department: 'Cardiology & Telemetry',
    title: 'Chief of Cardiology & Interventional Lead',
    specialty: 'Interventional Cardiology / Heart Failure',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'Cath Lab Suite 2 / Telemetry ICU',
    email: 'aye.myatthu@medicore.mm',
    phone: '+95 9 250 110 001',
    bleepNumber: 'EXT-4401',
    officeLocation: 'Tower A Mayangone, Suite 410',
    licenseNumber: 'MMC-C-92841',
    avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200',
    skills: ['Coronary Angiography', 'Transcatheter Valve Repair', 'Hemodynamic Monitoring', 'Echocardiography'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 8,
  },
  {
    id: 'staff-002',
    userId: 'u-2',
    name: 'Dr. Kyaw Zin Oo',
    credentials: 'MD, FACP',
    role: 'doctor',
    department: 'General Internal Medicine',
    title: 'Attending Physician & Inpatient Hospitalist',
    specialty: 'Internal Medicine / Complex Multimorbidity',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'Ward 4B Bahan Campus',
    email: 'kyaw.zinoo@medicore.mm',
    phone: '+95 9 250 110 002',
    bleepNumber: 'EXT-4402',
    officeLocation: 'Tower B Bahan, Room 218',
    licenseNumber: 'MMC-IM-84729',
    avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200',
    skills: ['Diagnostic Triage', 'Polymedication Optimization', 'Inpatient Rounding', 'Palliative Consultation'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 12,
  },
  {
    id: 'staff-003',
    name: 'Dr. Aung Kyaw Hein',
    credentials: 'MD, FACEP',
    role: 'doctor',
    department: 'Emergency Department (ED)',
    title: 'Emergency Medicine Department Director',
    specialty: 'Emergency Medicine & Resuscitation',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'Trauma Bay 1 - Emergency Red Zone',
    email: 'aung.kyawhein@medicore.mm',
    phone: '+95 9 250 110 003',
    bleepNumber: 'EXT-9111',
    officeLocation: 'Emergency Admin, Ground Level',
    licenseNumber: 'MMC-EM-55912',
    avatarUrl: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200',
    skills: ['Advanced Trauma Life Support (ATLS)', 'Point-of-Care Ultrasound (POCUS)', 'Rapid Sequence Intubation', 'Disaster Triage'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 14,
  },
  {
    id: 'staff-004',
    name: 'Dr. Thandar Win',
    credentials: 'MD, FCCP',
    role: 'doctor',
    department: 'Intensive Care Unit (ICU)',
    title: 'Lead Critical Care Intensivist',
    specialty: 'Critical Care & Pulmonology',
    availabilityStatus: 'In Surgery',
    currentShiftType: 'Day',
    currentLocation: 'ICU Bed 04 / Bronchoscopy Suite',
    email: 'thandar.win@medicore.mm',
    phone: '+95 9 250 110 004',
    bleepNumber: 'EXT-7703',
    officeLocation: 'ICU Control Desk, Level 3',
    licenseNumber: 'MMC-CC-67290',
    avatarUrl: 'https://images.unsplash.com/photo-1594824813629-45e0d4db0118?auto=format&fit=crop&q=80&w=200',
    skills: ['Mechanical Ventilation Protocols', 'Arterial / Central Line Placement', 'Septic Shock Management', 'ECMO Management'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 6,
  },
  {
    id: 'staff-005',
    userId: 'u-3',
    name: 'Daw Hnin Wai',
    credentials: 'RN',
    role: 'nurse',
    department: 'Cardiology & Telemetry',
    title: 'Cardiology Ward Charge Nurse',
    specialty: 'Cardiology Ward / Telemetry Monitoring',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'Ward 3B Bahan / Telemetry',
    email: 'hnin.wai@medicore.mm',
    phone: '+95 9 250 110 005',
    bleepNumber: 'EXT-2201',
    officeLocation: 'Ward 3B Bahan Nurses Station',
    licenseNumber: 'NMC-RN-382910',
    avatarUrl: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=200',
    skills: ['Continuous Vasoactive Infusions', 'Intra-Aortic Balloon Pump (IABP)', 'Continuous Renal Replacement Therapy (CRRT)', 'Post-Cardiac Arrest Hypothermia'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 2,
  },
  {
    id: 'staff-006',
    name: 'Ko Thura Aung',
    credentials: 'BSN, RN, CEN',
    role: 'nurse',
    department: 'Emergency Department (ED)',
    title: 'Emergency Triage Lead Nurse',
    specialty: 'Emergency Triage / Trauma Resuscitation',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Evening',
    currentLocation: 'ED Main Triage Desk',
    email: 'thura.aung@medicore.mm',
    phone: '+95 9 250 110 006',
    bleepNumber: 'EXT-2205',
    officeLocation: 'ED Triage Pod A',
    licenseNumber: 'NMC-RN-449102',
    avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200',
    skills: ['Emergency Severity Index (ESI) Triage', 'Mass Casualty Assessment', 'Defibrillation & Pacing', 'Wound Management'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 7,
  },
  {
    id: 'staff-007',
    name: 'Ma Su Myat',
    credentials: 'MSN, RN, CNOR',
    role: 'nurse',
    department: 'Surgical Suite & OR',
    title: 'Chief Operating Room Circulating Nurse',
    specialty: 'Perioperative Care & Surgical Safety',
    availabilityStatus: 'In Surgery',
    currentShiftType: 'Day',
    currentLocation: 'OR Suite 4 - Cardiac Surgery',
    email: 'su.myat@medicore.mm',
    phone: '+95 9 250 110 007',
    bleepNumber: 'EXT-3309',
    officeLocation: 'OR Surgical Control Center',
    licenseNumber: 'NMC-RN-592014',
    avatarUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=200',
    skills: ['WHO Surgical Safety Checklist', 'Sterile Field Custody', 'Instrument Count Auditing', 'Anesthesia Recovery'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 1,
  },
  {
    id: 'staff-008',
    userId: 'u-7',
    name: 'Daw Khin Sandar',
    credentials: 'PharmD, BCPS, BCGP',
    role: 'pharmacist',
    department: 'Inpatient Pharmacy',
    title: 'Lead Clinical Pharmacy Specialist',
    specialty: 'Inpatient Pharmacotherapy / Antimicrobial Stewardship',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'Central Pharmacy Dispensing Vault',
    email: 'khin.sandar@medicore.mm',
    phone: '+95 9 250 110 008',
    bleepNumber: 'EXT-5501',
    officeLocation: 'Central Inpatient Pharmacy, Level 1',
    licenseNumber: 'MMP-RPH-74912',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200',
    skills: ['Pharmacokinetic Dose Titration', 'Controlled Substance Auditing', 'Clinical Override Screening', 'Sterile Compounding (USP 797/800)'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 22,
  },
  {
    id: 'staff-009',
    name: 'Ko Myo Min',
    credentials: 'PharmD, BCOP',
    role: 'pharmacist',
    department: 'Inpatient Pharmacy',
    title: 'Staff Clinical Pharmacist',
    specialty: 'Critical Care Infusion & Oncology Compounding',
    availabilityStatus: 'On Call',
    currentShiftType: 'Evening',
    currentLocation: 'IV Cleanroom Laminar Flow Hood 2',
    email: 'myo.min@medicore.mm',
    phone: '+95 9 250 110 009',
    bleepNumber: 'EXT-5502',
    officeLocation: 'Inpatient Pharmacy Office B',
    licenseNumber: 'MMP-RPH-88219',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=200',
    skills: ['Hazardous Drug Compounding', 'TPN Calculations', 'Drug Interaction Analysis'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 15,
  },
  {
    id: 'staff-010',
    name: 'Ko Zaw Htet',
    credentials: 'BS, RRT-ACCS',
    role: 'technician',
    department: 'Intensive Care Unit (ICU)',
    title: 'Lead Respiratory Care Practitioner',
    specialty: 'Adult Critical Care Respiratory Support',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'ICU Beds 1-8 / Ventilator Hub',
    email: 'zaw.htet@medicore.mm',
    phone: '+95 9 250 110 010',
    bleepNumber: 'EXT-6602',
    officeLocation: 'Respiratory Care Department, Basement 1',
    licenseNumber: 'MRT-RCP-29104',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    skills: ['Ventilator Weaning Protocols', 'Arterial Blood Gas (ABG) Sampling', 'High-Flow Nasal Cannula (HFNC)', 'BiPAP/CPAP Titration'],
    languages: ['Myanmar', 'English'],
    activePatientCount: 9,
  },
  {
    id: 'staff-011',
    userId: 'u-4',
    name: 'U Min Thu',
    credentials: 'MHA, FACHE',
    role: 'admin',
    department: 'Hospital Administration',
    title: 'Chief Operating Officer & Clinical Lead',
    specialty: 'Healthcare Operations & Compliance',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'Executive Boardroom / Suite 600',
    email: 'min.thu@medicore.mm',
    phone: '+95 9 250 110 011',
    bleepNumber: 'EXT-1001',
    officeLocation: 'Executive Suite 601',
    licenseNumber: 'ADMIN-1002-MM',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    skills: ['Regulatory Accreditation', 'Crisis Disaster Management', 'Resource Allocation', 'HIPAA Policy Governance'],
    languages: ['Myanmar', 'English'],
  },
  {
    id: 'staff-012',
    userId: 'u-5',
    name: 'Ko Aung Ko',
    credentials: 'CPB, CPC, CRCR',
    role: 'billing',
    department: 'Revenue Cycle Management',
    title: 'Director of Hospital Billing & EDI Claims',
    specialty: 'HIPAA 837P Claims & Compliance Auditing',
    availabilityStatus: 'On Duty',
    currentShiftType: 'Day',
    currentLocation: 'Admin Block Mayangone, Floor 3',
    email: 'aung.ko@medicore.mm',
    phone: '+95 9 250 110 012',
    bleepNumber: 'EXT-305',
    officeLocation: 'Billing Suite 305',
    licenseNumber: 'RCM-5510-MM',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
    skills: ['CMS 1500 / UB-04 Auditing', 'Denial Management', 'Fee Schedule Verification', 'Prior Authorization'],
    languages: ['Myanmar', 'English'],
  },
];

// Pre-seeded shifts for the current calendar period (September 2026)
export const INITIAL_SHIFTS: Shift[] = [
  // Today: 2026-09-03
  {
    id: 'sh-001',
    staffId: 'staff-001',
    staffName: 'Dr. Aye Myat Thu',
    staffRole: 'doctor',
    department: 'Cardiology & Telemetry',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'active',
    isLead: true,
    unitLocation: 'Cath Lab Suite 2 / Telemetry ICU',
    patientAssignmentCount: 8,
    notes: 'Attending physician for telemetry cardiac patients.',
  },
  {
    id: 'sh-002',
    staffId: 'staff-002',
    staffName: 'Dr. Kyaw Zin Oo',
    staffRole: 'doctor',
    department: 'General Internal Medicine',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'active',
    isLead: true,
    unitLocation: 'Ward 4B Bahan Campus',
    patientAssignmentCount: 12,
  },
  {
    id: 'sh-003',
    staffId: 'staff-003',
    staffName: 'Dr. Aung Kyaw Hein',
    staffRole: 'doctor',
    department: 'Emergency Department (ED)',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'active',
    isLead: true,
    unitLocation: 'Trauma Bay 1',
    patientAssignmentCount: 14,
  },
  {
    id: 'sh-004',
    staffId: 'staff-004',
    staffName: 'Dr. Thandar Win',
    staffRole: 'doctor',
    department: 'Intensive Care Unit (ICU)',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'active',
    isLead: true,
    unitLocation: 'ICU Beds 01-08',
    patientAssignmentCount: 6,
  },
  {
    id: 'sh-005',
    staffId: 'staff-005',
    staffName: 'Daw Hnin Wai',
    staffRole: 'nurse',
    department: 'Cardiology & Telemetry',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'active',
    isLead: true,
    unitLocation: 'Ward 3B Bahan',
    patientAssignmentCount: 2,
    notes: 'Charge nurse on duty. Cardiology ward ratio maintained.',
  },
  {
    id: 'sh-006',
    staffId: 'staff-006',
    staffName: 'Ko Thura Aung',
    staffRole: 'nurse',
    department: 'Emergency Department (ED)',
    date: '2026-09-03',
    shiftType: 'Evening',
    startTime: '15:00',
    endTime: '23:30',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'ED Main Triage',
    patientAssignmentCount: 7,
  },
  {
    id: 'sh-007',
    staffId: 'staff-007',
    staffName: 'Ma Su Myat',
    staffRole: 'nurse',
    department: 'Surgical Suite & OR',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'active',
    isLead: false,
    unitLocation: 'OR 4 Cardiac',
    patientAssignmentCount: 1,
  },
  {
    id: 'sh-008',
    staffId: 'staff-008',
    staffName: 'Daw Khin Sandar',
    staffRole: 'pharmacist',
    department: 'Inpatient Pharmacy',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:30',
    endTime: '16:00',
    status: 'active',
    isLead: true,
    unitLocation: 'Central Pharmacy Vault',
    patientAssignmentCount: 22,
  },
  {
    id: 'sh-009',
    staffId: 'staff-009',
    staffName: 'Ko Myo Min',
    staffRole: 'pharmacist',
    department: 'Inpatient Pharmacy',
    date: '2026-09-03',
    shiftType: 'Evening',
    startTime: '15:30',
    endTime: '00:00',
    status: 'scheduled',
    isLead: false,
    unitLocation: 'Cleanroom IV Prep',
    patientAssignmentCount: 15,
  },
  {
    id: 'sh-010',
    staffId: 'staff-010',
    staffName: 'Ko Zaw Htet',
    staffRole: 'technician',
    department: 'Intensive Care Unit (ICU)',
    date: '2026-09-03',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'active',
    isLead: false,
    unitLocation: 'Ventilator Fleet & ICU Beds',
    patientAssignmentCount: 9,
  },

  // Evening & Night shifts for 2026-09-03
  {
    id: 'sh-011',
    staffId: 'staff-003',
    staffName: 'Dr. Aung Kyaw Hein',
    staffRole: 'doctor',
    department: 'Emergency Department (ED)',
    date: '2026-09-03',
    shiftType: 'On-Call',
    startTime: '15:30',
    endTime: '07:00',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'On-Call Ext. 9111',
  },
  {
    id: 'sh-012',
    staffId: 'staff-004',
    staffName: 'Dr. Thandar Win',
    staffRole: 'doctor',
    department: 'Intensive Care Unit (ICU)',
    date: '2026-09-03',
    shiftType: 'On-Call',
    startTime: '15:30',
    endTime: '07:00',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'On-Call Ext. 7703',
  },

  // Tomorrow: 2026-09-04
  {
    id: 'sh-013',
    staffId: 'staff-001',
    staffName: 'Dr. Aye Myat Thu',
    staffRole: 'doctor',
    department: 'Cardiology & Telemetry',
    date: '2026-09-04',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'Tower A Mayangone Wing',
  },
  {
    id: 'sh-014',
    staffId: 'staff-005',
    staffName: 'Daw Hnin Wai',
    staffRole: 'nurse',
    department: 'Cardiology & Telemetry',
    date: '2026-09-04',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'Ward 3B Bahan',
  },
  {
    id: 'sh-015',
    staffId: 'staff-008',
    staffName: 'Daw Khin Sandar',
    staffRole: 'pharmacist',
    department: 'Inpatient Pharmacy',
    date: '2026-09-04',
    shiftType: 'Day',
    startTime: '07:30',
    endTime: '16:00',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'Central Pharmacy',
  },
  {
    id: 'sh-016',
    staffId: 'staff-006',
    staffName: 'Ko Thura Aung',
    staffRole: 'nurse',
    department: 'Emergency Department (ED)',
    date: '2026-09-04',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'scheduled',
    isLead: false,
    unitLocation: 'ED Main Floor',
  },
  {
    id: 'sh-017',
    staffId: 'staff-002',
    staffName: 'Dr. Kyaw Zin Oo',
    staffRole: 'doctor',
    department: 'General Internal Medicine',
    date: '2026-09-04',
    shiftType: 'Day',
    startTime: '07:00',
    endTime: '15:30',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'Ward 4B',
  },

  // Saturday: 2026-09-05
  {
    id: 'sh-018',
    staffId: 'staff-001',
    staffName: 'Dr. Aye Myat Thu',
    staffRole: 'doctor',
    department: 'Cardiology & Telemetry',
    date: '2026-09-05',
    shiftType: 'On-Call',
    startTime: '08:00',
    endTime: '20:00',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'Standby / Telehealth',
  },
  {
    id: 'sh-019',
    staffId: 'staff-006',
    staffName: 'Ko Thura Aung',
    staffRole: 'nurse',
    department: 'Emergency Department (ED)',
    date: '2026-09-05',
    shiftType: 'Night',
    startTime: '23:00',
    endTime: '07:30',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'ED Night Triage',
  },
  {
    id: 'sh-020',
    staffId: 'staff-009',
    staffName: 'Ko Myo Min',
    staffRole: 'pharmacist',
    department: 'Inpatient Pharmacy',
    date: '2026-09-05',
    shiftType: 'Day',
    startTime: '08:00',
    endTime: '16:30',
    status: 'scheduled',
    isLead: true,
    unitLocation: 'Pharmacy Weekend Coverage',
  },
];

export const INITIAL_TIMEOFF_REQUESTS: TimeOffRequest[] = [
  {
    id: 'pto-001',
    staffId: 'staff-006',
    staffName: 'Ko Thura Aung',
    staffRole: 'nurse',
    department: 'Emergency Department (ED)',
    startDate: '2026-09-10',
    endDate: '2026-09-14',
    reason: 'Vacation',
    status: 'pending',
    requestedAt: '2026-09-01T10:15:00Z',
  },
  {
    id: 'pto-002',
    staffId: 'staff-002',
    staffName: 'Dr. Kyaw Zin Oo',
    staffRole: 'doctor',
    department: 'General Internal Medicine',
    startDate: '2026-09-18',
    endDate: '2026-09-22',
    reason: 'CME / Conference',
    status: 'approved',
    requestedAt: '2026-08-28T14:20:00Z',
    reviewedBy: 'U Min Thu, MHA',
    reviewNotes: 'Approved for American College of Physicians Annual Scientific Meeting.',
  },
  {
    id: 'pto-003',
    staffId: 'staff-007',
    staffName: 'Ma Su Myat',
    staffRole: 'nurse',
    department: 'Surgical Suite & OR',
    startDate: '2026-09-08',
    endDate: '2026-09-09',
    reason: 'Medical / Sick',
    status: 'approved',
    requestedAt: '2026-09-02T09:00:00Z',
    reviewedBy: 'Daw Hnin Wai, RN',
    reviewNotes: 'Short-term medical leave covered by float pool pool nurse.',
  },
  {
    id: 'pto-004',
    staffId: 'staff-009',
    staffName: 'Ko Myo Min',
    staffRole: 'pharmacist',
    department: 'Inpatient Pharmacy',
    startDate: '2026-09-25',
    endDate: '2026-09-28',
    reason: 'Personal',
    status: 'pending',
    requestedAt: '2026-09-02T16:45:00Z',
  },
];

export const INITIAL_EXPIRATION_NOTIFICATIONS: ExpirationNotification[] = [
  {
    id: 'exp-001',
    inventoryItemId: 'inv-008',
    medicationName: 'Naloxone HCl (Narcan Nasal Spray)',
    ndc: '69547-353-02',
    lotNumber: 'LOT-NX-7712',
    expirationDate: '2026-10-15',
    daysUntilExpiration: 42,
    currentStock: 45,
    severity: 'warning',
    status: 'sent',
    recipients: ['lead.pharmacist@medicore.mm', 'ed.nursing@medicore.mm'],
    sentAt: '2026-09-02T08:00:00Z',
    actionPlan: 'Expedited ward placement in High-Risk Overdose Response kits; replacement order queued.',
  },
  {
    id: 'exp-002',
    inventoryItemId: 'inv-006',
    medicationName: 'Heparin Sodium Injection',
    ndc: '00641-0400-25',
    lotNumber: 'LOT-HEP-4421',
    expirationDate: '2026-09-28',
    daysUntilExpiration: 25,
    currentStock: 18,
    severity: 'critical',
    status: 'pending',
    recipients: ['lead.pharmacist@medicore.mm', 'icu.nursing@medicore.mm', 'supplychain@medicore.mm'],
    actionPlan: 'Quarantine remaining vials by Sept 20 if unused. STAT manufacturer return RMA authorized.',
  },
  {
    id: 'exp-003',
    inventoryItemId: 'inv-003',
    medicationName: 'Morphine Sulfate Injection (C-II)',
    ndc: '00409-1762-30',
    lotNumber: 'LOT-MS-5519',
    expirationDate: '2026-11-05',
    daysUntilExpiration: 63,
    currentStock: 80,
    severity: 'advisory',
    status: 'sent',
    recipients: ['lead.pharmacist@medicore.mm', 'dea.compliance@medicore.mm'],
    sentAt: '2026-08-30T11:00:00Z',
    actionPlan: 'Surveillance cycle 60-day warning issued. Vault audit confirms full count integrity.',
  },
];

/**
 * Historical Vitals Generator
 * Generates continuous multi-day and multi-week physiological telemetry data points
 * with realistic circadian rhythms, subtle variations, and clinical spikes.
 */
export function generatePatientHistoricalVitals(
  patientId: string,
  timeframeDays: number = 7,
  baselineBP: { sys: number; dia: number } = { sys: 124, dia: 80 },
  baselineHR: number = 74,
  baselineSpO2: number = 98,
  baselineTemp: number = 98.6,
  baselineRR: number = 16
): Array<{
  timestamp: string;
  timeLabel: string;
  dateLabel: string;
  heartRate: number;
  bpSys: number;
  bpDia: number;
  map: number; // Mean Arterial Pressure = (2*DBP + SBP) / 3
  spO2: number;
  temp: number;
  respRate: number;
  isAbnormal: boolean;
  notes?: string;
}> {
  const points = [];
  const now = new Date('2026-09-03T07:00:00Z');
  
  // Sampling interval:
  // 1 day (24h) -> every 1 hour (24 points)
  // 7 days -> every 4 hours (42 points)
  // 14 days -> every 8 hours (42 points)
  // 30 days -> every 12 hours (60 points)
  let stepHours = 4;
  if (timeframeDays <= 1) stepHours = 1;
  else if (timeframeDays <= 7) stepHours = 4;
  else if (timeframeDays <= 14) stepHours = 8;
  else stepHours = 12;

  const totalPoints = Math.round((timeframeDays * 24) / stepHours);

  // Deterministic seed by patient id
  let seed = 0;
  for (let i = 0; i < patientId.length; i++) {
    seed += patientId.charCodeAt(i);
  }

  for (let i = totalPoints; i >= 0; i--) {
    const pointTime = new Date(now.getTime() - i * stepHours * 3600 * 1000);
    const hour = pointTime.getHours();

    // Circadian variation: lower HR and BP during 02:00-06:00, peak in early afternoon
    const circadian = Math.sin(((hour - 6) * Math.PI) / 12); // -1 to +1

    // Pseudo-random noise based on index and seed
    const pseudoRand1 = Math.sin(i * 1.7 + seed) * 0.5;
    const pseudoRand2 = Math.cos(i * 2.3 + seed) * 0.5;

    // Heart rate
    let hr = Math.round(baselineHR + circadian * 5 + pseudoRand1 * 8);

    // Blood pressure
    let sbp = Math.round(baselineBP.sys + circadian * 7 + pseudoRand1 * 10);
    let dbp = Math.round(baselineBP.dia + circadian * 4 + pseudoRand2 * 6);

    // SpO2
    let spo2 = Math.min(100, Math.round(baselineSpO2 + pseudoRand2 * 2));

    // Temperature
    let temp = Number((baselineTemp + circadian * 0.4 + pseudoRand1 * 0.3).toFixed(1));

    // Respiratory Rate
    let rr = Math.round(baselineRR + pseudoRand2 * 2);

    // Controlled anomaly injection to make clinical visualization meaningful
    let isAbnormal = false;
    let notes: string | undefined = undefined;

    // Inject a transient tachycardic / hypertensive episode mid-way
    if (i === Math.floor(totalPoints * 0.6)) {
      sbp += 28;
      dbp += 14;
      hr += 24;
      isAbnormal = true;
      notes = 'Patient reported mild post-exertion palpitations. Telemetry flagged sinus tachycardia.';
    } else if (i === Math.floor(totalPoints * 0.25) && baselineSpO2 <= 96) {
      spo2 = 92;
      rr += 5;
      isAbnormal = true;
      notes = 'Nocturnal desaturation event (<93% SpO2) resolved with 2L supplemental NC.';
    } else if (sbp >= 140 || hr >= 100 || spo2 < 95 || temp >= 100.4) {
      isAbnormal = true;
    }

    // Mean arterial pressure: (2*DBP + SBP) / 3
    const map = Math.round((2 * dbp + sbp) / 3);

    points.push({
      timestamp: pointTime.toISOString(),
      timeLabel: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      dateLabel: pointTime.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      heartRate: hr,
      bpSys: sbp,
      bpDia: dbp,
      map,
      spO2: spo2,
      temp,
      respRate: rr,
      isAbnormal,
      notes,
    });
  }

  return points;
}
