import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Home, HeartPulse, Calendar, MessageSquare, UserRound } from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { PhoneFrame } from './PhoneFrame';
import type { PatientMobileTab } from './types';
import { HomeScreen } from './screens/HomeScreen';
import { MonitorScreen } from './screens/MonitorScreen';
import { AppointmentsScreen } from './screens/AppointmentsScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { DEMO_PATIENT_USER_ID, readPatientSession } from '../portal/PatientLoginGate';
import { usePatientApiSession } from '../../hooks/usePatientApiSession';
import { api } from '../../lib/api';
import { resolvePrimaryDoctorId } from '../../lib/doctors';
import { enableWebPush, isWebPushEnabled } from '../../lib/push';

const FALLBACK_PATIENT_ID = 'pat-001';

interface PatientMobileAppProps {
  previewOnly?: boolean;
}

export const PatientMobileApp: React.FC<PatientMobileAppProps> = ({ previewOnly = false }) => {
  const {
    patients,
    appointments,
    invoices,
    messages,
    sendMessage,
    updateAppointmentStatus,
    addVitalReading,
    payInvoice,
    bookAppointment,
    rescheduleAppointment,
    cancelAppointmentByPatient,
    requestRefill,
    updatePatientProfile,
  } = useHospital();

  const session = readPatientSession();
  const { apiPatient, apiAppointments, apiInvoices, apiMessages, apiReady, refresh } =
    usePatientApiSession(session);

  const [activeTab, setActiveTab] = useState<PatientMobileTab>('home');

  useEffect(() => {
    if (!apiReady) return;
    // Quietly refresh backend registration if the browser already granted permission.
    isWebPushEnabled()
      .then((on) => (on ? enableWebPush() : undefined))
      .catch(() => undefined);
  }, [apiReady]);

  const patientUserId = session?.patientUserId || DEMO_PATIENT_USER_ID;
  const patientId = session?.patientId || apiPatient?.id || FALLBACK_PATIENT_ID;

  const mockPatient = patients.find((p) => p.id === patientId) || patients[0];
  const patient = apiReady && apiPatient ? apiPatient : mockPatient;

  const patientAppointments =
    apiReady && apiAppointments
      ? apiAppointments
      : appointments.filter((a) => a.patientId === patient.id);
  const patientInvoices =
    apiReady && apiInvoices
      ? apiInvoices
      : invoices.filter((i) => i.patientId === patient.id);
  const nextAppointment = useMemo(
    () =>
      patientAppointments.find(
        (a) => a.status === 'scheduled' || a.status === 'checked_in' || a.status === 'in_progress'
      ) || undefined,
    [patientAppointments]
  );

  const careTeamMessages =
    apiReady && apiMessages
      ? apiMessages
      : messages.filter(
          (m) => m.senderId === patientUserId || m.recipientId === patientUserId
        );

  const primaryDoctorId = resolvePrimaryDoctorId(patient.primaryDoctor, patientAppointments);

  const tabs: { id: PatientMobileTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'monitor', label: 'Monitor', icon: HeartPulse },
    { id: 'appointments', label: 'Visits', icon: Calendar },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: UserRound },
  ];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-8 p-2 ${
        previewOnly ? '' : 'lg:flex-row lg:items-start sm:p-6'
      }`}
    >
      {!previewOnly && (
        <div className="text-center lg:text-left max-w-sm lg:pt-10 rise-in">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl brand-mark flex items-center justify-center text-white font-display text-lg font-bold shadow-lg shadow-teal-900/20">
              M
            </div>
            <div className="text-left">
              <div className="font-display text-lg leading-none text-[var(--mc-text)]">
                Medicore
              </div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--mc-accent)]">
                Patient app
              </div>
            </div>
          </div>
          <p className="text-[13px] text-[var(--mc-muted)] leading-relaxed">
            Phone preview of the patient experience — live vitals monitoring, visits, billing, and
            encrypted care chat{apiReady ? ' (synced to API)' : ''}.
          </p>
        </div>
      )}

      <PhoneFrame>
        <header className="pm-brand-bar px-4 pt-4 pb-5 text-white shrink-0">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="font-display text-[1.35rem] leading-none tracking-tight">Medicore</div>
              <div className="text-[11px] text-teal-100/85 mt-1">Hi, {patient.firstName}</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-3.5 py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {activeTab === 'home' && (
                <HomeScreen
                  patient={patient}
                  nextAppointment={nextAppointment}
                  onCheckIn={async (id) => {
                    try {
                      if (apiReady) {
                        await api.checkInAppointment(id);
                        await refresh();
                      } else updateAppointmentStatus(id, 'checked_in');
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                  onNavigate={setActiveTab}
                  onRequestRefill={async (med) => {
                    try {
                      if (apiReady) {
                        await api.requestRefill(med, '30-day supply via patient mobile app');
                        await refresh();
                      } else requestRefill(patient.id, med, '30-day supply via patient mobile app');
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                />
              )}
              {activeTab === 'monitor' && (
                <MonitorScreen
                  patient={patient}
                  onLogReading={async (reading) => {
                    try {
                      if (apiReady) {
                        await api.ingestVital(reading);
                        await refresh();
                      } else {
                        addVitalReading(patient.id, reading);
                      }
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                />
              )}
              {activeTab === 'appointments' && (
                <AppointmentsScreen
                  appointments={patientAppointments}
                  onCheckIn={async (id) => {
                    try {
                      if (apiReady) {
                        await api.checkInAppointment(id);
                        await refresh();
                      } else updateAppointmentStatus(id, 'checked_in');
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                  onCancel={async (id) => {
                    try {
                      if (apiReady) {
                        await api.updateAppointment(id, { status: 'cancelled' });
                        await refresh();
                      } else cancelAppointmentByPatient(id);
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                  onReschedule={async (id, date, time) => {
                    try {
                      if (apiReady) {
                        await api.updateAppointment(id, { date, time });
                        await refresh();
                      } else rescheduleAppointment(id, date, time);
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                  onBook={async (input) => {
                    try {
                      if (apiReady) {
                        await api.bookAppointment({
                          doctorId: input.doctorId,
                          department: input.department,
                          date: input.date,
                          time: input.time,
                          reason: input.reason,
                        });
                        await refresh();
                      } else {
                        bookAppointment({
                          patientId: patient.id,
                          patientName: `${patient.firstName} ${patient.lastName}`,
                          patientMrn: patient.mrn,
                          doctorId: input.doctorId,
                          doctorName: input.doctorName,
                          department: input.department,
                          date: input.date,
                          time: input.time,
                          durationMinutes: 30,
                          type: 'Follow-up',
                          priority: 'routine',
                          reason: input.reason,
                          room: 'Outpatient Clinic',
                        });
                      }
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                />
              )}
              {activeTab === 'chat' && (
                <MessagesScreen
                  messages={careTeamMessages}
                  patientUserId={patientUserId}
                  onSend={async (body) => {
                    try {
                      if (apiReady) {
                        await api.sendMessage({
                          recipientId: primaryDoctorId,
                          subject: 'Patient Mobile Query',
                          body,
                        });
                        await refresh();
                      } else sendMessage(primaryDoctorId, 'Patient Mobile Query', body, false, patientUserId);
                    } catch (e) {
                      console.warn(e);
                    }
                  }}
                />
              )}
              {activeTab === 'profile' && (
                <ProfileScreen
                  patient={patient}
                  invoices={patientInvoices}
                  onUpdateProfile={async (profile) => {
                    try {
                      if (apiReady) {
                        await api.updatePatientProfile(profile);
                        await refresh();
                      } else {
                        updatePatientProfile(patient.id, profile);
                      }
                    } catch (e) {
                      console.warn(e);
                      throw e;
                    }
                  }}
                  onPay={async (id, amount, method) => {
                    try {
                      if (apiReady) {
                        const result = await api.payInvoice(id, method);
                        await refresh();
                        return {
                          id: result.receiptId,
                          amount,
                          method: method === 'hsa' ? 'HSA/FSA' : 'Card',
                        };
                      }
                      payInvoice(id, amount);
                      return {
                        id: `RCPT-${Date.now().toString(36).toUpperCase()}`,
                        amount,
                        method: method === 'hsa' ? 'HSA/FSA' : 'Card',
                      };
                    } catch (e) {
                      console.warn(e);
                      return undefined;
                    }
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <nav
          className="bg-[var(--mc-elevated)]/95 backdrop-blur-md border-t border-[var(--mc-line)] px-1.5 py-2 flex items-center justify-around shrink-0"
          aria-label="Patient app navigation"
        >
          {tabs.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex flex-col items-center min-w-[56px] py-1 rounded-xl transition-colors ${
                  active ? 'text-[var(--mc-accent)]' : 'text-[var(--mc-muted)]'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className={`h-5 w-5 ${active ? 'stroke-[2.25]' : ''}`} />
                <span className="text-[9px] font-bold mt-0.5 tracking-wide">{label}</span>
              </button>
            );
          })}
        </nav>
      </PhoneFrame>
    </div>
  );
};
