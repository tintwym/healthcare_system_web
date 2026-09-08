import React, { useEffect, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  Zap,
  Check,
  ChevronRight,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { Appointment } from '../../types';
import { McSelect } from '../ui/McSelect';
import { StaffApiLogin } from '../staff/StaffApiLogin';
import { api, getApiToken } from '../../lib/api';

export const AppointmentScheduler: React.FC = () => {
  const {
    appointments: localAppointments,
    patients,
    users,
    bookAppointment,
    updateAppointmentStatus,
    deIdentifyPhi,
  } = useHospital();

  const [apiAppointments, setApiAppointments] = useState<Appointment[] | null>(null);

  const loadStaffAppts = () => {
    if (!getApiToken()) {
      setApiAppointments(null);
      return;
    }
    void api
      .staffAppointments()
      .then((rows) => setApiAppointments(rows as Appointment[]))
      .catch(() => setApiAppointments(null));
  };

  useEffect(() => {
    loadStaffAppts();
  }, []);

  const appointments = apiAppointments ?? localAppointments;
  const usingApi = apiAppointments !== null;

  const setStatus = async (id: string, status: Appointment['status']) => {
    if (usingApi) {
      try {
        if (status === 'checked_in') await api.checkInAppointment(id);
        else await api.updateAppointment(id, { status });
        loadStaffAppts();
      } catch {
        /* keep list */
      }
      return;
    }
    updateAppointmentStatus(id, status);
  };

  const [filterDept, setFilterDept] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // New appointment form state
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState('u-1');
  const [dept, setDept] = useState('Cardiology');
  const [date, setDate] = useState('2026-09-04');
  const [time, setTime] = useState('11:00');
  const [duration, setDuration] = useState('30');
  const [type, setType] = useState<Appointment['type']>('Cardiology Consult');
  const [priority, setPriority] = useState<Appointment['priority']>('routine');
  const [reason, setReason] = useState('Clinical evaluation and telemetry review');
  const [room, setRoom] = useState('Suite 302-A');

  const filteredAppointments = appointments.filter((apt) => {
    const matchesDept = filterDept === 'all' || apt.department.toLowerCase() === filterDept.toLowerCase();
    const matchesStatus = filterStatus === 'all' || apt.status.toLowerCase() === filterStatus.toLowerCase();
    return matchesDept && matchesStatus;
  });

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    const patient = patients.find((p) => p.id === selectedPatientId) || patients[0];
    const doctor = users.find((u) => u.id === selectedDoctorId) || users[0];

    if (usingApi) {
      try {
        await api.bookAppointment({
          patientId: patient.id,
          doctorId: doctor.id,
          department: dept,
          date,
          time,
          reason: reason || type,
          type,
        });
        loadStaffAppts();
      } catch {
        /* ignore */
      }
      setIsBookModalOpen(false);
      return;
    }

    bookAppointment({
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientMrn: patient.mrn,
      doctorId: doctor.id,
      doctorName: doctor.name,
      department: dept,
      date,
      time,
      durationMinutes: parseInt(duration),
      type,
      priority,
      reason,
      room,
    });

    setIsBookModalOpen(false);
  };

  const getStatusBadge = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'checked_in':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200 animate-pulse';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  const getPriorityBadge = (priority: Appointment['priority']) => {
    switch (priority) {
      case 'stat':
        return 'bg-rose-600 text-white';
      case 'urgent':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <StaffApiLogin
        allowedRoles={['admin', 'doctor', 'nurse']}
        onAuthed={() => loadStaffAppts()}
      />
      {/* Header & Scheduling Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Appointment Scheduling & Encounters
          </h1>
          <p className="text-xs text-slate-500">
            Automated calendar orchestration across clinical departments with integrated automated billing triggers upon completion.
          </p>
        </div>

        <button
          id="open-book-appointment-modal"
          onClick={() => setIsBookModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter & Department Navigation Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500 text-[11px] uppercase tracking-wider mr-1">
            Department:
          </span>
          {['all', 'Cardiology', 'General Medicine', 'Orthopedics', 'Pediatrics', 'Endocrinology', 'Internal Medicine', 'Neurology'].map((d) => (
            <button
              key={d}
              onClick={() => setFilterDept(d)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filterDept === d
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {d === 'all' ? 'All Departments' : d}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs min-w-0">
          <span className="text-slate-500 text-[11px] font-semibold shrink-0">Status:</span>
          <McSelect
            value={filterStatus}
            onChange={setFilterStatus}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'checked_in', label: 'Checked In' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
            className="min-w-[9.5rem]"
            aria-label="Filter appointments by status"
          />
        </div>
      </div>

      {/* Appointments List Grid */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-slate-200 text-slate-500 text-xs">
            No appointments match the selected filters.
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const patientDisplayName = deIdentifyPhi
              ? `Patient #${apt.patientId.slice(-4)}`
              : apt.patientName;

            return (
              <div
                key={apt.id}
                className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Time & Patient Identity */}
                  <div className="flex items-start space-x-4">
                    <div className="text-center min-w-[70px] p-2 rounded-xl bg-blue-50 border border-blue-100">
                      <div className="text-xs font-bold text-blue-700">{apt.time}</div>
                      <div className="text-[10px] text-blue-500 font-medium">{apt.durationMinutes}m slot</div>
                      <div className="text-[9px] text-slate-400 mt-0.5">{apt.date}</div>
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="font-bold text-sm text-slate-900">{patientDisplayName}</h3>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {deIdentifyPhi ? 'MRN-******' : apt.patientMrn}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadge(apt.status)}`}>
                          {apt.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${getPriorityBadge(apt.priority)}`}>
                          {apt.priority}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium text-slate-800">
                          Dr: {apt.doctorName}
                        </span>
                        <span>•</span>
                        <span>Dept: {apt.department}</span>
                        <span>•</span>
                        <span className="flex items-center">
                          <MapPin className="h-3 w-3 mr-0.5 text-slate-400" /> {apt.room}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1.5">
                        <span className="font-semibold text-slate-700">Reason:</span> {apt.reason}
                      </p>

                      {apt.automatedBillingTriggered && (
                        <div className="mt-2 inline-flex items-center space-x-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <Zap className="h-3 w-3 text-emerald-600" />
                          <span>Automated Billing Generated: CPT-99214 Filed to EDI Claims</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Appointment Lifecycle Progression Actions */}
                  <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                    {apt.status === 'scheduled' && (
                      <button
                        onClick={() => void setStatus(apt.id, 'checked_in')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-xs"
                      >
                        Patient Check-In
                      </button>
                    )}

                    {apt.status === 'checked_in' && (
                      <button
                        onClick={() => void setStatus(apt.id, 'in_progress')}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs"
                      >
                        Begin Consult
                      </button>
                    )}

                    {apt.status === 'in_progress' && (
                      <button
                        id={`complete-apt-btn-${apt.id}`}
                        onClick={() => void setStatus(apt.id, 'completed')}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs"
                        title="Completing encounter automatically triggers EDI billing invoice"
                      >
                        <Check className="h-3.5 w-3.5" />
                        <span>Complete & Auto-Bill</span>
                      </button>
                    )}

                    {apt.status === 'completed' && (
                      <span className="flex items-center space-x-1 text-xs text-emerald-600 font-semibold px-2 py-1 bg-emerald-50 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Encounter Closed</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Book New Appointment Modal */}
      {isBookModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="text-base font-bold text-slate-900">Schedule Patient Appointment</h3>
              <button
                onClick={() => setIsBookModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleBook} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Patient</label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {deIdentifyPhi ? `Patient #${p.id.slice(-4)}` : `${p.firstName} ${p.lastName}`} ({p.mrn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={dept}
                    onChange={(e) => setDept(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="Cardiology">Cardiology</option>
                    <option value="General Medicine">General Medicine</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Neurology">Neurology</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Attending Physician</label>
                  <select
                    value={selectedDoctorId}
                    onChange={(e) => setSelectedDoctorId(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    {users
                      .filter((u) => u.role === 'doctor')
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duration</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Triage Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full pl-3 pr-9 py-2 rounded-lg border border-slate-300"
                  >
                    <option value="routine">Routine</option>
                    <option value="urgent">Urgent</option>
                    <option value="stat">STAT (Emergency)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exam Room / Clinic</label>
                  <input
                    type="text"
                    required
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="confirm-book-apt-btn"
                  className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
