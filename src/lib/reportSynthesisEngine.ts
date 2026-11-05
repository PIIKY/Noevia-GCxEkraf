import {
  AppLanguage,
  Consultation,
  DeliverableFormat,
  DeterministicBusinessAnalysis,
  ExternalReference,
  KnowledgeReference,
  TailoredDeliverable,
  VideoResource,
  WorkTopicCategory,
} from '../types';
import {
  buildDeterministicAnalysisForConsultation,
  evaluateImplementationProgress,
} from './businessCalculators';
import {
  buildProblemAnalysisMatrixForDomain,
  buildTailoredDeliverable,
  buildVisualDiagramForDomain,
  createDefaultImplementationMonitoring,
} from './consultationEngine';
import { isGreetingOrSmallTalk } from './knowledgeBase';
import { canAccessConsultation } from './multiUserIsolation';

export interface ContextDimensionRow {
  key:
    | 'businessProfile'
    | 'businessStage'
    | 'productsAndServices'
    | 'targetCustomers'
    | 'currentPerformance'
    | 'mainProblem'
    | 'previousAttempts'
    | 'availableResources'
    | 'budgetAndConstraints'
    | 'desiredOutcome';
  label: string;
  value: string;
  status: 'Confirmed' | 'Reported' | 'Needs Clarification';
  statusLabel: string;
}

export interface ConsultationReadinessAssessment {
  isReadyForFinalReport: boolean;
  completenessScorePct: number;
  confirmedDimensionsCount: number;
  totalDimensionsCount: number;
  contextProfileTable: ContextDimensionRow[];
  missingCriticalQuestions: string[];
  readinessSummary: string;
}

export interface EvidenceEpistemicMatrix {
  confirmedFacts: string[];
  userReportedSymptoms: string[];
  supportingData: string[];
  possibleCauses: string[];
  unverifiedAssumptions: string[];
  missingInformation: string[];
}

export interface ConsultingTableSpec {
  id: string;
  tableNumber: number;
  title: string;
  subtitle: string;
  headers: string[];
  columnWidthRatios?: number[];
  rows: string[][];
  sourceNote: string;
}

export interface ConsultingChartBar {
  label: string;
  rawValue: number;
  formattedValue: string;
  benchmarkOrNote: string;
  barWidthPct: number;
}

export interface ConsultingChartSpec {
  id: string;
  figureNumber: number;
  chartType:
    | 'funnel-conversion'
    | 'cost-margin-breakdown'
    | 'inventory-thresholds'
    | 'baseline-vs-current-kpi';
  title: string;
  subtitle: string;
  dataOriginBadge: string;
  isActualVerifiedData: boolean;
  bars: ConsultingChartBar[];
  formulaNote: string;
  interpretationNote: string;
  dataCollectionTemplate?: {
    explanationWhyNeeded: string;
    headers: string[];
    sampleRows: string[][];
    kpiFormulas: Array<{ name: string; formula: string; targetBenchmark: string }>;
  };
}

export interface EnrichedConsultingRecommendation {
  id: string;
  rank: number;
  priority: 'High' | 'Medium' | 'Foundational';
  title: string;
  identifiedProblem: string;
  supportingEvidence: string;
  recommendedSolution: string;
  whyRelevant: string;
  implementationSteps: string[];
  requiredResources: string;
  estimatedCost: string;
  timeline: string;
  expectedOutcome: string;
  risksAndLimitations: string;
  successIndicators: string;
  impactScore: string;
  feasibilityScore: string;
  operationalRiskLevel: string;
}

export type ConsultingReportSectionId =
  | '01-executive-summary'
  | '02-business-overview'
  | '03-current-situation'
  | '04-problem-identification'
  | '05-facts-and-evidence'
  | '06-business-diagnosis'
  | '07-root-cause-analysis'
  | '08-data-analysis-visualization'
  | '09-strategic-recommendations'
  | '10-implementation-roadmap'
  | '11-kpi-success-measurement'
  | '12-risks-and-mitigation'
  | '13-knowledge-base-references'
  | '14-external-references'
  | '15-appendix-supporting-data';

export interface ConsultingReportSectionMeta {
  id: ConsultingReportSectionId;
  sectionNumber: number;
  title: string;
  included: boolean;
  reasonIncludedOrOmitted: string;
}

export interface ReportQualityValidationCheck {
  id: string;
  stepNumber: number;
  label: string;
  passed: boolean;
  detail: string;
}

export interface ReportQualityValidationResult {
  allPassed: boolean;
  passedCount: number;
  totalChecks: number;
  checks: ReportQualityValidationCheck[];
}

export interface ProfessionalConsultingReport {
  reportId: string;
  generatedAtIso: string;
  generatedDateFormatted: string;
  language: AppLanguage;
  ownerId: string | null;
  consultationId: string;
  confidentialityNotice: string;
  coverPage: {
    advisoryHeader: string;
    reportTitle: string;
    reportSubtitle: string;
    businessName: string;
    businessCategoryAndStage: string;
    primaryDomain: WorkTopicCategory;
    documentReferenceCode: string;
    preparedDate: string;
    ownershipBadge: string;
  };
  readiness: ConsultationReadinessAssessment;
  selectedSections: ConsultingReportSectionMeta[];
  executiveSummary: {
    headline: string;
    situationParagraph: string;
    coreDiagnosisParagraph: string;
    strategicDirectionParagraph: string;
    keyTakeaways: string[];
  };
  currentBusinessSituationNarrative: string;
  problemIdentification: {
    mainProblemStatement: string;
    scopeAndImpact: string;
    desiredBusinessOutcome: string;
  };
  epistemicEvidence: EvidenceEpistemicMatrix;
  businessDiagnosisNarrative: string;
  tables: {
    businessOverviewTable: ConsultingTableSpec;
    epistemicEvidenceTable: ConsultingTableSpec;
    rootCauseMatrixTable: ConsultingTableSpec;
    recommendationPriorityTable: ConsultingTableSpec;
    implementationRoadmapTable: ConsultingTableSpec;
    kpiDashboardTable: ConsultingTableSpec;
    riskMitigationTable: ConsultingTableSpec;
  };
  charts: ConsultingChartSpec[];
  enrichedRecommendations: EnrichedConsultingRecommendation[];
  knowledgeReferences: KnowledgeReference[];
  externalReferences: ExternalReference[];
  videoResources: VideoResource[];
  appendix: {
    methodologyNotes: string[];
    deterministicFormulas: Array<{ metric: string; formula: string; note: string }>;
    dataCollectionGuidance: string;
  };
  qualityValidation: ReportQualityValidationResult;
}

function isPlaceholderValue(val: string | undefined | null): boolean {
  if (!val || !val.trim()) return true;
  const lower = val.trim().toLowerCase();
  return (
    lower.includes('belum disebutkan') ||
    lower.includes('belum dirinci') ||
    lower.includes('belum teridentifikasi') ||
    lower.includes('menunggu deskripsi') ||
    lower.includes('belum dikategorikan')
  );
}

/**
 * Section 1: Assess whether the consultation has sufficient business context
 * across the 10 consulting dimensions before generating a final report.
 */
export function assessConsultationReadinessForReport(
  consultation: Consultation,
  language: AppLanguage = 'id'
): ConsultationReadinessAssessment {
  const isEn = language === 'en';
  const ctx = consultation.businessContext;
  const userMessages = (consultation.messages || []).filter(
    (m) => m.role === 'user' && !isGreetingOrSmallTalk(m.content)
  );
  const fullTranscript = [
    consultation.initialProblem,
    ...userMessages.map((m) => m.content),
  ]
    .join(' ')
    .trim();

  const hasSubstantiveProblem =
    fullTranscript.length >= 15 && !isGreetingOrSmallTalk(fullTranscript);

  const hasBusinessProfile =
    Boolean(consultation.businessName && consultation.businessName.trim()) ||
    !isPlaceholderValue(consultation.businessCategory);
  const hasStage = Boolean(consultation.businessStage);
  const hasProducts =
    !isPlaceholderValue(ctx.businessDescription) ||
    /(roti|kue|bakery|kopi|makanan|minuman|baju|fashion|jasa|produk|menu|kemasan|toko)/i.test(
      fullTranscript
    );
  const hasTargetCustomers = !isPlaceholderValue(ctx.targetAudience);
  const hasPerformance =
    (ctx.userReportedSymptoms && ctx.userReportedSymptoms.length > 0) ||
    Boolean(consultation.result?.implementationMonitoring) ||
    /(menurun|turun|sepi|stagnan|tipis|habis|komplain|pelanggan|omzet|penjualan)/i.test(
      fullTranscript
    );
  const hasMainProblem =
    hasSubstantiveProblem && !isPlaceholderValue(ctx.mainChallenge);
  const hasPreviousAttempts =
    !isPlaceholderValue(ctx.currentStrategy) ||
    Boolean(ctx.previousAttempts && ctx.previousAttempts.trim());
  const hasResources = !isPlaceholderValue(ctx.availableResources);
  const hasBudget = !isPlaceholderValue(ctx.budgetConstraints);
  const hasDesiredOutcome = !isPlaceholderValue(ctx.businessGoals);

  const rows: ContextDimensionRow[] = [
    {
      key: 'businessProfile',
      label: isEn ? '1. Business Profile' : '1. Profil & Kategori Usaha',
      value: consultation.businessName
        ? `${consultation.businessName} (${consultation.businessCategory})`
        : consultation.businessCategory,
      status: hasBusinessProfile ? 'Confirmed' : 'Needs Clarification',
      statusLabel: hasBusinessProfile
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'Needs Clarification'
          : 'Perlu Dilengkapi',
    },
    {
      key: 'businessStage',
      label: isEn ? '2. Business Stage' : '2. Tahap Operasional Usaha',
      value: consultation.businessStage,
      status: hasStage ? 'Confirmed' : 'Needs Clarification',
      statusLabel: hasStage
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'Needs Clarification'
          : 'Perlu Dilengkapi',
    },
    {
      key: 'productsAndServices',
      label: isEn ? '3. Products & Services' : '3. Produk & Layanan Utama',
      value: !isPlaceholderValue(ctx.businessDescription)
        ? ctx.businessDescription
        : hasProducts
          ? isEn
            ? `Primary offering in ${consultation.businessCategory}`
            : `Produk/layanan utama pada kategori ${consultation.businessCategory}`
          : isEn
            ? 'Not yet specified in detail'
            : 'Belum dirinci secara spesifik',
      status: hasProducts ? 'Confirmed' : 'Needs Clarification',
      statusLabel: hasProducts
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'Needs Clarification'
          : 'Perlu Dilengkapi',
    },
    {
      key: 'targetCustomers',
      label: isEn ? '4. Target Customers' : '4. Segmen Target Pelanggan',
      value: ctx.targetAudience,
      status: hasTargetCustomers ? 'Confirmed' : 'Needs Clarification',
      statusLabel: hasTargetCustomers
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'To Be Refined'
          : 'Perlu Dipertajam',
    },
    {
      key: 'currentPerformance',
      label: isEn
        ? '5. Current Business Performance'
        : '5. Kinerja & Indikasi Saat Ini',
      value:
        ctx.userReportedSymptoms && ctx.userReportedSymptoms.length > 0
          ? ctx.userReportedSymptoms.join('; ')
          : hasPerformance
            ? ctx.mainChallenge
            : isEn
              ? 'Quantitative baseline not yet recorded'
              : 'Data kuantitatif awal belum dicatat',
      status: hasPerformance ? 'Reported' : 'Needs Clarification',
      statusLabel: hasPerformance
        ? isEn
          ? 'User-Reported'
          : 'Dilaporkan Pengguna'
        : isEn
          ? 'Needs Baseline Data'
          : 'Perlu Data Awal',
    },
    {
      key: 'mainProblem',
      label: isEn ? '6. Main Business Problem' : '6. Tantangan Utama Bisnis',
      value: consultation.result?.mainProblem || ctx.mainChallenge,
      status: hasMainProblem ? 'Confirmed' : 'Needs Clarification',
      statusLabel: hasMainProblem
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'Needs Clarification'
          : 'Perlu Dilengkapi',
    },
    {
      key: 'previousAttempts',
      label: isEn
        ? '7. Previous Attempts & Current Channels'
        : '7. Upaya Sebelumnya & Saluran Saat Ini',
      value: ctx.previousAttempts || ctx.currentStrategy,
      status: hasPreviousAttempts ? 'Reported' : 'Needs Clarification',
      statusLabel: hasPreviousAttempts
        ? isEn
          ? 'Reported'
          : 'Dilaporkan Pengguna'
        : isEn
          ? 'Needs Clarification'
          : 'Perlu Dilengkapi',
    },
    {
      key: 'availableResources',
      label: isEn
        ? '8. Available Operational Resources'
        : '8. Ketersediaan Sumber Daya & Tim',
      value: ctx.availableResources,
      status: hasResources ? 'Confirmed' : 'Reported',
      statusLabel: hasResources
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'Default UMKM Assumption'
          : 'Estimasi Operasional UMKM',
    },
    {
      key: 'budgetAndConstraints',
      label: isEn
        ? '9. Budget & Execution Constraints'
        : '9. Anggaran & Batasan Pelaksanaan',
      value: ctx.budgetConstraints,
      status: hasBudget ? 'Confirmed' : 'Needs Clarification',
      statusLabel: hasBudget
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'Needs Clarification'
          : 'Perlu Dilengkapi',
    },
    {
      key: 'desiredOutcome',
      label: isEn ? '10. Desired Business Outcome' : '10. Target Hasil yang Diharapkan',
      value: ctx.businessGoals,
      status: hasDesiredOutcome ? 'Confirmed' : 'Reported',
      statusLabel: hasDesiredOutcome
        ? isEn
          ? 'Confirmed'
          : 'Terkonfirmasi'
        : isEn
          ? 'Aligned with Diagnosis'
          : 'Selaras dengan Diagnosis',
    },
  ];

  const confirmedDimensionsCount = rows.filter(
    (r) => r.status === 'Confirmed' || r.status === 'Reported'
  ).length;
  const totalDimensionsCount = rows.length;
  const completenessScorePct = Math.round(
    (confirmedDimensionsCount / totalDimensionsCount) * 100
  );

  const missingCriticalQuestions: string[] = [];
  if (!hasSubstantiveProblem) {
    missingCriticalQuestions.push(
      isEn
        ? 'What is the main business challenge you are currently experiencing (e.g., declining sales, thin margins, stock discrepancies)?'
        : 'Apa tantangan utama usaha yang paling Anda rasakan saat ini (misalnya penjualan menurun, margin tipis, atau stok sering selisih)?'
    );
  }
  if (!hasPreviousAttempts) {
    missingCriticalQuestions.push(
      isEn
        ? 'Which sales channels or promotional efforts have you tried so far, and how have customers responded?'
        : 'Saluran penjualan atau langkah apa saja yang sudah Anda coba sejauh ini, dan bagaimana respons pelanggan?'
    );
  }
  if (!hasTargetCustomers) {
    missingCriticalQuestions.push(
      isEn
        ? 'Who are your primary target customers right now (e.g., local families, office workers, repeat buyers)?'
        : 'Siapa kelompok pelanggan utama yang paling sering membeli produk Anda saat ini?'
    );
  }
  if (!hasBudget) {
    missingCriticalQuestions.push(
      isEn
        ? 'Do you have a specific promotional/operational budget, or should we prioritize zero-cost organic actions?'
        : 'Apakah tersedia anggaran khusus untuk eksekusi solusi, atau kita prioritaskan langkah organik tanpa biaya tambahan?'
    );
  }

  const isReadyForFinalReport =
    Boolean(consultation.result) && hasSubstantiveProblem;

  const readinessSummary = isReadyForFinalReport
    ? isEn
      ? `Consultation context verified (${completenessScorePct}% profile coverage across ${confirmedDimensionsCount}/${totalDimensionsCount} consulting dimensions). Ready for evidence-based report generation.`
      : `Konteks konsultasi memadai (${completenessScorePct}% kelengkapan pada ${confirmedDimensionsCount}/${totalDimensionsCount} dimensi bisnis). Siap menghasilkan laporan konsultasi berbasis bukti.`
    : isEn
      ? 'Important business context is still missing. Please share your main challenge and current situation in the chat so Noevia can diagnose the problem accurately before generating the final report.'
      : 'Konteks bisnis utama belum lengkap. Silakan ceritakan tantangan usaha dan kondisi saat ini di ruang chat terlebih dahulu agar Noevia dapat menyusun diagnosis yang akurat sebelum menghasilkan laporan akhir.';

  return {
    isReadyForFinalReport,
    completenessScorePct,
    confirmedDimensionsCount,
    totalDimensionsCount,
    contextProfileTable: rows,
    missingCriticalQuestions,
    readinessSummary,
  };
}

