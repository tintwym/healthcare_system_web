import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { disableWebPush, enableWebPush, isWebPushEnabled } from '../lib/push';

/** Patient-facing enable/disable for browser push (VAPID). */
export function PushNotificationsToggle({ className = '' }: { className?: string }) {
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    isWebPushEnabled().then(setOn).catch(() => setOn(false));
  }, []);

  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      if (on) {
        await disableWebPush();
        setOn(false);
      } else {
        const ok = await enableWebPush();
        setOn(ok);
        if (!ok) setError('Permission denied. Enable notifications in browser settings.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update notifications.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-bold transition-colors ${
          on
            ? 'border-[var(--mc-accent)] bg-[var(--mc-accent-muted)] text-[var(--mc-accent)]'
            : 'border-[var(--mc-line)] bg-[var(--mc-elevated)] text-[var(--mc-muted)]'
        }`}
        aria-pressed={on}
      >
        <Bell className="h-3.5 w-3.5" />
        {busy ? 'Updating…' : on ? 'Push notifications on' : 'Enable push notifications'}
      </button>
      {error ? <p className="text-[11px] text-rose-600 mt-1.5">{error}</p> : null}
    </div>
  );
}
