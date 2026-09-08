import React, { useEffect, useState } from 'react';
import {
  Pill,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  FileText,
  Building,
  UserCheck,
  Package,
  Layers,
  History,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Printer,
  FileSpreadsheet,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  BadgeAlert,
  SlidersHorizontal,
  X,
  Bell,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { McSelect } from '../ui/McSelect';
import { EPrescription, PharmacyInventoryItem, DrugInteraction } from '../../types';
import { ExpirationAlertsManager } from './ExpirationAlertsManager';
import { InventoryTrackingChart } from './InventoryTrackingChart';
import { StaffApiLogin } from '../staff/StaffApiLogin';
import { api, getApiToken } from '../../lib/api';

type PharmacyQueueItem = {
  id: string;
  medicationName: string;
  notes: string | null;
  status: string;
  prescriptionId: string | null;
  createdAt: string;
  patientId: string;
  patientName: string;
  patientMrn: string;
  allergies: string[];
};

export const PharmacistDashboard: React.FC = () => {
  const {
    currentUser,
    ePrescriptions,
    pharmacyInventory,
    expirationNotifications,
    verifyPrescription,
    dispensePrescription,
    rejectPrescription,
    holdPrescriptionForClarification,
    restockInventory,
    addEPrescription,
    sendPrescriptionInquiry,
    patients,
    users,
    logAudit,
  } = useHospital();

  const [apiQueue, setApiQueue] = useState<PharmacyQueueItem[]>([]);
  const [queueError, setQueueError] = useState<string | null>(null);

  const loadQueue = async () => {
    if (!getApiToken()) {
      setApiQueue([]);
      return;
    }
    try {
      const rows = (await api.pharmacyQueue()) as PharmacyQueueItem[];
      setApiQueue(rows);
      setQueueError(null);
    } catch (e) {
      setQueueError(e instanceof Error ? e.message : 'Failed to load queue');
    }
  };

  useEffect(() => {
    void loadQueue();
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<'prescriptions' | 'dispense-history' | 'inventory' | 'expiration-alerts' | 'doctor-chat'>('prescriptions');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRx, setSelectedRx] = useState<EPrescription | null>(null);

  // Modals
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [dispenseModalOpen, setDispenseModalOpen] = useState(false);
  const [dispenseLot, setDispenseLot] = useState('LOT-AMX-9821');
  const [dispenseQty, setDispenseQty] = useState<number>(30);
  const [counselingDone, setCounselingDone] = useState(true);
  const [dispenseNotes, setDispenseNotes] = useState('');
  const [doctorInquiryModalOpen, setDoctorInquiryModalOpen] = useState(false);
  const [doctorQuestion, setDoctorQuestion] = useState('');
  const [suggestedAlternative, setSuggestedAlternative] = useState('');
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<PharmacyInventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(100);
  const [newRxModalOpen, setNewRxModalOpen] = useState(false);

  // New Rx form state
  const [newRxPatientId, setNewRxPatientId] = useState(patients[0]?.id || 'pat-001');
  const [newRxMedName, setNewRxMedName] = useState('Azithromycin');
  const [newRxGeneric, setNewRxGeneric] = useState('Azithromycin');
  const [newRxDosage, setNewRxDosage] = useState('500mg');
  const [newRxRoute, setNewRxRoute] = useState('Oral (PO)');
  const [newRxFreq, setNewRxFreq] = useState('Once daily');
  const [newRxQty, setNewRxQty] = useState(6);
  const [newRxSig, setNewRxSig] = useState('Take 1 tablet daily for 6 days.');
  const [newRxPriority, setNewRxPriority] = useState<'routine' | 'urgent' | 'stat'>('routine');

  // Stats calculation
  const totalRx = ePrescriptions.length;
  const pendingRx = ePrescriptions.filter((r) => r.status === 'pending_review').length;
  const heldRx = ePrescriptions.filter((r) => r.status === 'held_for_clarification').length;
  const verifiedRx = ePrescriptions.filter((r) => r.status === 'verified').length;
  const dispensedRx = ePrescriptions.filter((r) => r.status === 'dispensed').length;
  const flaggedInteractionsCount = ePrescriptions.filter(
    (r) => r.potentialInteractions && r.potentialInteractions.length > 0 && r.status !== 'dispensed'
  ).length;
  const lowStockCount = pharmacyInventory.filter(
    (i) => i.status === 'Low Stock' || i.status === 'Reorder Required' || i.status === 'Out of Stock'
  ).length;
  const expiringLotsCount = (expirationNotifications || []).filter(
    (n) => n.daysUntilExpiration <= 90
  ).length;

  // Filtered prescriptions
  const filteredPrescriptions = ePrescriptions.filter((rx) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'flagged'
        ? rx.potentialInteractions && rx.potentialInteractions.length > 0
        : rx.status === filterStatus;

    const matchesSearch =
      rx.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.patientMrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.prescriptionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rx.doctorName.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // Collect all dispense history across all prescriptions
  const allDispenseEvents = ePrescriptions
    .flatMap((rx) =>
      (rx.dispenseHistory || []).map((ev) => ({
        ...ev,
        rxNumber: rx.prescriptionNumber,
        medicationName: rx.medicationName,
        patientName: rx.patientName,
        patientMrn: rx.patientMrn,
        doctorName: rx.doctorName,
      }))
    )
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Handlers
  const handleOpenVerify = (rx: EPrescription) => {
    setSelectedRx(rx);
    if (rx.potentialInteractions && rx.potentialInteractions.length > 0) {
      setOverrideReason('');
      setOverrideModalOpen(true);
    } else {
      verifyPrescription(rx.id);
    }
  };

  const handleConfirmOverride = () => {
    if (!selectedRx) return;
    verifyPrescription(selectedRx.id, overrideReason || 'Pharmacist reviewed and authorized clinically.');
    setOverrideModalOpen(false);
    setSelectedRx(null);
  };

  const handleOpenDispense = (rx: EPrescription) => {
    setSelectedRx(rx);
    setDispenseQty(rx.quantity);
    // Find matching inventory lot if available
    const invItem = pharmacyInventory.find(
      (i) =>
        i.medicationName.toLowerCase().includes(rx.genericName.toLowerCase()) ||
        rx.medicationName.toLowerCase().includes(i.genericName.toLowerCase())
    );
    setDispenseLot(invItem ? invItem.lotNumber : 'LOT-HOSP-2026');
    setDispenseNotes('');
    setCounselingDone(true);
    setDispenseModalOpen(true);
  };

  const handleConfirmDispense = () => {
    if (!selectedRx) return;
    dispensePrescription(selectedRx.id, {
      lotNumber: dispenseLot,
      quantity: Number(dispenseQty),
      notes: dispenseNotes,
    });
    setDispenseModalOpen(false);
    setSelectedRx(null);
  };

  const handleOpenDoctorInquiry = (rx: EPrescription) => {
    setSelectedRx(rx);
    const severeInteraction = rx.potentialInteractions.find((i) => i.severity === 'severe');
    if (severeInteraction) {
      setDoctorQuestion(
        `Automated allergy/interaction screening flagged ${severeInteraction.title}. Patient ${rx.patientName} has: ${severeInteraction.description}. Please confirm clinical intent or provide alternative.`
      );
      setSuggestedAlternative(severeInteraction.clinicalRecommendation);
    } else {
      setDoctorQuestion(`Clarification needed on dosage and duration for ${rx.medicationName}.`);
      setSuggestedAlternative('');
    }
    setDoctorInquiryModalOpen(true);
  };

  const handleSendDoctorInquiry = () => {
    if (!selectedRx) return;
    sendPrescriptionInquiry(
      selectedRx.id,
      selectedRx.doctorId,
      doctorQuestion,
      suggestedAlternative
    );
    setDoctorInquiryModalOpen(false);
    setSelectedRx(null);
  };

  const handleOpenRestock = (item: PharmacyInventoryItem) => {
    setSelectedInventoryItem(item);
    setRestockQty(100);
    setRestockModalOpen(true);
  };

  const handleConfirmRestock = () => {
    if (!selectedInventoryItem) return;
    restockInventory(selectedInventoryItem.id, Number(restockQty));
    setRestockModalOpen(false);
    setSelectedInventoryItem(null);
  };

  const handleCreateNewRx = (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === newRxPatientId) || patients[0];
    
    // Check allergy interaction on the fly
    const potentialInteractions: DrugInteraction[] = [];
    patient.allergies.forEach((allergy) => {
      const allergyLower = allergy.toLowerCase();
      const medLower = newRxMedName.toLowerCase();
      if (
        (allergyLower.includes('penicillin') && (medLower.includes('penicillin') || medLower.includes('amoxicillin') || medLower.includes('augmentin'))) ||
        (allergyLower.includes('sulfa') && (medLower.includes('bactrim') || medLower.includes('sulfamethoxazole'))) ||
        (allergyLower.includes('aspirin') && (medLower.includes('aspirin') || medLower.includes('ibuprofen') || medLower.includes('ketorolac')))
      ) {
        potentialInteractions.push({
          id: `int-${Date.now()}`,
          type: 'drug_allergy',
          severity: 'severe',
          title: `Documented Allergy Conflict: ${allergy}`,
          description: `Patient ${patient.firstName} ${patient.lastName} has documented hypersensitivity: ${allergy}. Prescribing ${newRxMedName} presents high hypersensitivity risk.`,
          clinicalRecommendation: 'Select non-cross-reactive pharmacological class or obtain allergy specialist clearance.',
          substanceA: newRxMedName,
          substanceB: allergy,
        });
      }
    });

    addEPrescription({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.mrn,
      patientDob: patient.dob,
      patientAllergies: patient.allergies,
      doctorId: currentUser.id,
      doctorName: currentUser.name,
      doctorDea: 'BC9284102',
      doctorNpi: '1093849102',
      datePrescribed: new Date().toISOString(),
      medicationName: newRxMedName,
      genericName: newRxGeneric,
      dosage: newRxDosage,
      route: newRxRoute,
      frequency: newRxFreq,
      quantity: Number(newRxQty),
      refillsAllowed: 2,
      refillsRemaining: 2,
      daysSupply: 10,
      icd10Diagnosis: 'J06.9 - Acute upper respiratory infection, unspecified',
      sigInstructions: newRxSig,
      status: 'pending_review',
      priority: newRxPriority,
      potentialInteractions,
    });

    setNewRxModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <StaffApiLogin
        allowedRoles={['pharmacist', 'admin', 'doctor', 'nurse']}
        onAuthed={() => void loadQueue()}
      />
      {queueError && (
        <div className="text-xs text-rose-600">{queueError}</div>
      )}
      {apiQueue.length > 0 && (
        <div className="bg-white dark:bg-[var(--mc-elevated)] rounded-xl border border-teal-200 dark:border-teal-800 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Patient refill queue (API)
            </h3>
            <button
              type="button"
              onClick={() => void loadQueue()}
              className="text-[11px] font-semibold text-teal-700 flex items-center gap-1"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh
            </button>
          </div>
          <ul className="space-y-2">
            {apiQueue.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 text-xs p-2.5 rounded-lg bg-teal-50/80 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900"
              >
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-100">
                    {row.medicationName} · {row.patientName} ({row.patientMrn})
                  </div>
                  <div className="text-slate-500">
                    {row.prescriptionId} · {row.status} · {new Date(row.createdAt).toLocaleString()}
                  </div>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 rounded-lg bg-teal-600 text-white font-bold"
                  onClick={async () => {
                    await api.updateRefill(row.id, 'approved');
                    await loadQueue();
                  }}
                >
                  Approve
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Top Banner / Pharmacist Identification Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-700">
              <Pill className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  Inpatient Pharmacy & Formulary
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                  HIPAA § 164.312 Verified
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Real-time electronic prescription verification, automated drug-drug & drug-allergy interaction detection, lot-level dispensing, and central formulary control.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600 font-medium">
                <span className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                  <span>On-Duty: <strong className="text-slate-800">{currentUser.name}</strong></span>
                </span>
                <span className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Lock className="h-3.5 w-3.5 text-blue-600" />
                  <span>DEA Vault: <strong className="text-slate-800">Compliant (Schedule II Audited)</strong></span>
                </span>
                <span className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                  <Building className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Dispense Node: <strong className="text-slate-800">Central Main Pharmacy (Floor 2)</strong></span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
            <button
              id="new-eprescription-btn"
              onClick={() => setNewRxModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Simulate New E-Prescription</span>
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div className="text-[11px] font-bold uppercase text-slate-400">Total Rx Queue</div>
            <div className="text-xl font-bold text-slate-900 mt-1">{totalRx}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Active e-prescriptions</div>
          </div>

          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="text-[11px] font-bold uppercase text-amber-700">Pending Review</div>
            <div className="text-xl font-bold text-amber-900 mt-1">{pendingRx}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Awaiting pharmacist</div>
          </div>

          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
            <div className="text-[11px] font-bold uppercase text-rose-700">Safety Alerts</div>
            <div className="text-xl font-bold text-rose-900 mt-1">{flaggedInteractionsCount}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Allergy / Drug conflicts</div>
          </div>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <div className="text-[11px] font-bold uppercase text-blue-700">Held for MD</div>
            <div className="text-xl font-bold text-blue-900 mt-1">{heldRx}</div>
            <div className="text-[10px] text-blue-700 mt-0.5">Physician clarification</div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="text-[11px] font-bold uppercase text-emerald-700">Verified & Ready</div>
            <div className="text-xl font-bold text-emerald-900 mt-1">{verifiedRx}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Ready to dispense</div>
          </div>

          <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
            <div className="text-[11px] font-bold uppercase text-purple-700">Low Stock Items</div>
            <div className="text-xl font-bold text-purple-900 mt-1">{lowStockCount}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Reorder required</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          id="tab-prescriptions"
          onClick={() => setActiveSubTab('prescriptions')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'prescriptions'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>E-Prescription Review Queue ({ePrescriptions.length})</span>
          {flaggedInteractionsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
              {flaggedInteractionsCount} Alert
            </span>
          )}
        </button>

        <button
          id="tab-dispense-history"
          onClick={() => setActiveSubTab('dispense-history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'dispense-history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Dispensing Audit Log ({allDispenseEvents.length})</span>
        </button>

        <button
          id="tab-inventory"
          onClick={() => setActiveSubTab('inventory')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'inventory'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Formulary & Inventory ({pharmacyInventory.length})</span>
          {lowStockCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px]">
              {lowStockCount} Low
            </span>
          )}
        </button>

        <button
          id="tab-expiration-alerts"
          onClick={() => setActiveSubTab('expiration-alerts')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeSubTab === 'expiration-alerts'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Bell className="h-4 w-4" />
          <span>Automated Expiration Alerts</span>
          {expiringLotsCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">
              {expiringLotsCount} Expiring
            </span>
          )}
        </button>
      </div>

      {/* ======================================================== */}
      {/* SUB-TAB 1: E-PRESCRIPTION REVIEW QUEUE */}
      {/* ======================================================== */}
      {activeSubTab === 'prescriptions' && (
        <div className="space-y-4">
          {/* Filters and Search Bar */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by patient name, MRN, Rx number, medication, or physician..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full md:w-auto shrink-0">
              <Filter className="h-4 w-4 text-slate-400" />
              <McSelect
                value={filterStatus}
                onChange={setFilterStatus}
                options={[
                  { value: 'all', label: `All Statuses (${ePrescriptions.length})` },
                  { value: 'pending_review', label: `Pending Review (${pendingRx})` },
                  { value: 'flagged', label: `Flagged Interactions (${flaggedInteractionsCount})` },
                  { value: 'verified', label: `Verified (${verifiedRx})` },
                  { value: 'held_for_clarification', label: `Held for Clarification (${heldRx})` },
                  { value: 'dispensed', label: `Dispensed (${dispensedRx})` },
                  { value: 'rejected', label: 'Rejected' },
                ]}
                className="min-w-[14rem]"
                aria-label="Filter prescriptions by status"
              />
            </div>
          </div>

          {/* Prescriptions List */}
          {filteredPrescriptions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-semibold text-sm text-slate-700">No electronic prescriptions matching criteria</p>
              <p className="text-xs text-slate-400 mt-1">All e-prescriptions are verified and processed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPrescriptions.map((rx) => {
                const hasInteractions = rx.potentialInteractions && rx.potentialInteractions.length > 0;
                const hasSevere = rx.potentialInteractions?.some((i) => i.severity === 'severe');

                return (
                  <div
                    key={rx.id}
                    id={`rx-card-${rx.id}`}
                    className={`bg-white rounded-xl border transition-all p-5 shadow-sm ${
                      hasSevere && rx.status !== 'dispensed'
                        ? 'border-rose-300 ring-1 ring-rose-200'
                        : hasInteractions && rx.status !== 'dispensed'
                        ? 'border-amber-300'
                        : 'border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      {/* Left: Rx Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {rx.prescriptionNumber}
                          </span>
                          
                          {/* Priority badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              rx.priority === 'stat'
                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                : rx.priority === 'urgent'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {rx.priority} Priority
                          </span>

                          {/* Status badge */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              rx.status === 'dispensed'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : rx.status === 'verified'
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : rx.status === 'held_for_clarification'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : rx.status === 'rejected'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            {rx.status.replace('_', ' ')}
                          </span>

                          <span className="text-[11px] text-slate-400">
                            Prescribed {new Date(rx.datePrescribed).toLocaleString()}
                          </span>
                        </div>

                        {/* Drug Name & Dosage */}
                        <div className="flex items-baseline space-x-2">
                          <h3 className="text-base font-bold text-slate-900">
                            {rx.medicationName}
                          </h3>
                          <span className="text-xs text-slate-500 font-medium">({rx.genericName})</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold">
                            {rx.dosage}
                          </span>
                        </div>

                        {/* Sig instructions */}
                        <p className="text-xs text-slate-700 mt-1 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                          <strong className="text-slate-900">Sig:</strong> {rx.sigInstructions}
                        </p>

                        {/* Patient & Prescriber Meta */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs text-slate-600">
                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Patient</span>
                            <span className="font-semibold text-slate-800">{rx.patientName}</span>{' '}
                            <span className="font-mono text-[11px] text-slate-500">({rx.patientMrn})</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Prescriber</span>
                            <span className="font-semibold text-slate-800">{rx.doctorName}</span>{' '}
                            <span className="text-[10px] text-slate-400 block">NPI: {rx.doctorNpi}</span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">Quantity & Supply</span>
                            <span className="font-medium text-slate-800">
                              Qty: {rx.quantity} | {rx.daysSupply} days | Refills: {rx.refillsRemaining}/{rx.refillsAllowed}
                            </span>
                          </div>

                          <div>
                            <span className="text-slate-400 block text-[10px] uppercase font-bold">ICD-10 Diagnosis</span>
                            <span className="font-medium text-slate-800 truncate block" title={rx.icd10Diagnosis}>
                              {rx.icd10Diagnosis}
                            </span>
                          </div>
                        </div>

                        {/* Documented Patient Allergies */}
                        <div className="mt-2 text-xs flex items-center space-x-2">
                          <span className="text-slate-400 text-[10px] uppercase font-bold">Patient Allergies:</span>
                          {rx.patientAllergies.length === 0 ? (
                            <span className="text-slate-500 italic">No known drug allergies (NKDA)</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {rx.patientAllergies.map((allergy, i) => (
                                <span
                                  key={i}
                                  className="px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold"
                                >
                                  {allergy}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Automated Interaction / Conflict Banners */}
                        {hasInteractions && (
                          <div className="mt-3 space-y-2">
                            {rx.potentialInteractions.map((interaction) => (
                              <div
                                key={interaction.id}
                                className={`p-3 rounded-lg border text-xs ${
                                  interaction.severity === 'severe'
                                    ? 'bg-rose-50 border-rose-300 text-rose-900'
                                    : interaction.severity === 'moderate'
                                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                                    : 'bg-blue-50 border-blue-200 text-blue-900'
                                }`}
                              >
                                <div className="flex items-center space-x-2 font-bold">
                                  <AlertTriangle
                                    className={`h-4 w-4 shrink-0 ${
                                      interaction.severity === 'severe' ? 'text-rose-600' : 'text-amber-600'
                                    }`}
                                  />
                                  <span>{interaction.title}</span>
                                  <span
                                    className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-bold ${
                                      interaction.severity === 'severe'
                                        ? 'bg-rose-200 text-rose-800'
                                        : 'bg-amber-200 text-amber-800'
                                    }`}
                                  >
                                    {interaction.severity}
                                  </span>
                                </div>
                                <p className="mt-1 text-slate-700">{interaction.description}</p>
                                <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 flex items-start space-x-1.5">
                                  <strong className="text-slate-900 shrink-0">Recommendation:</strong>
                                  <span className="text-slate-800">{interaction.clinicalRecommendation}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Pharmacist Notes / Override status */}
                        {rx.overrideReason && (
                          <div className="mt-2.5 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900">
                            <span className="font-bold">Pharmacist Clinical Override Documented:</span>{' '}
                            <span>{rx.overrideReason}</span>
                            <span className="text-[10px] text-indigo-700 block mt-0.5">
                              Authorized by: {rx.overrideBy} on {rx.overrideTimestamp ? new Date(rx.overrideTimestamp).toLocaleString() : 'Today'}
                            </span>
                          </div>
                        )}

                        {rx.pharmacistNotes && !rx.overrideReason && (
                          <div className="mt-2 text-xs text-slate-500 italic">
                            Pharmacist Note: {rx.pharmacistNotes}
                          </div>
                        )}
                      </div>

                      {/* Right: Pharmacist Actions Panel */}
                      <div className="flex flex-row lg:flex-col gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 pt-3 lg:pt-0 lg:pl-4 justify-end">
                        {/* Verify button */}
                        {rx.status !== 'verified' && rx.status !== 'dispensed' && (
                          <button
                            id={`verify-btn-${rx.id}`}
                            onClick={() => handleOpenVerify(rx)}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Verify Rx</span>
                          </button>
                        )}

                        {/* Dispense button */}
                        {rx.status === 'verified' && (
                          <button
                            id={`dispense-btn-${rx.id}`}
                            onClick={() => handleOpenDispense(rx)}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
                          >
                            <Pill className="h-3.5 w-3.5" />
                            <span>Dispense Now</span>
                          </button>
                        )}

                        {/* Contact Prescribing Doctor button */}
                        <button
                          id={`contact-doctor-btn-${rx.id}`}
                          onClick={() => handleOpenDoctorInquiry(rx)}
                          className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors border border-slate-200"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-indigo-600" />
                          <span>Clarify with MD</span>
                        </button>

                        {/* Reject / Refuse Dispensing */}
                        {rx.status !== 'dispensed' && rx.status !== 'rejected' && (
                          <button
                            id={`reject-btn-${rx.id}`}
                            onClick={() => {
                              const reason = prompt('Document reason for refusing / rejecting e-prescription:', 'Severe contraindication / Safety conflict');
                              if (reason) rejectPrescription(rx.id, reason);
                            }}
                            className="flex items-center justify-center space-x-1 px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                          >
                            <span>Reject Rx</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: MEDICATION DISPENSING HISTORY & AUDIT LOG */}
      {/* ======================================================== */}
      {activeSubTab === 'dispense-history' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Medication Dispensing Audit History
              </h3>
              <p className="text-xs text-slate-500">
                Immutable record of all dispensed pharmaceutical items, verified lot numbers, cryptographic signature hashes, and patient counseling confirmations.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => alert('Dispense ledger exported as encrypted CSV report.')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                <span>Export Dispense Ledger</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Dispensed At</th>
                  <th className="py-2.5 px-3">Rx #</th>
                  <th className="py-2.5 px-3">Patient</th>
                  <th className="py-2.5 px-3">Medication</th>
                  <th className="py-2.5 px-3">Qty Dispensed</th>
                  <th className="py-2.5 px-3">Lot # / Expiry</th>
                  <th className="py-2.5 px-3">Pharmacist & License</th>
                  <th className="py-2.5 px-3">Counseling</th>
                  <th className="py-2.5 px-3">Signature Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allDispenseEvents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400 italic">
                      No prescriptions have been dispensed in this session yet.
                    </td>
                  </tr>
                ) : (
                  allDispenseEvents.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px]">
                        {new Date(ev.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                        {ev.rxNumber}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900">
                        {ev.patientName}{' '}
                        <span className="text-[10px] font-mono text-slate-400">({ev.patientMrn})</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">
                        {ev.medicationName}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-emerald-700">
                        {ev.quantityDispensed} units
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <span className="block font-bold">{ev.lotNumber}</span>
                        <span className="text-[10px] text-slate-400">Exp: {ev.expirationDate}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        <span className="block font-semibold">{ev.pharmacistName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{ev.pharmacistLicense}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        {ev.patientCounselingCompleted ? (
                          <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold text-[11px]">
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Waived</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[10px] text-indigo-600 truncate max-w-[120px]" title={ev.digitalSignatureHash}>
                        {ev.digitalSignatureHash}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: PHARMACY INVENTORY & FORMULARY */}
      {/* ======================================================== */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Network Formulary & Medication Inventory Control
              </h3>
              <p className="text-xs text-slate-500">
                Track stock levels, reorder thresholds, expiration dates, lot numbers, and temperature-controlled storage conditions.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">
                Vault Status: <strong className="text-slate-900">DEA Schedule II Verified</strong>
              </span>
            </div>
          </div>

          <InventoryTrackingChart inventory={pharmacyInventory} />

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3">Medication Name & Generic</th>
                  <th className="py-2.5 px-3">NDC Code</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Schedule</th>
                  <th className="py-2.5 px-3">Strength & Form</th>
                  <th className="py-2.5 px-3">Stock Level</th>
                  <th className="py-2.5 px-3">Reorder Point</th>
                  <th className="py-2.5 px-3">Lot & Expiry</th>
                  <th className="py-2.5 px-3">Storage</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pharmacyInventory.map((item) => {
                  const isLow = item.currentStock <= item.reorderThreshold;
                  const isControlled = item.controlledSchedule !== 'Non-controlled';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{item.medicationName}</span>
                        <span className="text-[11px] text-slate-500">{item.genericName}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {item.ndc}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-700">
                        {item.category}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isControlled
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {item.controlledSchedule}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        <span className="font-semibold block">{item.strength}</span>
                        <span className="text-[10px] text-slate-500">{item.dosageForm}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold text-sm ${
                            item.currentStock === 0
                              ? 'text-rose-600'
                              : isLow
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.currentStock}
                        </span>
                        <span className="text-[10px] text-slate-400 block">units</span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        {item.reorderThreshold} units
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <span className="font-bold block">{item.lotNumber}</span>
                        <span className="text-[10px] text-slate-400">{item.expirationDate}</span>
                      </td>
                      <td className="py-2.5 px-3 text-[11px] text-slate-600 font-medium">
                        {item.storageCondition}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            item.status === 'In Stock'
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          id={`restock-btn-${item.id}`}
                          onClick={() => handleOpenRestock(item)}
                          className="px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-[11px] transition-colors border border-indigo-200"
                        >
                          Restock
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: AUTOMATED MEDICATION EXPIRATION ALERTS */}
      {/* ======================================================== */}
      {activeSubTab === 'expiration-alerts' && (
        <ExpirationAlertsManager />
      )}

      {/* ======================================================== */}
      {/* MODAL: PHARMACIST CLINICAL OVERRIDE */}
      {/* ======================================================== */}
      {overrideModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-rose-600 border-b border-slate-100 pb-3">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">
                Pharmacist Clinical Override Required
              </h3>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-2">
              <p className="font-bold">
                Automated clinical screening detected the following interaction(s) for {selectedRx.patientName}:
              </p>
              {selectedRx.potentialInteractions.map((inter) => (
                <div key={inter.id} className="bg-white/80 p-2 rounded border border-rose-200">
                  <span className="font-bold text-rose-950 block">{inter.title}</span>
                  <span className="text-slate-700">{inter.description}</span>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mandatory Clinical Justification (HIPAA & Pharmacy Board Audited):
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. Discussed with prescribing physician Dr. Kyaw Zin Oo; allergy skin testing negative / telemetry telemetry monitoring in place; benefit clearly outweighs risk."
                rows={3}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setOverrideModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!overrideReason.trim()}
                onClick={handleConfirmOverride}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white disabled:opacity-50 transition-colors shadow-sm"
              >
                Sign & Authorize Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DISPENSE MEDICATION */}
      {/* ======================================================== */}
      {dispenseModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-emerald-600 border-b border-slate-100 pb-3">
              <Pill className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">
                Final Dispense Verification
              </h3>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Prescription:</span>
                <span className="font-mono font-bold text-slate-800">{selectedRx.prescriptionNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Patient:</span>
                <span className="font-bold text-slate-800">{selectedRx.patientName} ({selectedRx.patientMrn})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Medication:</span>
                <span className="font-bold text-slate-900">{selectedRx.medicationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dosage & Sig:</span>
                <span className="font-medium text-slate-700">{selectedRx.dosage} - {selectedRx.sigInstructions}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Manufacturer Lot Number:
                </label>
                <input
                  type="text"
                  value={dispenseLot}
                  onChange={(e) => setDispenseLot(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dispense Quantity (Deducted from Central Stock):
                </label>
                <input
                  type="number"
                  value={dispenseQty}
                  onChange={(e) => setDispenseQty(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="counseling-checkbox"
                  checked={counselingDone}
                  onChange={(e) => setCounselingDone(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <label htmlFor="counseling-checkbox" className="text-xs text-slate-700 font-medium">
                  Patient / Nurse counseling leaflets & instruction provided
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dispense Notes (Optional):
                </label>
                <input
                  type="text"
                  value={dispenseNotes}
                  onChange={(e) => setDispenseNotes(e.target.value)}
                  placeholder="e.g. Original factory seal verified; blister pack dispensed."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDispenseModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDispense}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                Confirm Dispense & Sign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: DOCTOR INQUIRY & CLARIFICATION */}
      {/* ======================================================== */}
      {doctorInquiryModalOpen && selectedRx && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
              <MessageSquare className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">
                Contact Prescribing Physician
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Send an encrypted urgent clinical clarification to <strong>{selectedRx.doctorName}</strong> regarding Rx <strong>{selectedRx.prescriptionNumber}</strong> for patient <strong>{selectedRx.patientName}</strong>.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Pharmacist Clinical Question / Safety Concern:
                </label>
                <textarea
                  value={doctorQuestion}
                  onChange={(e) => setDoctorQuestion(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Suggested Evidence-Based Alternative (Optional):
                </label>
                <input
                  type="text"
                  value={suggestedAlternative}
                  onChange={(e) => setSuggestedAlternative(e.target.value)}
                  placeholder="e.g. Recommend Azithromycin 500mg IV q24h due to documented Penicillin anaphylaxis."
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDoctorInquiryModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendDoctorInquiry}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send Urgent Clinical Message</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: RESTOCK INVENTORY */}
      {/* ======================================================== */}
      {restockModalOpen && selectedInventoryItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-indigo-600 border-b border-slate-100 pb-3">
              <Package className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-base">
                Restock Formulary Inventory
              </h3>
            </div>

            <div className="text-xs text-slate-600 space-y-1">
              <p>
                Item: <strong>{selectedInventoryItem.medicationName}</strong>
              </p>
              <p>
                Current Stock: <strong className="text-slate-900">{selectedInventoryItem.currentStock}</strong> | Reorder Point:{' '}
                {selectedInventoryItem.reorderThreshold}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Units to Add to Stock:
              </label>
              <input
                type="number"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                min={1}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800 text-xs font-bold"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRestockModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestock}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
              >
                Confirm Restock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SIMULATE NEW E-PRESCRIPTION */}
      {/* ======================================================== */}
      {newRxModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-indigo-600">
                <Plus className="h-6 w-6" />
                <h3 className="font-bold text-slate-900 text-base">
                  Simulate New Inpatient E-Prescription
                </h3>
              </div>
              <button
                onClick={() => setNewRxModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewRx} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Patient:</label>
                <select
                  value={newRxPatientId}
                  onChange={(e) => setNewRxPatientId(e.target.value)}
                  className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.mrn}) - Allergies: {p.allergies.join(', ') || 'NKDA'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Medication Name:</label>
                  <input
                    type="text"
                    value={newRxMedName}
                    onChange={(e) => setNewRxMedName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Generic Name:</label>
                  <input
                    type="text"
                    value={newRxGeneric}
                    onChange={(e) => setNewRxGeneric(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dosage:</label>
                  <input
                    type="text"
                    value={newRxDosage}
                    onChange={(e) => setNewRxDosage(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Route:</label>
                  <input
                    type="text"
                    value={newRxRoute}
                    onChange={(e) => setNewRxRoute(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Frequency:</label>
                  <input
                    type="text"
                    value={newRxFreq}
                    onChange={(e) => setNewRxFreq(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quantity:</label>
                  <input
                    type="number"
                    value={newRxQty}
                    onChange={(e) => setNewRxQty(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Priority:</label>
                  <select
                    value={newRxPriority}
                    onChange={(e) => setNewRxPriority(e.target.value as any)}
                    className="w-full pl-3 pr-9 py-1.5 rounded-lg border border-slate-300 text-slate-800 bg-white"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sig Instructions:</label>
                <textarea
                  value={newRxSig}
                  onChange={(e) => setNewRxSig(e.target.value)}
                  rows={2}
                  className="w-full p-2 rounded-lg border border-slate-300 text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewRxModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
                >
                  Submit E-Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