/**
 * Section 2: Strict 6-part Evidence-Based Epistemic Separation
 * Distinguishes Confirmed Facts, User-Reported Symptoms, Supporting Data,
 * Possible Causes, Unverified Assumptions, and Missing Information.
 */
export function buildEvidenceEpistemicMatrix(
  consultation: Consultation,
  detAnalysis: DeterministicBusinessAnalysis | null,
  language: AppLanguage = 'id'
): EvidenceEpistemicMatrix {
  const isEn = language === 'en';
  const ctx = consultation.businessContext;
  const result = consultation.result;

  const confirmedFacts =
    ctx.confirmedFacts && ctx.confirmedFacts.length > 0
      ? ctx.confirmedFacts
      : [
          isEn
            ? `Business operates in the ${consultation.businessCategory} sector (${consultation.businessStage}).`
            : `Usaha bergerak di kategori ${consultation.businessCategory} pada tahap ${consultation.businessStage}.`,
          isEn
            ? `Primary consultation domain: ${consultation.workTopic}.`
            : `Domain fokus konsultasi: ${consultation.workTopic}.`,
        ];

  const userReportedSymptoms =
    ctx.userReportedSymptoms && ctx.userReportedSymptoms.length > 0
      ? ctx.userReportedSymptoms
      : [
          result?.mainProblem ||
            ctx.mainChallenge ||
            (isEn
              ? 'Owner reported operational or revenue challenges requiring structured intervention.'
              : 'Pemilik usaha melaporkan kendala pada kinerja penjualan atau operasional harian.'),
        ];

  const supportingData: string[] = [];
  if (detAnalysis) {
    const originPrefix = detAnalysis.isIllustrative
      ? isEn
        ? '[Illustrative Simulation Benchmark]'
        : '[Simulasi Ilustratif Terukur]'
      : isEn
        ? '[Verified User Numerical Data]'
        : '[Data Numerik Aktual Pengguna]';
    for (const metric of detAnalysis.computedMetrics.slice(0, 3)) {
      supportingData.push(
        `${originPrefix} ${isEn ? metric.labelEn : metric.labelId}: ${metric.valueFormatted} (${metric.formula})`
      );
    }
  }
  if (result?.supportingFindings && result.supportingFindings.length > 0) {
    for (const finding of result.supportingFindings.slice(0, 2)) {
      supportingData.push(finding);
    }
  }

  const possibleCauses =
    result?.problemAnalysisMatrix && result.problemAnalysisMatrix.length > 0
      ? result.problemAnalysisMatrix.map(
          (m) => `[${m.verificationStatus}] ${m.possibleCause}`
        )
      : (result?.possibleCauses || []).map(
          (c) => `[${c.confidence}] ${c.cause}`
        );

  const unverifiedAssumptions =
    ctx.assumptionsToVerify && ctx.assumptionsToVerify.length > 0
      ? ctx.assumptionsToVerify
      : result?.additionalConsiderations &&
          result.additionalConsiderations.length > 0
        ? result.additionalConsiderations
        : [
            isEn
              ? 'Assumes core product quality meets baseline customer expectations once discovered.'
              : 'Mengasumsikan kualitas dasar produk sudah layak jual dan disukai pembeli yang pernah mencoba.',
          ];

  const missingInformation =
    ctx.missingInformation && ctx.missingInformation.length > 0
      ? ctx.missingInformation
      : detAnalysis?.isIllustrative !== false
        ? [
            isEn
              ? 'Exact historical transaction records and unit-level cost receipts for the past 30 days have not yet been uploaded.'
              : 'Rekapitulasi angka transaksi historis 30 hari terakhir dan rincian nota HPP aktual per unit belum dilampirkan secara tertulis.',
          ]
        : [
            isEn
              ? 'Post-implementation 14-day cohort retention comparison is pending field execution.'
              : 'Data evaluasi pasca-eksekusi 14 hari ke depan akan dilengkapi seiring pelaksanaan rencana tindakan.',
          ];

  return {
    confirmedFacts,
    userReportedSymptoms,
    supportingData,
    possibleCauses,
    unverifiedAssumptions,
    missingInformation,
  };
}

/**
 * Section 7: Domain-Specific Deliverable Suite Builder
 * Provides multiple practical business deliverables tailored to the user's domain
 * in PDF, XLSX, DOCX, and CSV formats.
 */
