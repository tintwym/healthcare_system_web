import React, { useState } from 'react';
import {
  CreditCard,
  DollarSign,
  Plus,
  FileCheck,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  Building,
  Calendar,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { Invoice, InvoiceItem } from '../../types';
import { McSelect } from '../ui/McSelect';

export const BillingDashboard: React.FC = () => {
  const {
    invoices,
    patients,
    createInvoice,
    payInvoice,
    submitInsuranceClaim,
    deIdentifyPhi,
  } = useHospital();

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(invoices[0] || null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);

  // New Invoice Form
  const [invoicePatientId, setInvoicePatientId] = useState(patients[0]?.id || '');
  const [lineItems, setLineItems] = useState<Omit<InvoiceItem, 'id' | 'total'>[]>([
    {
      code: '99214',
      description: 'Office Visit Level 4 - Moderate Medical Decision Making',
      category: 'Consultation',
      quantity: 1,
      unitPrice: 220,
    },
  ]);

  const filteredInvoices = invoices.filter((inv) => {
    return filterStatus === 'all' || inv.status === filterStatus;
  });

  const totalBilled = invoices.reduce((acc, i) => acc + i.subtotal, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.amountPaid, 0);
  const totalInsuranceCovered = invoices.reduce((acc, i) => acc + i.insuranceCovered, 0);
  const totalOutstanding = invoices.reduce((acc, i) => acc + (i.patientResponsibility - i.amountPaid), 0);

  const handleAddLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        code: '80053',
        description: 'Comprehensive Metabolic Panel',
        category: 'Laboratory',
        quantity: 1,
        unitPrice: 85,
      },
    ]);
  };

  const handleRemoveLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const items: InvoiceItem[] = lineItems.map((item, idx) => ({
      ...item,
      id: `item-${Date.now()}-${idx}`,
      total: item.quantity * item.unitPrice,
    }));

    const created = createInvoice(invoicePatientId, items);
    setSelectedInvoice(created);
    setIsNewInvoiceOpen(false);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'insurance_processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'overdue':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Automated Billing & Revenue Cycle Management
          </h1>
          <p className="text-xs text-slate-500">
            CPT/HCPCS medical coding, real-time insurance claims processing (EDI 837/835), and itemized patient invoicing.
          </p>
        </div>

        <button
          id="create-manual-invoice-btn"
          onClick={() => setIsNewInvoiceOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Generate Itemized Invoice</span>
        </button>
      </div>

      {/* Revenue Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase">Total Billed Charges</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">MMK {totalBilled.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">{invoices.length} active invoices</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase">Insurance Adjudicated</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">MMK {totalInsuranceCovered.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 font-medium mt-1">EDI Direct Remittance</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase">Patient Payments Received</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">MMK {totalCollected.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">PCI-DSS Level 1 Gateway</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs text-slate-500 font-semibold uppercase">Outstanding Copay/Balance</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">MMK {totalOutstanding.toLocaleString()}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-1">Patient Portal Active</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Invoices List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 h-[min(680px,calc(100dvh-12rem))]">
          {/* Filter Bar */}
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Claims & Invoices Registry
            </h3>
            <McSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'paid', label: 'Paid' },
                { value: 'pending', label: 'Pending' },
                { value: 'insurance_processing', label: 'Insurance Processing' },
              ]}
              className="min-w-[10rem]"
              aria-label="Filter invoices by status"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {filteredInvoices.map((inv) => {
              const isSelected = selectedInvoice?.id === inv.id;
              const patientDisplayName = deIdentifyPhi
                ? `Patient #${inv.patientId.slice(-4)}`
                : inv.patientName;

              return (
                <div
                  key={inv.id}
                  id={`invoice-row-${inv.id}`}
                  onClick={() => setSelectedInvoice(inv)}
                  className={`p-3.5 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-50/80 border-l-4 border-blue-600 shadow-xs'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-900">{inv.invoiceNumber}</div>
                      <div className="text-xs text-slate-700 font-medium mt-0.5">{patientDisplayName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{deIdentifyPhi ? 'MRN-******' : inv.patientMrn}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getStatusBadge(inv.status)}`}>
                      {inv.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Subtotal: MMK {inv.subtotal}</span>
                    <span className="font-bold text-slate-900">
                      Patient Due: MMK {inv.patientResponsibility - inv.amountPaid}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Payer: {inv.insuranceClaim.payerName.slice(0, 20)}</span>
                    <span>Due: {inv.dueDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Invoice Detail & Claim Inspector (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-0 h-[min(680px,calc(100dvh-12rem))]">
          {selectedInvoice ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Invoice Action Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/70 rounded-t-xl">
                <div>
                  <div className="text-xs font-bold text-slate-500 uppercase">Clinical Statement</div>
                  <h3 className="text-base font-bold text-slate-900">{selectedInvoice.invoiceNumber}</h3>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handlePrint}
                    className="p-2 border border-slate-300 rounded-lg hover:bg-slate-100 text-slate-700"
                    title="Print Invoice"
                  >
                    <Printer className="h-4 w-4" />
                  </button>

                  {selectedInvoice.insuranceClaim.status !== 'Approved' && (
                    <button
                      id="approve-claim-btn"
                      onClick={() => submitInsuranceClaim(selectedInvoice.id)}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Adjudicate Claim
                    </button>
                  )}

                  {selectedInvoice.status !== 'paid' && (
                    <button
                      id="record-payment-btn"
                      onClick={() => payInvoice(selectedInvoice.id, selectedInvoice.patientResponsibility - selectedInvoice.amountPaid)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                    >
                      Process Payment (MMK {selectedInvoice.patientResponsibility - selectedInvoice.amountPaid})
                    </button>
                  )}
                </div>
              </div>

              {/* Invoice Printable View */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700">
                {/* Hospital Header & Metadata */}
                <div className="flex justify-between border-b pb-4">
                  <div>
                    <h4 className="font-bold text-base text-slate-900">Medicore Yangon Healthcare Network</h4>
                    <p className="text-slate-500">No. 1, Pyay Road, Mayangone Township, Yangon</p>
                    <p className="text-slate-500">NPI: 1982740192 • Tax ID: 94-2849102</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-slate-900">Invoice Date: {selectedInvoice.date}</div>
                    <div className="text-slate-500">Due Date: {selectedInvoice.dueDate}</div>
                    <div className="text-slate-500">EDI Claim ID: {selectedInvoice.insuranceClaim.claimId}</div>
                  </div>
                </div>

                {/* Patient & Insurance Breakdown */}
                <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Billed Patient</div>
                    <div className="font-bold text-slate-900">
                      {deIdentifyPhi ? `Patient #${selectedInvoice.patientId.slice(-4)}` : selectedInvoice.patientName}
                    </div>
                    <div className="text-slate-500 font-mono">
                      {deIdentifyPhi ? 'MRN-******' : selectedInvoice.patientMrn}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Payer Information</div>
                    <div className="font-bold text-slate-900">{selectedInvoice.insuranceClaim.payerName}</div>
                    <div className="text-emerald-700 font-medium">
                      Status: {selectedInvoice.insuranceClaim.status}
                      {selectedInvoice.insuranceClaim.eobReference && ` (${selectedInvoice.insuranceClaim.eobReference})`}
                    </div>
                  </div>
                </div>

                {/* Detailed Itemized Statement by Service Category */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900">
                      Detailed Itemized Statement
                    </h5>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      CPT / HCPCS · {selectedInvoice.items.length} line items
                    </span>
                  </div>

                  {(() => {
                    const categoryMeta: Record<
                      InvoiceItem['category'],
                      { label: string; hint: string; color: string }
                    > = {
                      Consultation: {
                        label: 'Procedures & Clinical Visits',
                        hint: 'E&M, procedures, facility professional fees',
                        color: 'border-blue-200 bg-blue-50/60',
                      },
                      Surgical: {
                        label: 'Surgical Procedures',
                        hint: 'Operative and perioperative CPT services',
                        color: 'border-violet-200 bg-violet-50/60',
                      },
                      Laboratory: {
                        label: 'Laboratory & Diagnostics',
                        hint: 'Pathology and clinical lab panels',
                        color: 'border-cyan-200 bg-cyan-50/60',
                      },
                      Radiology: {
                        label: 'Radiology & Imaging',
                        hint: 'Imaging acquisition and interpretation',
                        color: 'border-indigo-200 bg-indigo-50/60',
                      },
                      Medication: {
                        label: 'Pharmacy & Medications',
                        hint: 'Dispensed drugs, vaccines, and J-codes',
                        color: 'border-emerald-200 bg-emerald-50/60',
                      },
                      'Room & Board': {
                        label: 'Room & Board / Facility',
                        hint: 'Inpatient stay and facility fees',
                        color: 'border-amber-200 bg-amber-50/60',
                      },
                    };

                    const categories = (
                      [
                        'Consultation',
                        'Surgical',
                        'Laboratory',
                        'Radiology',
                        'Medication',
                        'Room & Board',
                      ] as InvoiceItem['category'][]
                    ).filter((cat) =>
                      selectedInvoice.items.some((i) => i.category === cat)
                    );

                    const subtotal = selectedInvoice.subtotal || 1;
                    const adjRatio = selectedInvoice.insuranceAdjustment / subtotal;
                    const covRatio = selectedInvoice.insuranceCovered / subtotal;

                    return categories.map((cat) => {
                      const items = selectedInvoice.items.filter((i) => i.category === cat);
                      const catTotal = items.reduce((s, i) => s + i.total, 0);
                      const catAdj = Math.round(catTotal * adjRatio * 100) / 100;
                      const catCov = Math.round(catTotal * covRatio * 100) / 100;
                      const catPatient = Math.round((catTotal - catAdj - catCov) * 100) / 100;
                      const meta = categoryMeta[cat];

                      return (
                        <div
                          key={cat}
                          className={`rounded-xl border overflow-hidden ${meta.color}`}
                        >
                          <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 bg-white/50">
                            <div>
                              <div className="text-xs font-bold text-slate-900">{meta.label}</div>
                              <div className="text-[10px] text-slate-500">{meta.hint}</div>
                            </div>
                            <div className="text-right text-[10px] space-y-0.5">
                              <div className="font-bold text-slate-900 text-xs">
                                Gross MMK {catTotal.toFixed(2)}
                              </div>
                              <div className="text-slate-500">
                                Adj −MMK {catAdj.toFixed(2)} · Ins −MMK {catCov.toFixed(2)} · Patient MMK 
                                {catPatient.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <table className="w-full border-collapse bg-white/80">
                            <thead>
                              <tr className="text-slate-500 text-left text-[10px] uppercase tracking-wider border-b border-slate-100">
                                <th className="p-2 font-bold">Code</th>
                                <th className="p-2 font-bold">Service Description</th>
                                <th className="p-2 font-bold text-center">Qty</th>
                                <th className="p-2 font-bold text-right">Unit</th>
                                <th className="p-2 font-bold text-right">Line Total</th>
                                <th className="p-2 font-bold text-right">Est. Patient Share</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {items.map((item) => {
                                const linePatient =
                                  Math.round(
                                    (item.total - item.total * adjRatio - item.total * covRatio) *
                                      100
                                  ) / 100;
                                return (
                                  <tr key={item.id} className="hover:bg-white/90">
                                    <td className="p-2 font-mono font-semibold text-blue-700 text-[11px]">
                                      {item.code}
                                    </td>
                                    <td className="p-2 text-slate-800 text-[11px]">
                                      {item.description}
                                    </td>
                                    <td className="p-2 text-center text-[11px]">{item.quantity}</td>
                                    <td className="p-2 text-right text-[11px]">
                                      MMK {item.unitPrice.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right font-semibold text-[11px]">
                                      MMK {item.total.toFixed(2)}
                                    </td>
                                    <td className="p-2 text-right text-[11px] text-slate-600">
                                      MMK {linePatient.toFixed(2)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Insurance Adjustment Transparency Panel */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                      Insurance Adjustments & Adjudication
                    </h5>
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedInvoice.insuranceClaim.claimId}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Contractual Adjustment
                      </div>
                      <div className="text-lg font-bold text-slate-800 mt-1">
                        −MMK {selectedInvoice.insuranceAdjustment.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {selectedInvoice.subtotal > 0
                          ? `${((selectedInvoice.insuranceAdjustment / selectedInvoice.subtotal) * 100).toFixed(1)}%`
                          : '0%'}{' '}
                        of gross billed (payer contracted rate write-off)
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Payer Covered Amount
                      </div>
                      <div className="text-lg font-bold text-blue-700 mt-1">
                        −MMK {selectedInvoice.insuranceCovered.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {selectedInvoice.insuranceClaim.payerName} ·{' '}
                        {selectedInvoice.insuranceClaim.status}
                        {selectedInvoice.insuranceClaim.eobReference
                          ? ` · ${selectedInvoice.insuranceClaim.eobReference}`
                          : ''}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <div className="text-[10px] font-bold uppercase text-slate-400">
                        Patient Responsibility
                      </div>
                      <div className="text-lg font-bold text-rose-700 mt-1">
                        MMK {selectedInvoice.patientResponsibility.toFixed(2)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Copay / deductible / coinsurance after insurance
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 leading-relaxed">
                    Category-level patient share is prorated from the claim-level contractual
                    adjustment and insurance payment ratios for transparent statement review.
                    Pharmacy (Medication), procedures (Consultation/Surgical), and diagnostics are
                    itemized separately for financial counseling and regulatory audit.
                  </div>
                </div>

                {/* Financial Summary Calculation */}
                <div className="border-t pt-4 space-y-1.5 text-right">
                  <div className="flex justify-end space-x-8">
                    <span className="text-slate-500">Gross Billed Subtotal:</span>
                    <span className="font-semibold w-24">MMK {selectedInvoice.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end space-x-8 text-slate-600">
                    <span>Insurance Contracted Adjustment:</span>
                    <span className="w-24">-MMK {selectedInvoice.insuranceAdjustment.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end space-x-8 text-blue-700">
                    <span>Insurance Payer Covered:</span>
                    <span className="font-semibold w-24">-MMK {selectedInvoice.insuranceCovered.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end space-x-8 font-bold text-slate-900 text-sm border-t pt-2">
                    <span>Patient Responsibility (Copay/Deductible):</span>
                    <span className="w-24">MMK {selectedInvoice.patientResponsibility.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end space-x-8 text-emerald-600 font-semibold">
                    <span>Amount Paid by Patient:</span>
                    <span className="w-24">MMK {selectedInvoice.amountPaid.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-end space-x-8 font-bold text-slate-900 border-t pt-1">
                    <span>Current Balance Due:</span>
                    <span className="text-rose-600 w-24">
                      MMK {(selectedInvoice.patientResponsibility - selectedInvoice.amountPaid).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center justify-between border border-slate-200">
                  <div className="flex items-center space-x-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    <span>HIPAA Compliant EDI-837 Healthcare Claims Generation</span>
                  </div>
                  <span className="font-mono text-[10px]">Secure Electronic Statement</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select an invoice from the left to view statement details.
            </div>
          )}
        </div>
      </div>

      {/* Manual Invoice Generation Modal */}
      {isNewInvoiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900">Create Itemized Clinical Invoice</h3>
              <button onClick={() => setIsNewInvoiceOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInvoiceSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Patient</label>
                <select
                  value={invoicePatientId}
                  onChange={(e) => setInvoicePatientId(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {deIdentifyPhi ? `Patient #${p.id.slice(-4)}` : `${p.firstName} ${p.lastName}`} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-semibold text-slate-700">CPT / HCPCS Clinical Procedures & Fees</label>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {lineItems.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500">CPT Code</label>
                          <input
                            type="text"
                            required
                            value={item.code}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[idx].code = e.target.value;
                              setLineItems(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded border bg-white"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] text-slate-500">Description</label>
                          <input
                            type="text"
                            required
                            value={item.description}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[idx].description = e.target.value;
                              setLineItems(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded border bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500">Unit Price (MMK)</label>
                          <input
                            type="number"
                            required
                            value={item.unitPrice}
                            onChange={(e) => {
                              const updated = [...lineItems];
                              updated[idx].unitPrice = parseInt(e.target.value) || 0;
                              setLineItems(updated);
                            }}
                            className="w-full px-2 py-1.5 rounded border bg-white"
                          />
                        </div>
                      </div>
                      {lineItems.length > 1 && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(idx)}
                            className="text-rose-600 hover:text-rose-800 text-[10px] font-semibold"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Create & File Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
