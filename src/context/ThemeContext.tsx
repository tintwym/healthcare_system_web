import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

type ThemePreference = 'system' | 'light' | 'dark';

interface ThemeContextType {
  darkMode: boolean;
  preference: ThemePreference;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
  setPreference: (value: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'medicore_theme_preference';
const LEGACY_KEY = 'medicore_dark_mode';

/** Medicore clinic timezone — Myanmar Standard Time (UTC+06:30). */
export const CLINIC_TIME_ZONE = 'Asia/Yangon';

function clinicHour(now = new Date()): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TIME_ZONE,
    hour: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(now);
  const h = parts.find((p) => p.type === 'hour')?.value;
  return h != null ? Number(h) : now.getHours();
}

/** Prefer OS preference; if unavailable, day/night by Yangon (GMT+6:30). */
function systemDark(now = new Date()): boolean {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  const hour = clinicHour(now);
  return !(hour >= 6 && hour < 18);
}

function readStoredPreference(): ThemePreference {
  try {
    const pref = localStorage.getItem(THEME_STORAGE_KEY);
    if (pref === 'system' || pref === 'light' || pref === 'dark') return pref;
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy === 'true') return 'dark';
    if (legacy === 'false') return 'light';
  } catch {
    /* ignore */
  }
  return 'system';
}

function resolveDark(preference: ThemePreference): boolean {
  if (preference === 'system') return systemDark();
  return preference === 'dark';
}

/** Keep <html> class + color-scheme in sync. */
export function applyThemeClass(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  root.style.colorScheme = dark ? 'dark' : 'light';
  root.dataset.theme = dark ? 'dark' : 'light';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    const initial = readStoredPreference();
    applyThemeClass(resolveDark(initial));
    return initial;
  });
  const [systemIsDark, setSystemIsDark] = useState(() => systemDark());

  const darkMode = preference === 'system' ? systemIsDark : preference === 'dark';

  useEffect(() => {
    applyThemeClass(darkMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
      localStorage.setItem(LEGACY_KEY, String(darkMode));
    } catch {
      /* ignore */
    }
  }, [darkMode, preference]);

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) {
      const id = window.setInterval(() => setSystemIsDark(systemDark()), 60_000);
      return () => window.clearInterval(id);
    }
    const onChange = (e: MediaQueryListEvent) => setSystemIsDark(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        if (e.newValue === 'system' || e.newValue === 'light' || e.newValue === 'dark') {
          setPreferenceState(e.newValue);
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setPreference = useCallback((value: ThemePreference) => {
    if (value === 'system') setSystemIsDark(systemDark());
    applyThemeClass(resolveDark(value));
    setPreferenceState(value);
  }, []);

  const setDarkMode = useCallback(
    (value: boolean) => {
      setPreference(value ? 'dark' : 'light');
    },
    [setPreference]
  );

  /** Cycle Light → Dark → System (phone / Yangon time). */
  const toggleDarkMode = useCallback(() => {
    if (preference === 'system') {
      setPreference(darkMode ? 'light' : 'dark');
      return;
    }
    if (preference === 'light') {
      setPreference('dark');
      return;
    }
    setPreference('system');
  }, [preference, darkMode, setPreference]);

  return (
    <ThemeContext.Provider
      value={{ darkMode, preference, toggleDarkMode, setDarkMode, setPreference }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
