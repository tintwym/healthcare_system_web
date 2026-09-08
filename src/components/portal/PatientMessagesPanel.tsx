import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, MessageSquare, Send, ArrowLeft } from 'lucide-react';
import type { SecureMessage } from '../../types';
import { McSelect } from '../ui/McSelect';

interface PatientMessagesPanelProps {
  messages: SecureMessage[];
  patientUserId: string;
  onSend: (recipientId: string, subject: string, body: string) => void;
  onMarkRead: (messageId: string) => void;
}

const CARE_TEAM = [
  { value: 'u-1', label: 'Dr. Aye Myat Thu, MD (Cardiologist)' },
  { value: 'u-3', label: 'Daw Hnin Wai, RN (Care Coordinator)' },
  { value: 'u-7', label: 'Daw Khin Sandar, PharmD (Clinical Pharmacist)' },
];

export const PatientMessagesPanel: React.FC<PatientMessagesPanelProps> = ({
  messages,
  patientUserId,
  onSend,
  onMarkRead,
}) => {
  const [mode, setMode] = useState<'inbox' | 'compose' | 'thread'>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [recipient, setRecipient] = useState('u-1');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [sentAlert, setSentAlert] = useState(false);

  const inbox = useMemo(
    () =>
      messages
        .filter((m) => m.senderId === patientUserId || m.recipientId === patientUserId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [messages, patientUserId]
  );

  const selected = inbox.find((m) => m.id === selectedId) || null;

  useEffect(() => {
    if (selected && !selected.read && selected.recipientId === patientUserId) {
      onMarkRead(selected.id);
    }
  }, [selected, patientUserId, onMarkRead]);

  const handleCompose = (e: React.FormEvent) => {
    e.preventDefault();
    onSend(recipient, subject, body);
    setSubject('');
    setBody('');
    setSentAlert(true);
    setTimeout(() => setSentAlert(false), 3500);
    setMode('inbox');
  };

  const handleReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !replyBody.trim()) return;
    const toId =
      selected.senderId === patientUserId ? selected.recipientId : selected.senderId;
    onSend(toId, `Re: ${selected.subject}`, replyBody.trim());
    setReplyBody('');
    setSentAlert(true);
    setTimeout(() => setSentAlert(false), 3500);
    setMode('inbox');
    setSelectedId(null);
  };

  return (
    <div className="bg-[var(--mc-elevated)] rounded-xl border border-[var(--mc-line)] p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--mc-line)] pb-3">
        <div>
          <h3 className="text-base font-bold text-[var(--mc-text)]">
            Secure Care Team Messaging
          </h3>
          <p className="text-xs text-[var(--mc-muted)]">Encrypted non-emergency messages with your care team.</p>
        </div>
        <div className="flex items-center gap-2">
          {mode !== 'inbox' && (
            <button
              type="button"
              onClick={() => {
                setMode('inbox');
                setSelectedId(null);
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--mc-muted)] hover:bg-[var(--mc-surface)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Inbox
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode('compose')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--mc-accent)] hover:opacity-90 text-white text-xs font-bold"
          >
            <Send className="h-3.5 w-3.5" />
            Compose
          </button>
        </div>
      </div>

      {sentAlert && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Secure message sent to your care team.</span>
        </div>
      )}

      {mode === 'inbox' && (
        <div className="space-y-2">
          {inbox.length === 0 ? (
            <div className="py-10 text-center">
              <MessageSquare className="h-8 w-8 text-[var(--mc-muted)] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[var(--mc-text)]">No messages yet</p>
              <p className="text-xs text-[var(--mc-muted)] mt-1">Compose a note to your care team to get started.</p>
            </div>
          ) : (
            inbox.map((m) => {
              const fromMe = m.senderId === patientUserId;
              const unread = !m.read && m.recipientId === patientUserId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(m.id);
                    setMode('thread');
                  }}
                  className={`w-full text-left p-3.5 rounded-xl border transition-colors ${
                    unread
                      ? 'border-[var(--mc-accent)] bg-[var(--mc-accent-muted)]'
                      : 'border-[var(--mc-line)] hover:bg-[var(--mc-surface)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[var(--mc-text)] truncate">
                        {m.subject}
                      </div>
                      <div className="text-[11px] text-[var(--mc-muted)] mt-0.5 truncate">
                        {fromMe ? `To: ${m.recipientName}` : `From: ${m.senderName}`} · {m.senderRole}
                      </div>
                      <p className="text-xs text-[var(--mc-muted)] mt-1.5 line-clamp-2">{m.body}</p>
                    </div>
                    <div className="text-[10px] text-[var(--mc-muted)] shrink-0 text-right">
                      {new Date(m.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {unread && (
                        <span className="mt-1 block text-[var(--mc-accent)] font-bold uppercase">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}

      {mode === 'thread' && selected && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl border border-[var(--mc-line)] bg-[var(--mc-surface)] space-y-2">
            <h4 className="font-bold text-[var(--mc-text)]">{selected.subject}</h4>
            <p className="text-[11px] text-[var(--mc-muted)]">
              {selected.senderName} → {selected.recipientName} ·{' '}
              {new Date(selected.timestamp).toLocaleString()}
            </p>
            <p className="text-sm text-[var(--mc-text)] leading-relaxed whitespace-pre-wrap pt-2 border-t border-[var(--mc-line)]">
              {selected.body}
            </p>
          </div>
          <form onSubmit={handleReply} className="space-y-2 text-xs">
            <label className="block font-bold text-[var(--mc-text)]">Reply</label>
            <textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              rows={3}
              required
              className="w-full p-2.5 rounded-lg border border-[var(--mc-line)] bg-[var(--mc-elevated)] text-[var(--mc-text)] placeholder:text-[var(--mc-muted)]"
              placeholder="Write your reply…"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--mc-accent)] hover:opacity-90 text-white font-bold"
              >
                <Send className="h-3.5 w-3.5" />
                Send reply
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === 'compose' && (
        <form onSubmit={handleCompose} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[var(--mc-text)] mb-1">To</label>
            <McSelect
              value={recipient}
              onChange={setRecipient}
              options={CARE_TEAM}
              className="w-full"
              aria-label="Message recipient"
            />
          </div>
          <div>
            <label className="block font-bold text-[var(--mc-text)] mb-1">Subject</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg border border-[var(--mc-line)] bg-[var(--mc-elevated)] text-[var(--mc-text)]"
            />
          </div>
          <div>
            <label className="block font-bold text-[var(--mc-text)] mb-1">Message</label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full p-2.5 rounded-lg border border-[var(--mc-line)] bg-[var(--mc-elevated)] text-[var(--mc-text)]"
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--mc-accent)] hover:opacity-90 text-white font-bold"
            >
              <Send className="h-3.5 w-3.5" />
              Send message
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
