import React, { useState } from 'react';
import {
  AlertTriangle,
  Mail,
  Bell,
  Clock,
  CheckCircle2,
  Send,
  ShieldAlert,
  Archive,
  RefreshCw,
  Search,
  Filter,
  Check,
  Calendar,
  ExternalLink,
  Info,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { ExpirationNotification } from '../../types';
import { McSelect } from '../ui/McSelect';

export const ExpirationAlertsManager: React.FC = () => {
  const {
    currentUser,
    pharmacyInventory,
    expirationNotifications,
    sendExpirationNotification,
    quarantineExpiringInventory,
  } = useHospital();

  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedNotification, setSelectedNotification] = useState<ExpirationNotification | null>(null);
  const [emailModalOpen, setEmailModalOpen] = useState<boolean>(false);
  const [customEmailNote, setCustomEmailNote] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Calculate quick metrics
  const criticalCount = expirationNotifications.filter(
    (n) => n.severity === 'critical' || n.daysUntilExpiration <= 30
  ).length;
  const warningCount = expirationNotifications.filter(
    (n) => n.severity === 'warning' && n.daysUntilExpiration > 30
  ).length;
  const sentCount = expirationNotifications.filter((n) => n.status === 'sent').length;
  const pendingCount = expirationNotifications.filter((n) => n.status === 'pending').length;

  // Filtered notifications
  const filteredList = expirationNotifications.filter((item) => {
    const matchesSeverity = filterSeverity === 'all' || item.severity === filterSeverity;
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesSearch =
      item.medicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.lotNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.ndc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.recipients.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesSeverity && matchesStatus && matchesSearch;
  });

  const handleSendEmail = (notif: ExpirationNotification) => {
    setSelectedNotification(notif);
    setCustomEmailNote(
      `Attention Pharmacy Team: Lot ${notif.lotNumber} of ${notif.medicationName} expires in ${notif.daysUntilExpiration} days (${notif.expirationDate}). Please inspect, quarantine, or initiate manufacturer reverse distribution return per SOP-PHARM-408.`
    );
    setEmailModalOpen(true);
  };

  const handleConfirmSend = () => {
    if (!selectedNotification) return;
    setIsSending(true);

    const inventoryItem = pharmacyInventory.find(
      (i) => i.id === selectedNotification.inventoryItemId
    );

    setTimeout(() => {
      setIsSending(false);
      setEmailModalOpen(false);
      if (!inventoryItem) {
        setFeedbackMessage(
          `Unable to dispatch notification — inventory item for ${selectedNotification.medicationName} (Lot: ${selectedNotification.lotNumber}) was not found.`
        );
        setTimeout(() => setFeedbackMessage(null), 5000);
        return;
      }
      sendExpirationNotification(
        inventoryItem,
        'email_and_system',
        selectedNotification.recipients,
        customEmailNote || selectedNotification.actionPlan
      );
      setFeedbackMessage(
        `Automated email and system alert successfully transmitted for ${selectedNotification.medicationName} (Lot: ${selectedNotification.lotNumber}) to ${selectedNotification.recipients.join(', ')}.`
      );
      setTimeout(() => setFeedbackMessage(null), 5000);
    }, 400);
  };

  const handleQuarantine = (notif: ExpirationNotification) => {
    quarantineExpiringInventory(
      notif.inventoryItemId,
      notif.lotNumber,
      `Quarantined via Expiration Surveillance: ${notif.daysUntilExpiration} days until expiry`
    );
    setFeedbackMessage(
      `Lot ${notif.lotNumber} of ${notif.medicationName} has been quarantined. Stock marked for disposal/return.`
    );
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Critical (&le;30 Days / Expired)
            </div>
            <div className="text-xl font-bold text-rose-950 mt-0.5">{criticalCount} Lots</div>
            <div className="text-[10px] text-rose-700">Immediate quarantine or return</div>
          </div>
          <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">
              Warning (31 - 90 Days)
            </div>
            <div className="text-xl font-bold text-amber-950 mt-0.5">{warningCount} Lots</div>
            <div className="text-[10px] text-amber-700">Prioritize FEFO dispensing</div>
          </div>
          <div className="p-2.5 bg-amber-100 rounded-xl text-amber-700">
            <Clock className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
              Pending Automated Dispatch
            </div>
            <div className="text-xl font-bold text-blue-950 mt-0.5">{pendingCount} Alerts</div>
            <div className="text-[10px] text-blue-700">Awaiting scheduled trigger</div>
          </div>
          <div className="p-2.5 bg-blue-100 rounded-xl text-blue-700">
            <Bell className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              Dispatched & Logged
            </div>
            <div className="text-xl font-bold text-emerald-950 mt-0.5">{sentCount} Alerts</div>
            <div className="text-[10px] text-emerald-700">HIPAA & board compliant audit log</div>
          </div>
          <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-700">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Control Bar: Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search expiring medication, NDC, lot number, or recipient..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500 font-medium text-[11px] shrink-0">Severity:</span>
            <McSelect
              value={filterSeverity}
              onChange={setFilterSeverity}
              options={[
                { value: 'all', label: 'All Severities' },
                { value: 'critical', label: 'Critical (≤30d / Expired)' },
                { value: 'warning', label: 'Warning (30-90d)' },
                { value: 'advisory', label: 'Advisory (>60d)' },
              ]}
              className="min-w-[11rem]"
              aria-label="Filter by severity"
            />
          </div>

          <div className="flex items-center space-x-1 text-xs">
            <span className="text-slate-500 font-medium text-[11px] shrink-0">Status:</span>
            <McSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'pending', label: 'Pending Dispatch' },
                { value: 'sent', label: 'Dispatched / Sent' },
                { value: 'quarantined', label: 'Quarantined' },
                { value: 'disposed', label: 'Disposed' },
              ]}
              className="min-w-[10rem]"
              aria-label="Filter by status"
            />
          </div>
        </div>
      </div>

      {/* Expiration Surveillance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Automated Medication Expiration & Notification Register
            </h4>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
              {filteredList.length} monitored items
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            System Scan Frequency: <strong>Daily at 00:00 UTC</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Medication Name & NDC</th>
                <th className="py-2.5 px-3">Lot # & Location</th>
                <th className="py-2.5 px-3">Units at Risk</th>
                <th className="py-2.5 px-3">Expiration Date</th>
                <th className="py-2.5 px-3">Days Remaining</th>
                <th className="py-2.5 px-3">Notification Channels & Recipients</th>
                <th className="py-2.5 px-3">Dispatch Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    No medication expiration alerts matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredList.map((notif) => {
                  const isCritical = notif.severity === 'critical';
                  const isWarning = notif.severity === 'warning';

                  return (
                    <tr key={notif.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isCritical
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {notif.severity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{notif.medicationName}</span>
                        <span className="text-[10px] font-mono text-slate-500">{notif.ndc}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono font-bold text-slate-800 block">{notif.lotNumber}</span>
                        <span className="text-[10px] text-slate-500">
                          {pharmacyInventory.find((i) => i.id === notif.inventoryItemId)?.storageCondition || 'Central Vault'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900">{notif.currentStock} units</span>
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {notif.expirationDate}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`font-bold ${
                            notif.daysUntilExpiration <= 0
                              ? 'text-rose-700 font-extrabold'
                              : notif.daysUntilExpiration <= 30
                              ? 'text-rose-600'
                              : notif.daysUntilExpiration <= 90
                              ? 'text-amber-600'
                              : 'text-slate-700'
                          }`}
                        >
                          {notif.daysUntilExpiration <= 0
                            ? 'EXPIRED'
                            : `${notif.daysUntilExpiration} days`}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex flex-col space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            <span className="text-[11px] text-slate-700 font-medium truncate max-w-[200px]">
                              {notif.recipients.join(', ')}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Channels: Automated Email + System Alert
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center space-x-1.5">
                          {notif.status === 'sent' ? (
                            <span className="flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              <Check className="h-3 w-3" />
                              <span>Sent {notif.sentAt ? new Date(notif.sentAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}</span>
                            </span>
                          ) : notif.status === 'quarantined' ? (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                              Quarantined
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
                              Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleSendEmail(notif)}
                            className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] transition-colors border border-blue-200 flex items-center space-x-1"
                            title="Dispatch Automated Email Notification Now"
                          >
                            <Mail className="h-3 w-3" />
                            <span>Notify</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleQuarantine(notif)}
                            className="px-2 py-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] transition-colors border border-rose-200 flex items-center space-x-1"
                            title="Quarantine & Flag for Return"
                          >
                            <Archive className="h-3 w-3" />
                            <span>Quarantine</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: DISPATCH EMAIL NOTIFICATION */}
      {emailModalOpen && selectedNotification && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl border border-slate-200 max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center space-x-2 text-blue-600 border-b border-slate-100 pb-3">
              <Mail className="h-5 w-5" />
              <h3 className="font-bold text-slate-900 text-base">
                Dispatch Automated Expiration Alert
              </h3>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Medication:</span>
                <span className="font-bold text-slate-900">{selectedNotification.medicationName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Lot Number / NDC:</span>
                <span className="font-mono text-slate-800">{selectedNotification.lotNumber} • {selectedNotification.ndc}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiration Date:</span>
                <span className="font-bold text-rose-600">{selectedNotification.expirationDate} ({selectedNotification.daysUntilExpiration} days remaining)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipients:</span>
                <span className="font-medium text-slate-800">{selectedNotification.recipients.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sender Identity:</span>
                <span className="font-medium text-slate-700">Network Pharmacy Automated Notification Service ({currentUser.name})</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notification Message Body:
              </label>
              <textarea
                value={customEmailNote}
                onChange={(e) => setCustomEmailNote(e.target.value)}
                rows={4}
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEmailModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSending || !customEmailNote.trim()}
                onClick={handleConfirmSend}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors shadow-xs flex items-center space-x-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{isSending ? 'Transmitting...' : 'Send Automated Email & System Alert'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
