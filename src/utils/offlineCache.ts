/**
 * Offline-first IndexedDB cache for critical clinical dashboards and patient records.
 * Falls back to localStorage when IndexedDB is unavailable.
 */

const DB_NAME = 'medicore_offline_cache_v1';
const DB_VERSION = 1;
const STORE_NAME = 'clinical_snapshots';

export type CacheKey =
  | 'patients'
  | 'vitals_dashboard'
  | 'appointments'
  | 'pharmacy_inventory'
  | 'staff_roster'
  | 'audit_logs'
  | 'dicom_studies'
  | 'meta';

interface CacheEntry<T = unknown> {
  key: CacheKey | string;
  data: T;
  updatedAt: string;
  version: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      dbPromise = null; // allow retry on next call
      reject(request.error ?? new Error('IndexedDB open failed'));
    };
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };
  });

  return dbPromise;
}

function localStorageFallbackSet(key: string, data: unknown): void {
  try {
    localStorage.setItem(
      `medicore_idb_fallback_${key}`,
      JSON.stringify({ data, updatedAt: new Date().toISOString() })
    );
  } catch {
    // Quota exceeded — ignore silently in demo
  }
}

function localStorageFallbackGet<T>(key: string): CacheEntry<T> | null {
  try {
    const raw = localStorage.getItem(`medicore_idb_fallback_${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return { key, data: parsed.data, updatedAt: parsed.updatedAt, version: 1 };
  } catch {
    return null;
  }
}

export async function putCache<T>(key: CacheKey | string, data: T): Promise<void> {
  const entry: CacheEntry<T> = {
    key,
    data,
    updatedAt: new Date().toISOString(),
    version: 1,
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    localStorageFallbackSet(String(key), data);
  }
}

export async function getCache<T>(key: CacheKey | string): Promise<CacheEntry<T> | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as CacheEntry<T>) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return localStorageFallbackGet<T>(String(key));
  }
}

export async function clearOfflineCache(): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Clear fallbacks
    Object.keys(localStorage)
      .filter((k) => k.startsWith('medicore_idb_fallback_'))
      .forEach((k) => localStorage.removeItem(k));
  }
}

export async function syncCriticalClinicalData(payload: {
  patients: unknown;
  appointments: unknown;
  pharmacyInventory: unknown;
  staffMembers: unknown;
  shifts: unknown;
  dicomStudies?: unknown;
}): Promise<{ syncedAt: string; keys: string[] }> {
  const syncedAt = new Date().toISOString();
  const keys = [
    'patients',
    'vitals_dashboard',
    'appointments',
    'pharmacy_inventory',
    'staff_roster',
    'dicom_studies',
    'meta',
  ] as const;

  await Promise.all([
    putCache('patients', payload.patients),
    putCache('vitals_dashboard', {
      patients: Array.isArray(payload.patients)
        ? (payload.patients as { id: string; vitals: unknown[] }[]).map((p) => ({
            id: p.id,
            vitals: p.vitals,
          }))
        : [],
    }),
    putCache('appointments', payload.appointments),
    putCache('pharmacy_inventory', payload.pharmacyInventory),
    putCache('staff_roster', { staff: payload.staffMembers, shifts: payload.shifts }),
    putCache('dicom_studies', payload.dicomStudies ?? []),
    putCache('meta', {
      syncedAt,
      patientCount: Array.isArray(payload.patients) ? payload.patients.length : 0,
      offlineCapable: true,
    }),
  ]);

  return { syncedAt, keys: [...keys] };
}

export function subscribeOnlineStatus(
  onChange: (isOnline: boolean) => void
): () => void {
  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  onChange(navigator.onLine);
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}
