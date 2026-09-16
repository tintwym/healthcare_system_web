import React, { useCallback, useEffect, useRef } from 'react';
import { api, getApiToken } from '../lib/api';
import {
  mapApiAppointment,
  mapApiAudit,
  mapApiInvoice,
  mapApiMessage,
  mapApiPatient,
  mapApiUser,
} from '../lib/apiMappers';
import { readAuthUser } from '../lib/authSession';
import { useHospital } from './HospitalContext';

/** Loads live clinical data from the Medicore API into HospitalContext when staff is signed in. */
export const HospitalApiBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { hydrateFromApi, setApiConnected, clearClinicalData } = useHospital();
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (!getApiToken()) {
      clearClinicalData();
      setApiConnected(false);
      return;
    }
    if (busy.current) return;
    busy.current = true;
    try {
      const staff = readAuthUser();
      const role = staff?.role;
      const isPatient = role === 'patient';

      if (isPatient) {
        const [p, a, i, m] = await Promise.all([
          api.patientMe(),
          api.listAppointments(),
          api.listInvoices(),
          api.listMessages(),
        ]);
        hydrateFromApi({
          patients: [mapApiPatient(p as Record<string, unknown>)],
          appointments: (a as Record<string, unknown>[]).map(mapApiAppointment),
          invoices: (i as Record<string, unknown>[]).map(mapApiInvoice),
          messages: (m as Record<string, unknown>[]).map(mapApiMessage),
          auditLogs: [],
          users: staff ? [mapApiUser(staff as unknown as Record<string, unknown>)] : [],
          currentUserId: staff?.id || null,
        });
      } else {
        const [patients, appointments, invoices, messages, audit, users] = await Promise.all([
          api.listPatients(),
          api.staffAppointments(),
          api.listInvoices(),
          api.listMessages(),
          api.listAuditEvents(),
          api.listUsers(),
        ]);
        hydrateFromApi({
          patients: (patients as Record<string, unknown>[]).map(mapApiPatient),
          appointments: (appointments as Record<string, unknown>[]).map(mapApiAppointment),
          invoices: (invoices as Record<string, unknown>[]).map(mapApiInvoice),
          messages: (messages as Record<string, unknown>[]).map(mapApiMessage),
          auditLogs: (audit as Record<string, unknown>[]).map(mapApiAudit),
          users: (users as Record<string, unknown>[]).map(mapApiUser),
          currentUserId: staff?.id || null,
        });
      }
      setApiConnected(true);
    } catch {
      setApiConnected(false);
    } finally {
      busy.current = false;
    }
  }, [hydrateFromApi, clearClinicalData, setApiConnected]);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => {
      if (getApiToken()) void refresh();
    }, 15000);
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'medicore_api_token') void refresh();
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener('medicore:api-refresh', () => void refresh());
    return () => {
      window.clearInterval(id);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('medicore:api-refresh', () => void refresh());
    };
  }, [refresh]);

  return <>{children}</>;
};

export function requestApiRefresh() {
  window.dispatchEvent(new Event('medicore:api-refresh'));
}
