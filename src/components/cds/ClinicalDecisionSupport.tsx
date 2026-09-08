import React, { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Activity,
  CheckCircle2,
  HeartPulse,
  Brain,
  FileText,
  Stethoscope,
  BookOpen,
  ArrowRight,
  TrendingUp,
  FlaskConical,
  RefreshCw,
  Plus,
  Sliders,
  Check,
  Info,
  Zap,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { CdsAlert, TreatmentRecommendation, LabResult } from '../../types';
import { INITIAL_TREATMENT_GUIDELINES } from '../../data/pharmacyAndCdsData';
import { McSelect } from '../ui/McSelect';

type DiagnosticCategory = LabResult['category'];

function inferDiagnosticCategory(testName: string): DiagnosticCategory {
  const t = testName.toLowerCase();
  if (
    t.includes('ecg') ||
    t.includes('electrocardiogram') ||
    t.includes('echo') ||
    t.includes('troponin') ||
    t.includes('qtc')
  ) {
    return 'Cardiology';
  }
  if (t.includes('ct') || t.includes('x-ray') || t.includes('mri') || t.includes('imaging')) {
    return 'Radiology';
  }
  if (t.includes('culture') || t.includes('micro')) {
    return 'Microbiology';
  }
  if (
    t.includes('cbc') ||
    t.includes('blood count') ||
    t.includes('hematocrit') ||
    t.includes('hemoglobin')
  ) {
    return 'Hematology';
  }
  if (t.includes('consult') || t.includes('mtm') || t.includes('pharmacist')) {
    return 'Consultation';
  }
  return 'Biochemistry';
}

export const ClinicalDecisionSupport: React.FC = () => {
  const {
    currentUser,
    patients,
    selectedPatientId,
    setSelectedPatientId,
    orderDiagnosticTest,
    applyTreatmentGuideline,
    addVitalReading,
    logAudit,
  } = useHospital();

  const [activePatientId, setActivePatientId] = useState<string>(selectedPatientId || 'pat-001');
  const patient = patients.find((p) => p.id === activePatientId) || patients[0];

  // Simulation controls to test real-time alerts
  const [simulatedSBP, setSimulatedSBP] = useState<number>(142);
  const [simulatedDBP, setSimulatedDBP] = useState<number>(88);
  const [simulatedHR, setSimulatedHR] = useState<number>(76);
  const [simulatedRR, setSimulatedRR] = useState<number>(16);
  const [simulatedTroponin, setSimulatedTroponin] = useState<number>(0.02);
  const [simulatedPotassium, setSimulatedPotassium] = useState<number>(4.2);
  const [simulatedGlucose, setSimulatedGlucose] = useState<number>(128);

  const [guidelines] = useState<TreatmentRecommendation[]>(INITIAL_TREATMENT_GUIDELINES);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);
  const [appliedGuidelineIds, setAppliedGuidelineIds] = useState<string[]>([]);
  const [orderedLabIds, setOrderedLabIds] = useState<string[]>([]);

  // Computed Real-Time CDS Alerts based on patient history, simulated vitals and labs
  const computedAlerts: CdsAlert[] = [];

  // 1. Hypertensive Crisis / Urgency Rule
  if (simulatedSBP >= 180 || simulatedDBP >= 120) {
    computedAlerts.push({
      id: 'cds-htn-crisis',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'critical',
      category: 'vital_abnormality',
      ruleId: 'AHA-HTN-CRISIS-2024',
      title: 'CRITICAL: Hypertensive Crisis Threshold Exceeded',
      message: `Systolic BP ${simulatedSBP} mmHg / Diastolic ${simulatedDBP} mmHg exceeds acute crisis threshold (>180/120 mmHg). High risk of end-organ encephalopathy or acute aortic syndrome.`,
      evidenceSource: '2024 AHA/ACC Guideline for the Prevention, Detection, Evaluation and Management of High Blood Pressure',
      recommendedActions: [
        'Initiate continuous arterial line blood pressure monitoring',
        'Administer IV Labetalol 20mg IV bolus or IV Nicardipine infusion (5 mg/hr titrating by 2.5 mg/hr)',
        'Order STAT non-contrast head CT and 12-lead ECG to rule out end-organ damage',
      ],
      orderableDiagnostics: ['12-Lead Electrocardiogram', 'Serum Creatinine & Electrolytes', 'Non-contrast Head CT'],
      timestamp: new Date().toISOString(),
    });
  } else if (simulatedSBP >= 140 || simulatedDBP >= 90) {
    computedAlerts.push({
      id: 'cds-htn-stage2',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'warning',
      category: 'vital_abnormality',
      ruleId: 'AHA-HTN-STAGE2',
      title: 'Stage 2 Hypertension Detected',
      message: `Current BP ${simulatedSBP}/${simulatedDBP} mmHg requires optimization of antihypertensive regimen and dietary sodium restriction.`,
      evidenceSource: 'AHA/ACC Hypertension Guidelines 2024',
      recommendedActions: [
        'Re-check resting blood pressure in 15 minutes',
        'Review patient medication adherence and consider dual-agent combination therapy',
      ],
      orderableDiagnostics: ['Comprehensive Metabolic Panel (CMP)', 'Urinalysis for Microalbuminuria'],
      timestamp: new Date().toISOString(),
    });
  }

  // 2. Acute Coronary Syndrome (ACS) / Myocardial Injury Rule
  if (simulatedTroponin >= 0.04) {
    computedAlerts.push({
      id: 'cds-acs-troponin',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'critical',
      category: 'lab_abnormality',
      ruleId: 'ESC-ACC-ACS-001',
      title: 'CRITICAL: Elevated High-Sensitivity Troponin I (Myocardial Injury)',
      message: `Troponin I of ${simulatedTroponin} ng/mL exceeds the 99th percentile upper reference limit (0.04 ng/mL). Patient history of CAD elevates pre-test probability for NSTEMI / acute coronary syndrome.`,
      evidenceSource: 'Fourth Universal Definition of Myocardial Infarction (ESC/ACC/AHA 2023)',
      recommendedActions: [
        'Obtain urgent 12-lead ECG within 10 minutes',
        'Activate interventional cardiology on-call team for coronary evaluation',
        'Administer Aspirin 325 mg non-enteric coated chewable stat + unfractionated heparin',
      ],
      orderableDiagnostics: ['Repeat hs-Troponin I (1-hour delta)', 'Bedside Transthoracic Echocardiogram', '12-Lead ECG'],
      timestamp: new Date().toISOString(),
    });
  }

  // 3. Sepsis Screening (qSOFA) Rule
  let qSofaScore = 0;
  if (simulatedRR >= 22) qSofaScore++;
  if (simulatedSBP <= 100) qSofaScore++;
  if (simulatedHR >= 90) qSofaScore++;

  if (qSofaScore >= 2) {
    computedAlerts.push({
      id: 'cds-sepsis-qsofa',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'critical',
      category: 'vital_abnormality',
      ruleId: 'SURVIVING-SEPSIS-2023',
      title: 'STAT SEPSIS SCREEN: Positive qSOFA Score (High In-Hospital Mortality Risk)',
      message: `Patient meets >=2 quick SOFA criteria (RR: ${simulatedRR}/min, SBP: ${simulatedSBP} mmHg, HR: ${simulatedHR} bpm). Early sepsis bundle mandatory within 1 hour.`,
      evidenceSource: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock',
      recommendedActions: [
        'Measure serum blood lactate stat',
        'Obtain 2 sets of blood cultures prior to broad-spectrum antibiotic initiation',
        'Administer 30 mL/kg IV crystalloid fluid bolus for hypotension or lactate >= 4 mmol/L',
      ],
      orderableDiagnostics: ['Serum Lactate Stat', 'Blood Cultures x2 (Aerobic & Anaerobic)', 'Complete Blood Count with Differential'],
      timestamp: new Date().toISOString(),
    });
  }

  // 4. Potassium Electrolyte Imbalance Rule
  if (simulatedPotassium < 3.5) {
    computedAlerts.push({
      id: 'cds-hypokalemia',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'warning',
      category: 'lab_abnormality',
      ruleId: 'K-ELEC-HYPO-01',
      title: 'Hypokalemia Detected (Arrhythmia Risk)',
      message: `Serum Potassium is ${simulatedPotassium} mEq/L (Normal: 3.5 - 5.0). Risk of prolonged QTc, ventricular ectopy, and digoxin toxicity.`,
      evidenceSource: 'Clinical Guidelines for Electrolyte Replacement Therapy in Inpatient Medicine',
      recommendedActions: [
        'Check serum magnesium level (hypomagnesemia refractory potassium replenishment)',
        'Administer oral Potassium Chloride 40 mEq PO or slow IV infusion if oral route unavailable',
      ],
      orderableDiagnostics: ['Serum Magnesium Level', 'Repeat Potassium in 4 hours', '12-Lead ECG for QTc'],
      timestamp: new Date().toISOString(),
    });
  } else if (simulatedPotassium > 5.2) {
    computedAlerts.push({
      id: 'cds-hyperkalemia',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'critical',
      category: 'lab_abnormality',
      ruleId: 'K-ELEC-HYPER-02',
      title: 'CRITICAL: Hyperkalemia Detected (Fatal Cardiotoxicity Risk)',
      message: `Serum Potassium is ${simulatedPotassium} mEq/L. Risk of peaked T-waves, PR prolongation, and fatal sine wave ventricular fibrillation.`,
      evidenceSource: 'Emergency Inpatient Hyperkalemia Protocol (AHA/ACC)',
      recommendedActions: [
        'Order stat 12-lead ECG to evaluate for peaked T-waves or QRS widening',
        'Administer Calcium Gluconate 10% 10 mL IV over 2-3 minutes for cardiac membrane stabilization',
        'Shift potassium intracellularly with Regular Insulin 10 units IV + Dextrose 50% 50 mL',
      ],
      orderableDiagnostics: ['STAT 12-Lead ECG', 'Repeat Potassium Stat', 'Venous Blood Gas for Acidosis'],
      timestamp: new Date().toISOString(),
    });
  }

  // 5. Uncontrolled Hyperglycemia Rule
  if (simulatedGlucose >= 200) {
    computedAlerts.push({
      id: 'cds-hyperglycemia',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'warning',
      category: 'lab_abnormality',
      ruleId: 'ADA-GLYCEMIC-2024',
      title: 'Inpatient Hyperglycemia Exceeding Target Range',
      message: `Blood Glucose of ${simulatedGlucose} mg/dL exceeds hospital glycemic threshold (140-180 mg/dL target). Elevated infection risk and delayed tissue healing.`,
      evidenceSource: 'American Diabetes Association (ADA) Standards of Care in Hospitalized Patients',
      recommendedActions: [
        'Initiate or adjust subcutaneous basal-bolus insulin sliding scale protocol',
        'Check urine or serum ketones if patient exhibits nausea, tachypnea, or abdominal discomfort',
      ],
      orderableDiagnostics: ['Point-of-Care Blood Ketones', 'Basic Metabolic Panel', 'Glycated Hemoglobin (HbA1c)'],
      timestamp: new Date().toISOString(),
    });
  }

  // 6. Polypharmacy & Drug-Allergy Warning
  if (patient.allergies.length > 0 && patient.medications.length >= 4) {
    computedAlerts.push({
      id: 'cds-polypharmacy',
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      severity: 'advisory',
      category: 'guideline_adherence',
      ruleId: 'BEERS-CRITERIA-2023',
      title: 'Polypharmacy & Cumulative Allergy Surveillance',
      message: `Patient is actively prescribed ${patient.medications.length} concurrent medications with documented hypersensitivities (${patient.allergies.join(', ')}). Comprehensive pharmacist medication reconciliation recommended.`,
      evidenceSource: 'Beers Criteria & Deprescribing Quality Measures in Multimorbid Patients',
      recommendedActions: [
        'Request hospital pharmacist medication therapy management (MTM) consultation',
        'Verify renal dose adjustments for all active prescriptions against baseline eGFR',
      ],
      orderableDiagnostics: ['Pharmacist Inpatient MTM Consult'],
      timestamp: new Date().toISOString(),
    });
  }

  const activeAlerts = computedAlerts.filter((a) => !dismissedAlertIds.includes(a.id));

  // Handlers
  const handleAdoptGuideline = (guideline: TreatmentRecommendation) => {
    applyTreatmentGuideline(patient.id, guideline);
    setAppliedGuidelineIds((prev) => [...prev, guideline.id]);
  };

  const handleOrderDiagnostic = (testName: string, alert: CdsAlert) => {
    orderDiagnosticTest(patient.id, testName, inferDiagnosticCategory(testName), alert.title);
    setOrderedLabIds((prev) => [...prev, `${alert.id}-${testName}`]);
  };

  const handleDismissAlert = (alertId: string) => {
    setDismissedAlertIds((prev) => [...prev, alertId]);
  };

  const handleApplyPreset = (type: 'normal' | 'htn_crisis' | 'acs_mi' | 'sepsis' | 'hyperkalemia') => {
    if (type === 'normal') {
      setSimulatedSBP(120);
      setSimulatedDBP(78);
      setSimulatedHR(72);
      setSimulatedRR(14);
      setSimulatedTroponin(0.01);
      setSimulatedPotassium(4.2);
      setSimulatedGlucose(110);
    } else if (type === 'htn_crisis') {
      setSimulatedSBP(194);
      setSimulatedDBP(124);
      setSimulatedHR(88);
      setSimulatedRR(18);
    } else if (type === 'acs_mi') {
      setSimulatedTroponin(0.18);
      setSimulatedHR(104);
      setSimulatedSBP(138);
    } else if (type === 'sepsis') {
      setSimulatedRR(26);
      setSimulatedSBP(88);
      setSimulatedHR(118);
    } else if (type === 'hyperkalemia') {
      setSimulatedPotassium(6.4);
      setSimulatedHR(54);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-slate-200 dark:border-[var(--mc-line)] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-800 rounded-xl text-teal-700 dark:text-teal-300">
              <Brain className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Clinical Decision Support (CDS) & Rule Engine
                </h2>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-teal-600/10 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 uppercase tracking-wider">
                  Real-time evidence-based CDS
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Continuous physiological surveillance analyzing patient vitals, diagnostic laboratory panels, and historical diagnoses against validated AHA/ACC, KDIGO, and Surviving Sepsis clinical guidelines.
              </p>

              {/* Patient Selector */}
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs">
                <div className="mc-chip-select text-xs dark:bg-slate-800/60">
                  <span className="text-slate-500 dark:text-slate-400 font-medium shrink-0">Active Inpatient:</span>
                  <McSelect
                    value={activePatientId}
                    onChange={(id) => {
                      setActivePatientId(id);
                      setSelectedPatientId(id);
                    }}
                    options={patients.map((p) => ({
                      value: p.id,
                      label: `${p.firstName} ${p.lastName} (${p.mrn}) · ${p.age}y ${p.gender}`,
                    }))}
                    variant="ghost"
                    className="min-w-[12rem]"
                    menuClassName="min-w-[18rem]"
                    aria-label="Select active inpatient"
                  />
                </div>

                <span className="flex items-center space-x-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
                  <Stethoscope className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Attending: <strong>{patient.primaryDoctor}</strong></span>
                </span>

                <span className="flex items-center space-x-1.5 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 text-emerald-800 font-medium">
                  <Zap className="h-3.5 w-3.5" />
                  <span>Rule Engine: <strong>Active (Zero-Latency Stream)</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Simulation Presets */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-1.5 self-start lg:self-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Test Real-Time Clinical Scenarios:
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => handleApplyPreset('normal')}
                className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 font-bold text-[11px] border border-slate-200 shadow-2xs"
              >
                Normal Baseline
              </button>
              <button
                onClick={() => handleApplyPreset('htn_crisis')}
                className="px-2.5 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] border border-rose-200"
              >
                Hypertensive Crisis
              </button>
              <button
                onClick={() => handleApplyPreset('acs_mi')}
                className="px-2.5 py-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-[11px] border border-amber-200"
              >
                Troponin Elevation
              </button>
              <button
                onClick={() => handleApplyPreset('sepsis')}
                className="px-2.5 py-1 rounded bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold text-[11px] border border-teal-200 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 dark:text-teal-300 dark:border-teal-800"
              >
                qSOFA Sepsis
              </button>
              <button
                onClick={() => handleApplyPreset('hyperkalemia')}
                className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-800 font-bold text-[11px] border border-red-200"
              >
                Hyperkalemia
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Vitals & Diagnostic Lab Inputs for Live Analysis */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <Activity className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Live Clinical Parameter Telemetry (Real-Time Inputs)
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Adjust sliders to see rule engine trigger instant warnings and guideline protocols
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-4 text-xs">
          {/* SBP */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Systolic BP</label>
            <div className="text-lg font-bold text-slate-900 mt-1">{simulatedSBP} <span className="text-[10px] text-slate-400">mmHg</span></div>
            <input
              type="range"
              min={80}
              max={230}
              value={simulatedSBP}
              onChange={(e) => setSimulatedSBP(Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
          </div>

          {/* DBP */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Diastolic BP</label>
            <div className="text-lg font-bold text-slate-900 mt-1">{simulatedDBP} <span className="text-[10px] text-slate-400">mmHg</span></div>
            <input
              type="range"
              min={50}
              max={140}
              value={simulatedDBP}
              onChange={(e) => setSimulatedDBP(Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Heart Rate */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Heart Rate</label>
            <div className="text-lg font-bold text-slate-900 mt-1">{simulatedHR} <span className="text-[10px] text-slate-400">bpm</span></div>
            <input
              type="range"
              min={40}
              max={160}
              value={simulatedHR}
              onChange={(e) => setSimulatedHR(Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Respiratory Rate */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Resp Rate</label>
            <div className="text-lg font-bold text-slate-900 mt-1">{simulatedRR} <span className="text-[10px] text-slate-400">/min</span></div>
            <input
              type="range"
              min={10}
              max={40}
              value={simulatedRR}
              onChange={(e) => setSimulatedRR(Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
          </div>

          {/* hs-Troponin I */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">hs-Troponin I</label>
            <div className="text-lg font-bold text-slate-900 mt-1">{simulatedTroponin.toFixed(2)} <span className="text-[10px] text-slate-400">ng/mL</span></div>
            <input
              type="range"
              min={0.01}
              max={0.5}
              step={0.01}
              value={simulatedTroponin}
              onChange={(e) => setSimulatedTroponin(Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Potassium */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Potassium (K+)</label>
            <div className="text-lg font-bold text-slate-900 mt-1">{simulatedPotassium.toFixed(1)} <span className="text-[10px] text-slate-400">mEq/L</span></div>
            <input
              type="range"
              min={2.5}
              max={7.5}
              step={0.1}
              value={simulatedPotassium}
              onChange={(e) => setSimulatedPotassium(Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
          </div>

          {/* Glucose */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-[11px] font-bold text-slate-500 uppercase">Blood Glucose</label>
            <div className="text-lg font-bold text-slate-900 mt-1">{simulatedGlucose} <span className="text-[10px] text-slate-400">mg/dL</span></div>
            <input
              type="range"
              min={60}
              max={350}
              value={simulatedGlucose}
              onChange={(e) => setSimulatedGlucose(Number(e.target.value))}
              className="w-full mt-2 accent-teal-600 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Real-time Generated CDS Alerts */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="h-5 w-5 text-rose-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Active Clinical Decision Alerts ({activeAlerts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Continuous surveillance & automatic safety triggers
          </span>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="bg-white rounded-xl border border-emerald-200 p-8 text-center text-emerald-800 shadow-sm">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="font-bold text-sm">All Clinical Parameters Within Target Range</h4>
            <p className="text-xs text-emerald-600 mt-1">
              No active warnings, acute contraindications, or critical alerts flagged for {patient.firstName} {patient.lastName}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const isCritical = alert.severity === 'critical';
              const isWarning = alert.severity === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-5 shadow-sm transition-all bg-white ${
                    isCritical
                      ? 'border-rose-300 ring-1 ring-rose-200'
                      : isWarning
                      ? 'border-amber-300'
                      : 'border-blue-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {alert.severity} Priority
                        </span>

                        <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Rule: {alert.ruleId}
                        </span>

                        <span className="text-xs text-slate-400">
                          Triggered {new Date(alert.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900">{alert.title}</h4>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">
                        {alert.message}
                      </p>

                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600">
                        <strong className="text-slate-900 block mb-0.5">Evidence & Clinical Guidance:</strong>
                        <span>{alert.evidenceSource}</span>
                      </div>

                      {/* Recommended Actions */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-bold text-slate-900 uppercase">
                          Recommended Protocol Actions:
                        </span>
                        <ul className="space-y-1 text-xs text-slate-700 list-disc list-inside">
                          {alert.recommendedActions.map((act, i) => (
                            <li key={i} className="leading-snug">
                              {typeof act === 'string' ? act : `${act.label} — ${act.details}`}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Orderable Diagnostics directly from alert */}
                      {alert.orderableDiagnostics && alert.orderableDiagnostics.length > 0 && (
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-bold text-slate-500 uppercase">
                            Direct Diagnostic Orders:
                          </span>
                          {alert.orderableDiagnostics.map((testName, i) => {
                            const isOrdered = orderedLabIds.includes(`${alert.id}-${testName}`);
                            return (
                              <button
                                key={i}
                                disabled={isOrdered}
                                onClick={() => handleOrderDiagnostic(testName, alert)}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                                  isOrdered
                                    ? 'bg-emerald-100 text-emerald-800 cursor-default'
                                    : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                                }`}
                              >
                                {isOrdered ? (
                                  <>
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Ordered</span>
                                  </>
                                ) : (
                                  <>
                                    <Plus className="h-3.5 w-3.5" />
                                    <span>Order {testName}</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Alert actions */}
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0 justify-end">
                      <button
                        onClick={() => handleDismissAlert(alert.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        Acknowledge Alert
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Evidence-Based Treatment Guidelines Library */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 text-base">
              Evidence-Based Clinical Guidelines & Protocol Recommender
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Validated by ACC, AHA, ADA, KDIGO, and CHEST
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {guidelines.map((guide) => {
            const isApplied = appliedGuidelineIds.includes(guide.id);

            return (
              <div
                key={guide.id}
                className="p-5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                      {guide.condition}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      Evidence: {guide.evidenceGrade}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{guide.guidelineName}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {guide.recommendation}
                  </p>

                  <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="text-slate-700">
                      <strong className="text-slate-900">First-Line Regimen:</strong> {guide.firstLineTherapy}
                    </div>
                    <div className="text-slate-700">
                      <strong className="text-slate-900">Alternative Options:</strong> {guide.alternativeTherapy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-medium text-slate-400">
                    Clinical Decision Support
                  </span>
                  <button
                    disabled={isApplied}
                    onClick={() => handleAdoptGuideline(guide)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isApplied
                        ? 'bg-emerald-100 text-emerald-800 cursor-default'
                        : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                    }`}
                  >
                    {isApplied ? (
                      <>
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>Guideline Adopted into EHR</span>
                      </>
                    ) : (
                      <>
                        <FileText className="h-3.5 w-3.5" />
                        <span>Adopt Into Care Plan Note</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