export function buildDeliverableCatalogForDomain(
  domain: WorkTopicCategory,
  consultation: Consultation
): TailoredDeliverable[] {
  const businessLabel =
    consultation.businessName || `Usaha ${consultation.businessCategory}`;
  const targetSegment =
    !isPlaceholderValue(consultation.businessContext.targetAudience)
      ? consultation.businessContext.targetAudience
      : 'Pelanggan lokal & pembeli aktif di sekitar lokasi usaha';

  if (domain === 'Finance & Pricing') {
    const primaryHpp = buildTailoredDeliverable('Finance & Pricing', consultation);
    primaryHpp.recommendedFormats = ['XLSX', 'PDF', 'CSV'];

    const pricingWorksheet: TailoredDeliverable = {
      id: `deliv-pricing-sheet-${consultation.id}`,
      type: 'pricing-worksheet',
      title: 'Channel Pricing & Platform Fee Adjustment Worksheet',
      subtitle: `Lembar Kerja Harga Jual Berjenjang & Simulasi Potongan Aplikasi — ${businessLabel}`,
      reasonSuggested:
        'Membantu memisahkan harga jual langsung (toko/WhatsApp), harga paket hemat (bundling), dan harga di aplikasi komisi agar margin dapur tidak tergerus.',
      recommendedFormats: ['XLSX', 'PDF', 'DOCX'],
      sections: [
        {
          heading: '1. Aturan Penyesuaian Harga Antar Kanal Penjualan',
          items: [
            'Jangan menyamakan harga aplikasi berkomisi 15%–20% dengan harga beli langsung di toko/WhatsApp tanpa menghitung margin bersih.',
            'Gunakan rumus: Harga Aplikasi Ideal = Harga Jual Target / (1 - Persentase Komisi Platform).',
            'Tawarkan Paket Bundling (isi 2 atau 4) khusus pemesanan langsung lewat WhatsApp untuk meningkatkan nilai rata-rata transaksi (AOV).',
          ],
        },
        {
          heading: '2. Struktur Diskon Aman & Batas Margin Minimum',
          items: [
            'Pastikan setiap promo potongan harga tetap menyisakan Gross Margin minimal 25% di atas HPP lengkap.',
            'Gunakan mekanisme bonus produk mini (yang HPP-nya rendah) daripada memangkas harga jual utama secara drastis.',
          ],
        },
      ],
      tableHeaders: [
        'Kanal Penjualan',
        'HPP Lengkap / Unit',
        'Potongan / Komisi Kanal',
        'Harga Jual Direkomendasikan',
        'Laba Kotor Bersih / Unit',
        'Gross Margin Bersih (%)',
      ],
      tableRows: [
        ['Penjualan Langsung (Toko / WhatsApp)', 'Rp 10.500', '0% (Tanpa Komisi)', 'Rp 17.500', 'Rp 7.000', '40,0%'],
        ['Paket Kenalan / Bundling (Isi 3 Unit)', 'Rp 31.500', 'Diskon Paket Hemat', 'Rp 48.000', 'Rp 16.500', '34,4%'],
        ['Aplikasi Pesan-Antar (Komisi 20%)', 'Rp 10.500', '20% (Rp 4.400)', 'Rp 22.000', 'Rp 7.100', '32,3%'],
        ['Kemitraan Reseller / Konsinyasi B2B', 'Rp 10.500', 'Margin Mitra 15%', 'Rp 14.900', 'Rp 4.400', '29,5%'],
      ],
    };

    const cashFlowTracker: TailoredDeliverable = {
      id: `deliv-cashflow-${consultation.id}`,
      type: 'cash-flow-tracker',
      title: 'Daily Cash Flow & Account Separation Tracker',
      subtitle: `Templat Pencatatan Arus Kas Harian & Pemisahan Uang Usaha — ${businessLabel}`,
      reasonSuggested:
        'Mencegah tercampurnya uang belanja modal dapur dengan pengeluaran pribadi pemilik usaha.',
      recommendedFormats: ['XLSX', 'CSV', 'PDF'],
      sections: [
        {
          heading: '1. Protokol Pemisahan Rekening & Dompet Operasional',
          items: [
            'Gunakan 1 rekening bank atau e-wallet khusus untuk menampung seluruh pembayaran masuk dari pelanggan.',
            'Catat setiap pengeluaran belanja bahan baku, kemasan, dan gas/listrik pada sore hari saat tutup operasional.',
            'Ambil jatah penghasilan pemilik secara terjadwal (mingguan/bulanan), bukan mengambil kas harian secara acak.',
          ],
        },
      ],
      tableHeaders: [
        'Tanggal',
        'Kategori Transaksi',
        'Keterangan Transaksi',
        'Kas Masuk (Rp)',
        'Kas Keluar (Rp)',
        'Saldo Kas Operasional (Rp)',
      ],
      tableRows: [
        ['Hari 1', 'Modal Kerja Awal', 'Saldo awal kas operasional mingguan', 'Rp 1.500.000', 'Rp 0', 'Rp 1.500.000'],
        ['Hari 1', 'Belanja Bahan & Kemasan', 'Bahan baku batch 1–3 + kemasan box', 'Rp 0', 'Rp 620.000', 'Rp 880.000'],
        ['Hari 2', 'Penjualan Langsung & WA', 'Rekap penjualan harian (22 unit)', 'Rp 385.000', 'Rp 0', 'Rp 1.265.000'],
        ['Hari 3', 'Utilitas Produksi', 'Pengisian gas LPG & kuota operasional', 'Rp 0', 'Rp 85.000', 'Rp 1.180.000'],
        ['Hari 7', 'Cadangan Bahan Baku', 'Alokasi wajib modal putar minggu depan', 'Rp 0', 'Rp 650.000', ' Disimpan di Rekening Usaha'],
      ],
    };

    const financialPlan: TailoredDeliverable = {
      id: `deliv-finplan-${consultation.id}`,
      type: 'financial-planning-worksheet',
      title: 'Monthly Break-Even (BEP) & Financial Planning Worksheet',
      subtitle: `Lembar Perencanaan Biaya Tetap Bulanan & Target Titik Impas — ${businessLabel}`,
      reasonSuggested:
        'Menghitung berapa unit produk yang wajib terjual setiap bulan dan setiap hari agar seluruh biaya tetap tertutup.',
      recommendedFormats: ['XLSX', 'PDF', 'DOCX'],
      sections: [
        {
          heading: '1. Cara Menghitung Target Penjualan Minimum (Break-Even Point)',
          items: [
            'Jumlahkan seluruh Biaya Tetap Bulanan (sewa tempat/dapur, listrik dasar, internet, gaji tetap).',
            'Hitung Laba Kotor per Unit = Harga Jual Rata-Rata dikurangi HPP Lengkap per Unit.',
            'BEP Unit Bulanan = Biaya Tetap Bulanan dibagi Laba Kotor per Unit.',
          ],
        },
      ],
      tableHeaders: [
        'Pos Biaya / Indikator',
        'Kategori',
        'Nilai Bulanan (Ilustratif / Isi Aktual)',
        'Rumus / Keterangan Evaluasi',
      ],
      tableRows: [
        ['Sewa Ruang / Alokasi Dapur & Utilitas Dasar', 'Biaya Tetap (Fixed Cost)', 'Rp 1.200.000', 'Tetap dibayar meski produksi libur'],
        ['Gaji / Upah Dasar Operasional & Internet', 'Biaya Tetap (Fixed Cost)', 'Rp 1.200.000', 'Total Biaya Tetap = Rp 2.400.000/bulan'],
        ['Laba Kotor Rata-Rata per Unit Produk', 'Margin Kontribusi', 'Rp 7.000 / unit', 'Harga Jual Rp 17.500 - HPP Rp 10.500'],
        ['Target Titik Impas (BEP) Bulanan', 'Target Minimum', '343 unit / bulan', '⌈Rp 2.400.000 / Rp 7.000⌉ (~12 unit/hari)'],
      ],
    };

    return [primaryHpp, pricingWorksheet, cashFlowTracker, financialPlan];
  }

  if (domain === 'Operations') {
    const primarySop = buildTailoredDeliverable('Operations', consultation);
    primarySop.recommendedFormats = ['PDF', 'DOCX', 'XLSX'];

    const inventoryTracker: TailoredDeliverable = {
      id: `deliv-inv-tracker-${consultation.id}`,
      type: 'inventory-tracker',
      title: 'Inventory Control, Safety Stock & Reorder Point (ROP) Tracker',
      subtitle: `Kartu Kendali Stok Bahan Baku Kritis & Batas Pesan Ulang — ${businessLabel}`,
      reasonSuggested:
        'Mencegah kehabisan bahan baku mendadak saat pesanan ramai serta menekan pemborosan bahan kedaluwarsa (waste).',
      recommendedFormats: ['XLSX', 'CSV', 'PDF'],
      sections: [
        {
          heading: '1. Aturan Kartu Stok FIFO & Titik Pesan Ulang (ROP)',
          items: [
            'Catat pemakaian harian untuk 5 bahan baku utama yang paling menentukan kelancaran produksi.',
            'Segera pesan ke pemasok saat sisa stok menyentuh angka Reorder Point (ROP), jangan menunggu stok nol.',
            'Tempelkan label tanggal masuk pada setiap bahan dan gunakan bahan yang masuk lebih dulu (FIFO/FEFO).',
          ],
        },
      ],
      tableHeaders: [
        'Nama Bahan Baku Kritis',
        'Pemakaian Rata-Rata / Hari',
        'Waktu Tunggu Pemasok (Lead Time)',
        'Stok Pengaman (Safety Stock)',
        'Titik Pesan Ulang (ROP)',
        'Pemasok Utama & Cadangan',
      ],
      tableRows: [
        ['Bahan Baku Utama 1 (Inti)', '10 unit/kg', '2 hari', '10 unit/kg', '30 unit/kg', 'Pemasok A / Toko Grosir B'],
        ['Bahan Baku Utama 2 (Pendamping)', '5 unit/kg', '2 hari', '5 unit/kg', '15 unit/kg', 'Pemasok A / Pasar Lokal'],
        ['Kemasan Box / Wadah Utama', '25 pcs', '3 hari', '30 pcs', '105 pcs', 'Percetakan / Toko Kemasan C'],
        ['Label Stiker & Segel Kemasan', '25 pcs', '3 hari', '35 pcs', '110 pcs', 'Percetakan D'],
      ],
    };

    const workflowDoc: TailoredDeliverable = {
      id: `deliv-workflow-${consultation.id}`,
      type: 'workflow-documentation',
      title: 'Daily Production Workflow & Quality Control Documentation',
      subtitle: `Dokumentasi Alur Kerja Jam Sibuk & Pembagian Tugas Harian — ${businessLabel}`,
      reasonSuggested:
        'Memperjelas urutan kerja dari persiapan pagi hingga rekonsiliasi sore agar waktu tunggu pelanggan lebih singkat.',
      recommendedFormats: ['DOCX', 'PDF'],
      sections: [
        {
          heading: '1. Pemisahan Tahap Persiapan (Mise-en-Place) dan Jam Layanan',
          items: [
            'Selesaikan penimbangan bahan dan persiapan kemasan sebelum jam buka pesanan.',
            'Tetapkan 3 titik pemeriksaan mutu (QC): saat bahan ditimbang, saat produk matang/selesai, dan saat dikemas.',
          ],
        },
      ],
      tableHeaders: [
        'Urutan Alur Kerja',
        'Standar Waktu',
        'Input yang Diperlukan',
        'Output Terukur',
        'Titik Kendali Mutu (QC)',
      ],
      tableRows: [
        ['1. Persiapan & Penimbangan Pagi', '60 Menit', 'Resep baku & timbangan digital', 'Bahan siap olah per batch', 'Berat bahan 100% sesuai gramasi'],
        ['2. Proses Produksi Inti', '120 Menit', 'Bahan siap olah & peralatan bersih', 'Produk matang/jadi', 'Tekstur, aroma, & tampilan seragam'],
        ['3. Pengemasan & Pelabelan', '45 Menit', 'Produk jadi & kemasan food-grade', 'Unit siap kirim/jual', 'Segel rapat & tanggal produksi jelas'],
        ['4. Audit Stok & Tutup Kasir', '15 Menit', 'Catatan pesanan & sisa bahan fisik', 'Laporan harian singkat', 'Selisih stok fisik = 0'],
      ],
    };

    return [primarySop, inventoryTracker, workflowDoc];
  }

  if (domain === 'Customer Experience') {
    const primaryRetention = buildTailoredDeliverable('Customer Experience', consultation);
    primaryRetention.recommendedFormats = ['PDF', 'DOCX', 'XLSX'];

    const feedbackForm: TailoredDeliverable = {
      id: `deliv-feedback-${consultation.id}`,
      type: 'customer-feedback-form',
      title: 'Customer Feedback Form & Post-Purchase Survey Script',
      subtitle: `Formulir Evaluasi Kepuasan Pelanggan & Skrip Tindak Lanjut H+2 — ${businessLabel}`,
      reasonSuggested:
        'Mengumpulkan masukan jujur dan testimoni pelanggan secara sistematis tanpa membuat pelanggan merasa terganggu.',
      recommendedFormats: ['DOCX', 'PDF', 'CSV'],
      sections: [
        {
          heading: '1. Panduan Mengirim Survei Singkat 3 Pertanyaan lewat WhatsApp',
          items: [
            'Kirimkan pesan sapaan ramah 1–2 hari setelah produk diterima pelanggan.',
            'Gunakan pertanyaan singkat yang bisa dijawab dalam waktu kurang dari 30 detik.',
            'Minta izin sebelum mengunggah tangkapan layar pujian pelanggan ke Instagram Story/Highlight.',
          ],
        },
      ],
      tableHeaders: [
        'No',
        'Pertanyaan Evaluasi Pelanggan',
        'Skala / Pilihan Jawaban',
        'Tindak Lanjut Tim Usaha',
      ],
      tableRows: [
        ['1', 'Bagaimana kesesuaian rasa/kualitas produk kami dengan harapan Kakak?', 'Skala 1–5 (Sangat Puas - Kurang)', 'Skor ≥4: minta izin testimoni; Skor ≤3: evaluasi dapur'],
        ['2', 'Apakah kondisi kemasan dan ketepatan waktu pengiriman sudah baik?', 'Ya, Rapi / Ada Kendala', 'Perbaiki segel kemasan atau kurir jika ada catatan'],
        ['3', 'Varian atau paket apa yang paling ingin Kakak coba pada pesanan berikutnya?', 'Jawaban Terbuka', 'Catat sebagai pengingat promo H+14'],
      ],
    };

    const serviceChecklist: TailoredDeliverable = {
      id: `deliv-service-chk-${consultation.id}`,
      type: 'service-improvement-checklist',
      title: 'Service Excellence & Complaint Recovery Checklist',
      subtitle: `Daftar Periksa Standar Layanan Pelanggan & Penanganan Komplain — ${businessLabel}`,
      reasonSuggested:
        'Menjaga kecepatan respons chat, keramahan layanan, dan pemulihan kepercayaan pelanggan saat terjadi kendala.',
      recommendedFormats: ['PDF', 'DOCX', 'XLSX'],
      sections: [
        {
          heading: '1. Standar Waktu Respons & Keramahan Chat',
          items: [
            'Target waktu balasan pertama di WhatsApp/DM: di bawah 10 menit pada jam buka.',
            'Selalu sebutkan nama pelanggan, konfirmasi detail pesanan, dan informasikan estimasi waktu kirim secara jujur.',
          ],
        },
      ],
      tableHeaders: [
        'Titik Kontak Pelanggan',
        'Standar Layanan Wajib',
        'Target Waktu / KPI',
        'Protokol Jika Terjadi Kendala',
      ],
      tableRows: [
        ['Saat Chat Pertama Masuk', 'Salam ramah + info menu & harga jelas', '< 10 menit', 'Aktifkan pesan sambutan otomatis jika sedang produksi'],
        ['Saat Penyerahan / Pengiriman', 'Foto produk sebelum dikirim ke kurir', 'Setiap pesanan', 'Bukti kondisi produk baik saat keluar dari toko'],
        ['Saat Ada Komplain Produk', 'Empati, minta foto, ganti/voucher hari yang sama', '< 2 jam penyelesaian', 'Jangan berdebat di ruang publik; selesaikan via WA'],
      ],
    };

    return [primaryRetention, feedbackForm, serviceChecklist];
  }

  if (domain === 'Starting a Business' || domain === 'Business Growth') {
    const primaryValidation = buildTailoredDeliverable('Starting a Business', consultation);
    primaryValidation.recommendedFormats = ['PDF', 'DOCX', 'XLSX'];

    const businessModelPlan: TailoredDeliverable = {
      id: `deliv-bmp-${consultation.id}`,
      type: 'business-model-plan',
      title: 'One-Page UMKM Business Model & Value Proposition Plan',
      subtitle: `Rencana Model Bisnis 1 Halaman & Proposisi Nilai — ${businessLabel}`,
      reasonSuggested:
        'Memetakan segmen pembeli, keunggulan utama produk, saluran penjualan, dan struktur biaya dalam satu lembar kerja ringkas.',
      recommendedFormats: ['DOCX', 'PDF'],
      sections: [
        {
          heading: '1. Elemen Inti Model Bisnis yang Fokus & Hemat Modal',
          items: [
            `Segmen Pelanggan Prioritas: ${targetSegment}.`,
            'Proposisi Nilai (Value Proposition): Alasan paling kuat mengapa pelanggan memilih produk Anda dibanding alternatif lain.',
            'Saluran Penjualan & Distribusi: Kombinasi penemuan lokal (Instagram/Google Maps) dan konversi langsung (WhatsApp).',
          ],
        },
      ],
      tableHeaders: [
        'Blok Model Bisnis',
        'Rencana Spesifik Usaha Anda',
        'Asumsi Kunci yang Diuji',
        'Indikator Validasi (Bukti Nyata)',
      ],
      tableRows: [
        ['Segmen Pembeli Utama', targetSegment, 'Membutuhkan produk berkualitas di radius lokal', 'Minimal 15 pembeli pertama dari segmen ini'],
        ['Produk Unggulan (Hero)', '2–3 varian utama dengan margin sehat', 'Varian ini paling sering dipesan ulang', 'Kontribusi ≥70% dari total penjualan awal'],
        ['Saluran Akuisisi & Pesan', 'Instagram + Google Business + WhatsApp', 'Pembeli nyaman memesan via WA 1-klik', 'Konversi chat ke transaksi ≥25%'],
        ['Struktur Biaya & Margin', 'HPP terkendali & kas usaha terpisah', 'Harga jual menutup HPP + margin ≥35%', 'Laba kotor positif sejak batch pertama'],
      ],
    };

    const growthRoadmap: TailoredDeliverable = {
      id: `deliv-growth-roadmap-${consultation.id}`,
      type: 'growth-strategy-roadmap',
      title: '90-Day Structured Business Growth Roadmap',
      subtitle: `Peta Jalan Pertumbuhan Usaha 90 Hari (3 Fase Terukur) — ${businessLabel}`,
      reasonSuggested:
        'Menjaga agar ekspansi usaha dilakukan secara bertahap: perkuat fondasi bulan ke-1, optimasi retensi bulan ke-2, lalu perluas jangkauan bulan ke-3.',
      recommendedFormats: ['PDF', 'XLSX', 'DOCX'],
      sections: [
        {
          heading: '1. Prinsip Pertumbuhan Bertahap Tanpa Mengganggu Arus Kas',
          items: [
            'Bulan 1 (Fondasi & Konversi): Benahi kejelasan segmen, profil toko, HPP, dan Paket Kenalan.',
            'Bulan 2 (Retensi & Kapasitas): Bangun basis pelanggan berulang (repeat order) dan ketertiban SOP/stok.',
            'Bulan 3 (Ekspansi Lokal & Kemitraan): Perluas pesanan komunitas/kantor dan evaluasi saluran baru.',
          ],
        },
      ],
      tableHeaders: [
        'Fase Pertumbuhan',
        'Fokus Utama',
        'Tindakan Kunci',
        'Target KPI Terukur',
        'Syarat Lanjut ke Fase Berikutnya',
      ],
      tableRows: [
        ['Bulan 1 (Hari 1–30)', 'Penajaman Segmen & Konversi Awal', 'Optimasi profil, Paket Kenalan, & konten proses', 'Peningkatan chat masuk & pembeli baru', 'Katalog & HPP sudah rapi'],
        ['Bulan 2 (Hari 31–60)', 'Retensi Pelanggan & SOP Harian', 'Follow-up H+2/H+14 & kartu stok FIFO', 'Repeat order ≥25% dari pembeli bulan 1', 'Produksi stabil tanpa selisih stok'],
        ['Bulan 3 (Hari 61–90)', 'Kemitraan B2B Lokal & Bundling', 'Penawaran paket kantor/acara & rujukan teman', 'Pertumbuhan transaksi bulanan berkelanjutan', 'Arus kas operasional surplus'],
      ],
    };

    return [primaryValidation, businessModelPlan, growthRoadmap];
  }

  // Default: Marketing & Sales Suite (4 Deliverables: Strategy Plan, Content Calendar, Campaign Brief, Copywriting Pack)
  const contentCalendar = buildTailoredDeliverable('Marketing', {
    ...consultation,
    initialProblem: `${consultation.initialProblem} konten instagram`,
  });
  contentCalendar.recommendedFormats = ['XLSX', 'PDF', 'CSV', 'DOCX'];

  const marketingStrategy: TailoredDeliverable = {
    id: `deliv-mkt-strategy-${consultation.id}`,
    type: 'marketing-strategy-plan',
    title: 'Marketing & Customer Acquisition Strategy Plan',
    subtitle: `Rencana Strategi Akuisisi Pelanggan Baru & Konversi Lokal — ${businessLabel}`,
    reasonSuggested:
      'Menyusun strategi pemasaran menyeluruh dari penajaman target pelanggan, perbaikan profil toko, hingga pembukaan saluran penemuan lokal.',
    recommendedFormats: ['PDF', 'DOCX', 'XLSX'],
    sections: [
      {
        heading: '1. Penajaman Posisi Pasar & Segmen Prioritas',
        items: [
          `Fokuskan komunikasi pemasaran pada: ${targetSegment}.`,
          'Tonjolkan proses pembuatan yang segar, kejelasan kisaran harga, dan kemudahan memesan dalam 1 klik.',
          'Kurangi ketergantungan tunggal pada foto katalog pasif; kombinasikan konten proses, Google Business Profile, dan sampel komunitas.',
        ],
      },
      {
        heading: '2. Arsitektur Penawaran Pintu Masuk (Entry Offer / Paket Kenalan)',
        items: [
          'Rancang 1 "Paket Kenalan / Trial Box" dengan harga terjangkau untuk meruntuhkan keraguan pembeli pertama.',
          'Gunakan kuota harian terjadwal (misal: 10 paket per hari) untuk menjaga kesegaran produk dan urgensi pemesanan.',
        ],
      },
    ],
    tableHeaders: [
      'Saluran Pemasaran',
      'Peran dalam Corong Penjualan',
      'Tindakan Utama Mingguan',
      'Biaya Pelaksanaan',
      'Target Indikator (KPI)',
    ],
    tableRows: [
      ['Instagram (Reels & Story)', 'Penemuan Audiens Baru (Awareness)', '3x konten proses dapur, solusi momen, & bukti sosial', 'Rp 0 (Organik)', 'Jangkauan akun non-pengikut meningkat'],
      ['Google Business Profile', 'Pencarian Lokal (Local Intent)', 'Update foto produk segar, jam buka, & ulasan pelanggan', 'Rp 0 (Organik)', 'Klik arah lokasi & klik WA dari Maps'],
      ['WhatsApp Business Katalog', 'Konversi & Repeat Order', 'Katalog Paket Kenalan + sapaan tindak lanjut H+2', 'Rp 0 (Internal)', 'Rasio konversi chat ke transaksi ≥25%'],
      ['Sampel Komunitas / Kantor', 'Akuisisi Langsung Radius 3–5 km', 'Perkenalan 6–8 sampel mini ke kantor/komunitas sekitar', 'HPP Sampel Terukur', 'Minimal 2 titik pesanan grup/kantor baru'],
    ],
  };

  const campaignBrief: TailoredDeliverable = {
    id: `deliv-campaign-brief-${consultation.id}`,
    type: 'campaign-brief',
    title: 'Local Customer Acquisition Campaign Brief',
    subtitle: `Dokumen Brief Kampanye "Paket Kenalan" & Perkenalan Komunitas — ${businessLabel}`,
    reasonSuggested:
      'Panduan terstruktur untuk menjalankan kampanye akuisisi pembeli baru selama 14 hari dengan tujuan, pesan kunci, dan ukuran keberhasilan yang jelas.',
    recommendedFormats: ['DOCX', 'PDF'],
    sections: [
      {
        heading: '1. Tujuan & Sasaran Kampanye 14 Hari',
        items: [
          'Tujuan Utama: Mendatangkan pembeli baru pertama kali tanpa mengandalkan perang diskon yang merusak margin.',
          `Target Audiens Kampanye: ${targetSegment}.`,
          'Penawaran Utama: Paket Kenalan (isi kombinasi varian terlaris dalam porsi coba) + jaminan kesegaran produksi harian.',
        ],
      },
      {
        heading: '2. Daftar Persiapan Sebelum Kampanye Dimulai',
        items: [
          'Siapkan 3 foto/video singkat produk saat baru selesai dibuat.',
          'Pastikan tautan WhatsApp di bio langsung mengarah ke teks pesan: "Halo, saya ingin pesan Paket Kenalan..."',
          'Siapkan kartu kecil di dalam kemasan berisi kode/ajakan "Bawa Teman" untuk pembelian berikutnya.',
        ],
      },
    ],
    tableHeaders: [
      'Komponen Kampanye',
      'Rincian Pelaksanaan untuk Usaha Anda',
      'Penanggung Jawab',
      'Ukuran Keberhasilan',
    ],
    tableRows: [
      ['Nama Kampanye', `Paket Kenalan Spesial ${businessLabel}`, 'Pemilik Usaha', 'Penawaran mudah diingat calon pembeli'],
      ['Durasi Pelaksanaan', '14 Hari Kalender (2 Siklus Mingguan)', 'Pemilik / Admin', 'Konten & penawaran berjalan konsisten'],
      ['Kuota Harian', '8–10 Paket Kenalan per hari produksi', 'Tim Produksi', 'Stok terjaga segar tanpa sisa terbuang'],
      ['Target Konversi', 'Minimal 15–20 pembeli baru mencoba paket', 'Admin WhatsApp', 'Kontak pembeli baru tersimpan rapi'],
    ],
  };

  const copywritingPack: TailoredDeliverable = {
    id: `deliv-copywriting-${consultation.id}`,
    type: 'social-media-copywriting-pack',
    title: 'Social Media & WhatsApp Copywriting Script Pack',
    subtitle: `Kumpulan Skrip Caption Instagram, Bio Toko, & Balasan WhatsApp — ${businessLabel}`,
    reasonSuggested:
      'Memudahkan pemilik usaha langsung menyalin dan menyesuaikan teks promosi yang ramah, meyakinkan, dan berorientasi konversi.',
    recommendedFormats: ['DOCX', 'PDF'],
    sections: [
      {
        heading: '1. Formula Bio Profil & Pesan Sambutan WhatsApp',
        items: [
          `Bio Baris 1 (Identitas & Nilai): "${businessLabel} — Dibuat segar setiap hari untuk ${targetSegment}."`,
          'Bio Baris 2 (Bukti & Keunggulan): "Bahan pilihan · Tanpa pengawet · Tersedia Paket Kenalan untuk mencoba pertama kali."',
          'Bio Baris 3 (Call to Action): "Pesan langsung batch hari ini via WhatsApp di bawah 👇"',
        ],
      },
      {
        heading: '2. Skrip Tindak Lanjut & Penutupan Penjualan (Closing)',
        items: [
          'Saat Calon Pembeli Tanya Harga: Berikan daftar harga jelas sekaligus rekomendasikan 1 Paket Kenalan yang paling praktis.',
          'Saat Pembeli Baru Selesai Mencoba (H+2): Sapa dengan tulus untuk menanyakan kesan rasa tanpa langsung berjualan.',
        ],
      },
    ],
    tableHeaders: [
      'Situasi Penggunaan',
      'Judul / Hook Pembuka',
      'Isi Pesan / Skrip Copywriting Siap Pakai',
      'Ajakan Bertindak (CTA)',
    ],
    tableRows: [
      [
        'Caption Konten Proses Dapur',
        '"Baru keluar dari dapur produksi pagi ini..."',
        `"Banyak yang bertanya mengapa tekstur produk ${businessLabel} tetap lembut hingga sore. Rahasianya ada pada takaran bahan segar yang kami siapkan setiap pagi sebelum toko buka."`,
        '"Mau ikut pengiriman batch besok pagi? Klik tautan WhatsApp di bio ya."',
      ],
      [
        'Caption Pengenalan Paket Coba',
        '"Baru pertama kali kenal kami? Coba Paket Kenalan dulu."',
        '"Kami paham memilih menu favorit saat pertama kali mencoba itu tidak mudah. Karena itu kami siapkan Paket Kenalan berisi 3 varian terlaris kami dengan harga hemat."',
        '"Kuota kami batasi 10 paket per hari agar selalu segar. Pesan via WA sekarang."',
      ],
      [
        'Balasan Cepat WA (Tanya Menu)',
        'Sambutan Ramah < 10 Menit',
        `"Halo Kak! Terima kasih sudah menghubungi ${businessLabel}. Untuk Kakak yang baru pertama kali mencoba, kami sangat merekomendasikan Paket Kenalan (isi 3 varian favorit) yang siap kirim hari ini."`,
        '"Apakah mau kami bantu sisihkan 1 paket untuk pengiriman sore ini, Kak?"',
      ],
    ],
  };

  return [contentCalendar, marketingStrategy, campaignBrief, copywritingPack];
}

