import React from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  ShieldAlert,
  Activity,
  Network,
  MessageSquare,
  Smartphone,
  Lock,
  Pill,
  Brain,
  UserCheck,
  CalendarCheck,
  Contact,
  Scan,
  ClipboardList,
  HeartPulse,
  type LucideIcon,
} from 'lucide-react';
import { useHospital } from '../context/HospitalContext';

export type TabType =
  | 'overview'
  | 'vitals'
  | 'patients'
  | 'pharmacy'
  | 'cds'
  | 'shift-planning'
  | 'staff-directory'
  | 'radiology'
  | 'discharge'
  | 'care-loop'
  | 'appointments'
  | 'billing'
  | 'hipaa'
  | 'ehr'
  | 'messages'
  | 'patient-portal'
  | 'mobile-portal';

interface NavItem {
  id: TabType;
  label: string;
  subtitle: string;
  icon: LucideIcon;
  allowedRoles: string[];
  badge?: string;
  badgeColor?: string;
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, unreadAlertCount, messages, ePrescriptions, isMfaAuthenticated } = useHospital();

  const unreadMessagesCount = messages.filter(
    (m) => m.recipientId === currentUser.id && !m.read
  ).length;

  const pendingRxCount = ePrescriptions.filter(
    (rx) =>
      rx.status === 'pending_review' ||
      (rx.potentialInteractions &&
        rx.potentialInteractions.length > 0 &&
        rx.status !== 'dispensed')
  ).length;

  const role = currentUser.role;

  const navGroups: NavGroup[] = [
    {
      id: 'care-delivery',
      label: 'Care Delivery',
      items: [
        {
          id: 'vitals',
          label: 'Vitals & Trends',
          subtitle: 'Multi-parameter monitoring',
          icon: Activity,
          allowedRoles: ['doctor', 'nurse', 'admin', 'pharmacist'],
          badge: unreadAlertCount > 0 ? `${unreadAlertCount}` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300',
        },
        {
          id: 'patients',
          label: 'Patient Records',
          subtitle: 'EHR, labs & notes',
          icon: Users,
          allowedRoles: ['doctor', 'nurse', 'admin', 'pharmacist'],
        },
        {
          id: 'radiology',
          label: 'Radiology',
          subtitle: 'DICOM & annotations',
          icon: Scan,
          allowedRoles: ['doctor', 'nurse', 'admin'],
        },
        {
          id: 'cds',
          label: 'Decision Support',
          subtitle: 'Guidelines & alerts',
          icon: Brain,
          allowedRoles: ['doctor', 'nurse', 'pharmacist', 'admin'],
        },
        {
          id: 'discharge',
          label: 'Discharge',
          subtitle: 'Continuity of care',
          icon: ClipboardList,
          allowedRoles: ['doctor', 'nurse', 'admin'],
        },
        {
          id: 'care-loop',
          label: 'Care Loop',
          subtitle: 'AVS & med adherence',
          icon: HeartPulse,
          allowedRoles: ['doctor', 'nurse', 'admin', 'pharmacist'],
        },
        {
          id: 'pharmacy',
          label: 'Pharmacy',
          subtitle: 'Rx & formulary',
          icon: Pill,
          allowedRoles: ['pharmacist', 'doctor', 'nurse', 'admin'],
          badge: pendingRxCount > 0 ? `${pendingRxCount}` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300',
        },
      ],
    },
    {
      id: 'operations',
      label: 'Operations',
      items: [
        {
          id: 'overview',
          label: 'Network Overview',
          subtitle: 'Care network metrics',
          icon: LayoutDashboard,
          allowedRoles: ['admin', 'doctor', 'nurse', 'billing'],
        },
        {
          id: 'shift-planning',
          label: 'Shift Planning',
          subtitle: 'Roster & coverage',
          icon: CalendarCheck,
          allowedRoles: ['admin', 'doctor', 'nurse', 'pharmacist'],
        },
        {
          id: 'staff-directory',
          label: 'Care Team',
          subtitle: 'Directory & status',
          icon: Contact,
          allowedRoles: ['admin', 'doctor', 'nurse', 'pharmacist', 'billing', 'patient'],
        },
        {
          id: 'appointments',
          label: 'Appointments',
          subtitle: 'Scheduling & triage',
          icon: Calendar,
          allowedRoles: ['admin', 'doctor', 'nurse', 'billing', 'patient', 'pharmacist'],
        },
        {
          id: 'messages',
          label: 'Secure Messages',
          subtitle: 'Encrypted care chat',
          icon: MessageSquare,
          allowedRoles: ['admin', 'doctor', 'nurse', 'billing', 'patient', 'pharmacist'],
          badge: unreadMessagesCount > 0 ? `${unreadMessagesCount}` : undefined,
          badgeColor: 'bg-teal-500/20 text-teal-300',
        },
      ],
    },
    {
      id: 'revenue',
      label: 'Revenue',
      items: [
        {
          id: 'billing',
          label: 'Billing & Claims',
          subtitle: 'EDI & statements',
          icon: CreditCard,
          allowedRoles: ['billing', 'admin', 'doctor', 'patient'],
        },
      ],
    },
    {
      id: 'compliance',
      label: 'Compliance',
      items: [
        {
          id: 'hipaa',
          label: 'HIPAA & Audit',
          subtitle: 'Access & policy',
          icon: ShieldAlert,
          allowedRoles: ['admin', 'doctor', 'pharmacist'],
        },
        {
          id: 'ehr',
          label: 'EHR Interop',
          subtitle: 'HL7 FHIR R4',
          icon: Network,
          allowedRoles: ['admin', 'doctor'],
        },
      ],
    },
    {
      id: 'engagement',
      label: 'Engagement',
      items: [
        {
          id: 'patient-portal',
          label: 'Patient Portal',
          subtitle: 'Self-service health',
          icon: UserCheck,
          allowedRoles: ['patient', 'admin', 'doctor'],
        },
        {
          id: 'mobile-portal',
          label: 'Patient Mobile',
          subtitle: 'App + vitals monitor',
          icon: Smartphone,
          allowedRoles: ['admin', 'patient', 'doctor', 'nurse'],
        },
      ],
    },
  ];

  const renderItem = (item: NavItem) => {
    const isAllowed = item.allowedRoles.includes(role);
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    if (!isAllowed) {
      return (
        <div
          key={item.id}
          className="px-3 py-2 rounded-lg flex items-center justify-between cursor-not-allowed opacity-35"
          title={`Requires ${item.allowedRoles.join(', ')} privileges`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Icon className="h-3.5 w-3.5 text-slate-500 shrink-0" />
            <span className="text-[11px] text-slate-500 truncate">{item.label}</span>
          </div>
          <Lock className="h-3 w-3 text-slate-600 shrink-0" />
        </div>
      );
    }

    return (
      <button
        key={item.id}
        id={`nav-tab-${item.id}`}
        onClick={() => setActiveTab(item.id)}
        className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-all duration-200 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/40 ${
          isActive
            ? 'bg-teal-500/15 text-teal-200 ring-1 ring-teal-400/30'
            : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon
            className={`h-3.5 w-3.5 shrink-0 transition-colors ${
              isActive ? 'text-teal-300' : 'text-slate-500 group-hover:text-slate-300'
            }`}
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold truncate leading-tight">{item.label}</p>
            <p
              className={`text-[9px] truncate leading-tight mt-0.5 ${
                isActive ? 'text-teal-400/80' : 'text-slate-600'
              }`}
            >
              {item.subtitle}
            </p>
          </div>
        </div>
        {item.badge && (
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ml-1 ${
              isActive ? 'bg-teal-400 text-[#0a1628]' : item.badgeColor
            }`}
          >
            {item.badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="w-[17rem] lg:w-72 text-slate-300 flex flex-col shrink-0 h-full border-r border-white/5 bg-[var(--mc-ink)] relative overflow-hidden">
      {/* Sidebar atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 90% 50% at 20% -10%, rgba(20,184,166,0.22), transparent 55%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(14,116,144,0.15), transparent 50%)',
        }}
      />

      {/* Brand lockup — hero-level in nav */}
      <div className="brand-lockup relative z-10 px-5 pt-6 pb-5 border-b border-white/8">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl shrink-0 shadow-[0_8px_24px_rgba(15,118,110,0.35)] overflow-hidden ring-1 ring-white/10">
            <img
              src="/icon-192.png"
              alt="Medicore"
              className="w-full h-full object-cover"
              width={44}
              height={44}
            />
          </div>
          <div className="min-w-0 pt-0.5">
            <div className="font-display text-[1.35rem] leading-none text-white tracking-tight font-semibold">
              Medicore
            </div>
            <div className="mt-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-teal-400">
              Healthcare OS
            </div>
            <p className="mt-2 text-[10px] text-slate-500 leading-snug">
              Medicore Yangon care network
            </p>
          </div>
        </div>
      </div>

      <nav className="relative z-10 flex-1 px-3 py-2 overflow-y-auto">
        {navGroups.map((group) => {
          const visible = group.items.some((i) => i.allowedRoles.includes(role));
          if (!visible && role !== 'admin') {
            // Still show locked groups lightly for RBAC demo when any item exists
          }
          return (
            <div key={group.id} className="mb-1">
              <div className="nav-group-label">{group.label}</div>
              <div className="space-y-0.5">{group.items.map(renderItem)}</div>
            </div>
          );
        })}
      </nav>

      <div className="relative z-10 m-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-[9px] text-slate-400 uppercase tracking-[0.16em] font-bold">
            HIPAA Secure
          </span>
        </div>
        <div className="text-[11px] text-slate-200 font-semibold truncate">{currentUser.name}</div>
        <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between gap-2">
          <span className="truncate">{currentUser.department}</span>
          <span
            className={`font-medium shrink-0 ${
              isMfaAuthenticated ? 'text-teal-400' : 'text-amber-400'
            }`}
          >
            {isMfaAuthenticated ? 'MFA ✓' : 'MFA pending'}
          </span>
        </div>
      </div>
    </aside>
  );
};
