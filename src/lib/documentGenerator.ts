import { jsPDF } from 'jspdf';
import {
  AppLanguage,
  Consultation,
  DeliverableFormat,
  GeneratedDocumentMeta,
  TailoredDeliverable,
} from '../types';
import { formatKnowledgeCitation } from './knowledgeBase';
import { buildTailoredDeliverable } from './consultationEngine';
import { canAccessGeneratedDocument } from './multiUserIsolation';
import {
  ConsultingChartSpec,
  ConsultingTableSpec,
  buildProfessionalConsultingReport,
} from './reportSynthesisEngine';

function sanitizeFileSlug(text: string): string {
  return (
    (text || 'Usaha_UMKM')
      .replace(/[^a-zA-Z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'Usaha_UMKM'
  );
}

function escapeXml(text: string): string {
  return (text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function triggerBrowserDownload(blob: Blob, fileName: string): void {
  if (
    typeof document === 'undefined' ||
    typeof URL === 'undefined' ||
    !URL.createObjectURL
  ) {
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Editorial Consulting PDF Builder (Section 8)
 * Provides a cover page, consistent heading hierarchy, multi-column vector tables
 * with page-break continuation, vector bar/funnel charts, callout boxes, source notes,
 * running headers, and page numbers.
 */
function createEditorialPdfHelper(
  title: string,
  subtitle: string,
  docRefCode = 'NV-ADVISORY-2026',
  confidentialityFooter = 'Noevia Business Advisory Deliverable · Dokumen Privat'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 16;
  const contentWidth = pageWidth - marginX * 2;
  const bottomLimit = pageHeight - 18;
  let y = 20;

  const drawRunningHeaderOnNewPage = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(120, 120, 120);
    doc.text(
      `NOEVIA BUSINESS ADVISORY · ${docRefCode}`,
      marginX,
      12
    );
    const shortTitle =
      title.length > 58 ? `${title.slice(0, 58)}...` : title;
    doc.text(shortTitle, pageWidth - marginX, 12, { align: 'right' });
    doc.setDrawColor(225, 225, 220);
    doc.setLineWidth(0.25);
    doc.line(marginX, 14.5, pageWidth - marginX, 14.5);
  };

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      doc.addPage();
      drawRunningHeaderOnNewPage();
      y = 21;
    }
  };

  // Editorial Cover Top Banner on Page 1
  doc.setFillColor(24, 24, 24);
  doc.rect(marginX, y - 6, contentWidth, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(247, 247, 245);
  doc.text('NOEVIA · EVIDENCE-BASED AI BUSINESS CONSULTANT', marginX + 3.5, y);
  doc.text(docRefCode, pageWidth - marginX - 3.5, y, { align: 'right' });
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16.5);
  doc.setTextColor(24, 24, 24);
  const titleLines = doc.splitTextToSize(title, contentWidth);
  doc.text(titleLines, marginX, y);
  y += titleLines.length * 6.8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(95, 95, 95);
  const subLines = doc.splitTextToSize(subtitle, contentWidth);
  doc.text(subLines, marginX, y);
  y += subLines.length * 4.8 + 3;

  doc.setDrawColor(24, 24, 24);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 6;

  const addSectionHeading = (headingText: string) => {
    ensureSpace(15);
    y += 3;
    doc.setFillColor(243, 243, 240);
    doc.rect(marginX, y - 4.2, contentWidth, 7, 'F');
    doc.setDrawColor(210, 210, 205);
    doc.setLineWidth(0.25);
    doc.line(marginX, y + 2.8, pageWidth - marginX, y + 2.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(24, 24, 24);
    doc.text(headingText, marginX + 2.5, y + 0.5);
    y += 7.5;
  };

  const addSubHeading = (subText: string) => {
    ensureSpace(10);
    y += 1.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);
    const lines = doc.splitTextToSize(subText, contentWidth);
    doc.text(lines, marginX, y);
    y += lines.length * 4.5 + 1.5;
  };

  const addParagraph = (text: string, isMuted = false) => {
    if (!text) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(
      isMuted ? 95 : 35,
      isMuted ? 95 : 35,
      isMuted ? 95 : 35
    );
    const lines = doc.splitTextToSize(text, contentWidth);
    ensureSpace(lines.length * 4.3 + 2.5);
    doc.text(lines, marginX, y);
    y += lines.length * 4.3 + 2;
  };

  const addCalloutBox = (boxTitle: string, bodyLines: string[]) => {
    const wrappedLines: string[] = [];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    for (const line of bodyLines) {
      const split = doc.splitTextToSize(line, contentWidth - 8);
      wrappedLines.push(...split);
    }
    const boxHeight = 8 + wrappedLines.length * 4.2 + 3;
    ensureSpace(boxHeight + 4);

    doc.setFillColor(248, 248, 246);
    doc.setDrawColor(195, 195, 190);
    doc.setLineWidth(0.35);
    doc.rect(marginX, y, contentWidth, boxHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(24, 24, 24);
    doc.text(boxTitle, marginX + 4, y + 5.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(45, 45, 45);
    doc.text(wrappedLines, marginX + 4, y + 10);
    y += boxHeight + 4;
  };

  const addBulletList = (items: string[]) => {
    if (!items || items.length === 0) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(35, 35, 35);
    for (const item of items) {
      const bulletLines = doc.splitTextToSize(
        `•  ${item}`,
        contentWidth - 4
      );
      ensureSpace(bulletLines.length * 4.2 + 1.8);
      doc.text(bulletLines, marginX + 2, y);
      y += bulletLines.length * 4.2 + 1.4;
    }
    y += 1.5;
  };

  const addKeyValueRow = (label: string, value: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    const valLines = doc.splitTextToSize(value || '-', contentWidth - 48);
    ensureSpace(Math.max(1, valLines.length) * 4.2 + 2);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 24);
    doc.text(`${label}:`, marginX, y);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(50, 50, 50);
    doc.text(valLines, marginX + 48, y);
    y += Math.max(1, valLines.length) * 4.2 + 1.4;
  };

  /**
   * Renders a real multi-column vector table with header shading, cell borders,
   * automatic text wrapping, and multi-page header continuation.
   */
  const addConsultingTable = (table: ConsultingTableSpec) => {
    if (!table.headers || table.headers.length === 0) return;
    ensureSpace(22);

    // Table Title & Subtitle
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(24, 24, 24);
    const tLines = doc.splitTextToSize(table.title, contentWidth);
    doc.text(tLines, marginX, y);
    y += tLines.length * 4.2;

    if (table.subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const sLines = doc.splitTextToSize(table.subtitle, contentWidth);
      doc.text(sLines, marginX, y);
      y += sLines.length * 3.8 + 1.5;
    }

    const colCount = table.headers.length;
    const rawRatios =
      table.columnWidthRatios &&
      table.columnWidthRatios.length === colCount
        ? table.columnWidthRatios
        : Array(colCount).fill(1 / colCount);
    const ratioSum = rawRatios.reduce((a, b) => a + b, 0) || 1;
    const colWidths = rawRatios.map((r) => (r / ratioSum) * contentWidth);

    const drawHeaderRow = () => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      const wrappedHeaders = table.headers.map((h, cIdx) =>
        doc.splitTextToSize(String(h || ''), colWidths[cIdx] - 3)
      );
      const maxHeaderLines = Math.max(
        1,
        ...wrappedHeaders.map((lines) => lines.length)
      );
      const headerHeight = maxHeaderLines * 3.6 + 3.2;

      ensureSpace(headerHeight + 8);
      doc.setFillColor(238, 238, 234);
      doc.setDrawColor(195, 195, 190);
      doc.setLineWidth(0.25);
      doc.rect(marginX, y, contentWidth, headerHeight, 'FD');

      let curX = marginX;
      for (let cIdx = 0; cIdx < colCount; cIdx++) {
        if (cIdx > 0) {
          doc.line(curX, y, curX, y + headerHeight);
        }
        doc.setTextColor(24, 24, 24);
        doc.text(wrappedHeaders[cIdx], curX + 1.5, y + 3.8);
        curX += colWidths[cIdx];
      }
      y += headerHeight;
    };

    drawHeaderRow();

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);

    for (let rIdx = 0; rIdx < table.rows.length; rIdx++) {
      const row = table.rows[rIdx];
      const wrappedCells = table.headers.map((_, cIdx) =>
        doc.splitTextToSize(
          String(row[cIdx] ?? '-'),
          colWidths[cIdx] - 3
        )
      );
      const maxLines = Math.max(
        1,
        ...wrappedCells.map((lines) => lines.length)
      );
      const rowHeight = maxLines * 3.6 + 3;

      if (y + rowHeight > bottomLimit) {
        doc.addPage();
        drawRunningHeaderOnNewPage();
        y = 21;
        drawHeaderRow();
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
      }

      if (rIdx % 2 === 1) {
        doc.setFillColor(250, 250, 248);
        doc.rect(marginX, y, contentWidth, rowHeight, 'F');
      }

      doc.setDrawColor(210, 210, 205);
      doc.setLineWidth(0.2);
      doc.rect(marginX, y, contentWidth, rowHeight, 'S');

      let curX = marginX;
      for (let cIdx = 0; cIdx < colCount; cIdx++) {
        if (cIdx > 0) {
          doc.line(curX, y, curX, y + rowHeight);
        }
        doc.setTextColor(40, 40, 40);
        doc.text(wrappedCells[cIdx], curX + 1.5, y + 3.7);
        curX += colWidths[cIdx];
      }
      y += rowHeight;
    }

    if (table.sourceNote) {
      ensureSpace(6);
      y += 3.5;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(105, 105, 105);
      const noteLines = doc.splitTextToSize(table.sourceNote, contentWidth);
      doc.text(noteLines, marginX, y);
      y += noteLines.length * 3.5 + 2.5;
    } else {
      y += 3.5;
    }
  };

  /**
   * Renders a vector horizontal bar chart / conceptual diagram in PDF
   * with explicit data-origin badge and non-fabricated data collection template when needed.
   */
  const addConsultingChart = (chart: ConsultingChartSpec) => {
    const estimatedChartHeight = 18 + chart.bars.length * 10 + 10;
    ensureSpace(estimatedChartHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.2);
    doc.setTextColor(24, 24, 24);
    doc.text(chart.title, marginX, y);
    y += 4.2;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(95, 95, 95);
    const subLines = doc.splitTextToSize(
      `[${chart.dataOriginBadge}] ${chart.subtitle}`,
      contentWidth
    );
    doc.text(subLines, marginX, y);
    y += subLines.length * 3.8 + 2;

    const boxHeight = chart.bars.length * 9.5 + 6;
    ensureSpace(boxHeight + 6);
    doc.setFillColor(249, 249, 247);
    doc.setDrawColor(205, 205, 200);
    doc.setLineWidth(0.25);
    doc.rect(marginX, y, contentWidth, boxHeight, 'FD');

    let barY = y + 4.5;
    const labelColWidth = 66;
    const maxBarWidth = contentWidth - labelColWidth - 46;

    for (const bar of chart.bars) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(30, 30, 30);
      const shortLabel =
        bar.label.length > 36 ? `${bar.label.slice(0, 36)}...` : bar.label;
      doc.text(shortLabel, marginX + 3, barY + 2.5);

      // Bar Track
      const trackX = marginX + labelColWidth;
      doc.setFillColor(232, 232, 228);
      doc.rect(trackX, barY - 0.5, maxBarWidth, 4.2, 'F');

      // Filled Bar
      const fillW = Math.max(
        4,
        Math.min(maxBarWidth, (bar.barWidthPct / 100) * maxBarWidth)
      );
      doc.setFillColor(45, 45, 45);
      doc.rect(trackX, barY - 0.5, fillW, 4.2, 'F');

      // Value Label
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(24, 24, 24);
      const shortVal =
        bar.formattedValue.length > 24
          ? bar.formattedValue.slice(0, 24)
          : bar.formattedValue;
      doc.text(shortVal, trackX + maxBarWidth + 2.5, barY + 2.5);

      barY += 9.2;
    }

    y += boxHeight + 3.5;

    if (chart.formulaNote) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 100, 100);
      const fLines = doc.splitTextToSize(
        `Rumus / Catatan Visualisasi: ${chart.formulaNote}`,
        contentWidth
      );
      ensureSpace(fLines.length * 3.6 + 2);
      doc.text(fLines, marginX, y);
      y += fLines.length * 3.6 + 2.5;
    }

    // If illustrative, also render the Structured Data Collection Template table
    if (chart.dataCollectionTemplate) {
      const tpl = chart.dataCollectionTemplate;
      addParagraph(tpl.explanationWhyNeeded, true);
      addConsultingTable({
        id: `${chart.id}-data-template`,
        tableNumber: 8,
        title: 'Templat Pengumpulan Data Aktual 7–14 Hari (Structured Data Collection Worksheet)',
        subtitle:
          'Isi tabel di bawah ini dengan angka riil harian/mingguan untuk menggantikan simulasi ilustratif',
        headers: tpl.headers,
        rows: tpl.sampleRows,
        sourceNote:
          'Catatan: Noevia tidak mengarang grafik histori penjualan jika data belum tersedia; gunakan templat ini untuk mencatat bukti lapangan.',
      });
    }
  };

  const finalizeFooters = () => {
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(215, 215, 210);
      doc.setLineWidth(0.25);
      doc.line(marginX, pageHeight - 13.5, pageWidth - marginX, pageHeight - 13.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(115, 115, 115);
      doc.text(confidentialityFooter, marginX, pageHeight - 9.2);
      doc.text(
        `Halaman ${p} dari ${totalPages}`,
        pageWidth - marginX,
        pageHeight - 9.2,
        { align: 'right' }
      );
    }
  };

  return {
    doc,
    marginX,
    contentWidth,
    getY: () => y,
    setY: (nextY: number) => {
      y = nextY;
    },
    ensureSpace,
    addSectionHeading,
    addSubHeading,
    addParagraph,
    addCalloutBox,
    addBulletList,
    addKeyValueRow,
    addConsultingTable,
    addConsultingChart,
    finalizeFooters,
  };
}

