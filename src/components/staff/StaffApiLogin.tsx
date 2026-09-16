import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { ApiUser } from '../../lib/api';
import { readAuthUser } from '../../lib/authSession';

/** @deprecated use readAuthUser from lib/authSession */
export function readStaffUser(): ApiUser | null {
  return readAuthUser();
}

export function clearStaffSession() {
  /* handled by AuthContext.logout */
}

interface StaffApiLoginProps {
  allowedRoles?: string[];
  onAuthed?: (user: ApiUser) => void;
  defaultEmail?: string;
}

/** Shows signed-in API user — login happens once at app start. */
export const StaffApiLogin: React.FC<StaffApiLoginProps> = ({ allowedRoles, onAuthed }) => {
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (user && isAuthenticated) onAuthed?.(user);
  }, [user, isAuthenticated, onAuthed]);

  if (!isAuthenticated || !user) {
    return (
      <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
        Sign in at the Medicore welcome screen to use live API features.
      </p>
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <p className="text-[11px] text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg px-3 py-2">
        Signed in as <strong>{user.name}</strong> ({user.role}). This area requires:{' '}
        {allowedRoles.join(', ')}.
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 text-[11px] px-3 py-2 rounded-lg bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200">
      <span>
        Signed in: <strong>{user.name}</strong> ({user.role})
      </span>
    </div>
  );
};
