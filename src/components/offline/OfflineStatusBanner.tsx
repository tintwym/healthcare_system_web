import React from 'react';
import { Wifi, WifiOff, RefreshCw, HardDrive, CheckCircle2 } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';

export const OfflineStatusBanner: React.FC = () => {
  const { offlineStatus, syncOfflineCache, forceOfflinePreview } = useHospital();

  if (offlineStatus.isOnline && !forceOfflinePreview) {
    return (
      <button
        onClick={() => syncOfflineCache()}
        className="hidden lg:flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
        title={
          offlineStatus.lastSyncedAt
            ? `Last offline sync: ${new Date(offlineStatus.lastSyncedAt).toLocaleString()}`
            : 'Sync critical charts to IndexedDB'
        }
      >
        <HardDrive className="h-3.5 w-3.5" />
        <span>
          Offline Cache
          {offlineStatus.cachedDashboardReady ? ' Ready' : ' Sync'}
        </span>
        {offlineStatus.cachedDashboardReady ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <RefreshCw className="h-3 w-3" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700 animate-pulse">
      <WifiOff className="h-3.5 w-3.5" />
      <span>
        Offline Mode · {offlineStatus.cachedPatientCount} Charts Cached
      </span>
    </div>
  );
};

export const OfflineIndicatorPill: React.FC = () => {
  const { offlineStatus } = useHospital();
  return offlineStatus.isOnline ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
      <Wifi className="h-3 w-3" /> Online
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
      <WifiOff className="h-3 w-3" /> Offline
    </span>
  );
};
