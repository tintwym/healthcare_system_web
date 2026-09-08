import React, { useState } from 'react';
import {
  Bell,
  Smartphone,
  AlertTriangle,
  UserCheck,
  Lock,
  ChevronDown,
  Eye,
  EyeOff,
  Menu,
  Moon,
  Sun,
  HardDrive,
  WifiOff,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onOpenNotifications: () => void;
  onOpenEmergencyModal: () => void;
  activeTabTitle?: string;
  onToggleMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  onOpenEmergencyModal,
  activeTabTitle = 'Clinical Overview',
  onToggleMobileSidebar,
}) => {
  const {
    currentUser,
    users,
    switchUser,
    isMfaAuthenticated,
    requestMfaChallenge,
    deIdentifyPhi,
    setDeIdentifyPhi,
    unreadAlertCount,
    mobileSimulatorOpen,
    setMobileSimulatorOpen,
    offlineStatus,
    syncOfflineCache,
    forceOfflinePreview,
  } = useHospital();
  const { darkMode, toggleDarkMode } = useTheme();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const isOfflineView = !offlineStatus.isOnline || forceOfflinePreview;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-teal-100 text-teal-900 border-teal-200 dark:bg-teal-900/40 dark:text-teal-200 dark:border-teal-700';
      case 'doctor':
        return 'bg-sky-100 text-sky-900 border-sky-200 dark:bg-sky-900/40 dark:text-sky-200 dark:border-sky-700';
      case 'nurse':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700';
      case 'billing':
        return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700';
      case 'patient':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700';
      case 'pharmacist':
        return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-slate-700 dark:text-slate-200';
    }
  };

  const initials = currentUser.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const iconBtn =
    'p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50';

  return (
    <header className="h-16 bg-white/80 dark:bg-[var(--mc-elevated)]/85 backdrop-blur-md border-b border-[var(--mc-line)] flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 shrink-0 z-30">
      <div className="flex items-center gap-3 min-w-0">
        {onToggleMobileSidebar && (
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            aria-label="Toggle Navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="font-display text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate leading-tight">
            {activeTabTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:block">
            {todayDateFormatted}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
        {isOfflineView && (
          <span
            className="hidden sm:inline-flex items-center gap-1.5 mr-2 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 rounded-md"
            title="Working from local cache"
          >
            <WifiOff className="h-3.5 w-3.5" />
            Offline
          </span>
        )}

        <button
          id="dark-mode-toggle-btn"
          onClick={toggleDarkMode}
          className={iconBtn}
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-pressed={darkMode}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          id="emergency-code-btn"
          onClick={onOpenEmergencyModal}
          className={`${iconBtn} text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40`}
          title="Broadcast STAT alert"
          aria-label="STAT alert"
        >
          <AlertTriangle className="h-5 w-5" />
        </button>

        <button
          id="notifications-bell-btn"
          onClick={onOpenNotifications}
          className={`relative ${iconBtn}`}
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadAlertCount > 0 && (
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-[9px] font-bold text-white ring-2 ring-white dark:ring-[var(--mc-elevated)]">
              {unreadAlertCount}
            </span>
          )}
        </button>

        <div className="w-px h-6 bg-[var(--mc-line)] mx-1.5 hidden sm:block" />

        <div className="relative">
          <button
            id="role-switcher-dropdown-btn"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 pl-1 pr-2 sm:pr-2.5 py-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            aria-expanded={roleMenuOpen}
            aria-haspopup="menu"
          >
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt=""
                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-600"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-200">
                {initials}
              </div>
            )}
            <div className="text-left hidden md:block min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[140px]">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 capitalize truncate">
                {currentUser.role}
                {isMfaAuthenticated ? '' : ' · MFA required'}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block shrink-0 self-center" aria-hidden />
          </button>

          {roleMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setRoleMenuOpen(false)} />
              <div
                role="menu"
                className="absolute right-0 mt-2 w-72 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50"
              >
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Session
                  </p>
                </div>

                <div className="py-1 border-b border-slate-100 dark:border-slate-700">
                  <button
                    id="phi-mask-toggle-btn"
                    role="menuitem"
                    onClick={() => setDeIdentifyPhi(!deIdentifyPhi)}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    {deIdentifyPhi ? (
                      <EyeOff className="h-4 w-4 text-amber-600 shrink-0" />
                    ) : (
                      <Eye className="h-4 w-4 text-slate-400 shrink-0" />
                    )}
                    <span className="flex-1">{deIdentifyPhi ? 'Show PHI' : 'Mask PHI'}</span>
                    <span className="text-[10px] text-slate-400 uppercase">
                      {deIdentifyPhi ? 'On' : 'Off'}
                    </span>
                  </button>

                  <button
                    id="mfa-status-btn"
                    role="menuitem"
                    onClick={() => {
                      requestMfaChallenge();
                      setRoleMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Lock className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="flex-1">
                      {isMfaAuthenticated ? 'Re-authenticate MFA' : 'Verify MFA'}
                    </span>
                  </button>

                  <button
                    id="patient-mobile-sim-toggle"
                    role="menuitem"
                    onClick={() => {
                      setMobileSimulatorOpen(!mobileSimulatorOpen);
                      setRoleMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Smartphone className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="flex-1">
                      {mobileSimulatorOpen ? 'Close mobile preview' : 'Open mobile preview'}
                    </span>
                  </button>

                  <button
                    role="menuitem"
                    onClick={() => {
                      syncOfflineCache();
                      setRoleMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 flex items-center gap-2.5 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    title={
                      offlineStatus.lastSyncedAt
                        ? `Last sync: ${new Date(offlineStatus.lastSyncedAt).toLocaleString()}`
                        : 'Sync charts to IndexedDB'
                    }
                  >
                    <HardDrive className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="flex-1">Sync offline cache</span>
                  </button>
                </div>

                <div className="px-3 pt-2 pb-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Switch user
                  </p>
                </div>

                <div className="max-h-56 overflow-y-auto py-1">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    return (
                      <button
                        key={u.id}
                        id={`switch-user-${u.role}`}
                        role="menuitem"
                        onClick={() => {
                          switchUser(u.id);
                          setRoleMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center gap-3 transition-colors ${
                          isSelected
                            ? 'bg-teal-50 text-teal-950 dark:bg-teal-950/40 dark:text-teal-100'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        <img
                          src={u.avatarUrl}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-600"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                              {u.name}
                            </p>
                            <span
                              className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border shrink-0 ${getRoleBadgeColor(
                                u.role
                              )}`}
                            >
                              {u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {u.department}
                          </p>
                        </div>
                        {isSelected && (
                          <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
