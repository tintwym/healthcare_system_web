const API_BASE =
  (typeof import.meta !== 'undefined' && (import.meta as { env?: Record<string, string> }).env?.VITE_API_URL) ||
  'http://127.0.0.1:4110';

const TOKEN_KEY = 'medicore_api_token';

export function getApiToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export type ApiUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  patientId: string | null;
  department?: string;
  avatarUrl?: string;
};

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json');
  const token = getApiToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  baseUrl: API_BASE,
  login: (email: string, password: string) =>
    request<{ token: string; user: ApiUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<ApiUser>('/auth/me'),
  patientMe: (patientId?: string) =>
    request<Record<string, unknown>>(
      patientId ? `/patients/me?patientId=${encodeURIComponent(patientId)}` : '/patients/me'
    ),
  updatePatientProfile: (body: Record<string, unknown>) =>
    request<Record<string, unknown>>('/patients/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),
  listAppointments: (patientId?: string) =>
    request<unknown[]>(
      patientId ? `/appointments?patientId=${encodeURIComponent(patientId)}` : '/appointments'
    ),
  staffAppointments: () => request<unknown[]>('/appointments/staff/all'),
  slots: (doctorId: string, date: string) =>
    request<{ slots: Array<{ time: string; available: boolean }> }>(
      `/appointments/slots?doctorId=${encodeURIComponent(doctorId)}&date=${encodeURIComponent(date)}`
    ),
  bookAppointment: (body: Record<string, unknown>) =>
    request<unknown>('/appointments', { method: 'POST', body: JSON.stringify(body) }),
  updateAppointment: (id: string, body: Record<string, unknown>) =>
    request<unknown>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  checkInAppointment: (id: string) =>
    request<unknown>(`/appointments/${id}/check-in`, { method: 'POST' }),
  listMessages: () => request<unknown[]>('/messages'),
  sendMessage: (body: Record<string, unknown>) =>
    request<unknown>('/messages', { method: 'POST', body: JSON.stringify(body) }),
  replyMessage: (id: string, body: string) =>
    request<unknown>(`/messages/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) }),
  markMessageRead: (id: string) =>
    request<unknown>(`/messages/${id}/read`, { method: 'POST' }),
  listInvoices: (patientId?: string) =>
    request<unknown[]>(
      patientId ? `/billing/invoices?patientId=${encodeURIComponent(patientId)}` : '/billing/invoices'
    ),
  payInvoice: (id: string, method?: string) =>
    request<{ invoice: unknown; receiptId: string; method?: string }>(`/billing/invoices/${id}/pay`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    }),
  checkoutInvoice: (id: string, method?: string) =>
    request<{ mode: string; url?: string; invoice?: unknown; receiptId?: string }>(
      `/billing/invoices/${id}/checkout`,
      { method: 'POST', body: JSON.stringify({ method }) }
    ),
  requestRefill: (medicationName: string, notes?: string) =>
    request<unknown>('/refills', {
      method: 'POST',
      body: JSON.stringify({ medicationName, notes }),
    }),
  updateRefill: (id: string, status: string) =>
    request<unknown>(`/refills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  pharmacyQueue: () => request<unknown[]>('/refills/pharmacy/queue'),
  listVitals: (patientId?: string) =>
    request<unknown[]>(
      patientId ? `/vitals?patientId=${encodeURIComponent(patientId)}` : '/vitals'
    ),
  ingestVital: (body: Record<string, unknown>) =>
    request<unknown>('/vitals', { method: 'POST', body: JSON.stringify(body) }),
  fhirPatient: (id: string) => request<unknown>(`/fhir/Patient/${id}`),
  fhirImport: (bundle: unknown) =>
    request<unknown>('/fhir/Bundle', { method: 'POST', body: JSON.stringify(bundle) }),
  fhirLogs: () => request<unknown[]>('/fhir/logs'),
  registerDevice: (platform: 'EXPO' | 'WEB', token: string | Record<string, unknown> | object) =>
    request('/devices/register', {
      method: 'POST',
      body: JSON.stringify({ platform, token }),
    }),
  unregisterDevice: (token: string | Record<string, unknown> | object) =>
    request('/devices', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    }),
  vapidPublicKey: () => request<{ publicKey: string }>('/push/vapid-public-key'),
};
