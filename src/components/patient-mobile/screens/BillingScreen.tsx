import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import type { Invoice } from '../../../types';

interface BillingScreenProps {
  invoices: Invoice[];
  onPay: (
    invoiceId: string,
    amount: number,
    method: 'hsa' | 'card'
  ) => Promise<{ id: string; amount: number; method: string } | void>;
  embedded?: boolean;
  /** Skip title + balance hero when Profile owns the summary. */
  detailsOnly?: boolean;
}

export const BillingScreen: React.FC<BillingScreenProps> = ({
  invoices,
  onPay,
  embedded = false,
  detailsOnly = false,
}) => {
  const [method, setMethod] = useState<'hsa' | 'card'>('hsa');
  const [receipt, setReceipt] = useState<{ id: string; amount: number; method: string } | null>(
    null
  );

  const dueTotal = invoices.reduce((sum, inv) => {
    const bal = inv.patientResponsibility - inv.amountPaid;
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  return (
    <motion.div
      className="space-y-4"
      initial={embedded || detailsOnly ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {!detailsOnly &&
        (!embedded ? (
          <div>
            <h3 className="font-display text-xl text-[var(--mc-text)] tracking-tight">Billing</h3>
            <p className="text-[11px] text-[var(--mc-muted)] mt-0.5">Statements and patient share</p>
          </div>
        ) : (
          <div>
            <h3 className="text-[13px] font-bold text-[var(--mc-text)]">Billing & payments</h3>
            <p className="text-[11px] text-[var(--mc-muted)] mt-0.5">Statements and patient share</p>
          </div>
        ))}

      {!detailsOnly && (
        <div className="rounded-2xl bg-[var(--mc-ink)] text-white p-4 relative overflow-hidden">
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-teal-400/25 blur-2xl" />
          <div className="relative">
            <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-200/90">Balance due</div>
            <div className="font-display text-3xl mt-1 tabular-nums">${dueTotal.toFixed(2)}</div>
            <div className="text-[11px] text-slate-400 mt-1">{invoices.length} statements on file</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setMethod('hsa')}
          className={`py-2 rounded-xl text-[11px] font-bold border ${
            method === 'hsa'
              ? 'bg-[var(--mc-accent-muted)] border-[var(--mc-accent)] text-[var(--mc-accent)]'
              : 'bg-[var(--mc-elevated)] border-[var(--mc-line)] text-[var(--mc-muted)]'
          }`}
        >
          HSA / FSA
        </button>
        <button
          type="button"
          onClick={() => setMethod('card')}
          className={`py-2 rounded-xl text-[11px] font-bold border ${
            method === 'card'
              ? 'bg-[var(--mc-accent-muted)] border-[var(--mc-accent)] text-[var(--mc-accent)]'
              : 'bg-[var(--mc-elevated)] border-[var(--mc-line)] text-[var(--mc-muted)]'
          }`}
        >
          Card
        </button>
      </div>

      {receipt && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-[11px] text-emerald-900 space-y-0.5">
          <div className="font-bold">Payment confirmed</div>
          <div>
            ${receipt.amount.toFixed(2)} via {receipt.method}
          </div>
          <div className="font-mono text-emerald-800/80">Receipt {receipt.id}</div>
        </div>
      )}

      <div className="space-y-3">
        {invoices.length === 0 && (
          <p className="text-[12px] text-[var(--mc-muted)] py-6 text-center">No billing statements yet.</p>
        )}
        {invoices.map((inv, i) => {
          const balance = inv.patientResponsibility - inv.amountPaid;
          return (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] p-3.5 backdrop-blur-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-[12px] font-bold text-[var(--mc-text)] font-mono">{inv.invoiceNumber}</div>
                  <div className="text-[10px] text-[var(--mc-muted)] mt-0.5">Due {inv.dueDate}</div>
                </div>
                <span
                  className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                    inv.status === 'paid'
                      ? 'bg-emerald-50 text-emerald-800'
                      : 'bg-amber-50 text-amber-800'
                  }`}
                >
                  {inv.status.replace('_', ' ')}
                </span>
              </div>
              <div className="mt-2.5 flex justify-between text-[12px]">
                <span className="text-[var(--mc-muted)]">Your share</span>
                <span className="font-bold tabular-nums text-[var(--mc-text)]">${inv.patientResponsibility.toFixed(2)}</span>
              </div>
              {balance > 0 ? (
                <button
                  type="button"
                  onClick={async () => {
                    const result = await onPay(inv.id, balance, method);
                    if (result) setReceipt(result);
                  }}
                  className="mt-3 w-full py-2 rounded-xl bg-[var(--mc-accent)] hover:opacity-90 text-white text-[12px] font-bold transition-colors"
                >
                  Pay ${balance.toFixed(2)}
                </button>
              ) : (
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50/80 py-2 rounded-xl">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Paid in full
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