/**
 * 3.1 Generate Downloadable Professional Business Consulting Report (PDF)
 * Enforces context readiness, 9-point quality validation, owner-only privacy,
 * 6-part epistemic separation, 7 structured tables, and non-fabricated charts.
 */
export function downloadConsultationReportPdf(
  consultation: Consultation,
  actingUserId?: string | null,
  language: AppLanguage = 'id'
): GeneratedDocumentMeta | null {
  const result = consultation.result;
  if (!result) return null;

  const meta: GeneratedDocumentMeta = {
    id: `doc-report-${Date.now()}`,
    consultationId: consultation.id,
    ownerId: consultation.userId || null,
    kind: 'consultation-report',
    title: `Laporan Konsultasi Bisnis (${consultation.businessName || `Usaha ${consultation.businessCategory}`})`,
    fileName: `Noevia_Laporan_Konsultasi_${sanitizeFileSlug(
      consultation.businessName || `Usaha_${consultation.businessCategory}`
    )}.pdf`,
    format: 'PDF',
    generatedAt: new Date().toISOString(),
  };

  if (
    actingUserId !== undefined &&
    !canAccessGeneratedDocument(meta, consultation, actingUserId)
  ) {
    return null;
  }

  const report = buildProfessionalConsultingReport(
    consultation,
    language,
    actingUserId
  );
  if (!report || !report.readiness.isReadyForFinalReport) {
    return null;
  }

  const helper = createEditorialPdfHelper(
    report.coverPage.reportTitle,
    `${report.coverPage.reportSubtitle} · Tanggal: ${report.coverPage.preparedDate}`,
    report.coverPage.documentReferenceCode,
    report.confidentialityNotice
  );

  // Cover Metadata & Executive Summary Callout Box
  helper.addCalloutBox(
    language === 'en'
      ? 'EXECUTIVE SUMMARY & ADVISORY METADATA'
      : 'RINGKASAN EKSEKUTIF & IDENTITAS DOKUMEN KONSULTASI',
    [
      `Usaha / Klien: ${report.coverPage.businessName} (${report.coverPage.businessCategoryAndStage})  |  Domain Fokus: ${report.coverPage.primaryDomain}`,
      `Kode Dokumen: ${report.coverPage.documentReferenceCode}  |  Status Kepemilikan: ${report.coverPage.ownershipBadge}  |  Validasi Kualitas: ${report.qualityValidation.passedCount}/${report.qualityValidation.totalChecks} Lulus`,
      `Masalah Utama: ${report.executiveSummary.headline}`,
      ...report.executiveSummary.keyTakeaways,
    ]
  );

  // 1. Executive Summary
  helper.addSectionHeading(
    language === 'en'
      ? '1. Executive Summary'
      : '1. Ringkasan Eksekutif (Executive Summary)'
  );
  helper.addParagraph(report.executiveSummary.situationParagraph);
  helper.addParagraph(report.executiveSummary.coreDiagnosisParagraph);
  helper.addParagraph(report.executiveSummary.strategicDirectionParagraph);

  // 2. Business Overview & Context Table
  helper.addSectionHeading(
    language === 'en'
      ? '2. Business Overview & 10-Dimension Context Profile'
      : '2. Gambaran Umum Usaha & Profil 10 Dimensi Konteks'
  );
  helper.addParagraph(report.currentBusinessSituationNarrative);
  helper.addConsultingTable(report.tables.businessOverviewTable);

  // 3. Problem Identification & Evidence Epistemic Matrix
  helper.addSectionHeading(
    language === 'en'
      ? '3. Problem Identification & Evidence-Based Separation (Facts vs. Assumptions)'
      : '3. Identifikasi Masalah & Pemisahan Bukti (Fakta, Gejala, Data, Asumsi & Informasi Kurang)'
  );
  helper.addKeyValueRow(
    language === 'en' ? 'Main Business Problem' : 'Permasalahan Utama',
    report.problemIdentification.mainProblemStatement
  );
  helper.addKeyValueRow(
    language === 'en' ? 'Desired Business Outcome' : 'Target Hasil Bisnis',
    report.problemIdentification.desiredBusinessOutcome
  );
  helper.addConsultingTable(report.tables.epistemicEvidenceTable);

  // 4. Business Diagnosis & Root Cause Analysis Matrix
  helper.addSectionHeading(
    language === 'en'
      ? '4. Business Diagnosis & Root Cause Analysis Matrix'
      : '4. Diagnosis Bisnis & Matriks Analisis Akar Masalah'
  );
  helper.addParagraph(report.businessDiagnosisNarrative);
  helper.addConsultingTable(report.tables.rootCauseMatrixTable);

  // 5. Data Analysis, Visualization & Non-Fabricated Data Collection Template
  helper.addSectionHeading(
    language === 'en'
      ? '5. Deterministic Data Analysis, Visualization & Data Collection Template'
      : '5. Analisis Data Deterministik, Visualisasi & Templat Pengumpulan Data'
  );
  for (const chart of report.charts) {
    helper.addConsultingChart(chart);
  }

  // 6. Strategic Recommendations & Priority Matrix
  helper.addSectionHeading(
    language === 'en'
      ? '6. Strategic Recommendations & Priority Comparison Matrix'
      : '6. Rekomendasi Solusi Strategis & Matriks Perbandingan Prioritas'
  );
  helper.addConsultingTable(report.tables.recommendationPriorityTable);

  report.enrichedRecommendations.forEach((rec) => {
    helper.addSubHeading(
      `6.${rec.rank}. ${rec.title} [Prioritas: ${rec.priority} · Waktu: ${rec.timeline}]`
    );
    helper.addKeyValueRow(
      language === 'en' ? 'Identified Problem' : 'Masalah yang Dijawab',
      rec.identifiedProblem
    );
    helper.addKeyValueRow(
      language === 'en' ? 'Supporting Evidence' : 'Bukti Pendukung',
      rec.supportingEvidence
    );
    helper.addKeyValueRow(
      language === 'en' ? 'Why It Fits Your Business' : 'Alasan Relevansi Kontekstual',
      rec.whyRelevant
    );
    helper.addParagraph(rec.recommendedSolution);
    helper.addBulletList(rec.implementationSteps);
    helper.addKeyValueRow(
      language === 'en' ? 'Resources & Cost' : 'Sumber Daya & Estimasi Biaya',
      `${rec.requiredResources} (${rec.estimatedCost})`
    );
    helper.addKeyValueRow(
      language === 'en' ? 'Expected Outcome & KPI' : 'Target Hasil & Indikator Sukses',
      `${rec.expectedOutcome} — KPI: ${rec.successIndicators}`
    );
    helper.addKeyValueRow(
      language === 'en' ? 'Risks & Limitations' : 'Risiko & Batasan Pelaksanaan',
      rec.risksAndLimitations
    );
  });

  // 7. Implementation Roadmap
  helper.addSectionHeading(
    language === 'en'
      ? '7. Practical Implementation Roadmap & Schedule'
      : '7. Peta Jalan Implementasi & Jadwal Tindakan Praktis'
  );
  helper.addConsultingTable(report.tables.implementationRoadmapTable);

  // 8. KPI Dashboard & Success Measurement
  helper.addSectionHeading(
    language === 'en'
      ? '8. KPI Dashboard, Formulas & Implementation Progress'
      : '8. Dashboard KPI, Rumus Pengukuran & Evaluasi Implementasi'
  );
  helper.addConsultingTable(report.tables.kpiDashboardTable);

  // 9. Operational Risks & Mitigation Matrix
  helper.addSectionHeading(
    language === 'en'
      ? '9. Risks and Mitigation Matrix'
      : '9. Matriks Risiko Pelaksanaan & Langkah Mitigasi'
  );
  helper.addConsultingTable(report.tables.riskMitigationTable);

  // 10. Knowledge Base References
  helper.addSectionHeading(
    language === 'en'
      ? '10. Internal Knowledge Base References'
      : '10. Referensi Knowledge Base Internal (Knowledge Base References)'
  );
  if (report.knowledgeReferences.length === 0) {
    helper.addParagraph(
      'Tidak ada dokumen internal spesifik yang dikutip; analisis disusun dari konteks usaha yang disampaikan.'
    );
  } else {
    helper.addBulletList(
      report.knowledgeReferences.map(
        (ref) => `${formatKnowledgeCitation(ref)} — ${ref.relevantContent}`
      )
    );
  }

  // 11. External References & Video Tutorials (only when present)
  if (
    report.externalReferences.length > 0 ||
    report.videoResources.length > 0
  ) {
    helper.addSectionHeading(
      language === 'en'
        ? '11. Official External References & Verified Learning Videos'
        : '11. Referensi Eksternal Resmi & Panduan Video Terverifikasi'
    );
    if (report.externalReferences.length > 0) {
      helper.addBulletList(
        report.externalReferences.map(
          (ext) =>
            `${ext.title} (${ext.publisher}, ${ext.updatedAt || '2026'}) — ${ext.url} | Relevansi: ${ext.relevanceReason}`
        )
      );
    }
    if (report.videoResources.length > 0) {
      helper.addBulletList(
        report.videoResources.map(
          (vid) =>
            `[Video] ${vid.title} (${vid.channelOrSource} · ${vid.durationLabel}) — ${vid.url} | Segmen: ${(vid.verifiedTimestamps || []).map((t) => `${t.time} ${t.topic}`).join('; ')}`
        )
      );
    }
  }

  // 12. Appendix & Methodology Notes
  helper.addSectionHeading(
    language === 'en'
      ? '12. Appendix: Methodology Notes & Deterministic Formulas'
      : '12. Lampiran: Catatan Metodologi & Rumus Perhitungan Deterministik'
  );
  helper.addParagraph(report.appendix.dataCollectionGuidance, true);
  helper.addBulletList(report.appendix.methodologyNotes);

  helper.finalizeFooters();
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    helper.doc.save(meta.fileName);
  }

  return meta;
}