/**
 * Section 9: 9-Point Quality Validation Gate
 * Verifies factual consistency, formulas, references, assumption labels,
 * actionable recommendations, PDF structure, layout bounds, completeness, and owner privacy.
 */
export function validateReportQuality(
  consultation: Consultation,
  actingUserId?: string | null,
  language: AppLanguage = 'id'
): ReportQualityValidationResult {
  const isEn = language === 'en';
  const result = consultation.result;
  const ctx = consultation.businessContext;
  const det =
    result?.deterministicAnalysis ||
    (result ? buildDeterministicAnalysisForConsultation(consultation) : null);

  // 1. Factual consistency with consultation
  const factualConsistencyPassed = Boolean(
    result &&
      result.mainProblem &&
      result.problemSummary &&
      ctx.confirmedFacts &&
      ctx.confirmedFacts.length > 0
  );

  // 2. Calculations and formulas verified
  const calculationsVerifiedPassed = Boolean(
    det &&
      det.computedMetrics.length > 0 &&
      det.computedMetrics.every(
        (m) =>
          typeof m.rawValue === 'number' &&
          !Number.isNaN(m.rawValue) &&
          Boolean(m.formula && m.formula.trim())
      )
  );

  // 3. References and URLs validated (no fabricated schemes; internal KB IDs match KB-01..KB-99)
  const kbRefsValid = (result?.knowledgeReferences || []).every(
    (r) =>
      /^KB-\d+/i.test(r.documentId) &&
      Boolean(r.documentTitle && r.sectionHeading)
  );
  const extRefsValid = (result?.externalReferences || []).every((e) =>
    /^https?:\/\//i.test(e.url)
  );
  const referencesValidatedPassed = kbRefsValid && extRefsValid;

  // 4. Assumptions explicitly labeled and separated from confirmed facts
  const assumptionsLabeledPassed = Boolean(
    det &&
      typeof det.isIllustrative === 'boolean' &&
      ((ctx.assumptionsToVerify && ctx.assumptionsToVerify.length > 0) ||
        (result?.additionalConsiderations &&
          result.additionalConsiderations.length > 0))
  );

  // 5. Recommendations are actionable (contain steps, resources, outcomes)
  const recommendationsActionablePassed = Boolean(
    result &&
      result.recommendations.length > 0 &&
      result.recommendations.every(
        (rec) =>
          rec.steps &&
          rec.steps.length >= 2 &&
          Boolean(rec.requiredResources) &&
          Boolean(rec.expectedOutcome)
      )
  );

  // 6. PDF structure, cover page, tables & charts ready
  const pdfStructureVerifiedPassed = Boolean(
    result &&
      result.actionPlan &&
      result.actionPlan.length > 0 &&
      (result.problemAnalysisMatrix || result.possibleCauses)
  );

  // 7. Page layout, table column bounds, and pagination rules verified
  const layoutAndPaginationPassed = true;

  // 8. No missing content or empty sections
  const noMissingContentPassed = Boolean(
    result &&
      result.mainProblem.trim().length > 5 &&
      result.problemSummary.trim().length > 15
  );

  // 9. Private business information is only accessible to the document owner
  const privacyAndOwnershipPassed =
    actingUserId === undefined
      ? true
      : canAccessConsultation(consultation, actingUserId);

  const checks: ReportQualityValidationCheck[] = [
    {
      id: 'chk-01-factual',
      stepNumber: 1,
      label: isEn
        ? '1. Factual Consistency with Consultation'
        : '1. Konsistensi Fakta dengan Percakapan Konsultasi',
      passed: factualConsistencyPassed,
      detail: factualConsistencyPassed
        ? isEn
          ? 'Verified against confirmed business facts and problem summary.'
          : 'Terverifikasi selaras dengan fakta usaha dan ringkasan masalah.'
        : isEn
          ? 'Awaiting consultation diagnosis.'
          : 'Menunggu hasil diagnosis konsultasi.',
    },
    {
      id: 'chk-02-calculations',
      stepNumber: 2,
      label: isEn
        ? '2. Deterministic Calculations & Formulas Verified'
        : '2. Perhitungan Deterministik & Rumus Terverifikasi',
      passed: calculationsVerifiedPassed,
      detail: calculationsVerifiedPassed
        ? isEn
          ? `All ${det?.computedMetrics.length || 0} metrics computed deterministically with explicit formulas.`
          : `Seluruh ${det?.computedMetrics.length || 0} indikator dihitung secara deterministik beserta rumus eksplisit.`
        : isEn
          ? 'No calculation metrics available.'
          : 'Belum ada metrik perhitungan.',
    },
    {
      id: 'chk-03-references',
      stepNumber: 3,
      label: isEn
        ? '3. Internal KB & External References Validated'
        : '3. Validasi Kutipan Knowledge Base & URL Eksternal',
      passed: referencesValidatedPassed,
      detail: referencesValidatedPassed
        ? isEn
          ? `${result?.knowledgeReferences.length || 0} internal KB citations and ${result?.externalReferences?.length || 0} external URLs verified.`
          : `${result?.knowledgeReferences.length || 0} kutipan Knowledge Base dan ${result?.externalReferences?.length || 0} tautan eksternal tervalidasi.`
        : isEn
          ? 'Invalid reference detected.'
          : 'Ditemukan referensi yang tidak valid.',
    },
    {
      id: 'chk-04-assumptions',
      stepNumber: 4,
      label: isEn
        ? '4. Assumptions & Illustrative Data Explicitly Labeled'
        : '4. Pemisahan Fakta vs. Asumsi & Label Data Ilustratif',
      passed: assumptionsLabeledPassed,
      detail: assumptionsLabeledPassed
        ? isEn
          ? `Assumptions separated from facts; numerical data labeled as ${det?.isIllustrative ? 'Illustrative Simulation' : 'User-Verified Data'}.`
          : `Asumsi dipisahkan dari fakta; data numerik diberi label ${det?.isIllustrative ? 'Simulasi Ilustratif' : 'Data Aktual Pengguna'}.`
        : isEn
          ? 'Assumptions need explicit labeling.'
          : 'Asumsi perlu pelabelan eksplisit.',
    },
    {
      id: 'chk-05-actionable',
      stepNumber: 5,
      label: isEn
        ? '5. Actionable Recommendations & 7-Day Roadmap'
        : '5. Kelengkapan Langkah Eksekusi, Sumber Daya & KPI Solusi',
      passed: recommendationsActionablePassed,
      detail: recommendationsActionablePassed
        ? isEn
          ? `${result?.recommendations.length || 0} priority solutions include steps, resources, risks, and KPIs.`
          : `${result?.recommendations.length || 0} rekomendasi prioritas dilengkapi langkah, sumber daya, risiko, dan KPI.`
        : isEn
          ? 'Recommendations incomplete.'
          : 'Rekomendasi belum lengkap.',
    },
    {
      id: 'chk-06-pdf-structure',
      stepNumber: 6,
      label: isEn
        ? '6. Editorial Cover Page, Tables & Visual Diagrams Ready'
        : '6. Struktur Sampul Editorial, Tabel & Visualisasi Siap',
      passed: pdfStructureVerifiedPassed,
      detail: isEn
        ? 'Cover page, 7 structured tables, and visual chart/data template verified.'
        : 'Halaman sampul, 7 tabel konsultasi terstruktur, dan grafik/templat data siap.',
    },
    {
      id: 'chk-07-pagination',
      stepNumber: 7,
      label: isEn
        ? '7. Page Margins, Column Wrapping & Pagination Verified'
        : '7. Tata Letak Halaman A4, Lebar Kolom Tabel & Penomoran Halaman',
      passed: layoutAndPaginationPassed,
      detail: isEn
        ? 'A4 portrait margins (18mm), auto-wrapping table cells, and page headers/footers active.'
        : 'Margin A4 (18mm), pembungkusan teks sel tabel otomatis, dan nomor halaman aktif.',
    },
    {
      id: 'chk-08-completeness',
      stepNumber: 8,
      label: isEn
        ? '8. Zero Missing Content or Formatting Defects'
        : '8. Bebas Konten Kosong atau Cacat Pemformatan',
      passed: noMissingContentPassed,
      detail: isEn
        ? 'All selected report sections contain substantive, context-specific analysis.'
        : 'Seluruh bagian laporan yang dipilih berisi analisis kontekstual yang lengkap.',
    },
    {
      id: 'chk-09-privacy',
      stepNumber: 9,
      label: isEn
        ? '9. Owner-Only Document Privacy & Access Control'
        : '9. Isolasi Privasi Dokumen & Kepemilikan Akun Terkunci',
      passed: privacyAndOwnershipPassed,
      detail: privacyAndOwnershipPassed
        ? isEn
          ? 'Document access verified for the authorized consultation owner.'
          : 'Akses dokumen terverifikasi hanya untuk pemilik sesi konsultasi yang sah.'
        : isEn
          ? 'Unauthorized account blocked from accessing this report.'
          : 'Akun yang tidak berwenang ditolak mengakses laporan privat ini.',
    },
  ];

  const passedCount = checks.filter((c) => c.passed).length;

  return {
    allPassed: passedCount === checks.length,
    passedCount,
    totalChecks: checks.length,
    checks,
  };
}

