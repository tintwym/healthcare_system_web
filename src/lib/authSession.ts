import { setApiToken, type ApiUser } from './api';

export const AUTH_USER_KEY = 'medicore_auth_user';
/** @deprecated kept for migration from older builds */
const LEGACY_STAFF_USER_KEY = 'medicore_staff_user';

export function readAuthUser(): ApiUser | null {
  try {
    const raw =
      localStorage.getItem(AUTH_USER_KEY) || localStorage.getItem(LEGACY_STAFF_USER_KEY);
    return raw ? (JSON.parse(raw) as ApiUser) : null;
  } catch {
    return null;
  }
}

export function writeAuthUser(user: ApiUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  localStorage.setItem(LEGACY_STAFF_USER_KEY, JSON.stringify(user));
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(LEGACY_STAFF_USER_KEY);
}

export function clearAuthSession() {
  setApiToken(null);
  clearAuthUser();
}