/**
 * 3.3 Generate Downloadable Structured Action Plan (PDF)
 */
export function downloadActionPlanPdf(
  consultation: Consultation,
  actingUserId?: string | null,
  language: AppLanguage = 'id'
): GeneratedDocumentMeta | null {
  const result = consultation.result;
  if (!result) return null;

  const businessLabel =
    consultation.businessName || `Usaha ${consultation.businessCategory}`;
  const fileName = `Noevia_Action_Plan_${sanitizeFileSlug(businessLabel)}.pdf`;

  const meta: GeneratedDocumentMeta = {
    id: `doc-actionplan-${Date.now()}`,
    consultationId: consultation.id,
    ownerId: consultation.userId || null,
    kind: 'action-plan',
    title: `Rencana Tindakan 7 Hari (${businessLabel})`,
    fileName,
    format: 'PDF',
    generatedAt: new Date().toISOString(),
  };

  if (
    actingUserId !== undefined &&
    !canAccessGeneratedDocument(meta, consultation, actingUserId)
  ) {
    return null;
  }

  const report = buildProfessionalConsultingReport(
    consultation,
    language,
    actingUserId
  );
  if (!report) return null;

  const helper = createEditorialPdfHelper(
    `Rencana Tindakan Praktis & KPI (Action Plan): ${businessLabel}`,
    `Jadwal Eksekusi Harian Terukur, Sumber Daya, & Mitigasi Risiko · Tanggal: ${report.coverPage.preparedDate}`,
    report.coverPage.documentReferenceCode,
    report.confidentialityNotice
  );

  helper.addSectionHeading('1. Fokus Masalah & Target Hasil');
  helper.addKeyValueRow('Masalah Utama', result.mainProblem);
  helper.addKeyValueRow(
    'Target Hasil',
    consultation.businessContext.businessGoals
  );

  helper.addSectionHeading('2. Tabel Jadwal Eksekusi Rencana Tindakan 7 Hari');
  helper.addConsultingTable(report.tables.implementationRoadmapTable);

  helper.addSectionHeading('3. Dashboard KPI & Evaluasi Keberhasilan');
  helper.addConsultingTable(report.tables.kpiDashboardTable);

  helper.addSectionHeading('4. Matriks Antisipasi Risiko Pelaksanaan');
  helper.addConsultingTable(report.tables.riskMitigationTable);

  helper.finalizeFooters();
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    helper.doc.save(fileName);
  }

  return meta;
}

