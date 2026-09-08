import React, { useMemo, useState } from 'react';
import {
  FileText,
  Download,
  Send,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  User,
  Pill,
  Stethoscope,
  Calendar,
  Printer,
  Lock,
  Eye,
  RefreshCw,
  Building2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { useHospital } from '../../context/HospitalContext';
import { McSelect } from '../ui/McSelect';
import { DischargeSummary, PatientRecord } from '../../types';

function buildDraftFromPatient(
  patient: PatientRecord,
  generatedBy: string
): Omit<DischargeSummary, 'id' | 'generatedAt' | 'status'> {
  const latestNote = patient.clinicalNotes[0];
  const activeMeds = patient.medications.filter((m) => m.status === 'active');
  const latestVitals = patient.vitals[patient.vitals.length - 1];

  return {
    patientId: patient.id,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientMrn: patient.mrn,
    generatedBy,
    admissionDate: patient.admissionDate || new Date().toISOString().split('T')[0],
    dischargeDate: new Date().toISOString().split('T')[0],
    admittingDiagnosis: patient.chronicConditions[0] || 'Clinical evaluation',
    dischargeDiagnosis: [
      ...(patient.chronicConditions.length > 0
        ? patient.chronicConditions
        : ['Resolved acute presentation']),
      ...(latestNote?.soapAssessment
        ? [latestNote.soapAssessment.slice(0, 120)]
        : []),
    ].slice(0, 4),
    hospitalCourse:
      latestNote?.soapSubjective ||
      `Patient was admitted under ${patient.primaryDoctor} for management of MMK {
        patient.chronicConditions.join(', ') || 'acute illness'
      }. Clinical course was monitored with serial vitals and laboratory assessment. Condition improved sufficiently for safe discharge to home with outpatient follow-up.`,
    proceduresPerformed: patient.labResults
      .filter((l) => l.category === 'Radiology')
      .map((l) => l.testName)
      .slice(0, 5),
    dischargeMedications: activeMeds.map((m) => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      route: m.route,
      instructions: `Continue ${m.frequency.toLowerCase()} as directed. Prescribed by ${m.prescribedBy}.`,
    })),
    allergies: patient.allergies.length > 0 ? patient.allergies : ['NKDA'],
    followUpInstructions: `Follow up with ${patient.primaryDoctor} within 7–14 days. Bring this discharge summary to your primary care provider. ${
      latestNote?.soapPlan ? `Plan: ${latestNote.soapPlan.slice(0, 200)}` : ''
    }`,
    dietRestrictions: 'Regular diet as tolerated unless otherwise instructed by your care team.',
    activityRestrictions:
      patient.admissionStatus === 'ICU'
        ? 'Limited activity for 48 hours; avoid heavy lifting >10 lbs for 1 week.'
        : 'Resume light activity as tolerated; avoid strenuous exercise for 72 hours.',
    warningSignsToReturn: [
      'Chest pain, shortness of breath, or sudden weakness',
      'Fever >100.4°F (38°C) lasting more than 24 hours',
      'Uncontrolled bleeding, severe headache, or confusion',
      latestVitals?.isAbnormal
        ? 'Recurrence of abnormal vital signs previously documented during admission'
        : 'Worsening of symptoms that prompted this admission',
    ],
    primaryCareProvider: patient.primaryDoctor,
    pcpFaxNumber: '+95 1 966 1100',
    attendingPhysician: patient.primaryDoctor,
    hipaaAcknowledgement: true,
  };
}

