import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Droplets, Phone, Shield, CreditCard } from 'lucide-react';
import type { Invoice, PatientRecord } from '../../../types';
import { BillingScreen } from './BillingScreen';
import { PushNotificationsToggle } from '../../PushNotificationsToggle';

interface ProfileScreenProps {
  patient: PatientRecord;
  invoices: Invoice[];
  onPay: (
    invoiceId: string,
    amount: number,
    method: 'hsa' | 'card'
  ) => Promise<{ id: string; amount: number; method: string } | void>;
  onUpdateProfile: (profile: {
    phone?: string;
    emergencyContact?: Partial<PatientRecord['emergencyContact']>;
  }) => Promise<void>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  patient,
  invoices,
  onPay,
  onUpdateProfile,
}) => {
  const [editing, setEditing] = useState(false);
  const [billingOpen, setBillingOpen] = useState(false);
  const [phone, setPhone] = useState(patient.phone);
  const [ecName, setEcName] = useState(patient.emergencyContact.name);
  const [ecPhone, setEcPhone] = useState(patient.emergencyContact.phone);
  const [ecRel, setEcRel] = useState(patient.emergencyContact.relationship);

  const dueTotal = invoices.reduce((sum, inv) => {
    const bal = inv.patientResponsibility - inv.amountPaid;
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  return (
    <motion.div
      className="space-y-5"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Identity hero */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--mc-ink)] text-white px-4 py-5 text-center">
        <div className="absolute -right-8 -top-10 h-28 w-28 rounded-full bg-teal-400/25 blur-2xl" />
        <div className="relative">
          <h3 className="font-display text-xl tracking-tight">
            {patient.firstName} {patient.lastName}
          </h3>
          <p className="text-[12px] text-teal-200/95 mt-1.5">
            Care with {patient.primaryDoctor.split(',')[0]}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 tabular-nums tracking-wide">MRN {patient.mrn}</p>
        </div>
      </div>

      {/* Care profile */}
      <section>
        <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--mc-muted)] mb-2">
          Care profile
        </h4>
        <div className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] divide-y divide-[var(--mc-line)]">
          <div className="flex gap-3 p-3.5">
            <div className="h-8 w-8 rounded-xl bg-[var(--mc-accent-muted)] text-[var(--mc-accent)] flex items-center justify-center shrink-0">
              <Droplets className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">Blood type</div>
              <div className="text-[13px] font-semibold text-[var(--mc-text)] mt-0.5">{patient.bloodType}</div>
            </div>
          </div>
          <div className="flex gap-3 p-3.5">
            <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">Allergies</div>
              <div className="text-[13px] font-semibold text-[var(--mc-text)] mt-0.5">
                {patient.allergies.length ? patient.allergies.join(', ') : 'NKDA'}
              </div>
            </div>
          </div>
          <div className="flex gap-3 p-3.5">
            <div className="h-8 w-8 rounded-xl bg-[var(--mc-accent-muted)] text-[var(--mc-accent)] flex items-center justify-center shrink-0">
              <CreditCard className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">Insurance</div>
              <div className="text-[13px] font-semibold text-[var(--mc-text)] mt-0.5">{patient.insurance.provider}</div>
              {patient.insurance.policyNumber && (
                <div className="text-[11px] text-[var(--mc-muted)] mt-0.5">Policy {patient.insurance.policyNumber}</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--mc-muted)]">Contact</h4>
          <button
            type="button"
            className="text-[11px] font-bold text-[var(--mc-accent)]"
            onClick={async () => {
              if (editing) {
                try {
                  await onUpdateProfile({
                    phone,
                    emergencyContact: {
                      name: ecName,
                      phone: ecPhone,
                      relationship: ecRel,
                    },
                  });
                  setEditing(false);
                } catch {
                  /* keep editing */
                }
              } else {
                setPhone(patient.phone);
                setEcName(patient.emergencyContact.name);
                setEcPhone(patient.emergencyContact.phone);
                setEcRel(patient.emergencyContact.relationship);
                setEditing(true);
              }
            }}
          >
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>
        <div className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] p-3.5">
          {editing ? (
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase text-[var(--mc-muted)]">
                Your phone
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-2.5 py-2 text-[12px] text-[var(--mc-text)]"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
              <label className="block text-[10px] font-bold uppercase text-[var(--mc-muted)]">
                Emergency contact
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-2.5 py-2 text-[12px] text-[var(--mc-text)]"
                  value={ecName}
                  onChange={(e) => setEcName(e.target.value)}
                />
              </label>
              <label className="block text-[10px] font-bold uppercase text-[var(--mc-muted)]">
                Relationship
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-2.5 py-2 text-[12px] text-[var(--mc-text)]"
                  value={ecRel}
                  onChange={(e) => setEcRel(e.target.value)}
                />
              </label>
              <label className="block text-[10px] font-bold uppercase text-[var(--mc-muted)]">
                Emergency phone
                <input
                  className="mt-1 w-full rounded-lg border border-[var(--mc-line)] bg-[var(--mc-surface)] px-2.5 py-2 text-[12px] text-[var(--mc-text)]"
                  value={ecPhone}
                  onChange={(e) => setEcPhone(e.target.value)}
                />
              </label>
              <button
                type="button"
                className="w-full text-[11px] font-semibold text-[var(--mc-muted)] py-1.5"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-xl bg-[var(--mc-accent-muted)] text-[var(--mc-accent)] flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">You</div>
                  <div className="text-[13px] font-semibold text-[var(--mc-text)] mt-0.5">{patient.phone}</div>
                </div>
              </div>
              <div className="border-t border-[var(--mc-line)] pt-3 flex gap-3">
                <div className="h-8 w-8 rounded-xl bg-[var(--mc-accent-muted)] text-[var(--mc-accent)] flex items-center justify-center shrink-0">
                  <Phone className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--mc-muted)]">
                    Emergency · {patient.emergencyContact.relationship}
                  </div>
                  <div className="text-[13px] font-semibold text-[var(--mc-text)] mt-0.5">
                    {patient.emergencyContact.name}
                  </div>
                  <div className="text-[11px] text-[var(--mc-muted)] mt-0.5">{patient.emergencyContact.phone}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section>
        <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--mc-muted)] mb-2">
          Notifications
        </h4>
        <p className="text-[11px] text-[var(--mc-muted)] mb-2 leading-relaxed">
          Care messages, abnormal vitals, and visit reminders in this browser.
        </p>
        <PushNotificationsToggle />
      </section>

      {/* Billing summary */}
      <section>
        <h4 className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--mc-muted)] mb-2">Billing</h4>
        <div className="rounded-2xl bg-[var(--mc-ink)] text-white p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-teal-400/25 blur-2xl" />
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200/90">Balance due</div>
            <div className="font-display text-3xl mt-1 tabular-nums">${dueTotal.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 mt-1">
              {invoices.length} statement{invoices.length === 1 ? '' : 's'} on file
            </div>
            <button
              type="button"
              onClick={() => setBillingOpen((o) => !o)}
              className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white/15 text-white text-[12px] font-bold hover:bg-white/20 transition-colors"
            >
              {billingOpen ? 'Hide statements' : 'View statements & pay'}
              <ChevronDown
                className={`h-4 w-4 transition-transform ${billingOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        </div>
        <AnimatePresence>
          {billingOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-3"
            >
              <BillingScreen invoices={invoices} onPay={onPay} embedded detailsOnly />
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </motion.div>
  );
};
