import React, { useEffect, useMemo, useState } from 'react';
import {
  Send,
  Lock,
  AlertCircle,
  Search,
  CheckCheck,
  Clock,
  Filter,
  Users,
  UserRound,
  X,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { UserRole } from '../../types';

type RoleFilter = 'all' | UserRole;

export const SecureMessaging: React.FC = () => {
  const {
    messages,
    currentUser,
    users,
    patients,
    sendMessage,
    markMessageRead,
    activeMessageRecipientId,
    setActiveMessageRecipientId,
  } = useHospital();

  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    activeMessageRecipientId || (currentUser.role === 'patient' ? 'u-1' : 'u-2')
  );
  const [messageText, setMessageText] = useState<string>('');
  const [isUrgent, setIsUrgent] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');

  useEffect(() => {
    if (activeMessageRecipientId) {
      setSelectedRecipientId(activeMessageRecipientId);
      setActiveMessageRecipientId(null);
    }
  }, [activeMessageRecipientId, setActiveMessageRecipientId]);

  const activeRecipient = users.find((u) => u.id === selectedRecipientId) || users[0];

  const conversation = messages.filter(
    (m) =>
      (m.senderId === currentUser.id && m.recipientId === selectedRecipientId) ||
      (m.senderId === selectedRecipientId && m.recipientId === currentUser.id) ||
      (m.recipientId === 'care-team-all' &&
        (m.senderId === selectedRecipientId || m.senderId === currentUser.id))
  );

  // Mark inbound unread messages as read when opening a conversation
  useEffect(() => {
    messages.forEach((m) => {
      if (
        !m.read &&
        m.recipientId === currentUser.id &&
        m.senderId === selectedRecipientId
      ) {
        markMessageRead(m.id);
      }
    });
  }, [selectedRecipientId, currentUser.id, messages, markMessageRead]);

  const getLastMessage = (userId: string) => {
    return messages.find(
      (m) =>
        (m.senderId === currentUser.id && m.recipientId === userId) ||
        (m.senderId === userId && m.recipientId === currentUser.id)
    );
  };

  const patientNameIndex = useMemo(() => {
    return patients.map((p) => ({
      id: p.id,
      fullName: `${p.firstName} ${p.lastName}`.toLowerCase(),
      mrn: p.mrn.toLowerCase(),
    }));
  }, [patients]);

  const conversationMentionsPatient = (userId: string, query: string) => {
    if (!query) return true;
    const q = query.toLowerCase();
    const related = messages.filter(
      (m) =>
        (m.senderId === currentUser.id && m.recipientId === userId) ||
        (m.senderId === userId && m.recipientId === currentUser.id)
    );
    return related.some((m) => {
      const haystack = `${m.subject} ${m.body} ${m.senderName} ${m.recipientName}`.toLowerCase();
      if (haystack.includes(q)) return true;
      return patientNameIndex.some(
        (p) =>
          (p.fullName.includes(q) || p.mrn.includes(q)) &&
          (haystack.includes(p.fullName) || haystack.includes(p.mrn))
      );
    });
  };

  const filteredContacts = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return users
      .filter((u) => u.id !== currentUser.id)
      .filter((u) => roleFilter === 'all' || u.role === roleFilter)
      .filter((u) => {
        if (!q) return true;
        const staffMatch =
          u.name.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q);
        if (staffMatch) return true;
        // Match if conversation discusses a patient name/MRN
        return conversationMentionsPatient(u.id, q);
      })
      .sort((a, b) => {
        const aLast = getLastMessage(a.id)?.timestamp || '';
        const bLast = getLastMessage(b.id)?.timestamp || '';
        return bLast.localeCompare(aLast);
      });
  }, [users, currentUser.id, roleFilter, filterQuery, messages, patientNameIndex]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendMessage(
      selectedRecipientId,
      isUrgent ? 'URGENT Clinical Consult' : 'Clinical Consultation',
      messageText.trim(),
      isUrgent
    );

    setMessageText('');
    setIsUrgent(false);
  };

  const handleTemplateClick = (text: string) => {
    setMessageText(text);
  };

  const roleChips: { id: RoleFilter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'doctor', label: 'Doctors' },
    { id: 'nurse', label: 'Nurses' },
    { id: 'pharmacist', label: 'Pharmacy' },
    { id: 'admin', label: 'Admin' },
    { id: 'billing', label: 'Billing' },
    { id: 'patient', label: 'Patients' },
  ];

  const matchingPatients = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return [];
    return patients.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        p.mrn.toLowerCase().includes(q)
    );
  }, [patients, filterQuery]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Secure Inter-Departmental Messaging
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            HIPAA-compliant encrypted clinical communication. Search conversations by staff member
            or patient name.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-200 flex items-center dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <Lock className="h-3 w-3 mr-1" /> End-to-End Encrypted (FIPS 140-2)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm h-[720px] overflow-hidden">
        <div className="lg:col-span-4 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40">
          <div className="p-3 border-b border-slate-200 dark:border-slate-700 space-y-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search by staff or patient name / MRN..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                aria-label="Filter conversations by patient or staff member"
              />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
              <Filter className="h-3 w-3 text-slate-400 shrink-0" />
              {roleChips.map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setRoleFilter(chip.id)}
                  className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors ${
                    roleFilter === chip.id
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {matchingPatients.length > 0 && (
              <div className="rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950/30 p-2">
                <div className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300 flex items-center gap-1 mb-1">
                  <UserRound className="h-3 w-3" /> Matching patients
                </div>
                <div className="space-y-1">
                  {matchingPatients.slice(0, 3).map((p) => (
                    <div key={p.id} className="text-[11px] text-teal-900 dark:text-teal-200">
                      {p.firstName} {p.lastName}{' '}
                      <span className="font-mono text-teal-600 dark:text-teal-400">({p.mrn})</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-1">
                  Showing care-team threads that mention these patients.
                </p>
              </div>
            )}
          </div>

          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3" />
            Conversations ({filteredContacts.length})
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-1">
            {filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                No conversations match “{filterQuery}”. Try a staff name, role, or patient MRN.
              </div>
            ) : (
              filteredContacts.map((u) => {
                const isSelected = u.id === selectedRecipientId;
                const last = getLastMessage(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => setSelectedRecipientId(u.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all flex items-center space-x-3 ${
                      isSelected
                        ? 'bg-blue-100 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 font-semibold'
                        : 'hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {u.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="text-xs font-bold truncate">{u.name}</div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold shrink-0">
                          {u.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {u.department}
                      </div>
                      {last && (
                        <div className="text-[10px] text-slate-400 truncate mt-0.5">
                          {last.body.slice(0, 48)}
                          {last.body.length > 48 ? '…' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col h-full bg-white dark:bg-slate-900">
          <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-white dark:bg-slate-900">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-bold flex items-center justify-center text-sm">
                {activeRecipient.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {activeRecipient.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {activeRecipient.role} • {activeRecipient.department}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for Triage</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30 dark:bg-slate-950/30">
            {conversation.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No past messages in this encrypted thread. Send a secure transmission below.
              </div>
            ) : (
              conversation.map((msg) => {
                const isMe = msg.senderId === currentUser.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="text-[10px] text-slate-400 px-1 mb-0.5">
                      {msg.senderName} ({msg.senderRole})
                    </div>
                    <div
                      className={`p-3 rounded-xl max-w-md text-xs shadow-xs ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200 dark:border-slate-700'
                      } ${msg.isUrgent ? 'ring-2 ring-rose-500' : ''}`}
                    >
                      {msg.isUrgent && (
                        <div
                          className={`flex items-center space-x-1 text-[10px] font-bold uppercase mb-1 ${
                            isMe ? 'text-rose-200' : 'text-rose-600'
                          }`}
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span>STAT URGENT TRIAGE</span>
                        </div>
                      )}
                      {msg.subject && (
                        <div
                          className={`text-[10px] font-semibold mb-1 ${
                            isMe ? 'text-blue-100' : 'text-slate-500'
                          }`}
                        >
                          {msg.subject}
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.body}</p>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-1 px-1">
                      <Clock className="h-2.5 w-2.5" />
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      {isMe && <CheckCheck className="h-3 w-3 text-blue-600 ml-1" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 overflow-x-auto text-[11px]">
            {[
              'Please review latest labs before rounds.',
              'Patient requesting medication clarification.',
              'Ready for discharge planning discussion.',
            ].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTemplateClick(t)}
                className="shrink-0 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                {t}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSend}
            className="p-4 border-t border-slate-200 dark:border-slate-700 flex items-end gap-2"
          >
            <div className="flex-1">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={2}
                placeholder="Compose encrypted clinical message…"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 resize-none"
              />
              <label className="mt-1.5 inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Mark as STAT urgent
              </label>
            </div>
            <button
              type="submit"
              disabled={!messageText.trim()}
              className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