export const DischargeSummaryTool: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    dischargeSummaries,
    generateDischargeSummary,
    finalizeDischargeSummary,
    transmitDischargeSummary,
    deIdentifyPhi,
    currentUser,
    logAudit,
  } = useHospital();

  const [activePatientId, setActivePatientId] = useState(
    selectedPatientId || patients[0]?.id || ''
  );
  const patient =
    patients.find((p) => p.id === activePatientId) || patients[0];

  const existing = useMemo(
    () =>
      dischargeSummaries
        .filter((d) => d.patientId === patient?.id)
        .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt)),
    [dischargeSummaries, patient?.id]
  );

  const [draft, setDraft] = useState(() =>
    patient ? buildDraftFromPatient(patient, currentUser.name) : null
  );
  const [selectedSummaryId, setSelectedSummaryId] = useState<string | null>(
    existing[0]?.id ?? null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const selectedSummary =
    dischargeSummaries.find((d) => d.id === selectedSummaryId) || existing[0];

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const handlePatientChange = (id: string) => {
    setActivePatientId(id);
    setSelectedPatientId(id);
    const p = patients.find((x) => x.id === id);
    if (p) setDraft(buildDraftFromPatient(p, currentUser.name));
    setSelectedSummaryId(null);
  };

  const handleRegenerateDraft = () => {
    if (!patient) return;
    setDraft(buildDraftFromPatient(patient, currentUser.name));
    showToast('Draft refreshed from current EHR, medications, and visit notes.');
  };

  const handleGenerate = () => {
    if (!patient || !draft) return;
    setIsGenerating(true);
    setTimeout(() => {
      const summary = generateDischargeSummary(patient.id, draft);
      setSelectedSummaryId(summary.id);
      setIsGenerating(false);
      showToast(`Discharge summary draft created for ${summary.patientName}`);
    }, 500);
  };

  const handleFinalize = () => {
    if (!selectedSummary) return;
    finalizeDischargeSummary(selectedSummary.id);
    showToast('Discharge summary finalized with electronic signature.');
  };

  const handleTransmit = () => {
    if (!selectedSummary) return;
    transmitDischargeSummary(selectedSummary.id);
    showToast(
      `HIPAA-compliant summary transmitted to ${selectedSummary.primaryCareProvider} (secure fax/Direct).`
    );
  };

  const handleExportPdf = () => {
    const source = selectedSummary || (draft as DischargeSummary | null);
    if (!source || !patient) return;

    const doc = new jsPDF();
    const name = deIdentifyPhi
      ? `Patient #${patient.id.slice(-4)}`
      : source.patientName;
    const mrn = deIdentifyPhi ? 'MRN-******' : source.patientMrn;

    doc.setFontSize(16);
    doc.text('MEDICORE Healthcare OS — Discharge Summary', 14, 18);
    doc.setFontSize(9);
    doc.text('HIPAA-Compliant Continuity of Care Document (§ 164.312)', 14, 24);
    doc.setFontSize(11);
    doc.text(`Patient: ${name}  |  MRN: ${mrn}`, 14, 34);
    doc.text(
      `Admission: ${source.admissionDate}  →  Discharge: ${source.dischargeDate}`,
      14,
      40
    );
    doc.text(`Attending: ${source.attendingPhysician}`, 14, 46);

    let y = 56;
    const addSection = (title: string, body: string) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFont('helvetica', 'bold');
      doc.text(title, 14, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(body, 180);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 6;
    };

    addSection('Admitting Diagnosis', source.admittingDiagnosis);
    addSection('Discharge Diagnoses', source.dischargeDiagnosis.join('\n'));
    addSection('Hospital Course', source.hospitalCourse);
    addSection(
      'Procedures / Diagnostics',
      source.proceduresPerformed.length
        ? source.proceduresPerformed.join(', ')
        : 'None documented'
    );
    addSection(
      'Discharge Medications',
      source.dischargeMedications
        .map(
          (m) =>
            `${m.name} ${m.dosage} ${m.route} — ${m.frequency}. ${m.instructions}`
        )
        .join('\n') || 'None'
    );
    addSection('Allergies', source.allergies.join(', '));
    addSection('Follow-Up', source.followUpInstructions);
    addSection('Diet', source.dietRestrictions);
    addSection('Activity', source.activityRestrictions);
    addSection(
      'Return Precautions',
      source.warningSignsToReturn.map((w) => `• ${w}`).join('\n')
    );
    addSection(
      'Primary Care Provider',
      `${source.primaryCareProvider}${
        source.pcpFaxNumber ? ` | Fax: ${source.pcpFaxNumber}` : ''
      }`
    );

    doc.setFontSize(8);
    doc.text(
      `Generated by ${source.generatedBy || currentUser.name} | Confidential PHI — Authorized recipients only`,
      14,
      285
    );

    doc.save(
      `Discharge_Summary_${deIdentifyPhi ? patient.id : source.patientMrn}_${
        source.dischargeDate
      }.pdf`
    );

    logAudit(
      'GENERATE_DISCHARGE_SUMMARY',
      `Exported discharge summary PDF for ${source.patientName}`,
      'Patient and external PCP continuity-of-care document export',
      patient.id,
      source.patientName
    );
  };

  if (!patient || !draft) {
    return <div className="p-8 text-slate-500">No patient selected.</div>;
  }

  const displayName = deIdentifyPhi
    ? `Patient #${patient.id.slice(-4)}`
    : `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Automated Discharge Summary
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pulls demographics, medications, and visit notes into a standardized HIPAA-compliant
            summary for patients and external primary care providers.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
          <Lock className="h-3.5 w-3.5" />
          Continuity of Care · Encrypted Transmission
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <McSelect
          value={patient.id}
          onChange={handlePatientChange}
          options={patients.map((p) => ({
            value: p.id,
            label: deIdentifyPhi
              ? `Patient #${p.id.slice(-4)} (${p.admissionStatus})`
              : `${p.firstName} ${p.lastName} — ${p.admissionStatus}`,
          }))}
          className="min-w-[220px]"
          size="md"
          aria-label="Select patient for discharge summary"
        />
        <button
          onClick={handleRegenerateDraft}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh from EHR
        </button>
        <button
          onClick={handleGenerate}
          disabled={isGenerating}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
        >
          <Stethoscope className="h-3.5 w-3.5" />
          {isGenerating ? 'Generating…' : 'Generate Draft Summary'}
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Draft editor */}
        <div className="xl:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {displayName}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <User className="h-3 w-3" />
                  {deIdentifyPhi ? 'MRN-******' : patient.mrn}
                  <span>·</span>
                  <Calendar className="h-3 w-3" />
                  DOB {deIdentifyPhi ? '****-**-**' : patient.dob}
                </p>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Admission Date
                </span>
                <input
                  type="date"
                  value={draft.admissionDate}
                  onChange={(e) => setDraft({ ...draft, admissionDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="text-xs space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  Discharge Date
                </span>
                <input
                  type="date"
                  value={draft.dischargeDate}
                  onChange={(e) => setDraft({ ...draft, dischargeDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </label>
            </div>

            <label className="block text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Admitting Diagnosis
              </span>
              <input
                value={draft.admittingDiagnosis}
                onChange={(e) => setDraft({ ...draft, admittingDiagnosis: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Hospital Course
              </span>
              <textarea
                rows={5}
                value={draft.hospitalCourse}
                onChange={(e) => setDraft({ ...draft, hospitalCourse: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </label>

            <label className="block text-xs space-y-1">
              <span className="font-semibold text-slate-600 dark:text-slate-300">
                Follow-Up Instructions
              </span>
              <textarea
                rows={3}
                value={draft.followUpInstructions}
                onChange={(e) => setDraft({ ...draft, followUpInstructions: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="text-xs space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Diet</span>
                <input
                  value={draft.dietRestrictions}
                  onChange={(e) => setDraft({ ...draft, dietRestrictions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </label>
              <label className="text-xs space-y-1">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Activity</span>
                <input
                  value={draft.activityRestrictions}
                  onChange={(e) => setDraft({ ...draft, activityRestrictions: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                <Pill className="h-3.5 w-3.5" /> Discharge Medications (
                {draft.dischargeMedications.length})
              </div>
              <div className="space-y-2">
                {draft.dischargeMedications.length === 0 ? (
                  <p className="text-[11px] text-slate-400">No active medications on chart.</p>
                ) : (
                  draft.dischargeMedications.map((m, idx) => (
                    <div
                      key={`${m.name}-${idx}`}
                      className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {m.name} — {m.dosage} ({m.route})
                      </div>
                      <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                        {m.frequency} · {m.instructions}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              Review diagnoses and medications before finalizing. Transmission creates an immutable
              audit event under HIPAA Security Rule § 164.312(b).
            </div>
          </div>
        </div>

        {/* Actions & history */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Document Actions
            </h3>
            <button
              onClick={handleExportPdf}
              className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF for Patient
            </button>
            <button
              onClick={handleFinalize}
              disabled={!selectedSummary || selectedSummary.status === 'finalized' || selectedSummary.status === 'transmitted'}
              className="w-full py-2.5 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Finalize & Sign
            </button>
            <button
              onClick={handleTransmit}
              disabled={
                !selectedSummary ||
                selectedSummary.status === 'draft' ||
                selectedSummary.status === 'transmitted'
              }
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" /> Transmit to PCP
            </button>
            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-1.5"
            >
              <Printer className="h-3.5 w-3.5" /> Print Preview
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" /> External PCP
            </h3>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {draft.primaryCareProvider}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Secure Direct / Fax: {draft.pcpFaxNumber}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                Generated Summaries ({existing.length})
              </h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-72 overflow-y-auto">
              {existing.length === 0 ? (
                <p className="p-4 text-[11px] text-slate-400">
                  No summaries yet. Generate a draft from the current chart.
                </p>
              ) : (
                existing.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSummaryId(s.id)}
                    className={`w-full text-left p-3 transition-colors ${
                      selectedSummary?.id === s.id
                        ? 'bg-blue-50 dark:bg-blue-950/40'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                        {s.dischargeDate}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          s.status === 'transmitted'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : s.status === 'finalized'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                        }`}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                      {s.admittingDiagnosis}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {s.generatedBy} · {new Date(s.generatedAt).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
