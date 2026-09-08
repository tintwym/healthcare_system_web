import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  EyeOff,
  AlertTriangle,
  Server,
  Key,
  Clock,
  UserCheck,
  FileText,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { AuditLog } from '../../types';
import { AuditExportModal } from './AuditExportModal';
import { McSelect } from '../ui/McSelect';

export const HipaaCompliance: React.FC = () => {
  const { auditLogs, deIdentifyPhi, setDeIdentifyPhi } = useHospital();
  const [filterAction, setFilterAction] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSearch =
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.justification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.patientName && log.patientName.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const handleExportCsv = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action', 'Resource', 'Patient', 'IP Hash', 'Justification', 'Flag'];
    const rows = filteredLogs.map((l) => [
      l.id,
      l.timestamp,
      l.userName,
      l.userRole,
      l.action,
      `"${l.resource.replace(/"/g, '""')}"`,
      l.patientName ? `"${l.patientName}"` : 'N/A',
      l.ipHash,
      `"${l.justification.replace(/"/g, '""')}"`,
      l.complianceFlag,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `HIPAA_Audit_Trail_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFlagBadge = (flag: AuditLog['complianceFlag']) => {
    switch (flag) {
      case 'STAT_OVERRIDE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'ELEVATED_PRIVILEGE':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            HIPAA Compliance & Immutable Audit Registry
          </h1>
          <p className="text-xs text-slate-500">
            Enforces 45 CFR § 164.312 Technical Safeguards: Unique User ID, Emergency Access, Cryptographic Verification & Audit Controls.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="open-secure-export-modal-btn"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Lock className="h-3.5 w-3.5" />
            <span>Export Secure Audit Trail (PDF / CSV)</span>
          </button>

          <button
            id="export-audit-csv-btn"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Quick CSV</span>
          </button>
        </div>
      </div>

      {/* Security Safeguards Status Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>Encryption at Rest</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2">AES-256 GCM</div>
          <p className="text-[11px] text-slate-500 mt-1">
            FIPS 140-2 validated hardware security module (HSM) keys
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-700">
            <Lock className="h-4 w-4 text-blue-600" />
            <span>Data In-Transit</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2">TLS 1.3 Encrypted</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Strict transport security (HSTS) with forward secrecy
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-purple-700">
            <Key className="h-4 w-4 text-purple-600" />
            <span>Identity & Access</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2">MFA & RBAC</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Role-Based Access Control + TOTP Authenticator enforced
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-xs font-bold text-amber-700">
            <Server className="h-4 w-4 text-amber-600" />
            <span>BAA Cloud Status</span>
          </div>
          <div className="text-lg font-bold text-slate-900 mt-2">Active & Signed</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Business Associate Agreement with Tier 4 Cloud Provider
          </p>
        </div>
      </div>

      {/* Audit Log Controls & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search audit trail by user, action, resource, or justification..."
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs min-w-0">
            <span className="text-slate-500 font-medium text-[11px] shrink-0">Filter Action:</span>
            <McSelect
              value={filterAction}
              onChange={setFilterAction}
              options={[
                { value: 'all', label: 'All Audit Actions' },
                { value: 'READ_EHR', label: 'READ_EHR' },
                { value: 'UPDATE_VITALS', label: 'UPDATE_VITALS' },
                { value: 'CREATE_APPOINTMENT', label: 'CREATE_APPOINTMENT' },
                { value: 'GENERATE_INVOICE', label: 'GENERATE_INVOICE' },
                { value: 'EXPORT_FHIR', label: 'EXPORT_FHIR' },
                { value: 'MFA_AUTH', label: 'MFA_AUTH' },
                { value: 'EMERGENCY_OVERRIDE', label: 'EMERGENCY_OVERRIDE' },
              ]}
              className="min-w-[12rem]"
              aria-label="Filter audit actions"
            />
          </div>
        </div>

        {/* Audit Trail Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-semibold">Timestamp (UTC)</th>
                <th className="px-4 py-3 font-semibold">Actor & Role</th>
                <th className="px-4 py-3 font-semibold">Action</th>
                <th className="px-4 py-3 font-semibold">Resource Target</th>
                <th className="px-4 py-3 font-semibold">Patient</th>
                <th className="px-4 py-3 font-semibold">Cryptographic IP Hash</th>
                <th className="px-4 py-3 font-semibold">Clinical Justification</th>
                <th className="px-4 py-3 font-semibold">Audit Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">{log.userRole}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800 max-w-xs truncate">
                    {log.resource}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {log.patientName ? (
                      deIdentifyPhi ? `Patient #${log.patientId?.slice(-4)}` : log.patientName
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-[10px] text-slate-500 whitespace-nowrap">
                    {log.ipHash}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-sm">
                    {log.justification}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getFlagBadge(log.complianceFlag)}`}>
                      {log.complianceFlag}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Secure Password-Protected Export Modal */}
      <AuditExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        logs={auditLogs}
      />
    </div>
  );
};
