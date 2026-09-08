import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Send, Shield } from 'lucide-react';
import type { SecureMessage } from '../../../types';

interface MessagesScreenProps {
  messages: SecureMessage[];
  patientUserId: string;
  onSend: (body: string) => void;
}

export const MessagesScreen: React.FC<MessagesScreenProps> = ({
  messages,
  patientUserId,
  onSend,
}) => {
  const [chatInput, setChatInput] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSend(chatInput.trim());
    setChatInput('');
  };

  return (
    <motion.div
      className="flex flex-col h-full min-h-[460px]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div className="mb-3">
        <h3 className="font-display text-xl text-[var(--mc-text)] tracking-tight">Care chat</h3>
        <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] font-semibold text-[var(--mc-accent)] bg-[var(--mc-accent-muted)] px-2 py-1 rounded-lg border border-[var(--mc-line)]">
          <Shield className="h-3 w-3" />
          HIPAA encrypted
        </div>
      </div>

      <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
        {messages.length === 0 && (
          <p className="text-[12px] text-[var(--mc-muted)] py-8 text-center">
            No messages yet. Say hello to your care team.
          </p>
        )}
        {messages.map((m) => {
          const isMe = m.senderId === patientUserId;
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div
                className={`px-3 py-2.5 rounded-2xl max-w-[88%] text-[12px] leading-relaxed ${
                  isMe
                    ? 'bg-[var(--mc-accent)] text-white rounded-br-md'
                    : 'bg-[var(--mc-elevated)] text-[var(--mc-text)] border border-[var(--mc-line)] rounded-bl-md'
                }`}
              >
                <p>{m.body}</p>
              </div>
              <span className="text-[9px] text-[var(--mc-muted)] mt-1 px-1">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSend} className="mt-3 flex items-center gap-1.5">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Message your care team…"
          className="flex-1 px-3.5 py-2.5 rounded-xl bg-[var(--mc-elevated)] border border-[var(--mc-line)] text-[12px] text-[var(--mc-text)] placeholder:text-[var(--mc-muted)] shadow-sm focus:outline-hidden focus:ring-2 focus:ring-[color-mix(in_srgb,var(--mc-accent)_35%,transparent)]"
          aria-label="Message body"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl bg-[var(--mc-accent)] text-white hover:opacity-90 transition-opacity"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
};
