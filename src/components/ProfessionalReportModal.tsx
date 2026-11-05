import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Layers,
  ShieldCheck,
  Sparkles,
  Table,
  X,
} from 'lucide-react';
import {
  AppLanguage,
  Consultation,
  DeliverableFormat,
  TailoredDeliverable,
} from '../types';
import {
  ProfessionalConsultingReport,
  buildDeliverableCatalogForDomain,
} from '../lib/reportSynthesisEngine';

interface ProfessionalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ProfessionalConsultingReport;
  consultation: Consultation;
  language: AppLanguage;
  onDownloadConsultationReport: () => void;
  onDownloadActionPlan: () => void;
  onDownloadDeliverable: (
    format: DeliverableFormat,
    deliverable: TailoredDeliverable
  ) => void;
}

export const ProfessionalReportModal: React.FC<ProfessionalReportModalProps> = ({
  isOpen,
  onClose,
  report,
  consultation,
  language,
  onDownloadConsultationReport,
  onDownloadActionPlan,
  onDownloadDeliverable,
}) => {
  const isEn = language === 'en';
  const deliverableSuite = buildDeliverableCatalogForDomain(
    consultation.workTopic,
    consultation
  );
  const [selectedDeliverableIdx, setSelectedDeliverableIdx] = useState(0);
  const [showQualityDetails, setShowQualityDetails] = useState(false);

  if (!isOpen) return null;

  const activeDeliverable =
    deliverableSuite[selectedDeliverableIdx] || deliverableSuite[0];

  const renderTable = (tbl: {
    id: string;
    title: string;
    subtitle: string;
    headers: string[];
    rows: string[][];
    sourceNote: string;
  }) => (
    <div
      key={tbl.id}
      className="rounded-[14px] border border-subtle bg-surface overflow-hidden space-y-0"
    >
      <div className="px-4 py-3 bg-surface-secondary border-b border-subtle">
        <p className="text-[14px] font-semibold text-primary">{tbl.title}</p>
        {tbl.subtitle && (
          <p className="text-[12px] text-secondary mt-0.5">{tbl.subtitle}</p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[13px]">
          <thead>
            <tr className="bg-surface-secondary/60 border-b border-subtle text-primary font-semibold">
              {tbl.headers.map((h, hIdx) => (
                <th key={hIdx} className="p-3 min-w-[130px] align-top">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {tbl.rows.map((row, rIdx) => (
              <tr key={rIdx} className="align-top hover:bg-surface-secondary/30">
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`p-3 leading-relaxed ${
                      cIdx === 0
                        ? 'font-medium text-primary'
                        : 'text-secondary'
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tbl.sourceNote && (
        <div className="px-4 py-2.5 bg-surface-secondary/40 border-t border-subtle text-[11px] text-secondary italic">
          {tbl.sourceNote}
        </div>
      )}
    </div>
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={report.coverPage.reportTitle}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in"
    >
      <div className="w-full max-w-[980px] max-h-[92vh] rounded-[20px] border border-[var(--text-primary)] bg-app text-primary flex flex-col overflow-hidden shadow-2xl">
        {/* Top Modal Bar */}
        <div className="px-5 py-4 border-b border-subtle bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-primary shrink-0" />
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-meta text-secondary">
                <span>{report.coverPage.documentReferenceCode}</span>
                <span aria-hidden="true">·</span>
                <span>{report.coverPage.ownershipBadge}</span>
                <span aria-hidden="true">·</span>
                <span className="text-primary font-semibold">
                  {report.qualityValidation.passedCount}/
                  {report.qualityValidation.totalChecks}{' '}
                  {isEn ? 'Quality Checks Passed' : 'Validasi Kualitas Lulus'}
                </span>
              </div>
              <h2 className="text-[16px] sm:text-[18px] font-semibold text-primary">
                {isEn
                  ? 'Professional Consulting Report & Deliverable Inspector'
                  : 'Pratinjau Laporan Konsultasi Bisnis & Validasi Kualitas'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDownloadConsultationReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] btn-primary text-[13px] font-medium cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                {isEn ? 'Download Report (PDF)' : 'Unduh Laporan (PDF)'}
              </span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label={isEn ? 'Close report preview' : 'Tutup pratinjau laporan'}
              className="p-2 rounded-[10px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-secondary hover:text-primary cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Editorial Report Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-8">
          {/* 1. Editorial Cover Page Block */}
          <section className="p-6 sm:p-8 rounded-[16px] border border-[var(--text-primary)] bg-surface space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-subtle font-mono-meta text-[11px] text-secondary">
              <span>{report.coverPage.advisoryHeader}</span>
              <span>{report.coverPage.preparedDate}</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-primary leading-snug">
                {report.coverPage.reportTitle}
              </h1>
              <p className="text-[14px] sm:text-[15px] text-secondary leading-relaxed">
                {report.coverPage.reportSubtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-[12px] bg-surface-secondary border border-subtle">
                <p className="font-mono-meta text-[11px] text-secondary">
                  {isEn ? 'CLIENT / BUSINESS' : 'IDENTITAS USAHA'}
                </p>
                <p className="text-[14px] font-semibold text-primary mt-0.5">
                  {report.coverPage.businessName}
                </p>
                <p className="text-[12px] text-secondary">
                  {report.coverPage.businessCategoryAndStage}
                </p>
              </div>
              <div className="p-3.5 rounded-[12px] bg-surface-secondary border border-subtle">
                <p className="font-mono-meta text-[11px] text-secondary">
                  {isEn ? 'PRIMARY FOCUS DOMAIN' : 'DOMAIN FOKUS KONSULTASI'}
                </p>
                <p className="text-[14px] font-semibold text-primary mt-0.5">
                  {report.coverPage.primaryDomain}
                </p>
                <p className="text-[12px] text-secondary">
                  {isEn
                    ? `${report.readiness.completenessScorePct}% context profile coverage`
                    : `${report.readiness.completenessScorePct}% kelengkapan profil konteks`}
                </p>
              </div>
              <div className="p-3.5 rounded-[12px] bg-surface-secondary border border-subtle">
                <p className="font-mono-meta text-[11px] text-secondary">
                  {isEn ? 'PRIVACY & QUALITY GATE' : 'PRIVASI & VALIDASI KUALITAS'}
                </p>
                <p className="text-[14px] font-semibold text-primary mt-0.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {report.qualityValidation.passedCount}/
                    {report.qualityValidation.totalChecks}{' '}
                    {isEn ? 'Verified' : 'Terverifikasi'}
                  </span>
                </p>
                <button
                  type="button"
                  onClick={() => setShowQualityDetails(!showQualityDetails)}
                  className="text-[12px] text-primary underline underline-offset-4 mt-0.5 cursor-pointer"
                >
                  {showQualityDetails
                    ? isEn
                      ? 'Hide 9-point audit'
                      : 'Sembunyikan rincian 9 validasi'
                    : isEn
                      ? 'Inspect 9-point quality audit'
                      : 'Lihat rincian 9 poin validasi'}
                </button>
              </div>
            </div>

            {/* Expandable 9-Point Quality Validation Audit */}
            {showQualityDetails && (
              <div
                data-testid="report-quality-validation-grid"
                className="p-4 rounded-[12px] bg-surface-secondary border border-subtle space-y-2.5"
              >
                <p className="font-mono-meta text-[11px] uppercase tracking-wider text-primary font-semibold">
                  {isEn
                    ? '9-Point Report Quality & Privacy Validation Gate'
                    : '9 Poin Pemeriksaan Kualitas & Keamanan Dokumen Konsultasi'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {report.qualityValidation.checks.map((chk) => (
                    <div
                      key={chk.id}
                      className="p-2.5 rounded-[10px] bg-surface border border-subtle text-[12px] space-y-1"
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{chk.label}</span>
                      </div>
                      <p className="text-secondary leading-snug">{chk.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Table of Selected Sections */}
            <div className="pt-3 border-t border-subtle space-y-2">
              <p className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary">
                {isEn
                  ? 'DYNAMICALLY SELECTED CONSULTING REPORT SECTIONS'
                  : 'STRUKTUR BAGIAN LAPORAN YANG DIPILIH SESUAI KONTEKS USAHA'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12px] text-secondary">
                {report.selectedSections
                  .filter((s) => s.included)
                  .map((sec) => (
                    <span key={sec.id} className="text-primary">
                      <strong>{sec.sectionNumber}.</strong> {sec.title}
                    </span>
                  ))}
              </div>
            </div>
          </section>

          {/* 2. Executive Summary */}
          <section className="p-6 rounded-[16px] border border-subtle bg-surface space-y-3">
            <h3 className="text-[18px] font-semibold text-primary">
              {isEn
                ? '1. Executive Summary'
                : '1. Ringkasan Eksekutif (Executive Summary)'}
            </h3>
            <p className="text-[15px] text-primary leading-relaxed">
              {report.executiveSummary.situationParagraph}
            </p>
            <p className="text-[14px] text-secondary leading-relaxed">
              {report.executiveSummary.coreDiagnosisParagraph}
            </p>
            <p className="text-[14px] text-secondary leading-relaxed">
              {report.executiveSummary.strategicDirectionParagraph}
            </p>
            <div className="p-4 rounded-[12px] bg-surface-secondary border border-subtle space-y-1.5">
              <p className="font-mono-meta text-[11px] uppercase text-secondary">
                {isEn ? 'KEY ADVISORY TAKEAWAYS' : 'INTISARI TEMUAN & SOLUSI'}
              </p>
              <ul className="space-y-1 text-[13px] text-primary">
                {report.executiveSummary.keyTakeaways.map((item, idx) => (
                  <li key={idx}>• {item}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* 3. Business Overview & 10-Dimension Context Table */}
          <section className="space-y-3">
            {renderTable(report.tables.businessOverviewTable)}
          </section>

          {/* 4. Epistemic Evidence Matrix (Facts vs. Symptoms vs. Data vs. Causes vs. Assumptions vs. Missing Info) */}
          <section className="space-y-3">
            {renderTable(report.tables.epistemicEvidenceTable)}
          </section>

          {/* 5. Root Cause & Problem-Analysis Matrix */}
          <section className="space-y-3">
            {renderTable(report.tables.rootCauseMatrixTable)}
          </section>

          {/* 6. Data Analysis, Visual Charts & Non-Fabricated Data Collection Template */}
          <section className="p-6 rounded-[16px] border border-subtle bg-surface space-y-6">
            <div>
              <h3 className="text-[18px] font-semibold text-primary">
                {isEn
                  ? 'Data Analysis, Visualization & Non-Fabrication Standard'
                  : 'Analisis Data Deterministik, Visualisasi & Standar Anti-Fabrikasi Data'}
              </h3>
              <p className="text-[13px] text-secondary mt-0.5">
                {report.appendix.dataCollectionGuidance}
              </p>
            </div>

            {report.charts.map((chart) => (
              <div
                key={chart.id}
                className="p-5 rounded-[14px] border border-subtle bg-surface-secondary space-y-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono-meta text-[11px] text-secondary">
                      {chart.dataOriginBadge}
                    </p>
                    <h4 className="text-[16px] font-semibold text-primary mt-0.5">
                      {chart.title}
                    </h4>
                    <p className="text-[12px] text-secondary">
                      {chart.subtitle}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {chart.bars.map((bar, bIdx) => (
                    <div key={bIdx} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-2 text-[13px]">
                        <span className="font-medium text-primary">
                          {bar.label}
                        </span>
                        <span className="font-mono-meta font-semibold text-primary">
                          {bar.formattedValue}
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-surface border border-subtle overflow-hidden">
                        <div
                          className="h-full bg-[var(--text-primary)] rounded-full transition-all"
                          style={{ width: `${bar.barWidthPct}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-secondary">
                        {bar.benchmarkOrNote}
                      </p>
                    </div>
                  ))}
                </div>

                {chart.dataCollectionTemplate && (
                  <div className="pt-4 border-t border-subtle space-y-3">
                    <p className="text-[13px] font-semibold text-primary">
                      {isEn
                        ? 'Structured Data Collection Template (For Recording Actual Field Data)'
                        : 'Templat Pengumpulan Data Aktual (Untuk Mencatat Bukti Riil 7–14 Hari)'}
                    </p>
                    <p className="text-[12px] text-secondary">
                      {chart.dataCollectionTemplate.explanationWhyNeeded}
                    </p>
                    <div className="overflow-x-auto rounded-[10px] border border-subtle bg-surface">
                      <table className="w-full text-left border-collapse text-[12px]">
                        <thead>
                          <tr className="bg-surface-secondary border-b border-subtle font-semibold text-primary">
                            {chart.dataCollectionTemplate.headers.map(
                              (h, i) => (
                                <th key={i} className="p-2.5">
                                  {h}
                                </th>
                              )
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]">
                          {chart.dataCollectionTemplate.sampleRows.map(
                            (r, rIdx) => (
                              <tr key={rIdx}>
                                {r.map((c, cIdx) => (
                                  <td
                                    key={cIdx}
                                    className="p-2.5 text-secondary"
                                  >
                                    {c}
                                  </td>
                                ))}
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </section>

          {/* 7. Strategic Recommendations Comparison Matrix & 11-Attribute Cards */}
          <section className="space-y-4">
            {renderTable(report.tables.recommendationPriorityTable)}
          </section>

          {/* 8. Implementation Roadmap, KPI Dashboard & Risk Mitigation Tables */}
          <section className="space-y-4">
            {renderTable(report.tables.implementationRoadmapTable)}
            {renderTable(report.tables.kpiDashboardTable)}
            {renderTable(report.tables.riskMitigationTable)}
          </section>

          {/* 9. Practical Business Deliverables Suite Selector (PDF, XLSX, DOCX, CSV) */}
          <section className="p-6 rounded-[16px] border border-[var(--text-primary)] bg-surface space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary">
                  {isEn
                    ? `DOMAIN DELIVERABLE SUITE · ${consultation.workTopic}`
                    : `PAKET DOKUMEN KERJA PRAKTIS · ${consultation.workTopic}`}
                </p>
                <h3 className="text-[18px] font-semibold text-primary mt-0.5">
                  {isEn
                    ? 'Select & Download Practical Business Deliverables'
                    : 'Pilih & Unduh Dokumen Kerja Pendukung Implementasi'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onDownloadActionPlan}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[13px] font-medium text-primary cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {isEn ? 'Action Plan (PDF)' : 'Rencana Tindakan (PDF)'}
                </span>
              </button>
            </div>

            {/* Deliverable Suite Tabs */}
            <div className="flex flex-wrap gap-2">
              {deliverableSuite.map((deliv, idx) => (
                <button
                  key={deliv.id}
                  type="button"
                  onClick={() => setSelectedDeliverableIdx(idx)}
                  className={`px-3.5 py-2 rounded-[10px] text-[13px] font-medium border transition-colors cursor-pointer ${
                    selectedDeliverableIdx === idx
                      ? 'btn-primary border-transparent'
                      : 'border-subtle bg-surface-secondary text-secondary hover:text-primary'
                  }`}
                >
                  {idx + 1}. {deliv.title}
                </button>
              ))}
            </div>

            {activeDeliverable && (
              <div className="p-4 sm:p-5 rounded-[14px] border border-subtle bg-surface-secondary space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-[16px] font-semibold text-primary">
                      {activeDeliverable.title}
                    </h4>
                    <p className="text-[13px] text-secondary">
                      {activeDeliverable.subtitle}
                    </p>
                    <p className="text-[12px] text-primary mt-1">
                      {activeDeliverable.reasonSuggested}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {(['PDF', 'XLSX', 'DOCX', 'CSV'] as DeliverableFormat[]).map(
                      (fmt) => (
                        <button
                          key={fmt}
                          type="button"
                          onClick={() =>
                            onDownloadDeliverable(fmt, activeDeliverable)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-[12px] font-mono-meta font-semibold text-primary cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>.{fmt}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
