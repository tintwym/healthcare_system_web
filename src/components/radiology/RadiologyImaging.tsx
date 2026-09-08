import React, { useMemo, useRef, useState } from 'react';
import {
  Scan,
  Search,
  Filter,
  Link2,
  Unlink,
  Pencil,
  Trash2,
  Eye,
  FileText,
  ShieldCheck,
  Clock,
  User,
  Layers,
  Crosshair,
  Ruler,
  Type,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  X,
  Plus,
} from 'lucide-react';
import { useHospital } from '../../context/HospitalContext';
import { DicomAnnotation, DicomStudy, ModalityType } from '../../types';
import { McSelect } from '../ui/McSelect';

export const RadiologyImaging: React.FC = () => {
  const {
    dicomStudies,
    patients,
    selectedPatientId,
    setSelectedPatientId,
    addDicomAnnotation,
    removeDicomAnnotation,
    linkStudyToPatientRecord,
    logAudit,
    deIdentifyPhi,
    currentUser,
  } = useHospital();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalityFilter, setModalityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [patientFilter, setPatientFilter] = useState<string>(selectedPatientId || 'all');
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(dicomStudies[0]?.id ?? null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const [annotationMode, setAnnotationMode] = useState<DicomAnnotation['type'] | null>(null);
  const [annotationLabel, setAnnotationLabel] = useState('Finding');
  const [annotationValue, setAnnotationValue] = useState('');
  const [showReport, setShowReport] = useState(true);
  const imageRef = useRef<HTMLDivElement>(null);

  const selectedStudy = dicomStudies.find((s) => s.id === selectedStudyId) || dicomStudies[0];
  const activeSeries =
    selectedStudy?.series.find((s) => s.id === selectedSeriesId) || selectedStudy?.series[0];

  const filteredStudies = useMemo(() => {
    return dicomStudies.filter((s) => {
      const matchesSearch =
        s.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.studyDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.patientMrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.bodyPart.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesModality = modalityFilter === 'all' || s.modality === modalityFilter;
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchesPatient = patientFilter === 'all' || s.patientId === patientFilter;
      return matchesSearch && matchesModality && matchesStatus && matchesPatient;
    });
  }, [dicomStudies, searchQuery, modalityFilter, statusFilter, patientFilter]);

  const displayPatientName = (study: DicomStudy) =>
    deIdentifyPhi ? `Patient #${study.patientId.slice(-4)}` : study.patientName;

  const displayMrn = (study: DicomStudy) => (deIdentifyPhi ? 'MRN-******' : study.patientMrn);

  const modalityBadge = (m: ModalityType) => {
    const colors: Record<ModalityType, string> = {
      CT: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-700',
      MRI: 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-200 dark:border-violet-700',
      XR: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600',
      US: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200 dark:border-cyan-700',
      PET: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-200 dark:border-rose-700',
      MG: 'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900/40 dark:text-pink-200 dark:border-pink-700',
      NM: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700',
    };
    return colors[m];
  };

  const handleSelectStudy = (study: DicomStudy) => {
    setSelectedStudyId(study.id);
    setSelectedSeriesId(study.series[0]?.id ?? null);
    setSelectedPatientId(study.patientId);
    logAudit(
      'VIEW_DICOM',
      `Opened DICOM study ${study.accessionNumber} (${study.modality} ${study.bodyPart})`,
      'Clinician review of diagnostic imaging for care coordination',
      study.patientId,
      study.patientName
    );
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!annotationMode || !activeSeries || !selectedStudy || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const colors: Record<DicomAnnotation['type'], string> = {
      measurement: '#3b82f6',
      roi: '#ef4444',
      arrow: '#f59e0b',
      text: '#10b981',
      findings_marker: '#8b5cf6',
    };

    addDicomAnnotation(selectedStudy.id, activeSeries.id, {
      type: annotationMode,
      label: annotationLabel || annotationMode,
      x,
      y,
      width: annotationMode === 'roi' ? 8 : undefined,
      height: annotationMode === 'roi' ? 6 : undefined,
      value: annotationValue || undefined,
      color: colors[annotationMode],
      createdBy: currentUser.name,
    });

    setAnnotationMode(null);
    setAnnotationValue('');
  };

  const handleLinkToChart = (study: DicomStudy) => {
    linkStudyToPatientRecord(study.id, true);
  };

  if (!selectedStudy || !activeSeries) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400">
        No DICOM studies available in the PACS cache.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <Scan className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            Radiology & Imaging (DICOM)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            View DICOM-format studies, overlay diagnostic annotations, and link images to patient EHR
            charts for historical tracking.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full">
          <ShieldCheck className="h-3.5 w-3.5" />
          HIPAA § 164.312 Imaging Access Logged
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search accession, MRN, body part..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
          />
        </div>
        <McSelect
          value={modalityFilter}
          onChange={setModalityFilter}
          options={[
            { value: 'all', label: 'All Modalities' },
            ...(['CT', 'MRI', 'XR', 'US', 'PET', 'MG', 'NM'] as ModalityType[]).map((m) => ({
              value: m,
              label: m,
            })),
          ]}
          className="min-w-[9rem]"
          size="md"
          aria-label="Filter by modality"
        />
        <McSelect
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'final', label: 'Final' },
            { value: 'preliminary', label: 'Preliminary' },
            { value: 'addendum', label: 'Addendum' },
          ]}
          className="min-w-[9rem]"
          size="md"
          aria-label="Filter by report status"
        />
        <McSelect
          value={patientFilter}
          onChange={setPatientFilter}
          options={[
            { value: 'all', label: 'All Patients' },
            ...patients.map((p) => ({
              value: p.id,
              label: deIdentifyPhi
                ? `Patient #${p.id.slice(-4)}`
                : `${p.firstName} ${p.lastName}`,
            })),
          ]}
          className="min-w-[10rem]"
          size="md"
          aria-label="Filter by patient"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-[640px]">
        {/* Study list */}
        <div className="xl:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
          <div className="px-3 py-2.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              Worklist ({filteredStudies.length})
            </span>
            <Filter className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
            {filteredStudies.map((study) => (
              <button
                key={study.id}
                onClick={() => handleSelectStudy(study)}
                className={`w-full text-left p-3 transition-colors ${
                  selectedStudy.id === study.id
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-l-4 border-blue-500'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 border-l-4 border-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${modalityBadge(
                      study.modality
                    )}`}
                  >
                    {study.modality}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      study.priority === 'stat'
                        ? 'text-rose-600 dark:text-rose-400'
                        : study.priority === 'urgent'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {study.priority}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {study.studyDescription}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {displayPatientName(study)} · {displayMrn(study)}
                </p>
                <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {study.studyDate} {study.studyTime}
                  </span>
                  {study.linkedToChart ? (
                    <Link2 className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Unlink className="h-3 w-3 text-slate-400" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Viewer */}
        <div className="xl:col-span-6 space-y-3">
          <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-700 relative">
            <div className="px-3 py-2 bg-slate-900 border-b border-slate-700 flex items-center justify-between gap-2 flex-wrap">
              <div className="text-xs text-slate-300 font-mono truncate">
                UID: {selectedStudy.dicomUid}
              </div>
              <div className="flex items-center gap-1">
                {(
                  [
                    ['roi', Crosshair, 'ROI'],
                    ['measurement', Ruler, 'Measure'],
                    ['arrow', ArrowUpRight, 'Arrow'],
                    ['text', Type, 'Text'],
                    ['findings_marker', Pencil, 'Marker'],
                  ] as const
                ).map(([type, Icon, label]) => (
                  <button
                    key={type}
                    onClick={() => setAnnotationMode(annotationMode === type ? null : type)}
                    className={`px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 transition-colors ${
                      annotationMode === type
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                    title={`Add ${label} annotation`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {annotationMode && (
              <div className="px-3 py-2 bg-amber-950/80 border-b border-amber-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-amber-200 font-semibold">
                  Click image to place {annotationMode} annotation
                </span>
                <input
                  value={annotationLabel}
                  onChange={(e) => setAnnotationLabel(e.target.value)}
                  placeholder="Label"
                  className="px-2 py-1 rounded text-xs bg-slate-900 border border-slate-600 text-white w-28"
                />
                <input
                  value={annotationValue}
                  onChange={(e) => setAnnotationValue(e.target.value)}
                  placeholder="Value / note"
                  className="px-2 py-1 rounded text-xs bg-slate-900 border border-slate-600 text-white w-36"
                />
                <button
                  onClick={() => setAnnotationMode(null)}
                  className="ml-auto text-amber-300 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div
              ref={imageRef}
              onClick={handleImageClick}
              className={`relative aspect-[4/3] bg-black ${
                annotationMode ? 'cursor-crosshair' : 'cursor-default'
              }`}
            >
              <img
                src={activeSeries.fullImageUrl}
                alt={activeSeries.description}
                className="w-full h-full object-contain opacity-90"
                draggable={false}
              />
              {activeSeries.annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="absolute group"
                  style={{
                    left: `${ann.x}%`,
                    top: `${ann.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {ann.type === 'roi' ? (
                    <div
                      className="border-2 rounded-sm"
                      style={{
                        borderColor: ann.color,
                        width: `${(ann.width || 8) * 4}px`,
                        height: `${(ann.height || 6) * 4}px`,
                      }}
                    />
                  ) : (
                    <div
                      className="w-3 h-3 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: ann.color }}
                    />
                  )}
                  <div className="absolute left-4 top-0 whitespace-nowrap bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded opacity-90 group-hover:opacity-100">
                    {ann.label}
                    {ann.value ? `: ${ann.value}` : ''}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDicomAnnotation(selectedStudy.id, activeSeries.id, ann.id);
                      }}
                      className="ml-1 text-rose-400 hover:text-rose-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <div className="absolute bottom-2 left-2 text-[10px] text-white/70 font-mono bg-black/50 px-2 py-1 rounded">
                {selectedStudy.modality} · {activeSeries.description} · {activeSeries.imageCount}{' '}
                frames
              </div>
            </div>
          </div>

          {/* Series thumbnails */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedStudy.series.map((series) => (
              <button
                key={series.id}
                onClick={() => setSelectedSeriesId(series.id)}
                className={`shrink-0 w-28 rounded-lg overflow-hidden border-2 transition-colors ${
                  activeSeries.id === series.id
                    ? 'border-blue-500'
                    : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                <img
                  src={series.thumbnailUrl}
                  alt={series.description}
                  className="w-full h-16 object-cover"
                />
                <div className="px-1.5 py-1 bg-white dark:bg-slate-800 text-[9px] font-semibold text-slate-700 dark:text-slate-300 truncate">
                  S{series.seriesNumber}: {series.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Report + metadata */}
        <div className="xl:col-span-3 space-y-3">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Study Metadata
              </h3>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  selectedStudy.status === 'final'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                }`}
              >
                {selectedStudy.status}
              </span>
            </div>
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="text-slate-400">Accession</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100 font-mono">
                  {selectedStudy.accessionNumber}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Patient</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {displayPatientName(selectedStudy)} ({displayMrn(selectedStudy)})
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Body Part</dt>
                <dd className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedStudy.bodyPart}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400 flex items-center gap-1">
                  <User className="h-3 w-3" /> Referring
                </dt>
                <dd className="text-slate-700 dark:text-slate-300">
                  {selectedStudy.referringPhysician}
                </dd>
              </div>
              <div>
                <dt className="text-slate-400">Radiologist</dt>
                <dd className="text-slate-700 dark:text-slate-300">
                  {selectedStudy.readingRadiologist}
                </dd>
              </div>
            </dl>

            <button
              onClick={() => handleLinkToChart(selectedStudy)}
              disabled={selectedStudy.linkedToChart}
              className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                selectedStudy.linkedToChart
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 cursor-default'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {selectedStudy.linkedToChart ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Linked to Patient Chart
                </>
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5" /> Link to Patient Record
                </>
              )}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setShowReport(!showReport)}
              className="w-full px-4 py-2.5 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Radiology Report
              </span>
              <Eye className="h-3.5 w-3.5 text-slate-400" />
            </button>
            {showReport && (
              <div className="p-4 space-y-3 text-xs">
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Findings</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {selectedStudy.reportFindings}
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-1">Impression</h4>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">
                    {selectedStudy.reportImpression}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" /> Annotations (
              {activeSeries.annotations.length})
            </h3>
            {activeSeries.annotations.length === 0 ? (
              <p className="text-[11px] text-slate-400">
                No overlays yet. Use toolbar tools to annotate.
              </p>
            ) : (
              <ul className="space-y-2">
                {activeSeries.annotations.map((ann) => (
                  <li
                    key={ann.id}
                    className="flex items-start justify-between gap-2 text-[11px] p-2 rounded-lg bg-slate-50 dark:bg-slate-800"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: ann.color }}
                        />
                        {ann.label}
                      </div>
                      {ann.value && (
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">{ann.value}</div>
                      )}
                      <div className="text-slate-400 mt-0.5">
                        {ann.createdBy} · {new Date(ann.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        removeDicomAnnotation(selectedStudy.id, activeSeries.id, ann.id)
                      }
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!selectedStudy.linkedToChart && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              Study is not yet linked to the patient chart. Link for longitudinal imaging history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
