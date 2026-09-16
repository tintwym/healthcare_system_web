import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { api, type ApiUser } from '../lib/api';
import {
  clearAuthSession,
  readAuthUser,
  writeAuthUser,
} from '../lib/authSession';
import { getApiToken, setApiToken } from '../lib/api';
import { requestApiRefresh } from './HospitalApiBridge';
import {
  clearPatientSession,
  writePatientSession,
} from '../components/portal/PatientLoginGate';

type AuthContextValue = {
  user: ApiUser | null;
  isAuthenticated: boolean;
  bootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function syncPatientSession(user: ApiUser, token: string) {
  if (user.role === 'patient' && user.patientId) {
    writePatientSession({
      authenticated: true,
      patientUserId: user.id,
      patientId: user.patientId,
      email: user.email,
      token,
    });
  } else {
    clearPatientSession();
  }
}

function applySession(token: string, user: ApiUser) {
  setApiToken(token);
  writeAuthUser(user);
  syncPatientSession(user, token);
  requestApiRefresh();
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(() => readAuthUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(getApiToken()));
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      const token = getApiToken();
      if (!token) {
        setUser(null);
        setIsAuthenticated(false);
        setBootstrapping(false);
        return;
      }
      try {
        const me = await api.me();
        setUser(me);
        writeAuthUser(me);
        syncPatientSession(me, token);
        setIsAuthenticated(true);
        requestApiRefresh();
      } catch {
        clearAuthSession();
        clearPatientSession();
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setBootstrapping(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { token, user: signedIn } = await api.login(email.trim(), password);
    applySession(token, signedIn);
    setUser(signedIn);
    setIsAuthenticated(true);
  }, []);

  const register = useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      phone?: string;
    }) => {
      const { token, user: signedIn } = await api.register(input);
      applySession(token, signedIn);
      setUser(signedIn);
      setIsAuthenticated(true);
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      if (getApiToken()) await api.logout();
    } catch {
      /* ignore */
    }
    clearAuthSession();
    clearPatientSession();
    setUser(null);
    setIsAuthenticated(false);
    requestApiRefresh();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated,
      bootstrapping,
      login,
      register,
      logout,
    }),
    [user, isAuthenticated, bootstrapping, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
