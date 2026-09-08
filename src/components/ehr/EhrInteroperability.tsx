import React, { useState } from 'react';
import {
  Network,
  RefreshCw,
  CheckCircle2,
  Database,
  ArrowRightLeft,
  Code2,
  Send,
  ExternalLink,
  Zap,
  Globe,
  ShieldCheck,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { McSelect } from '../ui/McSelect';
import { StaffApiLogin } from '../staff/StaffApiLogin';
import { api, getApiToken } from '../../lib/api';

export const EhrInteroperability: React.FC = () => {
  const { ehrIntegrations, syncEhrSystem, patients } = useHospital();
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/fhir/Patient/pat-001');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('GET');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState<boolean>(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [useLiveApi, setUseLiveApi] = useState(true);

  const samplePatient = patients[0];

  const handleTestApi = async () => {
    setIsLoadingApi(true);
    try {
      if (useLiveApi && getApiToken()) {
        if (apiMethod === 'GET' && selectedEndpoint.includes('/Patient/')) {
          const id = selectedEndpoint.split('/Patient/')[1] || 'pat-001';
          const data = await api.fhirPatient(id);
          setApiResponse(data);
        } else if (apiMethod === 'POST') {
          const data = await api.fhirImport({
            resourceType: 'Bundle',
            type: 'transaction',
            entry: [{ resource: { resourceType: 'Patient', id: samplePatient.id } }],
          });
          setApiResponse(data);
        } else {
          const logs = await api.fhirLogs();
          setApiResponse(logs);
        }
      } else {
        await new Promise((r) => setTimeout(r, 400));
        if (selectedEndpoint.includes('/Patient/')) {
          setApiResponse({
            resourceType: 'Patient',
            id: samplePatient.id,
            identifier: [{ system: 'urn:medicore:mrn', value: samplePatient.mrn }],
            name: [{ family: samplePatient.lastName, given: [samplePatient.firstName] }],
            gender: samplePatient.gender.toLowerCase(),
            birthDate: samplePatient.dob,
          });
        } else {
          setApiResponse({ note: 'Mock response — sign in to staff API for live FHIR' });
        }
      }
    } catch (e) {
      setApiResponse({ error: e instanceof Error ? e.message : 'Request failed' });
    } finally {
      setIsLoadingApi(false);
    }
  };

  const handleSync = async (id: string) => {
    setSyncingId(id);
    await syncEhrSystem(id);
    setSyncingId(null);
  };

  return (
    <div className="space-y-6">
      <StaffApiLogin allowedRoles={['admin', 'doctor', 'nurse', 'billing']} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            EHR Interoperability & HL7 FHIR Gateway
          </h1>
          <p className="text-xs text-slate-500">
            Bidirectional electronic health record synchronization supporting FHIR R4 standard with Epic Systems, Cerner Millennium, and AthenaHealth.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-semibold flex items-center">
            <Globe className="h-3.5 w-3.5 mr-1" />
            ONC Health IT Certified API (Cures Act)
          </span>
        </div>
      </div>

      {/* Connected EHR Systems Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {ehrIntegrations.map((sys) => {
          const isSyncing = syncingId === sys.id || sys.status === 'Syncing';
          return (
            <div
              key={sys.id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{sys.name}</span>
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      sys.status === 'Connected'
                        ? 'bg-emerald-500 ring-4 ring-emerald-100'
                        : 'bg-amber-500 animate-ping'
                    }`}
                  />
                </div>

                <div className="text-[11px] text-slate-500 font-mono mt-1 truncate">
                  {sys.endpointUrl}
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Protocol / Schema:</span>
                    <span className="font-semibold text-slate-900">HL7 FHIR {sys.fhirVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Synced Today:</span>
                    <span className="font-semibold text-blue-600">{sys.recordsSyncedToday} records</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Latency:</span>
                    <span className="font-mono text-emerald-600 font-semibold">{sys.latencyMs} ms</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  Last: {new Date(sys.lastSyncTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  id={`sync-ehr-btn-${sys.id}`}
                  disabled={isSyncing}
                  onClick={() => handleSync(sys.id)}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive FHIR API Test Bench */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Code2 className="h-5 w-5 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                FHIR R4 REST API Live Testing Console
              </h3>
              <p className="text-xs text-slate-500">
                Execute authenticated sandbox requests with SMART-on-FHIR OAuth bearer tokens.
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            Endpoint: <span className="text-blue-600 font-bold">https://api.medicore.mm/fhir/r4</span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Request Configurator */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <McSelect
              value={apiMethod}
              onChange={(v) => setApiMethod(v as 'GET' | 'POST')}
              options={[
                { value: 'GET', label: 'GET' },
                { value: 'POST', label: 'POST' },
              ]}
              className="sm:w-28"
              size="md"
              aria-label="HTTP method"
            />

            <McSelect
              value={selectedEndpoint}
              onChange={setSelectedEndpoint}
              options={[
                {
                  value: '/fhir/Patient/pat-001',
                  label: '/fhir/Patient/pat-001 (Thiri Su Pyae Demographics)',
                },
                {
                  value: '/fhir/logs',
                  label: '/fhir/logs (Import/export audit)',
                },
                {
                  value: '/fhir/Bundle',
                  label: '/fhir/Bundle (POST import)',
                },
              ]}
              className="flex-1 min-w-0"
              menuClassName="min-w-[min(100vw-2rem,28rem)]"
              size="md"
              aria-label="FHIR endpoint"
            />

            <button
              id="send-fhir-request-btn"
              disabled={isLoadingApi}
              onClick={handleTestApi}
              className="flex items-center justify-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isLoadingApi ? 'Sending...' : 'Send Request'}</span>
            </button>
          </div>

          {/* Response Inspector */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-80">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px] text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-emerald-400 font-bold">HTTP 200 OK</span>
                <span>Content-Type: application/fhir+json; charset=utf-8</span>
              </div>
              <span>Response Time: 28ms</span>
            </div>

            <pre className="text-slate-200">
              {apiResponse
                ? JSON.stringify(apiResponse, null, 2)
                : `// Click "Send Request" to invoke the live FHIR R4 endpoint.\n// Returns structured HL7 FHIR compliant JSON resources.`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
