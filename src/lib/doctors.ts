import type { Appointment } from '../types';

export function doctorForDepartment(dept: string): { id: string; name: string } {
  switch (dept) {
    case 'Endocrinology':
      return { id: 'u-8', name: 'Dr. Su Su Hlaing, MD' };
    case 'General Medicine':
    case 'Neurology':
      return { id: 'u-2', name: 'Dr. Kyaw Zin Oo, MD' };
    case 'Cardiology':
    default:
      return { id: 'u-1', name: 'Dr. Aye Myat Thu, MD' };
  }
}

export function resolvePrimaryDoctorId(
  primaryDoctor: string,
  appointments: Appointment[] = []
): string {
  const byAppt = appointments.find(
    (a) =>
      a.doctorName === primaryDoctor ||
      primaryDoctor.startsWith(a.doctorName.split(',')[0] || '')
  );
  if (byAppt?.doctorId) return byAppt.doctorId;

  const n = primaryDoctor.toLowerCase();
  if (n.includes('su su')) return 'u-8';
  if (n.includes('kyaw zin')) return 'u-2';
  if (n.includes('aye myat')) return 'u-1';
  return 'u-1';
}

export const BOOK_SLOTS = ['9:00 AM', '10:30 AM', '1:30 PM', '3:00 PM'];
export const RESCHEDULE_SLOTS = ['9:00 AM', '11:00 AM', '2:00 PM', '4:00 PM'];