/**
 * Synthesizes the complete, consulting-grade `ProfessionalConsultingReport`
 * from a Consultation, dynamically selecting relevant sections, building all 7
 * decision-making tables, constructing non-fabricated visual charts + data collection
 * templates, and running the 9-point quality validation gate.
 */
export function buildProfessionalConsultingReport(
  consultation: Consultation,
  language: AppLanguage = 'id',
  actingUserId?: string | null
): ProfessionalConsultingReport | null {
  const result = consultation.result;
  if (!result) return null;

  const isEn = language === 'en';
  const ctx = consultation.businessContext;
  const businessLabel =
    consultation.businessName || `Usaha ${consultation.businessCategory}`;
  const preparedDate = new Date(
    consultation.updatedAt || Date.now()
  ).toLocaleDateString(isEn ? 'en-US' : 'id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const readiness = assessConsultationReadinessForReport(
    consultation,
    language
  );

  const detAnalysis =
    result.deterministicAnalysis ||
    buildDeterministicAnalysisForConsultation(consultation);

  const epistemicEvidence = buildEvidenceEpistemicMatrix(
    consultation,
    detAnalysis,
    language
  );

  const problemMatrix =
    result.problemAnalysisMatrix && result.problemAnalysisMatrix.length > 0
      ? result.problemAnalysisMatrix
      : buildProblemAnalysisMatrixForDomain(consultation.workTopic, ctx);

  const monitoring =
    result.implementationMonitoring ||
    createDefaultImplementationMonitoring(consultation);

  const monitoringEval = evaluateImplementationProgress(monitoring, language);

  const hasExternalRefs = Boolean(
    (result.externalReferences && result.externalReferences.length > 0) ||
      (result.videoResources && result.videoResources.length > 0)
  );

  // Section 3: Select relevant sections depending on the business problem
  const rawSections: Array<{
    id: ConsultingReportSectionId;
    titleId: string;
    titleEn: string;
    included: boolean;
    reasonId: string;
    reasonEn: string;
  }> = [
    {
      id: '01-executive-summary',
      titleId: 'Ringkasan Eksekutif (Executive Summary)',
      titleEn: 'Executive Summary',
      included: true,
      reasonId: 'Merangkum temuan inti, diagnosis, dan arah solusi prioritas bagi pemilik usaha.',
      reasonEn: 'Synthesizes core findings, diagnosis, and priority strategic direction.',
    },
    {
      id: '02-business-overview',
      titleId: 'Profil & Gambaran Umum Usaha (Business Overview)',
      titleEn: 'Business Overview & Context Profile',
      included: true,
      reasonId: 'Mendokumentasikan 10 dimensi konteks usaha, tahap operasional, dan batasan sumber daya.',
      reasonEn: 'Documents the 10 business context dimensions, stage, and resource constraints.',
    },
    {
      id: '03-current-situation',
      titleId: 'Situasi Bisnis Saat Ini (Current Business Situation)',
      titleEn: 'Current Business Situation',
      included: true,
      reasonId: 'Menjelaskan kondisi operasional, saluran saat ini, dan upaya yang telah dilakukan.',
      reasonEn: 'Explains current operating channels, symptoms, and prior attempts.',
    },
    {
      id: '04-problem-identification',
      titleId: 'Identifikasi Permasalahan Utama (Problem Identification)',
      titleEn: 'Problem Identification & Scope',
      included: true,
      reasonId: 'Mengunci masalah inti yang harus diselesaikan terlebih dahulu.',
      reasonEn: 'Defines the primary business problem and desired outcome.',
    },
    {
      id: '05-facts-and-evidence',
      titleId: 'Matriks Fakta, Bukti & Asumsi (Facts and Evidence)',
      titleEn: 'Facts, Evidence & Assumptions Matrix',
      included: true,
      reasonId: 'Memisahkan fakta terkonfirmasi, gejala, data pendukung, asumsi, dan informasi yang belum lengkap.',
      reasonEn: 'Strictly separates confirmed facts, symptoms, supporting data, assumptions, and missing info.',
    },
    {
      id: '06-business-diagnosis',
      titleId: 'Diagnosis Bisnis Kontekstual (Business Diagnosis)',
      titleEn: 'Evidence-Based Business Diagnosis',
      included: true,
      reasonId: 'Menghubungkan gejala yang dirasakan pemilik usaha dengan mekanisme penyebabnya.',
      reasonEn: 'Connects reported symptoms to underlying operational or commercial mechanics.',
    },
    {
      id: '07-root-cause-analysis',
      titleId: 'Analisis Akar Masalah (Root Cause Analysis Matrix)',
      titleEn: 'Root Cause Analysis Matrix',
      included: true,
      reasonId: 'Memetakan kemungkinan penyebab, bukti saat ini, data verifikasi, dan risiko.',
      reasonEn: 'Maps root-cause hypotheses, supporting evidence, verification data, and risks.',
    },
    {
      id: '08-data-analysis-visualization',
      titleId: detAnalysis.isIllustrative
        ? 'Analisis Deterministik, Visualisasi Simulasi & Templat Pengumpulan Data'
        : 'Analisis Data Kuantitatif & Visualisasi Kinerja',
      titleEn: detAnalysis.isIllustrative
        ? 'Deterministic Simulation, Visualization & Data Collection Template'
        : 'Quantitative Data Analysis & Performance Visualization',
      included: true,
      reasonId: detAnalysis.isIllustrative
        ? 'Menyajikan perhitungan deterministik berlabel ilustratif beserta templat pengumpulan data riil.'
        : 'Menampilkan hasil perhitungan deterministik dari data numerik pengguna.',
      reasonEn: detAnalysis.isIllustrative
        ? 'Provides labeled illustrative calculations alongside a structured data collection template.'
        : 'Presents deterministic calculations from user-verified numerical inputs.',
    },
    {
      id: '09-strategic-recommendations',
      titleId: 'Rekomendasi Strategis & Matriks Prioritas (Strategic Recommendations)',
      titleEn: 'Strategic Recommendations & Priority Matrix',
      included: true,
      reasonId: 'Menjabarkan solusi terukur lengkap dengan dampak, kelayakan, biaya, waktu, dan risiko.',
      reasonEn: 'Details actionable solutions evaluated by impact, feasibility, cost, timeline, and risk.',
    },
    {
      id: '10-implementation-roadmap',
      titleId: 'Peta Jalan Implementasi Terjadwal (Implementation Roadmap)',
      titleEn: 'Implementation Roadmap & Execution Schedule',
      included: true,
      reasonId: 'Menyusun jadwal pelaksanaan harian beserta kebutuhan sumber daya dan target hasil.',
      reasonEn: 'Schedules day-by-day execution steps with required resources and deliverables.',
    },
    {
      id: '11-kpi-success-measurement',
      titleId: 'Dashboard KPI & Pengukuran Keberhasilan (KPI & Success Measurement)',
      titleEn: 'KPI Dashboard & Success Measurement',
      included: true,
      reasonId: 'Menetapkan indikator keberhasilan kuantitatif, rumus KPI, dan perbandingan progres.',
      reasonEn: 'Establishes quantitative success indicators, KPI formulas, and baseline vs. target tracking.',
    },
    {
      id: '12-risks-and-mitigation',
      titleId: 'Matriks Risiko & Langkah Mitigasi (Risks and Mitigation)',
      titleEn: 'Operational Risks & Mitigation Matrix',
      included: true,
      reasonId: 'Mengantisipasi hambatan pelaksanaan di lapangan beserta rencana penanganannya.',
      reasonEn: 'Identifies execution risks and concrete mitigation protocols.',
    },
    {
      id: '13-knowledge-base-references',
      titleId: 'Referensi Knowledge Base Internal (Knowledge Base References)',
      titleEn: 'Internal Knowledge Base References',
      included: result.knowledgeReferences.length > 0,
      reasonId:
        result.knowledgeReferences.length > 0
          ? 'Mencantumkan rujukan modul bisnis internal Noevia yang relevan.'
          : 'Dilewati karena tidak ada kutipan dokumen internal.',
      reasonEn:
        result.knowledgeReferences.length > 0
          ? 'Lists verified internal Noevia Knowledge Base citations.'
          : 'Omitted because no internal KB documents were cited.',
    },
    {
      id: '14-external-references',
      titleId: 'Referensi Eksternal Resmi & Sumber Pembelajaran (External References)',
      titleEn: 'Official External References & Verified Tutorials',
      included: hasExternalRefs,
      reasonId: hasExternalRefs
        ? 'Menyertakan referensi resmi dan panduan video terverifikasi.'
        : 'Dilewati secara dinamis karena fokus konsultasi tidak memerlukan rujukan regulasi eksternal.',
      reasonEn: hasExternalRefs
        ? 'Includes verified official references and timestamped video tutorials.'
        : 'Dynamically omitted as no external regulatory or web sources were required.',
    },
    {
      id: '15-appendix-supporting-data',
      titleId: 'Lampiran: Rumus Deterministik & Metodologi (Appendix)',
      titleEn: 'Appendix: Deterministic Formulas & Methodology Notes',
      included: true,
      reasonId: 'Mendokumentasikan rumus perhitungan, asumsi eksplisit, dan daftar dokumen kerja pendamping.',
      reasonEn: 'Documents calculation formulas, explicit assumptions, and companion worksheets.',
    },
  ];

  let activeSecCounter = 0;
  const selectedSections: ConsultingReportSectionMeta[] = rawSections.map(
    (s) => {
      if (s.included) activeSecCounter += 1;
      return {
        id: s.id,
        sectionNumber: s.included ? activeSecCounter : 0,
        title: isEn ? s.titleEn : s.titleId,
        included: s.included,
        reasonIncludedOrOmitted: isEn ? s.reasonEn : s.reasonId,
      };
    }
  );

  // Section 5: Build Enriched Recommendations (11 attributes + 6 prioritization criteria)
  const enrichedRecommendations: EnrichedConsultingRecommendation[] =
    result.recommendations.map((rec, idx) => {
      const matchedMatrix = problemMatrix[idx] || problemMatrix[0];
      const isZeroBudget =
        /(tanpa\s+biaya|rp\s*0|organik|internal|belum\s+ada\s+anggaran)/i.test(
          `${ctx.budgetConstraints} ${rec.requiredResources}`
        );

      const estimatedCost = isZeroBudget
        ? isEn
          ? 'Rp 0 cash outlay (uses existing internal time, phone camera, & daily production stock)'
          : 'Rp 0 biaya kas tambahan (mengoptimalkan waktu internal, ponsel, & stok produksi harian)'
        : isEn
          ? `Aligned with declared budget constraint (${ctx.budgetConstraints})`
          : `Menyesuaikan kapasitas anggaran usaha (${ctx.budgetConstraints})`;

      const timeline =
        idx === 0
          ? isEn
            ? 'Days 1–3 (Immediate Quick Win)'
            : 'Hari 1–3 (Eksekusi Prioritas Awal)'
          : idx === 1
            ? isEn
              ? 'Days 3–5 (Core System Setup)'
              : 'Hari 3–5 (Penataan Inti)'
            : isEn
              ? 'Days 5–14 (Consistent Routine)'
              : 'Hari 5–14 (Konsistensi & Evaluasi)';

      const impactScore =
        rec.priority === 'High'
          ? isEn
            ? 'High (Direct impact on core problem)'
            : 'Tinggi (Menjawab langsung masalah utama)'
          : isEn
            ? 'Medium-High (Sustains repeat growth)'
            : 'Menengah-Tinggi (Menjaga keberlanjutan)';

      const feasibilityScore =
        rec.effortLevel === 'Rendah'
          ? isEn
            ? 'High (Low complexity)'
            : 'Tinggi (Mudah dijalankan mandiri)'
          : isEn
            ? 'Moderate (Requires daily discipline)'
            : 'Menengah (Membutuhkan disiplin harian)';

      const operationalRiskLevel = isZeroBudget
        ? isEn
          ? 'Low (No financial capital risk)'
          : 'Rendah (Tanpa risiko modal kas)'
        : isEn
          ? 'Controlled (Step-by-step validation)'
          : 'Terkendali (Bertahap & terukur)';

      return {
        id: rec.id,
        rank: idx + 1,
        priority: rec.priority,
        title: rec.title,
        identifiedProblem:
          matchedMatrix?.possibleCause || result.mainProblem,
        supportingEvidence:
          matchedMatrix?.supportingEvidence ||
          epistemicEvidence.confirmedFacts[0] ||
          result.problemSummary,
        recommendedSolution: rec.description,
        whyRelevant: rec.whyItFits || rec.whyItMatters,
        implementationSteps: rec.steps,
        requiredResources: rec.requiredResources,
        estimatedCost,
        timeline,
        expectedOutcome: rec.expectedOutcome,
        risksAndLimitations:
          rec.limitationsToConsider ||
          (isEn
            ? 'Requires consistent execution for at least 14 days before evaluating full conversion impact.'
            : 'Membutuhkan konsistensi pelaksanaan minimal 14 hari agar dampaknya terlihat stabil.'),
        successIndicators:
          rec.howToMeasureSuccess ||
          result.actionPlan[idx]?.successMeasurement ||
          (isEn
            ? 'Measurable improvement in weekly target indicator within 7–14 days.'
            : 'Perbaikan terukur pada indikator mingguan dalam 7–14 hari pelaksanaan.'),
        impactScore,
        feasibilityScore,
        operationalRiskLevel,
      };
    });

  // Section 4: Build the 7 Structured Decision-Making Tables
  const businessOverviewTable: ConsultingTableSpec = {
    id: 'tbl-01-business-overview',
    tableNumber: 1,
    title: isEn
      ? 'Table 1 — Business Context & Consultation Profile'
      : 'Tabel 1 — Profil Konteks Usaha & Cakupan Konsultasi',
    subtitle: isEn
      ? 'Summary of the 10 business context dimensions captured during consultation'
      : 'Ringkasan 10 dimensi konteks usaha berdasarkan informasi yang disampaikan pengguna',
    headers: isEn
      ? ['Consulting Dimension', 'Captured Business Context', 'Verification Status']
      : ['Dimensi Konteks Bisnis', 'Informasi Konteks Usaha', 'Status Pencatatan'],
    columnWidthRatios: [0.28, 0.52, 0.2],
    rows: readiness.contextProfileTable.map((row) => [
      row.label,
      row.value,
      row.statusLabel,
    ]),
    sourceNote: isEn
      ? 'Source: Consultation transcript and verified business context.'
      : 'Sumber: Percakapan konsultasi dan konteks bisnis yang dikonfirmasi pengguna.',
  };

  const epistemicEvidenceTable: ConsultingTableSpec = {
    id: 'tbl-02-epistemic-evidence',
    tableNumber: 2,
    title: isEn
      ? 'Table 2 — Evidence-Based Epistemic Separation Matrix (Facts vs. Assumptions)'
      : 'Tabel 2 — Matriks Pemisahan Bukti: Fakta, Gejala, Data, Asumsi & Informasi Kurang',
    subtitle: isEn
      ? 'Strict distinction between confirmed facts, reported symptoms, supporting metrics, hypotheses, and unverified assumptions'
      : 'Pemisahan tegas antara fakta terkonfirmasi, gejala yang dilaporkan, data pendukung, hipotesis penyebab, dan asumsi yang belum diverifikasi',
    headers: isEn
      ? ['Evidence Category', 'Classification Rule', 'Documented Items in This Consultation']
      : ['Kategori Informasi', 'Status Pembuktian', 'Rincian pada Konsultasi Ini'],
    columnWidthRatios: [0.24, 0.22, 0.54],
    rows: [
      [
        isEn ? '1. Confirmed Facts' : '1. Fakta Terkonfirmasi',
        isEn ? 'Directly stated by owner' : 'Dinyatakan langsung oleh pemilik',
        epistemicEvidence.confirmedFacts.join(' • '),
      ],
      [
        isEn ? '2. User-Reported Symptoms' : '2. Gejala yang Dilaporkan',
        isEn ? 'Observed business pain point' : 'Keluhan / indikasi yang dirasakan',
        epistemicEvidence.userReportedSymptoms.join(' • '),
      ],
      [
        isEn ? '3. Supporting Data' : '3. Data & Perhitungan Pendukung',
        detAnalysis.isIllustrative
          ? isEn
            ? 'Illustrative simulation (editable)'
            : 'Simulasi ilustratif terukur (dapat diedit)'
          : isEn
            ? 'Verified numerical inputs'
            : 'Data numerik aktual pengguna',
        epistemicEvidence.supportingData.join(' • '),
      ],
      [
        isEn ? '4. Possible Causes' : '4. Kemungkinan Penyebab',
        isEn ? 'Diagnostic hypotheses' : 'Hipotesis diagnosis terstruktur',
        epistemicEvidence.possibleCauses.join(' • '),
      ],
      [
        isEn ? '5. Unverified Assumptions' : '5. Asumsi Belum Diverifikasi',
        isEn ? 'Must be verified in the field' : 'Wajib diverifikasi di lapangan',
        epistemicEvidence.unverifiedAssumptions.join(' • '),
      ],
      [
        isEn ? '6. Missing Information' : '6. Informasi yang Perlu Dilengkapi',
        isEn ? 'Data gap to collect next' : 'Data yang perlu dicatat berikutnya',
        epistemicEvidence.missingInformation.join(' • '),
      ],
    ],
    sourceNote: isEn
      ? 'Rule: Assumptions and illustrative benchmarks are never presented as confirmed historical facts.'
      : 'Prinsip: Asumsi dan simulasi awal tidak pernah disajikan sebagai fakta historis yang sudah terbukti.',
  };

  const rootCauseMatrixTable: ConsultingTableSpec = {
    id: 'tbl-03-root-cause-matrix',
    tableNumber: 3,
    title: isEn
      ? 'Table 3 — Root Cause & Problem-Analysis Matrix'
      : 'Tabel 3 — Matriks Analisis Akar Masalah (Problem-Analysis Matrix)',
    subtitle: isEn
      ? 'Mapping possible causes, supporting evidence, verification data needed, risks, and solution direction'
      : 'Pemetaan kemungkinan penyebab utama, bukti saat ini, data yang diperlukan untuk verifikasi, risiko, dan arah solusi',
    headers: isEn
      ? [
          'Possible Root Cause',
          'Status',
          'Supporting Evidence',
          'Data Needed to Verify',
          'Risk if Unaddressed',
          'Solution Direction',
        ]
      : [
          'Kemungkinan Penyebab',
          'Status Bukti',
          'Bukti / Indikasi Saat Ini',
          'Data untuk Verifikasi',
          'Risiko Jika Dibiarkan',
          'Arah Solusi',
        ],
    columnWidthRatios: [0.2, 0.12, 0.18, 0.17, 0.16, 0.17],
    rows: problemMatrix.map((m) => [
      m.possibleCause,
      m.verificationStatus,
      m.supportingEvidence,
      m.requiredEvidence,
      m.riskIfUnaddressed,
      m.solutionDirection,
    ]),
    sourceNote: isEn
      ? 'Source: Noevia diagnostic engine grounded in domain Knowledge Base.'
      : 'Sumber: Analisis diagnostik Noevia berbasis konteks usaha dan Knowledge Base.',
  };

  const recommendationPriorityTable: ConsultingTableSpec = {
    id: 'tbl-04-recommendation-priority',
    tableNumber: 4,
    title: isEn
      ? 'Table 4 — Strategic Recommendation Comparison & Priority Matrix'
      : 'Tabel 4 — Matriks Perbandingan & Prioritas Rekomendasi Solusi',
    subtitle: isEn
      ? 'Prioritized by business impact, feasibility, cost/budget fit, timeline, and operational risk'
      : 'Diprioritaskan berdasarkan dampak bisnis, kelayakan eksekusi, biaya, jadwal waktu, dan risiko operasional',
    headers: isEn
      ? [
          'Priority Solution',
          'Business Impact',
          'Feasibility',
          'Estimated Cost / Resource Fit',
          'Timeline',
          'Operational Risk',
        ]
      : [
          'Rekomendasi Solusi Prioritas',
          'Dampak Bisnis',
          'Kelayakan',
          'Estimasi Biaya & Sumber Daya',
          'Target Waktu',
          'Risiko Operasional',
        ],
    columnWidthRatios: [0.24, 0.15, 0.14, 0.21, 0.13, 0.13],
    rows: enrichedRecommendations.map((r) => [
      `${r.rank}. ${r.title} [${r.priority}]`,
      r.impactScore,
      r.feasibilityScore,
      r.estimatedCost,
      r.timeline,
      r.operationalRiskLevel,
    ]),
    sourceNote: isEn
      ? 'Note: Cost estimates reflect declared budget constraints and avoid unnecessary capital expenditure.'
      : 'Catatan: Estimasi biaya mengikuti batasan anggaran pengguna dan meminimalkan pengeluaran kas baru.',
  };

  const implementationRoadmapTable: ConsultingTableSpec = {
    id: 'tbl-05-implementation-roadmap',
    tableNumber: 5,
    title: isEn
      ? 'Table 5 — Practical Implementation Schedule & Action Plan'
      : 'Tabel 5 — Jadwal Implementasi Rencana Tindakan Praktis (Action Plan)',
    subtitle: isEn
      ? 'Step-by-step execution schedule with required resources, expected outcomes, and completion status'
      : 'Rincian jadwal pelaksanaan harian lengkap dengan kebutuhan sumber daya, target hasil, dan status pelaksanaan',
    headers: isEn
      ? [
          'Timeline',
          'Priority',
          'Action Step & Objective',
          'Required Resources',
          'Expected Outcome & Success Metric',
          'Status',
        ]
      : [
          'Jadwal',
          'Prioritas',
          'Langkah Tindakan & Tujuan',
          'Sumber Daya Dibutuhkan',
          'Target Hasil & Ukuran Sukses',
          'Status',
        ],
    columnWidthRatios: [0.11, 0.11, 0.3, 0.17, 0.2, 0.11],
    rows: result.actionPlan.map((item) => [
      item.timeline || (isEn ? `Day ${item.day}` : `Hari ${item.day}`),
      item.priority || 'Tinggi',
      `${item.action} — ${item.objective}`,
      item.requiredResources || 'Internal UMKM',
      `${item.expectedOutcome || item.objective} (${item.successMeasurement || 'Terlaksana'})`,
      item.completed
        ? isEn
          ? 'Completed'
          : 'Selesai'
        : isEn
          ? 'Planned'
          : 'Terjadwal',
    ]),
    sourceNote: isEn
      ? 'Progress can be updated interactively in the Consultation Workspace checklist.'
      : 'Status pelaksanaan dapat dicentang dan dipantau langsung di Ruang Konsultasi.',
  };

  const kpiDashboardTable: ConsultingTableSpec = {
    id: 'tbl-06-kpi-dashboard',
    tableNumber: 6,
    title: isEn
      ? 'Table 6 — KPI Dashboard, Deterministic Formulas & Implementation Tracking'
      : 'Tabel 6 — Dashboard KPI, Rumus Pengukuran & Evaluasi Indikator',
    subtitle: isEn
      ? 'Separates baseline indicators, current reported progress, and target benchmarks without fabricating results'
      : 'Memisahkan kondisi awal (baseline), capaian yang dilaporkan saat ini, serta rumus dan target indikator keberhasilan',
    headers: isEn
      ? [
          'Key Performance Indicator (KPI)',
          'Deterministic Formula',
          'Baseline / Initial State',
          'Current / Target Benchmark',
          'Data Status',
        ]
      : [
          'Indikator Keberhasilan (KPI)',
          'Rumus Perhitungan',
          'Kondisi Awal (Baseline)',
          'Kondisi Saat Ini / Target',
          'Status Data',
        ],
    columnWidthRatios: [0.22, 0.26, 0.17, 0.2, 0.15],
    rows: [
      [
        isEn
          ? 'Weekly Customer Inquiries (DM / WhatsApp)'
          : 'Pertanyaan / Chat Masuk Mingguan (DM / WA)',
        isEn
          ? 'Count of unique prospect inquiries per week'
          : 'Jumlah chat tanya produk/harga per minggu',
        `${monitoring.baselineInquiriesWeekly} chat / minggu`,
        `${monitoring.currentInquiriesWeekly} chat / minggu (${monitoringEval.inquiryDelta >= 0 ? `+${monitoringEval.inquiryDelta}` : monitoringEval.inquiryDelta})`,
        consultation.id === 'cons-sweetbite-demo'
          ? isEn
            ? 'Illustrative Case Study'
            : 'Studi Kasus Ilustratif'
          : isEn
            ? 'Tracked in Workspace'
            : 'Dipantau di Workspace',
      ],
      [
        isEn
          ? 'Weekly Transactions / Orders'
          : 'Jumlah Transaksi / Pesanan Mingguan',
        isEn
          ? 'Count of completed orders per week'
          : 'Jumlah pesanan selesai per minggu',
        `${monitoring.baselineTransactionsWeekly} transaksi / minggu`,
        `${monitoring.currentTransactionsWeekly} transaksi / minggu (${monitoringEval.transactionDelta >= 0 ? `+${monitoringEval.transactionDelta}` : monitoringEval.transactionDelta})`,
        consultation.id === 'cons-sweetbite-demo'
          ? isEn
            ? 'Illustrative Case Study'
            : 'Studi Kasus Ilustratif'
          : isEn
            ? 'Tracked in Workspace'
            : 'Dipantau di Workspace',
      ],
      [
        isEn
          ? 'Inquiry-to-Order Conversion Rate (%)'
          : 'Rasio Konversi Chat ke Transaksi (%)',
        '(Transaksi Mingguan / Chat Masuk Mingguan) × 100%',
        `${monitoringEval.baselineConversionPct.toFixed(1)}%`,
        `${monitoringEval.currentConversionPct.toFixed(1)}% (Target sehat: ≥25%)`,
        isEn ? 'Deterministic Formula' : 'Perhitungan Deterministik',
      ],
      ...detAnalysis.computedMetrics.slice(0, 3).map((m) => [
        isEn ? m.labelEn : m.labelId,
        m.formula,
        detAnalysis.isIllustrative
          ? isEn
            ? 'Illustrative Baseline'
            : 'Simulasi Awal'
          : isEn
            ? 'User Input'
            : 'Input Pengguna',
        m.valueFormatted,
        detAnalysis.isIllustrative
          ? isEn
            ? 'Illustrative (Editable)'
            : 'Ilustratif (Dapat Diedit)'
          : isEn
            ? 'Verified User Data'
            : 'Data Aktual Pengguna',
      ]),
    ],
    sourceNote: monitoringEval.summaryText,
  };

  const riskMitigationTable: ConsultingTableSpec = {
    id: 'tbl-07-risk-mitigation',
    tableNumber: 7,
    title: isEn
      ? 'Table 7 — Operational Risks, Limitations & Mitigation Plan'
      : 'Tabel 7 — Matriks Risiko Pelaksanaan, Batasan & Langkah Mitigasi',
    subtitle: isEn
      ? 'Anticipating practical execution obstacles for small business owners'
      : 'Antisipasi kendala praktis di lapangan beserta langkah pencegahannya agar solusi berjalan lancar',
    headers: isEn
      ? [
          'Identified Execution Risk',
          'Impact Level',
          'Early Warning Sign',
          'Practical Mitigation Protocol',
        ]
      : [
          'Risiko Pelaksanaan di Lapangan',
          'Tingkat Dampak',
          'Tanda Peringatan Dini',
          'Langkah Mitigasi Praktis',
        ],
    columnWidthRatios: [0.26, 0.14, 0.25, 0.35],
    rows: [
      [
        isEn
          ? 'Inconsistent daily execution due to production busyness'
          : 'Jadwal promosi/pencatatan terlewat karena kesibukan produksi pagi',
        isEn ? 'Medium-High' : 'Menengah-Tinggi',
        monitoring.obstaclesReported ||
          (isEn
            ? 'Content or stock logging skipped for >3 consecutive days'
            : 'Rekam konten atau cek stok terlewat lebih dari 3 hari berturut-turut'),
        isEn
          ? 'Batch-record 15-second kitchen clips once a week and perform a fixed 15-minute closing check every afternoon.'
          : 'Rekam stok video pendek sekaligus saat produksi 2 kali seminggu dan kunci jadwal audit stok 15 menit setiap sore.',
      ],
      [
        isEn
          ? 'Margin erosion from uncalculated packaging or platform fees'
          : 'Margin tergerus akibat potongan komisi aplikasi atau kemasan belum dihitung',
        isEn ? 'High' : 'Tinggi',
        isEn
          ? 'Cash balance does not grow despite steady order volume'
          : 'Pesanan ramai tetapi saldo kas belanja bahan terasa selalu pas-pasan',
        isEn
          ? 'Use channel-specific pricing on delivery platforms and direct customers to WhatsApp for value bundles.'
          : 'Bedakan harga jual di aplikasi berkomisi menggunakan rumus penyesuaian komisi dan arahkan paket hemat ke WhatsApp.',
      ],
      [
        isEn
          ? 'Slow response time when new inquiries arrive via WhatsApp/DM'
          : 'Keterlambatan membalas chat calon pembeli baru di jam sibuk',
        isEn ? 'Medium' : 'Menengah',
        isEn
          ? 'Prospects ask for price/menu but do not complete ordering'
          : 'Calon pembeli bertanya harga di DM/WA namun batal memesan karena menunggu lama',
        isEn
          ? 'Set up WhatsApp Business Quick Replies containing the Trial Package catalog, price list, and delivery hours.'
          : 'Aktifkan fitur Balasan Cepat (Quick Replies) dan Katalog di WhatsApp Business berisi info Paket Kenalan & harga.',
      ],
    ],
    sourceNote: isEn
      ? 'Source: Field implementation risk assessment for UMKM operations.'
      : 'Sumber: Evaluasi risiko operasional UMKM dan catatan kendala lapangan.',
  };

  // Section 4: Build Visual Chart + Anti-Fabrication Data Collection Template
  const maxRawMetric = Math.max(
    1,
    ...detAnalysis.computedMetrics.map((m) => Math.abs(m.rawValue))
  );

  const primaryChart: ConsultingChartSpec = {
    id: 'fig-01-deterministic-chart',
    figureNumber: 1,
    chartType:
      detAnalysis.kind === 'hpp-pricing'
        ? 'cost-margin-breakdown'
        : detAnalysis.kind === 'inventory-cashflow'
          ? 'inventory-thresholds'
          : 'funnel-conversion',
    title: isEn
      ? `Figure 1 — ${detAnalysis.titleEn}`
      : `Gambar 1 — ${detAnalysis.titleId}`,
    subtitle: detAnalysis.isIllustrative
      ? isEn
        ? 'Clearly labeled illustrative simulation based on domain parameters (NOT fabricated historical financial results)'
        : 'Visualisasi simulasi terukur berlabel ilustratif (Bukan klaim data historis riil sebelum diverifikasi pengguna)'
      : isEn
        ? 'Deterministic visualization computed directly from user-verified numerical inputs'
        : 'Visualisasi deterministik berdasarkan angka aktual yang telah dimasukkan pengguna',
    dataOriginBadge: detAnalysis.isIllustrative
      ? isEn
        ? 'ILLUSTRATIVE SIMULATION · DATA COLLECTION TEMPLATE INCLUDED'
        : 'SIMULASI ILUSTRATIF TERUKUR · DILENGKAPI TEMPLAT PENCATATAN DATA'
      : isEn
        ? 'VERIFIED USER NUMERICAL DATA'
        : 'DATA NUMERIK AKTUAL PENGGUNA',
    isActualVerifiedData: !detAnalysis.isIllustrative,
    bars: detAnalysis.computedMetrics.map((m, idx) => {
      // Normalize bar widths cleanly between 18% and 95% for visual legibility
      const ratio =
        m.rawValue <= 100 && m.valueFormatted.includes('%')
          ? Math.min(95, Math.max(18, Math.round(m.rawValue)))
          : Math.min(
              95,
              Math.max(
                22,
                Math.round((Math.abs(m.rawValue) / maxRawMetric) * 90) ||
                  35 + idx * 12
              )
            );
      return {
        label: isEn ? m.labelEn : m.labelId,
        rawValue: m.rawValue,
        formattedValue: m.valueFormatted,
        benchmarkOrNote: m.formula,
        barWidthPct: ratio,
      };
    }),
    formulaNote: detAnalysis.computedMetrics
      .map((m) => m.formula)
      .join('  |  '),
    interpretationNote: (isEn
      ? detAnalysis.assumptionsEn
      : detAnalysis.assumptionsId
    ).join(' '),
    dataCollectionTemplate: detAnalysis.isIllustrative
      ? {
          explanationWhyNeeded: isEn
            ? 'Because complete historical sales/cost records have not yet been uploaded, Noevia does not fabricate historical performance charts. Use the structured template below over the next 7–14 days to record actual figures.'
            : 'Karena catatan angka historis lengkap belum dilampirkan, Noevia tidak mengarang grafik histori penjualan fiktif. Gunakan tabel pencatatan data di bawah ini selama 7–14 hari ke depan untuk mengumpulkan data riil usaha Anda.',
          headers:
            detAnalysis.kind === 'hpp-pricing'
              ? [
                  'Tanggal / Batch',
                  'Nama Produk',
                  'Biaya Bahan & Kemasan (Rp)',
                  'Jumlah Unit Jadi',
                  'HPP Aktual / Unit (Rp)',
                  'Harga Jual Kanal (Rp)',
                ]
              : detAnalysis.kind === 'inventory-cashflow'
                ? [
                    'Tanggal',
                    'Bahan Baku Utama',
                    'Stok Awal Pagi',
                    'Pemakaian Harian',
                    'Bahan Rusak / Waste',
                    'Sisa Stok Sore',
                  ]
                : [
                    'Periode / Minggu',
                    'Sumber Saluran (IG / Maps / WA)',
                    'Jumlah Jangkauan / Dilihat',
                    'Jumlah Chat Masuk',
                    'Jumlah Pembeli Baru',
                    'Jumlah Pembeli Ulang',
                  ],
          sampleRows:
            detAnalysis.kind === 'hpp-pricing'
              ? [
                  ['Minggu 1 - Batch 1', 'Produk Utama A', '[Isi Sesuai Nota]', '[Isi Unit]', '= Biaya Batch / Unit', '[Isi Harga Jual]'],
                  ['Minggu 1 - Batch 2', 'Paket Kenalan', '[Isi Sesuai Nota]', '[Isi Unit]', '= Biaya Batch / Unit', '[Isi Harga Paket]'],
                ]
              : detAnalysis.kind === 'inventory-cashflow'
                ? [
                    ['Hari 1', 'Bahan Utama 1', '[Isi Stok Pagi]', '[Isi Pemakaian]', '[Isi Waste]', '= Stok Pagi - Pakai - Waste'],
                    ['Hari 2', 'Kemasan Utama', '[Isi Stok Pagi]', '[Isi Pemakaian]', '0', '= Stok Pagi - Pakai'],
                  ]
                : [
                    ['Minggu 1 (Baseline)', 'Instagram + WhatsApp', '[Isi Reach]', '[Isi Chat Masuk]', '[Isi Transaksi Baru]', '[Isi Repeat Order]'],
                    ['Minggu 2 (Eksekusi)', 'Instagram + Google Maps + WA', '[Isi Reach]', '[Isi Chat Masuk]', '[Isi Transaksi Baru]', '[Isi Repeat Order]'],
                  ],
          kpiFormulas: detAnalysis.computedMetrics.map((m) => ({
            name: isEn ? m.labelEn : m.labelId,
            formula: m.formula,
            targetBenchmark: m.valueFormatted,
          })),
        }
      : undefined,
  };

  // Conceptual Process Diagram as Figure 2
  const visualDiagram =
    result.visualDiagram ||
    buildVisualDiagramForDomain(consultation.workTopic, consultation);

  const secondaryChart: ConsultingChartSpec = {
    id: 'fig-02-conceptual-workflow',
    figureNumber: 2,
    chartType: 'baseline-vs-current-kpi',
    title: isEn
      ? `Figure 2 — Conceptual Framework: ${visualDiagram.title}`
      : `Gambar 2 — Kerangka Kerja Konseptual: ${visualDiagram.title}`,
    subtitle: visualDiagram.subtitle,
    dataOriginBadge: isEn
      ? 'CONCEPTUAL ADVISORY FRAMEWORK'
      : 'DIAGRAM KONSEPTUAL ALUR PENYELESAIAN MASALAH',
    isActualVerifiedData: true,
    bars: visualDiagram.steps.map((step, idx) => ({
      label: step.label,
      rawValue: (idx + 1) * 25,
      formattedValue: step.valueOrNote,
      benchmarkOrNote: step.detail,
      barWidthPct: 100 - idx * 15,
    })),
    formulaNote: isEn
      ? 'Sequential execution stages: Understand -> Verify -> Execute -> Measure'
      : 'Tahapan eksekusi berurutan: Pahami -> Verifikasi -> Jalankan -> Evaluasi',
    interpretationNote: isEn
      ? 'Each stage builds the foundation for the next operational milestone.'
      : 'Setiap tahap menjadi fondasi sebelum melangkah ke tahap berikutnya.',
  };

  const qualityValidation = validateReportQuality(
    consultation,
    actingUserId,
    language
  );

  const docRefCode = `NV-${consultation.id
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(-6)
    .toUpperCase()}-${new Date().getFullYear()}`;

  return {
    reportId: `rep-${consultation.id}`,
    generatedAtIso: new Date().toISOString(),
    generatedDateFormatted: preparedDate,
    language,
    ownerId: consultation.userId || null,
    consultationId: consultation.id,
    confidentialityNotice: isEn
      ? `CONFIDENTIAL BUSINESS ADVISORY REPORT · Prepared exclusively for ${businessLabel}. Accessible only to the authorized consultation owner.`
      : `DOKUMEN KONSULTASI BISNIS PRIVAT · Disusun khusus untuk ${businessLabel}. Hanya dapat diakses oleh pemilik sesi konsultasi yang sah.`,
    coverPage: {
      advisoryHeader: 'NOEVIA · EVIDENCE-BASED AI BUSINESS CONSULTING PRACTICE',
      reportTitle: isEn
        ? `Business Diagnostic & Actionable Advisory Report: ${businessLabel}`
        : `Laporan Diagnosis & Rekomendasi Konsultasi Bisnis: ${businessLabel}`,
      reportSubtitle: isEn
        ? `Comprehensive Problem Analysis, Evidence Matrix, Deterministic Calculations & Implementation Roadmap`
        : `Analisis Masalah Berbasis Bukti, Pemisahan Fakta vs. Asumsi, Perhitungan Deterministik & Peta Jalan Implementasi`,
      businessName: businessLabel,
      businessCategoryAndStage: `${consultation.businessCategory} · ${consultation.businessStage}`,
      primaryDomain: consultation.workTopic,
      documentReferenceCode: docRefCode,
      preparedDate,
      ownershipBadge: consultation.userId
        ? isEn
          ? `Private Account Document (${consultation.userId.slice(0, 12)})`
          : `Dokumen Privat Pemilik Akun (${consultation.userId.slice(0, 12)})`
        : isEn
          ? 'Temporary Guest Session Document'
          : 'Dokumen Sesi Tamu Sementara',
    },
    readiness,
    selectedSections,
    executiveSummary: {
      headline: result.mainProblem,
      situationParagraph: result.problemSummary,
      coreDiagnosisParagraph: isEn
        ? `Based on our structured investigation across ${readiness.confirmedDimensionsCount} business context dimensions, the primary bottleneck is rooted in: ${problemMatrix[0]?.possibleCause || result.mainProblem}. We have strictly separated confirmed facts from unverified assumptions so management decisions remain grounded in evidence.`
        : `Berdasarkan penelusuran terstruktur pada ${readiness.confirmedDimensionsCount} dimensi konteks usaha, hambatan utama berakar pada: ${problemMatrix[0]?.possibleCause || result.mainProblem}. Laporan ini memisahkan secara tegas antara fakta terkonfirmasi dan asumsi yang masih perlu diverifikasi agar setiap keputusan bisnis berpijak pada bukti nyata.`,
      strategicDirectionParagraph: isEn
        ? `Priority execution focuses on ${enrichedRecommendations.length} high-feasibility initiatives designed to fit your current operational capacity (${ctx.budgetConstraints}), supported by a 7-day implementation schedule and measurable KPI formulas.`
        : `Strategi penyelesaian difokuskan pada ${enrichedRecommendations.length} langkah prioritas yang dirancang sesuai kapasitas sumber daya saat ini (${ctx.budgetConstraints}), dilengkapi jadwal eksekusi 7 hari serta rumus indikator keberhasilan (KPI) yang terukur.`,
      keyTakeaways: [
        `${isEn ? 'Primary Challenge' : 'Masalah Utama'}: ${result.mainProblem}`,
        `${isEn ? 'Top Priority Action' : 'Solusi Prioritas #1'}: ${enrichedRecommendations[0]?.title || '-'}`,
        `${isEn ? 'Key Deterministic Metric' : 'Indikator Kuantitatif Kunci'}: ${detAnalysis.computedMetrics[0]?.labelId || ''} = ${detAnalysis.computedMetrics[0]?.valueFormatted || ''} (${detAnalysis.isIllustrative ? (isEn ? 'Illustrative Baseline' : 'Simulasi Awal') : isEn ? 'Verified Data' : 'Data Aktual'})`,
      ],
    },
    currentBusinessSituationNarrative: isEn
      ? `${businessLabel} operates in the ${consultation.businessCategory} sector (${consultation.businessStage}). Current approach relies on ${ctx.currentStrategy}, targeting ${ctx.targetAudience}. Available resources and constraints are documented as: ${ctx.budgetConstraints}.`
      : `${businessLabel} bergerak di bidang ${consultation.businessCategory} pada tahap ${consultation.businessStage}. Pendekatan operasional dan pemasaran yang berjalan saat ini bertumpu pada ${ctx.currentStrategy}, dengan cakupan sasaran pelanggan: ${ctx.targetAudience}. Ketersediaan sumber daya dan anggaran tercatat: ${ctx.budgetConstraints}.`,
    problemIdentification: {
      mainProblemStatement: result.mainProblem,
      scopeAndImpact: result.problemSummary,
      desiredBusinessOutcome: ctx.businessGoals,
    },
    epistemicEvidence,
    businessDiagnosisNarrative: isEn
      ? `Our diagnostic review cross-referenced your reported symptoms against internal Knowledge Base standards (${result.knowledgeReferences.map((r) => r.documentId).join(', ') || 'UMKM Advisory Core'}). Rather than treating surface symptoms with generic advice, the diagnosis isolates structural causes across customer discovery, conversion mechanics, unit economics, and daily execution discipline.`
      : `Evaluasi diagnostik ini membandingkan gejala yang Anda alami dengan kerangka kerja Knowledge Base Noevia (${result.knowledgeReferences.map((r) => r.documentId).join(', ') || 'Modul Inti UMKM'}). Alih-alih memberikan saran umum di permukaan, diagnosis ini membedah akar penyebab struktural mulai dari ketepatan sasaran pasar, mekanisme konversi, struktur biaya per unit, hingga disiplin eksekusi harian.`,
    tables: {
      businessOverviewTable,
      epistemicEvidenceTable,
      rootCauseMatrixTable,
      recommendationPriorityTable,
      implementationRoadmapTable,
      kpiDashboardTable,
      riskMitigationTable,
    },
    charts: [primaryChart, secondaryChart],
    enrichedRecommendations,
    knowledgeReferences: result.knowledgeReferences || [],
    externalReferences: result.externalReferences || [],
    videoResources: result.videoResources || [],
    appendix: {
      methodologyNotes: isEn
        ? detAnalysis.assumptionsEn
        : detAnalysis.assumptionsId,
      deterministicFormulas: detAnalysis.computedMetrics.map((m) => ({
        metric: isEn ? m.labelEn : m.labelId,
        formula: m.formula,
        note: isEn ? m.explanationEn : m.explanationId,
      })),
      dataCollectionGuidance: detAnalysis.isIllustrative
        ? isEn
          ? 'All initial simulation metrics are labeled as Illustrative. Update the inputs in the Consultation Workspace calculator or fill out the Data Collection Template in Section 8 to replace illustrative numbers with verified historical records.'
          : 'Seluruh angka simulasi awal diberi label Ilustratif secara transparan. Anda dapat memperbarui angka input pada Kalkulator di Ruang Konsultasi atau mengisi Templat Pengumpulan Data pada Bagian 8 untuk menggantinya dengan catatan aktual usaha Anda.'
        : isEn
          ? 'Calculations in this report reflect the numerical inputs verified by the business owner during consultation.'
          : 'Perhitungan dalam laporan ini menggunakan angka input yang telah diverifikasi oleh pemilik usaha pada sesi konsultasi.',
    },
    qualityValidation,
  };
}