/**
 * 3.2 Generate Downloadable Tailored Business Document (PDF, CSV, XLSX, or DOCX)
 * Supports any deliverable from the domain deliverable catalog.
 */
export function downloadTailoredBusinessDocument(
  consultation: Consultation,
  format: DeliverableFormat = 'PDF',
  actingUserId?: string | null,
  customDeliverable?: TailoredDeliverable
): GeneratedDocumentMeta | null {
  const result = consultation.result;
  if (!result) return null;

  const deliverable =
    customDeliverable ||
    result.tailoredDeliverable ||
    buildTailoredDeliverable(consultation.workTopic, consultation);
  const businessLabel =
    consultation.businessName || `Usaha ${consultation.businessCategory}`;

  const extMap: Record<DeliverableFormat, string> = {
    PDF: 'pdf',
    CSV: 'csv',
    XLSX: 'xlsx',
    DOCX: 'docx',
  };

  const fileName = `Noevia_${sanitizeFileSlug(deliverable.title)}_${sanitizeFileSlug(businessLabel)}.${extMap[format]}`;

  const meta: GeneratedDocumentMeta = {
    id: `doc-tailored-${format.toLowerCase()}-${Date.now()}`,
    consultationId: consultation.id,
    ownerId: consultation.userId || null,
    kind: 'tailored-document',
    title: `${deliverable.title} (${format})`,
    fileName,
    format,
    generatedAt: new Date().toISOString(),
  };

  if (
    actingUserId !== undefined &&
    !canAccessGeneratedDocument(meta, consultation, actingUserId)
  ) {
    return null;
  }

  // Format 1: CSV
  if (format === 'CSV' && deliverable.tableHeaders && deliverable.tableRows) {
    const csvRows = [
      deliverable.tableHeaders
        .map((h) => `"${h.replace(/"/g, '""')}"`)
        .join(','),
      ...deliverable.tableRows.map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')
      ),
    ];
    const blob = new Blob([csvRows.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    triggerBrowserDownload(blob, fileName);
    return meta;
  }

  // Format 2: XLSX (Excel SpreadsheetML Workbook for Calculators, Checklists, and Trackers)
  if (format === 'XLSX') {
    const headers = deliverable.tableHeaders || ['Komponen', 'Keterangan'];
    const rows = deliverable.tableRows || [];
    const det = result.deterministicAnalysis;

    const xmlRows: string[] = [];
    xmlRows.push(
      `<Row><Cell><Data ss:Type="String">NOEVIA BUSINESS DELIVERABLE — ${escapeXml(deliverable.title)} (${escapeXml(businessLabel)})</Data></Cell></Row>`
    );
    xmlRows.push(
      `<Row><Cell><Data ss:Type="String">${escapeXml(deliverable.subtitle)}</Data></Cell></Row>`
    );
    xmlRows.push(
      `<Row><Cell><Data ss:Type="String">Alasan Penyusunan: ${escapeXml(deliverable.reasonSuggested)}</Data></Cell></Row>`
    );
    xmlRows.push('<Row></Row>');

    // Table Headers
    xmlRows.push(
      `<Row>${headers
        .map(
          (h) => `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`
        )
        .join('')}</Row>`
    );
    // Table Data Rows
    for (const row of rows) {
      xmlRows.push(
        `<Row>${row
          .map(
            (c) => `<Cell><Data ss:Type="String">${escapeXml(c)}</Data></Cell>`
          )
          .join('')}</Row>`
      );
    }

    // Include Deterministic Calculator Inputs & Outputs if available
    if (det) {
      xmlRows.push('<Row></Row>');
      xmlRows.push(
        `<Row><Cell><Data ss:Type="String">${escapeXml(det.titleId)} (${det.isIllustrative ? 'Simulasi Ilustratif Terukur' : 'Data Aktual Pengguna'})</Data></Cell></Row>`
      );
      xmlRows.push(
        `<Row><Cell><Data ss:Type="String">Parameter Input</Data></Cell><Cell><Data ss:Type="String">Nilai</Data></Cell></Row>`
      );
      for (const [inpKey, inpVal] of Object.entries(det.inputs)) {
        xmlRows.push(
          `<Row><Cell><Data ss:Type="String">${escapeXml(inpKey)}</Data></Cell><Cell><Data ss:Type="Number">${inpVal}</Data></Cell></Row>`
        );
      }
      xmlRows.push('<Row></Row>');
      xmlRows.push(
        `<Row><Cell><Data ss:Type="String">Hasil Perhitungan</Data></Cell><Cell><Data ss:Type="String">Nilai Terhitung</Data></Cell><Cell><Data ss:Type="String">Rumus</Data></Cell><Cell><Data ss:Type="String">Interpretasi</Data></Cell></Row>`
      );
      for (const out of det.computedMetrics) {
        xmlRows.push(
          `<Row><Cell><Data ss:Type="String">${escapeXml(out.labelId)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(out.valueFormatted)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(out.formula)}</Data></Cell><Cell><Data ss:Type="String">${escapeXml(out.explanationId)}</Data></Cell></Row>`
        );
      }
    }

    const workbookXml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Lembar Kerja Noevia">
  <Table>
   ${xmlRows.join('\n   ')}
  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([workbookXml], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8;',
    });
    triggerBrowserDownload(blob, fileName);
    return meta;
  }

  // Format 3: DOCX (Editable Word Document for SOPs, Marketing Plans, Retention Plans, and Worksheets)
  if (format === 'DOCX') {
    const sectionsHtml = deliverable.sections
      .map(
        (sec) => `
        <h2 style="font-size:13pt;color:#181818;margin-top:14pt;margin-bottom:6pt;border-bottom:1px solid #d6d6d2;padding-bottom:3pt;">${escapeXml(sec.heading)}</h2>
        <ul>
          ${sec.items.map((it) => `<li style="margin-bottom:4pt;color:#262626;">${escapeXml(it)}</li>`).join('')}
        </ul>`
      )
      .join('\n');

    const tableHtml =
      deliverable.tableHeaders && deliverable.tableRows
        ? `
        <h2 style="font-size:13pt;color:#181818;margin-top:16pt;margin-bottom:8pt;">Tabel Kerja Terstruktur (Editable Worksheet Table)</h2>
        <table border="1" cellspacing="0" cellpadding="6" style="border-collapse:collapse;width:100%;font-size:9.5pt;border-color:#c8c8c2;">
          <thead>
            <tr style="background-color:#f3f3f1;font-weight:bold;">
              ${deliverable.tableHeaders.map((h) => `<th align="left">${escapeXml(h)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${deliverable.tableRows
              .map(
                (r) =>
                  `<tr>${r.map((c) => `<td>${escapeXml(c)}</td>`).join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>`
        : '';

    const docHtml = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8" />
<title>${escapeXml(deliverable.title)}</title>
</head>
<body style="font-family:Calibri,Arial,sans-serif;font-size:10.5pt;color:#181818;line-height:1.5;">
  <div style="background-color:#181818;color:#f7f7f5;padding:8pt 12pt;font-size:8.5pt;font-weight:bold;letter-spacing:0.8px;">
    NOEVIA · EVIDENCE-BASED AI BUSINESS CONSULTANT · DOKUMEN KERJA PRIVAT
  </div>
  <h1 style="font-size:17pt;margin-top:12pt;margin-bottom:4pt;">${escapeXml(deliverable.title)}</h1>
  <p style="font-size:10.5pt;color:#555555;margin-top:0;">${escapeXml(deliverable.subtitle)}</p>
  <hr style="border:0;border-top:1px solid #181818;margin:10pt 0;" />
  <p><strong> Konteks &amp; Alasan Penyusunan:</strong> ${escapeXml(deliverable.reasonSuggested)}</p>
  ${sectionsHtml}
  ${tableHtml}
  <hr style="border:0;border-top:1px solid #d6d6d2;margin-top:20pt;" />
  <p style="font-size:8.5pt;color:#777777;">Disusun oleh Noevia berdasarkan konteks sesi konsultasi ${escapeXml(businessLabel)}.</p>
</body>
</html>`;

    const blob = new Blob([docHtml], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document;charset=utf-8;',
    });
    triggerBrowserDownload(blob, fileName);
    return meta;
  }

  // Format 4: PDF (Default — now uses real multi-column vector tables)
  const helper = createEditorialPdfHelper(
    deliverable.title,
    `${deliverable.subtitle} · Disusun oleh Noevia untuk ${businessLabel}`
  );

  helper.addCalloutBox(
    'KONTEKS & TUJUAN DOKUMEN KERJA BISNIS',
    [
      `Usaha: ${businessLabel} (${consultation.businessCategory} · ${consultation.businessStage})`,
      `Alasan Penyusunan: ${deliverable.reasonSuggested}`,
    ]
  );

  for (const sec of deliverable.sections) {
    helper.addSectionHeading(sec.heading);
    helper.addBulletList(sec.items);
  }

  if (deliverable.tableHeaders && deliverable.tableRows) {
    helper.addSectionHeading('Lembar Kerja Terstruktur (Structured Action Worksheet)');
    helper.addConsultingTable({
      id: `tbl-${deliverable.id}`,
      tableNumber: 1,
      title: `Tabel Kerja — ${deliverable.title}`,
      subtitle: deliverable.subtitle,
      headers: deliverable.tableHeaders,
      rows: deliverable.tableRows,
      sourceNote: `Sumber: Dokumen kerja kontekstual Noevia untuk ${businessLabel}.`,
    });
  }

  helper.finalizeFooters();
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    helper.doc.save(fileName);
  }

  return meta;
}
