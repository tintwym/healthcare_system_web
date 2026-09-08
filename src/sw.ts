/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<string | { url: string; revision: string | null }>;
};

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

type PushPayload = {
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

self.addEventListener('push', (event) => {
  let payload: PushPayload = {};
  try {
    payload = event.data ? (event.data.json() as PushPayload) : {};
  } catch {
    payload = { body: event.data?.text() };
  }
  const title = payload.title || 'Medicore';
  const body = payload.body || 'You have a new care update.';
  const data = payload.data || {};
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data,
      tag: data.type || 'medicore',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = (event.notification.data || {}) as Record<string, string>;
  const screen = String(data.screen || data.type || 'chat').toLowerCase();
  let path = '/?patientTab=messages';
  if (screen === 'monitor' || screen === 'vitals') path = '/?patientTab=monitor';
  else if (screen === 'visits' || screen === 'appointment') path = '/?patientTab=visits';
  else if (screen === 'chat' || screen === 'message') path = '/?patientTab=messages';
  else if (screen === 'profile') path = '/?patientTab=profile';

  event.waitUntil(
    (async () => {
      const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of all) {
        if ('focus' in client) {
          await client.focus();
          client.postMessage({ type: 'medicore-push-navigate', path, data });
          return;
        }
      }
      await self.clients.openWindow(path);
    })()
  );
});
