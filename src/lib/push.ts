import { api } from './api';

const PUSH_TOKEN_KEY = 'medicore_web_push_subscription';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export async function ensurePushServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null;
  // Prefer the Vite PWA worker once registered; fall back to waiting for ready.
  return navigator.serviceWorker.ready;
}

export async function getStoredWebPushSubscription(): Promise<PushSubscriptionJSON | null> {
  try {
    const raw = localStorage.getItem(PUSH_TOKEN_KEY);
    return raw ? (JSON.parse(raw) as PushSubscriptionJSON) : null;
  } catch {
    return null;
  }
}

export async function isWebPushEnabled(): Promise<boolean> {
  if (Notification.permission !== 'granted') return false;
  const stored = await getStoredWebPushSubscription();
  return Boolean(stored?.endpoint);
}

export async function enableWebPush(): Promise<boolean> {
  if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('This browser does not support web push.');
  }
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const { publicKey } = await api.vapidPublicKey();
  const reg = await ensurePushServiceWorker();
  if (!reg) throw new Error('Service worker not ready. Reload after the first visit.');

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    });
  }
  const json = sub.toJSON();
  await api.registerDevice('WEB', json);
  localStorage.setItem(PUSH_TOKEN_KEY, JSON.stringify(json));
  return true;
}

export async function disableWebPush(): Promise<void> {
  const reg = await ensurePushServiceWorker().catch(() => null);
  const sub = reg ? await reg.pushManager.getSubscription() : null;
  const stored = await getStoredWebPushSubscription();
  const token = sub?.toJSON() || stored;
  if (token) {
    try {
      await api.unregisterDevice(token);
    } catch {
      /* ignore */
    }
  }
  if (sub) await sub.unsubscribe().catch(() => undefined);
  localStorage.removeItem(PUSH_TOKEN_KEY);
}
