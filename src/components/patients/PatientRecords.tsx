import React, { useState } from 'react';
import {
  Search,
  Plus,
  FileText,
  Pill,
  FlaskConical,
  HeartPulse,
  Download,
  AlertCircle,
  CheckCircle,
  User,
  Shield,
  FileCode,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PatientRecord } from '../../types';

function admissionBadgeClass(status: string) {
  switch (status) {
    case 'ICU':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
    case 'Inpatient':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
    case 'Emergency':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300';
    case 'Discharged':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
    case 'Outpatient':
    default:
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300';
  }
}

function realChronicConditions(conditions: string[]) {
  return conditions.filter((c) => c.trim() && c.trim().toLowerCase() !== 'none');
}

export const PatientRecords: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    addPatient,
    addMedication,
    addClinicalNote,
    createInvoice,
    logAudit,
    deIdentifyPhi,
  } = useHospital();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'chart' | 'meds' | 'labs' | 'soap' | 'fhir'>('chart');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isAddSoapOpen, setIsAddSoapOpen] = useState(false);

  // New Patient Form state
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newDob, setNewDob] = useState('1990-01-01');
  const [newGender, setNewGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [newBloodType, setNewBloodType] = useState<any>('O+');
  const [newPhone, setNewPhone] = useState('+95 9 000 000 000');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('General Medicine');
  const [newStatus, setNewStatus] = useState<any>('Outpatient');
  const [newAllergies, setNewAllergies] = useState('None');
  const [newInsurance, setNewInsurance] = useState('AIA Myanmar');

  // New Medication Form state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFreq, setMedFreq] = useState('Once daily');
  const [medRoute, setMedRoute] = useState('Oral');

  // New SOAP Note state
  const [soapTitle, setSoapTitle] = useState('Clinical Progress Note');
  const [soapS, setSoapS] = useState('');
  const [soapO, setSoapO] = useState('');
  const [soapA, setSoapA] = useState('');
  const [soapP, setSoapP] = useState('');

  const filteredPatients = patients.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || p.admissionStatus.toLowerCase() === filterStatus.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const selectedPatient =
    filteredPatients.find((p) => p.id === selectedPatientId) ||
    filteredPatients[0] ||
    patients.find((p) => p.id === selectedPatientId) ||
    patients[0];

  const detailPatient = selectedPatient;
  const latestVital = detailPatient?.vitals[detailPatient.vitals.length - 1];
  const chronicList = realChronicConditions(detailPatient?.chronicConditions || []);

  const getPatientName = (p: PatientRecord) => {
    if (deIdentifyPhi) return `Patient #${p.id.slice(-4)}`;
    return `${p.firstName} ${p.lastName}`;
  };

  const getPatientMrn = (p: PatientRecord) => {
    if (deIdentifyPhi) return 'MRN-******';
    return p.mrn;
  };

  const maskPhi = (value: string) => (deIdentifyPhi ? '••••••••' : value);

  const handleCreatePatient = (e: React.FormEvent) => {
    e.preventDefault();
    const created = addPatient({
      firstName: newFirst,
      lastName: newLast,
      dob: newDob,
      age: 2026 - parseInt(newDob.split('-')[0]),
      gender: newGender,
      bloodType: newBloodType,
      phone: newPhone,
      email: newEmail || `${newFirst.toLowerCase()}@patient.org`,
      address: 'No. 1, Pyay Road, Mayangone Township, Yangon',
      emergencyContact: {
        name: 'Designated Next of Kin',
        relationship: 'Family',
        phone: newPhone,
      },
      allergies: newAllergies === 'None' ? [] : newAllergies.split(',').map((s) => s.trim()),
      chronicConditions: [],
      primaryDoctor: 'Dr. Aye Myat Thu, MD',
      department: newDept,
      admissionStatus: newStatus,
      insurance: {
        provider: newInsurance,
        policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        groupNumber: 'GRP-2026',
        verified: true,
        copay: 30,
      },
    });
    setSelectedPatientId(created.id);
    setIsAddPatientOpen(false);
  };

  const handleCreateMed = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    addMedication(selectedPatient.id, {
      name: medName,
      dosage: medDosage,
      frequency: medFreq,
      route: medRoute,
    });
    setIsAddMedOpen(false);
    setMedName('');
    setMedDosage('');
  };

  const handleCreateSoap = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    addClinicalNote(selectedPatient.id, {
      title: soapTitle,
      soapSubjective: soapS || 'Patient reports stable condition.',
      soapObjective: soapO || 'Vitals stable. Alert and oriented x4.',
      soapAssessment: soapA || 'Progressing per clinical treatment pathway.',
      soapPlan: soapP || 'Continue current therapy and monitor.',
    });
    setIsAddSoapOpen(false);
    setSoapS('');
    setSoapO('');
    setSoapA('');
    setSoapP('');
  };

  const handleExportFhir = () => {
    if (!selectedPatient) return;
    const fhirResource = {
      resourceType: 'Bundle',
      id: `bundle-${selectedPatient.id}`,
      type: 'collection',
      timestamp: new Date().toISOString(),
      entry: [
        {
          fullUrl: `urn:uuid:${selectedPatient.id}`,
          resource: {
            resourceType: 'Patient',
            id: selectedPatient.id,
            identifier: [
              {
                use: 'official',
                system: 'urn:oid:medicore.mm:mrn',
                value: deIdentifyPhi ? 'MRN-REDACTED' : selectedPatient.mrn,
              },
            ],
            active: true,
            name: [
              {
                use: 'official',
                family: deIdentifyPhi ? 'ANONYMIZED' : selectedPatient.lastName,
                given: [deIdentifyPhi ? 'PATIENT' : selectedPatient.firstName],
              },
            ],
            gender: selectedPatient.gender.toLowerCase(),
            birthDate: deIdentifyPhi ? '1900-01-01' : selectedPatient.dob,
            telecom: [{ system: 'phone', value: deIdentifyPhi ? '•••' : selectedPatient.phone }],
          },
        },
        ...selectedPatient.medications.map((m) => ({
          resource: {
            resourceType: 'MedicationStatement',
            status: m.status,
            medicationCodeableConcept: { text: `${m.name} ${m.dosage}` },
            dosage: [{ text: `${m.frequency} via ${m.route}` }],
          },
        })),
      ],
    };

    const blob = new Blob([JSON.stringify(fhirResource, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FHIR_${deIdentifyPhi ? 'REDACTED' : selectedPatient.mrn}_Export.json`;
    a.click();

    logAudit(
      'EXPORT_FHIR',
      `FHIR R4 Patient Bundle Download for ${deIdentifyPhi ? 'REDACTED' : selectedPatient.mrn}`,
      'HIPAA Sec. 164.524 Individual Right of Access FHIR R4 Bundle Export',
      selectedPatient.id,
      deIdentifyPhi ? 'REDACTED' : `${selectedPatient.firstName} ${selectedPatient.lastName}`
    );
  };

  const handleQuickBilling = () => {
    if (!selectedPatient) return;
    createInvoice(selectedPatient.id, [
      {
        id: `item-${Date.now()}-1`,
        code: '99214',
        description: 'Comprehensive Clinical Encounter & Diagnostic Evaluation',
        category: 'Consultation',
        quantity: 1,
        unitPrice: 220,
        total: 220,
      },
      {
        id: `item-${Date.now()}-2`,
        code: '80053',
        description: 'Comprehensive Metabolic Laboratory Workup',
        category: 'Laboratory',
        quantity: 1,
        unitPrice: 95,
        total: 95,
      },
    ]);
    alert('Automated invoice generated and submitted to billing queue!');
  };

  return (
    <div className="space-y-6">
      {/* Search, Filter & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Electronic Health Records (EHR)
          </h1>
          <p className="text-xs text-slate-500">
            HIPAA-compliant longitudinal patient health records, lab orders, medications, and clinical SOAP documentation.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="new-patient-modal-btn"
            onClick={() => setIsAddPatientOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Enroll New Patient</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Patient Directory List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[740px]">
          {/* Search Box */}
          <div className="p-3 border-b border-slate-200 space-y-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                id="patient-search-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search patient, MRN, department..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex space-x-1 overflow-x-auto pb-1 text-xs">
              {['all', 'inpatient', 'icu', 'outpatient', 'emergency'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap text-[11px] font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-100 text-blue-800 border border-blue-200 font-semibold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Patient Cards List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredPatients.map((p) => {
              const isSelected = p.id === selectedPatientId;
              return (
                <div
                  key={p.id}
                  id={`patient-card-${p.id}`}
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-blue-600 shadow-xs'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{getPatientName(p)}</h4>
                      <p className="text-[11px] font-mono text-slate-500">{getPatientMrn(p)}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${admissionBadgeClass(p.admissionStatus)}`}>
                      {p.admissionStatus}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>{p.department}</span>
                    <span>{p.room || 'Clinic Visit'}</span>
                  </div>

                  {p.allergies.length > 0 && (
                    <div className="mt-1.5 flex items-start gap-1 text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                      <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                      <span className="leading-snug">Allergy: {p.allergies.join(', ')}</span>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredPatients.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">No patients match this search or filter.</div>
            )}
          </div>
        </div>

        {/* Right: Comprehensive EHR Inspector (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-[740px]">
          {!detailPatient ? (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-500 p-8">
              No patient selected.
            </div>
          ) : (
          <>
          {/* Patient Header Banner */}
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 rounded-t-xl">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900">{getPatientName(detailPatient)}</h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200">
                  {getPatientMrn(detailPatient)}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300">
                  Blood: {detailPatient.bloodType}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                DOB: {maskPhi(detailPatient.dob)} ({detailPatient.age} yrs) • Gender: {detailPatient.gender} • Doctor:{' '}
                <span className="font-semibold text-slate-700">{detailPatient.primaryDoctor}</span>
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                id="quick-billing-trigger-btn"
                onClick={handleQuickBilling}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
                title="Trigger automated billing for this patient encounter"
              >
                + Auto-Bill
              </button>
              <button
                id="export-fhir-btn"
                onClick={handleExportFhir}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[var(--mc-ink)] hover:opacity-90 text-white text-xs font-semibold shadow-xs transition-colors border border-[var(--mc-line)]"
                title="Export FHIR R4 Bundle"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export FHIR</span>
              </button>
            </div>
          </div>

          {/* EHR Tabs Bar */}
          <div className="px-5 border-b border-slate-200 flex space-x-4 text-xs font-semibold text-slate-600 overflow-x-auto">
            {[
              { id: 'chart', label: 'Clinical Overview', icon: FileText },
              { id: 'meds', label: `Medications (${detailPatient.medications.length})`, icon: Pill },
              { id: 'labs', label: `Lab Results (${detailPatient.labResults.length})`, icon: FlaskConical },
              { id: 'soap', label: `SOAP Notes (${detailPatient.clinicalNotes.length})`, icon: HeartPulse },
              { id: 'fhir', label: 'FHIR JSON', icon: FileCode },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3 flex items-center space-x-1.5 border-b-2 transition-colors shrink-0 ${
                    isActive
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-5">
            {activeTab === 'chart' && (
              <div className="space-y-5">
                {/* Insurance & Demographics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span>Insurance Verification</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Provider:</span>{' '}
                      <span className="font-semibold text-slate-800">
                        {maskPhi(detailPatient.insurance.provider)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Policy / Group:</span>{' '}
                      <span className="font-mono text-slate-800">
                        {maskPhi(detailPatient.insurance.policyNumber)} / {maskPhi(detailPatient.insurance.groupNumber)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 pt-1 flex-wrap gap-y-1">
                      {detailPatient.insurance.verified ? (
                        <span className="text-emerald-600 font-semibold flex items-center">
                          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Active Coverage
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold flex items-center">
                          <AlertCircle className="h-3.5 w-3.5 mr-1" /> Unverified
                        </span>
                      )}
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-600">Copay: MMK {detailPatient.insurance.copay.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                      <Phone className="h-4 w-4 text-emerald-600" />
                      <span>Emergency Contact</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Name:</span>{' '}
                      <span className="font-semibold text-slate-800">
                        {maskPhi(detailPatient.emergencyContact.name)} ({maskPhi(detailPatient.emergencyContact.relationship)})
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Direct Phone:</span>{' '}
                      <span className="text-slate-800 font-mono">
                        {maskPhi(detailPatient.emergencyContact.phone)}
                      </span>
                    </div>
                    <div className="pt-1 text-[11px] text-slate-500">
                      Address: {maskPhi(detailPatient.address)}
                    </div>
                  </div>
                </div>

                {/* Chronic Conditions & Allergies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-slate-200">
                    <div className="font-bold text-xs text-slate-900 mb-2">Chronic Medical Diagnoses</div>
                    {chronicList.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No chronic conditions documented.</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {chronicList.map((cond) => (
                          <span
                            key={cond}
                            className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-medium border border-slate-200"
                          >
                            {cond}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 dark:bg-rose-950/30 dark:border-rose-900/50">
                    <div className="font-bold text-xs text-rose-900 dark:text-rose-200 mb-2 flex items-center space-x-1">
                      <AlertCircle className="h-4 w-4 text-rose-600" />
                      <span>Allergy Warnings (Strict Triage)</span>
                    </div>
                    {detailPatient.allergies.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No known drug allergies (NKDA).</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {detailPatient.allergies.map((all) => (
                          <span
                            key={all}
                            className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200 dark:bg-rose-950/50 dark:text-rose-200 dark:border-rose-800"
                          >
                            {all}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Latest Vitals Snapshot */}
                <div className="p-4 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-bold text-slate-900 mb-2">Latest Bedside Vitals</h4>
                  {!latestVital ? (
                    <p className="text-xs text-slate-400 italic">No vitals recorded for this patient.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <div className="text-slate-400 text-[10px]">Heart Rate</div>
                        <div className="font-bold text-slate-800">{latestVital.heartRate} bpm</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <div className="text-slate-400 text-[10px]">Blood Pressure</div>
                        <div className="font-bold text-slate-800">
                          {latestVital.bloodPressureSys}/{latestVital.bloodPressureDia}
                        </div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <div className="text-slate-400 text-[10px]">SpO2</div>
                        <div className="font-bold text-slate-800">{latestVital.spO2}%</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <div className="text-slate-400 text-[10px]">Core Temp</div>
                        <div className="font-bold text-slate-800">{latestVital.temperature}°F</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'meds' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Active e-Prescriptions & Regimens
                  </h3>
                  <button
                    onClick={() => setIsAddMedOpen(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Prescribe Medication</span>
                  </button>
                </div>

                {selectedPatient.medications.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No active prescriptions.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPatient.medications.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl border border-slate-200 hover:border-slate-300 flex items-center justify-between"
                      >
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">{m.name}</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                              {m.dosage}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {m.route}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Frequency: {m.frequency} • Prescribed by: {m.prescribedBy} • Started: {m.startDate}
                          </p>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-emerald-100 text-emerald-800">
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'labs' && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Diagnostic Laboratory & Radiology Reports
                </h3>
                {selectedPatient.labResults.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No lab results available.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPatient.labResults.map((l) => (
                      <div
                        key={l.id}
                        className={`p-3 rounded-xl border ${
                          l.status === 'flagged' ? 'border-amber-300 bg-amber-50/40' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-xs text-slate-900">{l.testName}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {l.category}
                            </span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              l.status === 'normal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {l.status}
                          </span>
                        </div>
                        <div className="mt-1.5 text-xs text-slate-700">
                          <span className="font-semibold">Result:</span> {l.value}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
                          <span>Ref Range: {l.referenceRange}</span>
                          <span>Ordered by: {l.orderedBy} ({l.date})</span>
                        </div>
                        {l.notes && (
                          <div className="mt-1 text-[11px] text-slate-600 bg-white p-1.5 rounded border border-slate-200">
                            Note: {l.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'soap' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Physician Encounters & SOAP Notes
                  </h3>
                  <button
                    onClick={() => setIsAddSoapOpen(true)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New SOAP Note</span>
                  </button>
                </div>

                {selectedPatient.clinicalNotes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4">No clinical notes recorded.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedPatient.clinicalNotes.map((cn) => (
                      <div key={cn.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                        <div className="flex items-center justify-between border-b pb-2 border-slate-200">
                          <div>
                            <h4 className="font-bold text-xs text-slate-900">{cn.title}</h4>
                            <p className="text-[11px] text-slate-500">
                              By {cn.author} ({cn.authorRole}) • {cn.date}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                            Signed Token
                          </span>
                        </div>

                        <div className="text-xs space-y-1.5">
                          <div>
                            <span className="font-bold text-blue-900">S (Subjective):</span>{' '}
                            <span className="text-slate-700">{cn.soapSubjective}</span>
                          </div>
                          <div>
                            <span className="font-bold text-blue-900">O (Objective):</span>{' '}
                            <span className="text-slate-700">{cn.soapObjective}</span>
                          </div>
                          <div>
                            <span className="font-bold text-blue-900">A (Assessment):</span>{' '}
                            <span className="text-slate-700">{cn.soapAssessment}</span>
                          </div>
                          <div>
                            <span className="font-bold text-blue-900">P (Plan):</span>{' '}
                            <span className="text-slate-700">{cn.soapPlan}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'fhir' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    HL7 FHIR R4 Resource JSON Representation
                  </h3>
                  <button
                    onClick={handleExportFhir}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Download .json
                  </button>
                </div>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-96 border border-slate-800">
                  {JSON.stringify(
                    {
                      resourceType: 'Patient',
                      id: selectedPatient.id,
                      identifier: [
                        {
                          use: 'official',
                          system: 'urn:oid:medicore.mm:mrn',
                          value: deIdentifyPhi ? 'MRN-REDACTED' : selectedPatient.mrn,
                        },
                      ],
                      active: true,
                      name: [
                        {
                          use: 'official',
                          family: deIdentifyPhi ? 'REDACTED' : selectedPatient.lastName,
                          given: [deIdentifyPhi ? 'ANONYMOUS' : selectedPatient.firstName],
                        },
                      ],
                      gender: selectedPatient.gender.toLowerCase(),
                      birthDate: deIdentifyPhi ? '1900-01-01' : selectedPatient.dob,
                      telecom: [{ system: 'phone', value: deIdentifyPhi ? '•••' : selectedPatient.phone }],
                      address: [{ text: deIdentifyPhi ? 'REDACTED' : selectedPatient.address }],
                      communication: [{ language: { coding: [{ system: 'urn:ietf:bcp:47', code: 'en' }] } }],
                      managingOrganization: { display: 'Medicore Yangon Healthcare Network' },
                    },
                    null,
                    2
                  )}
                </pre>
                {deIdentifyPhi && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    De-identify mode is on — identifiers and contact fields are redacted in this view and exports.
                  </p>
                )}
              </div>
            )}
          </div>
          </>
          )}
        </div>
      </div>

      {/* Enroll New Patient Modal */}
      {isAddPatientOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="text-base font-bold text-slate-900">Enroll New Patient Record</h3>
              <button
                onClick={() => setIsAddPatientOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePatient} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={newFirst}
                    onChange={(e) => setNewFirst(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    placeholder="e.g. John"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={newLast}
                    onChange={(e) => setNewLast(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value as any)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Blood Type</label>
                  <select
                    value={newBloodType}
                    onChange={(e) => setNewBloodType(e.target.value as any)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bt) => (
                      <option key={bt} value={bt}>
                        {bt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admission Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as any)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Outpatient">Outpatient</option>
                    <option value="Inpatient">Inpatient</option>
                    <option value="ICU">ICU</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Insurance Provider</label>
                  <input
                    type="text"
                    value={newInsurance}
                    onChange={(e) => setNewInsurance(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Known Drug Allergies (comma separated or 'None')
                </label>
                <input
                  type="text"
                  value={newAllergies}
                  onChange={(e) => setNewAllergies(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="p-3 bg-blue-50 text-blue-900 rounded-lg text-[11px] flex items-center space-x-2">
                <Shield className="h-4 w-4 shrink-0 text-blue-600" />
                <span>Notice: Creating this record logs an automatic HIPAA access event and provisions a unique FHIR Patient identifier.</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddPatientOpen(false)}
                  className="px-4 py-2 rounded-lg border text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="submit-new-patient-btn"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
                >
                  Enroll Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Prescribe Medication Modal */}
      {isAddMedOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b">
              e-Prescribe Medication for {getPatientName(selectedPatient)}
            </h3>
            <form onSubmit={handleCreateMed} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Medication Name</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Lisinopril or Amoxicillin"
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Dosage</label>
                  <input
                    type="text"
                    required
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="e.g. 20mg"
                    className="w-full px-3 py-2 rounded-lg border"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Route</label>
                  <select
                    value={medRoute}
                    onChange={(e) => setMedRoute(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                    <option value="Subcutaneous">Subcutaneous</option>
                    <option value="Inhalation">Inhalation</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Frequency Instructions</label>
                <input
                  type="text"
                  required
                  value={medFreq}
                  onChange={(e) => setMedFreq(e.target.value)}
                  placeholder="e.g. Once daily in the morning with water"
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddMedOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg"
                >
                  Sign & Prescribe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New SOAP Note Modal */}
      {isAddSoapOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b">
              Document Clinical SOAP Note
            </h3>
            <form onSubmit={handleCreateSoap} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Encounter Title</label>
                <input
                  type="text"
                  required
                  value={soapTitle}
                  onChange={(e) => setSoapTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">S (Subjective History & Symptoms)</label>
                <textarea
                  rows={2}
                  required
                  value={soapS}
                  onChange={(e) => setSoapS(e.target.value)}
                  placeholder="Patient reports..."
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">O (Objective Findings & Vitals)</label>
                <textarea
                  rows={2}
                  required
                  value={soapO}
                  onChange={(e) => setSoapO(e.target.value)}
                  placeholder="Physical exam reveals..."
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">A (Assessment & Diagnosis)</label>
                <textarea
                  rows={2}
                  required
                  value={soapA}
                  onChange={(e) => setSoapA(e.target.value)}
                  placeholder="Primary clinical assessment..."
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">P (Care Plan & Follow-up)</label>
                <textarea
                  rows={2}
                  required
                  value={soapP}
                  onChange={(e) => setSoapP(e.target.value)}
                  placeholder="Diagnostic tests ordered, treatment plan..."
                  className="w-full px-3 py-2 rounded-lg border"
                />
              </div>
              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddSoapOpen(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg"
                >
                  Sign & File Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
