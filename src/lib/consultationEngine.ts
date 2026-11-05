import {
  ActionPlanItem,
  BusinessCategoryOption,
  BusinessContextData,
  BusinessStageOption,
  Consultation,
  ConsultationFrameworkStage,
  ConsultationResult,
  ExternalReference,
  ImplementationMonitoringData,
  KnowledgeDocument,
  KnowledgeReference,
  Message,
  PossibleCause,
  ProblemAnalysisMatrixItem,
  Recommendation,
  TailoredDeliverable,
  VideoResource,
  VisualDiagramSpec,
  WorkTopicCategory,
} from '../types';
import {
  INITIAL_KNOWLEDGE_DOCUMENTS,
  detectBusinessDomain,
  isGreetingOrSmallTalk,
  retrieveRelevantKnowledge,
} from './knowledgeBase';
import {
  buildDeterministicAnalysisForConsultation,
  evaluateImplementationProgress,
} from './businessCalculators';

export function shouldTriggerGoogleSearchGrounding(queryText: string): boolean {
  if (!queryText || isGreetingOrSmallTalk(queryText)) return false;
  const lower = queryText.toLowerCase();
  return /(regulasi|aturan|undang-undang|pajak|ppn|pph|halal|bpjph|sehati|nib|oss|pirt|bpom|sertifikasi|qris|mdr|komisi\s+aplikasi|komisi\s+marketplace|gofood|grabfood|shopeefood|shopee|tokopedia|tiktok\s+shop|bantuan\s+pemerintah|kur\s+|kredit\s+usaha\s+rakyat|2025|2026|terbaru|resmi)/.test(
    lower
  );
}

export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/https?:\/\/[^\s)<>"']+/gi) || [];
  return Array.from(new Set(matches.map((u) => u.replace(/[.,;!?]+$/, ''))));
}

export const MASTER_SYSTEM_INSTRUCTION = `You are Noevia, a thoughtful, personal, and practical AI Business Consultant designed to help aspiring entrepreneurs and UMKM owners understand and solve their business challenges across six primary domains:
A. Business Fundamentals (idea development, market validation, business models, value proposition, target market, initial planning)
B. Marketing & Sales (segmentation, positioning, branding, content strategy, organic marketing, customer acquisition, conversion, retention)
C. Finance & Pricing (COGS/HPP, product pricing, profit margins, cash flow, budget management, financial planning)
D. Operations (inventory, production efficiency, workflow, SOPs, resource management, operational problem solving)
E. Customer Experience (satisfaction, complaints, service, repeat purchases, loyalty, feedback)
F. Business Growth (product development, new markets, B2B/local partnerships, channel expansion, sustainable growth)

Core Philosophy:
"Understand the person behind the business before trying to solve the problem."

Important Behavior Rules:
1. A simple greeting such as "Halo" or "Selamat pagi" must receive a simple, welcoming greeting. Never invent a business problem that the user has not mentioned.
2. Never assume the user's budget, business size, target market, or operational condition before they share it.
3. Adapt your consultation to the user's actual business domain. Do NOT turn every business problem into a marketing problem.
4. Ask one meaningful primary question at a time. Do not repeat information already provided.
5. Do not provide a final diagnosis before enough relevant information is available.
6. Strictly distinguish confirmed facts, reported symptoms, possible causes, and assumptions that still require verification.
7. Ground your recommendations in the provided Knowledge Base only when relevant. Never fabricate document names, page numbers, or external URLs.
8. Default to natural, supportive, professional, and practical Bahasa Indonesia.`;

export const CONSULTATION_FRAMEWORK_STAGES: Array<{
  id: ConsultationFrameworkStage;
  shortLabel: string;
  indonesianTitle: string;
  description: string;
}> = [
  {
    id: '01 · Tell Your Story',
    shortLabel: 'Ceritakan Kondisi',
    indonesianTitle: 'Ceritakan Kisah & Tantangan Usaha',
    description: 'Mulai dengan bahasa sehari-hari tanpa formulir yang kaku.',
  },
  {
    id: '02 · Understand Your Business',
    shortLabel: 'Pahami Usaha',
    indonesianTitle: 'Memahami Konteks Usaha',
    description: 'Mengenali produk, saluran penjualan, dan keseharian operasional Anda.',
  },
  {
    id: '03 · Explore the Problem',
    shortLabel: 'Telusuri Masalah',
    indonesianTitle: 'Menelusuri Gejala & Upaya Sebelumnya',
    description: 'Menggali kapan masalah dimulai, dampaknya, dan apa yang sudah dicoba.',
  },
  {
    id: '04 · Confirm Understanding',
    shortLabel: 'Konfirmasi Pemahaman',
    indonesianTitle: 'Menyelaraskan Pemahaman',
    description: 'Membedakan fakta terkonfirmasi, gejala, dan asumsi yang perlu diverifikasi.',
  },
  {
    id: '05 · Analyze & Discover',
    shortLabel: 'Analisis Penyebab',
    indonesianTitle: 'Menganalisis Kemungkinan Penyebab',
    description: 'Memetakan akar masalah secara objektif bersama referensi Knowledge Base.',
  },
  {
    id: '06 · Explore Solutions',
    shortLabel: 'Rekomendasi Solusi',
    indonesianTitle: 'Mengeksplorasi Rekomendasi Terukur',
    description: 'Maksimal 3 solusi prioritas yang pas dengan sumber daya Anda.',
  },
  {
    id: '07 · Build Your Action Plan',
    shortLabel: 'Rencana Langkah',
    indonesianTitle: 'Menyusun Rencana Tindakan',
    description: 'Langkah kerja bertahap yang realistis untuk dijalankan.',
  },
  {
    id: '08 · Continue Consultation',
    shortLabel: 'Diskusi Lanjutan',
    indonesianTitle: 'Melanjutkan & Menyesuaikan Strategi',
    description: 'Ubah strategi atau perdalam langkah kapan saja dalam percakapan yang sama.',
  },
];

export const WORK_TOPIC_OPTIONS: Array<{
  category: WorkTopicCategory;
  indonesianLabel: string;
  subtitle: string;
}> = [
  {
    category: 'Starting a Business',
    indonesianLabel: 'Memulai Bisnis',
    subtitle: 'Validasi ide usaha, model bisnis, proposisi nilai, dan perencanaan awal.',
  },
  {
    category: 'Marketing',
    indonesianLabel: 'Marketing & Branding',
    subtitle: 'Segmentasi pelanggan, strategi konten, akuisisi pembeli baru, dan konversi penjualan.',
  },
  {
    category: 'Finance & Pricing',
    indonesianLabel: 'Keuangan & Harga',
    subtitle: 'Perhitungan HPP, penetapan harga jual, margin keuntungan, dan pengelolaan arus kas.',
  },
  {
    category: 'Operations',
    indonesianLabel: 'Operasional',
    subtitle: 'Manajemen stok bahan baku, efisiensi produksi, alur kerja, dan SOP dasar.',
  },
  {
    category: 'Customer Experience',
    indonesianLabel: 'Pelanggan & Penjualan',
    subtitle: 'Kepuasan pelanggan, penanganan komplain, repeat order, dan loyalitas.',
  },
  {
    category: 'Business Growth',
    indonesianLabel: 'Pengembangan Bisnis',
    subtitle: 'Pengembangan produk baru, kemitraan B2B lokal, dan ekspansi saluran penjualan.',
  },
  {
    category: 'Other Challenges',
    indonesianLabel: 'Tantangan Bisnis Lainnya',
    subtitle: 'Ceritakan situasi usaha Anda secara bebas dan kita telusuri bersama langkah terbaiknya.',
  },
];

export const BUSINESS_CATEGORY_OPTIONS: BusinessCategoryOption[] = [
  'Food & Beverage',
  'Fashion',
  'Beauty & Personal Care',
  'Creative Services',
  'Retail & Online Shop',
  'Handicraft',
  'Home Business',
  'Digital Services',
];

export const BUSINESS_STAGE_OPTIONS: Array<{
  value: BusinessStageOption;
  label: string;
}> = [
  { value: 'Planning', label: 'Baru Merencanakan Ide (Planning)' },
  { value: 'Starting', label: 'Baru Memulai Usaha (Starting)' },
  { value: 'Already Operating', label: 'Sudah Berjalan (Already Operating)' },
];

export const SWEETBITE_DEMO_PRESET = {
  businessName: 'SweetBite Bakery',
  businessCategory: 'Food & Beverage' as BusinessCategoryOption,
  businessStage: 'Already Operating' as BusinessStageOption,
  workTopic: 'Marketing' as WorkTopicCategory,
  businessDescription:
    'Usaha bakery rumahan dan toko kecil yang menjual roti manis serta pastry segar melalui toko offline dan Instagram.',
  initialProblem:
    'Saya mempunyai usaha bakery kecil bernama SweetBite Bakery. Sejak dua bulan terakhir penjualan menurun dan pelanggan baru semakin sedikit. Selama ini saya hanya promosi lewat Instagram, tetapi hasilnya belum terlalu terlihat.',
};

export function getActiveFrameworkStage(consultation: Consultation): {
  index: number;
  stage: (typeof CONSULTATION_FRAMEWORK_STAGES)[number];
} {
  const userTurnCount = consultation.messages.filter((m) => m.role === 'user').length;
  const contCount = consultation.messages.filter((m) => m.phase === 'continuation').length;

  if (consultation.result) {
    if (contCount > 0) {
      return { index: 7, stage: CONSULTATION_FRAMEWORK_STAGES[7] };
    }
    return { index: 5, stage: CONSULTATION_FRAMEWORK_STAGES[5] };
  }
  if (consultation.currentStep === 'step-05-understanding') {
    return { index: 3, stage: CONSULTATION_FRAMEWORK_STAGES[3] };
  }
  if (userTurnCount === 0) {
    return { index: 0, stage: CONSULTATION_FRAMEWORK_STAGES[0] };
  }
  if (userTurnCount === 1) {
    return { index: 1, stage: CONSULTATION_FRAMEWORK_STAGES[1] };
  }
  if (userTurnCount === 2) {
    return { index: 2, stage: CONSULTATION_FRAMEWORK_STAGES[2] };
  }
  return { index: 3, stage: CONSULTATION_FRAMEWORK_STAGES[3] };
}

export function retrieveExternalResources(
  queryText: string,
  domain: WorkTopicCategory
): {
  externalReferences: ExternalReference[];
  videoResources: VideoResource[];
} {
  if (!queryText || isGreetingOrSmallTalk(queryText)) {
    return { externalReferences: [], videoResources: [] };
  }

  const lower = queryText.toLowerCase();
  const externalReferences: ExternalReference[] = [];
  const videoResources: VideoResource[] = [];

  if (
    /(nib|izin\s+usaha|legalitas|oss|pirt|halal|bpom|sertifikat|aturan|regulasi)/.test(
      lower
    ) ||
    domain === 'Starting a Business'
  ) {
    externalReferences.push({
      id: 'ext-oss-nib',
      title: 'Panduan Pendaftaran Nomor Induk Berusaha (NIB) UMKM Berbasis Risiko',
      publisher: 'Kementerian Investasi / BKPM — Portal Resmi OSS Indonesia',
      url: 'https://oss.go.id',
      updatedAt: '2026',
      relevanceReason:
        'Sumber resmi pemerintah untuk pendaftaran NIB gratis bagi pelaku usaha mikro dan kecil (UMK).',
      sourceType: 'official-portal',
    });
  }

  if (/(halal|sertifikasi\s+halal|bpjph|kuliner|makanan|minuman|bakery|roti)/.test(lower)) {
    externalReferences.push({
      id: 'ext-bpjph-halal',
      title: 'Layanan Sertifikasi Halal Gratis (SEHATI) & Regulasi Jaminan Produk Halal',
      publisher: 'Badan Penyelenggara Jaminan Produk Halal (BPJPH) Kemenag RI',
      url: 'https://ptsp.halal.go.id',
      updatedAt: '2026',
      relevanceReason:
        'Portal resmi pendaftaran sertifikasi halal bagi UMKM makanan, minuman, dan bakery.',
      sourceType: 'official-portal',
    });
  }

  if (
    /(qris|pembayaran\s+digital|cashless|keuangan|pencatatan|siapik|bank\s+indonesia)/.test(
      lower
    ) ||
    domain === 'Finance & Pricing'
  ) {
    externalReferences.push({
      id: 'ext-bi-qris-siapik',
      title: 'Standar Pembayaran QRIS & Aplikasi Pencatatan Keuangan UMKM (SIAPIK)',
      publisher: 'Bank Indonesia (BI)',
      url: 'https://www.bi.go.id',
      updatedAt: '2026',
      relevanceReason:
        'Referensi resmi Bank Indonesia untuk fasilitas pembayaran QRIS dan pencatatan arus kas standar UMKM.',
      sourceType: 'official-portal',
    });
  }

  if (
    /(google\s+business|google\s+maps|pencarian\s+lokal|instagram|pelanggan\s+baru|promosi)/.test(
      lower
    ) ||
    domain === 'Marketing'
  ) {
    externalReferences.push({
      id: 'ext-gbp-official',
      title: 'Panduan Resmi Google Business Profile untuk Usaha Lokal',
      publisher: 'Google Business Profile Help Center',
      url: 'https://support.google.com/business',
      updatedAt: '2026',
      relevanceReason:
        'Dokumentasi resmi untuk mengoptimalkan visibilitas toko lokal di Google Search dan Google Maps.',
      sourceType: 'official-portal',
    });
    videoResources.push({
      id: 'vid-gbp-tutorial',
      title: 'Tutorial Membuat & Mengoptimalkan Google Business Profile untuk UMKM',
      channelOrSource: 'Google Business Profile Official Guide (YouTube)',
      url: 'https://www.youtube.com/results?search_query=cara+membuat+google+bisnis+profil+umkm',
      durationLabel: 'Panduan Video · 8 menit',
      topicRelevance:
        'Membantu pemilik usaha mengatur titik lokasi toko, jam operasional, dan foto produk agar ditemukan pembeli sekitar.',
      verifiedTimestamps: [
        {
          time: '00:45',
          topic: 'Klaim & Verifikasi Titik Lokasi Toko di Google Maps',
        },
        {
          time: '03:15',
          topic: 'Optimasi Foto Produk, Jam Buka, & Tautan WhatsApp',
        },
        {
          time: '06:10',
          topic: 'Cara Mengumpulkan & Membalas Ulasan Pelanggan Pertama',
        },
      ],
    });
  }

  if (domain === 'Finance & Pricing' || /(hpp|harga\s+jual|margin|spreadsheet)/.test(lower)) {
    videoResources.push({
      id: 'vid-hpp-spreadsheet',
      title: 'Cara Menghitung HPP (Harga Pokok Produksi) & Margin Harga Jual UMKM',
      channelOrSource: 'Panduan Keuangan UMKM Praktis (YouTube)',
      url: 'https://www.youtube.com/results?search_query=cara+menghitung+hpp+dan+harga+jual+umkm',
      durationLabel: 'Panduan Video · 10 menit',
      topicRelevance:
        'Menjelaskan langkah menyusun tabel biaya bahan baku, kemasan, dan overhead per porsi secara akurat.',
      verifiedTimestamps: [
        {
          time: '01:10',
          topic: 'Mendata Biaya Bahan Baku, Kemasan, & Penyusutan (Waste 5%)',
        },
        {
          time: '04:30',
          topic: 'Perbedaan Rumus Gross Margin vs. Markup Harga Jual',
        },
        {
          time: '07:45',
          topic: 'Penyesuaian Harga Jual untuk Komisi Aplikasi / Marketplace',
        },
      ],
    });
  }

  if (domain === 'Operations' || /(stok|sop|inventori|bahan\s+baku)/.test(lower)) {
    videoResources.push({
      id: 'vid-sop-stok',
      title: 'Tutorial Menyusun Kartu Stok Barang & SOP Produksi Sederhana',
      channelOrSource: 'Manajemen Operasional UMKM (YouTube)',
      url: 'https://www.youtube.com/results?search_query=cara+membuat+kartu+stok+barang+dan+sop+umkm',
      durationLabel: 'Panduan Video · 9 menit',
      topicRelevance:
        'Panduan praktis mencegah selisih bahan baku dan menjaga standar kualitas produksi harian.',
      verifiedTimestamps: [
        {
          time: '01:00',
          topic: 'Menyusun Kartu Stok Harian dengan Prinsip FIFO',
        },
        {
          time: '04:05',
          topic: 'Menentukan Batas Stok Minimum (Reorder Point & Safety Stock)',
        },
        {
          time: '06:50',
          topic: 'Checklist Takaran Baku & Rekonsiliasi Stok Sore 15 Menit',
        },
      ],
    });
  }

  return {
    externalReferences: externalReferences.slice(0, 2),
    videoResources: videoResources.slice(0, 2),
  };
}

export function buildProblemAnalysisMatrixForDomain(
  domain: WorkTopicCategory,
  ctx: BusinessContextData
): ProblemAnalysisMatrixItem[] {
  const firstSymptom = (ctx.userReportedSymptoms || [])[0];
  if (domain === 'Finance & Pricing') {
    return [
      {
        possibleCause: 'Komponen kemasan, energi (gas/listrik), dan penyusutan bahan (waste 5%) belum dihitung dalam HPP per unit',
        supportingEvidence:
          firstSymptom ||
          'Pemilik usaha merasakan margin keuntungan tipis meskipun penjualan harian berjalan.',
        requiredEvidence: 'Rincian nota belanja 1 batch produksi lengkap beserta biaya kemasan dan gas/listrik.',
        verificationStatus: 'Indikasi Awal',
        riskIfUnaddressed: 'Keuntungan di atas kertas menjadi semu dan modal kerja produksi perlahan tergerus.',
        solutionDirection: 'Hitung ulang HPP lengkap per unit dan gunakan rumus Gross Margin sehat (35%–45%).',
      },
      {
        possibleCause: 'Harga jual mengikuti kompetitor atau menyamakan harga toko offline dengan aplikasi komisi',
        supportingEvidence:
          ctx.confirmedFacts[0] ||
          'Struktur harga belum memisahkan margin penjualan langsung dan potongan kanal.',
        requiredEvidence: 'Daftar harga jual saat ini per kanal (WhatsApp/toko langsung vs platform online).',
        verificationStatus: 'Terverifikasi dari Data',
        riskIfUnaddressed: 'Setiap transaksi melalui kanal berkomisi 15%–20% akan memakan laba bersih dapur.',
        solutionDirection: 'Terapkan harga berjenjang (channel-adjusted pricing) dan Paket Bundling bernilai tambah.',
      },
      {
        possibleCause: 'Pencampuran rekening kas operasional usaha dengan pengeluaran pribadi/rumah tangga',
        supportingEvidence: 'Arus kas masuk dan keluar belum dipisahkan pada dompet atau rekening khusus usaha.',
        requiredEvidence: 'Rekap mutasi kas masuk penjualan dan pengeluaran belanja bahan selama 14 hari terakhir.',
        verificationStatus: 'Belum Diverifikasi',
        riskIfUnaddressed: 'Sulit mengetahui laba bersih riil dan dana belanja bahan baku sering terpakai tanpa sadar.',
        solutionDirection: 'Pisahkan 1 rekening/e-wallet khusus operasional usaha dan tetapkan jadwal bagi hasil pemilik.',
      },
    ];
  }

  if (domain === 'Operations') {
    return [
      {
        possibleCause: 'Belum tersedianya Batas Stok Minimum (Reorder Point) dan Kartu Stok FIFO harian',
        supportingEvidence:
          firstSymptom ||
          'Bahan baku utama terkadang habis mendadak atau terdapat selisih stok di akhir minggu.',
        requiredEvidence: 'Catatan rata-rata pemakaian bahan per hari dan waktu tunggu pengiriman pemasok (lead time).',
        verificationStatus: 'Terverifikasi dari Data',
        riskIfUnaddressed: 'Produksi terhambat saat pesanan ramai atau bahan baku rusak karena penyimpanan tidak teratur.',
        solutionDirection: 'Tetapkan Safety Stock & Reorder Point untuk 5 bahan kritis serta jalankan cek stok 15 menit setiap sore.',
      },
      {
        possibleCause: 'Proses produksi belum menggunakan takaran timbangan tertulis (SOP Resep Baku)',
        supportingEvidence: 'Kualitas produk dan waktu penyelesaian pesanan masih bergantung pada perkiraan manual.',
        requiredEvidence: 'Dokumentasi takaran gramasi dan waktu proses per batch produksi.',
        verificationStatus: 'Indikasi Awal',
        riskIfUnaddressed: 'Rasa/mutu produk tidak konsisten dan tingkat produk gagal (waste) meningkat.',
        solutionDirection: 'Kunci lembar kerja SOP 1 halaman untuk persiapan pagi, takaran produksi, dan QC pengemasan.',
      },
      {
        possibleCause: 'Pembagian tugas persiapan dan pengemasan pada jam sibuk belum terstruktur',
        supportingEvidence: 'Waktu tunggu pesanan pelanggan meningkat ketika pesanan masuk bersamaan.',
        requiredEvidence: 'Pengamatan tahapan kerja yang paling lama memakan waktu pada jam puncak operasional.',
        verificationStatus: 'Belum Diverifikasi',
        riskIfUnaddressed: 'Keterlambatan pengiriman yang dapat menurunkan kepuasan pelanggan.',
        solutionDirection: 'Terapkan persiapan bahan setengah jadi (mise-en-place) sebelum jam buka toko.',
      },
    ];
  }

  if (domain === 'Customer Experience') {
    return [
      {
        possibleCause: 'Belum ada penyimpanan kontak terstruktur dan sapaan tindak lanjut pasca-pembelian',
        supportingEvidence:
          firstSymptom ||
          'Pembeli pertama jarang kembali memesan ulang meskipun tidak ada keluhan langsung.',
        requiredEvidence: 'Jumlah kontak pelanggan yang tersimpan di WhatsApp dibandingkan total transaksi bulanan.',
        verificationStatus: 'Terverifikasi dari Data',
        riskIfUnaddressed: 'Usaha harus terus mencari pembeli baru dari nol karena pembeli lama terlupakan.',
        solutionDirection: 'Jalankan protokol sapaan ramah H+2 (tanya kepuasan) dan pengingat H+14 di WhatsApp.',
      },
      {
        possibleCause: 'Belum tersedia pemicu pembelian ulang (insentif repeat order / kartu paket di kemasan)',
        supportingEvidence: 'Kemasan produk saat ini hanya berfungsi sebagai wadah tanpa ajakan memesan kembali.',
        requiredEvidence: 'Evaluasi kelengkapan informasi kontak dan penawaran di dalam kemasan produk.',
        verificationStatus: 'Indikasi Awal',
        riskIfUnaddressed: 'Pelanggan yang puas tidak memiliki pengingat praktis saat ingin memesan lagi.',
        solutionDirection: 'Sisipkan kartu ucapan berisi tips penyimpanan, nomor WA 1-klik, dan program Ajak Teman.',
      },
    ];
  }

  // Default: Marketing & Sales / Starting a Business / Business Growth
  return [
    {
      possibleCause: 'Akuisisi pelanggan baru terlalu bergantung pada satu saluran organik dengan format katalog foto',
      supportingEvidence:
        ctx.confirmedFacts.find((f) => f.toLowerCase().includes('instagram')) ||
        `Aktivitas promosi saat ini bertumpu pada ${ctx.currentStrategy}.`,
      requiredEvidence: 'Perbandingan jangkauan akun non-pengikut (reach) dan sumber kedatangan pembeli baru 30 hari terakhir.',
      verificationStatus: 'Terverifikasi dari Data',
      riskIfUnaddressed: 'Ketika jangkauan organik melambat, aliran pembeli baru langsung terhenti karena tidak ada saluran penemuan kedua.',
      solutionDirection: 'Kombinasikan konten proses dapur (Reels/Video), optimasi Google Business Profile lokal, dan sampel komunitas.',
    },
    {
      possibleCause: 'Target pelanggan masih terlalu umum sehingga pesan promosi belum menyentuh kebutuhan spesifik',
      supportingEvidence: `Target pasar saat ini tercatat: ${ctx.targetAudience}.`,
      requiredEvidence: 'Data 10–15 transaksi terakhir untuk melihat profil pembeli yang paling sering memesan dan momen konsumsinya.',
      verificationStatus: 'Indikasi Awal',
      riskIfUnaddressed: 'Calon pembeli baru yang melihat profil usaha merasa penawaran biasa saja dan menunda membeli.',
      solutionDirection: 'Fokuskan penawaran pada 2 segmen lokal prioritas (misal: pekerja kantor & keluarga muda radius 3–5 km).',
    },
    {
      possibleCause: 'Hambatan konversi pembelian pertama karena belum adanya Paket Kenalan (Trial/Sampler)',
      supportingEvidence: 'Calon pembeli baru yang bertanya atau melihat profil belum memiliki opsi coba berisiko rendah.',
      requiredEvidence: 'Rasio jumlah chat tanya harga di DM/WhatsApp dibandingkan jumlah transaksi jadi per minggu.',
      verificationStatus: 'Belum Diverifikasi',
      riskIfUnaddressed: 'Pengunjung profil yang tertarik batal memesan karena ragu membeli ukuran reguler pada percobaan pertama.',
      solutionDirection: 'Sediakan 1 "Paket Kenalan / Sampler" dengan harga terjangkau dan tombol pesan WhatsApp 1-klik.',
    },
  ];
}

export function createDefaultImplementationMonitoring(
  consultation: Consultation
): ImplementationMonitoringData {
  const isSweetBite = consultation.id === 'cons-sweetbite-demo';
  const baseData: ImplementationMonitoringData = {
    baselineInquiriesWeekly: 12,
    baselineTransactionsWeekly: 3,
    currentInquiriesWeekly: isSweetBite ? 20 : 12,
    currentTransactionsWeekly: isSweetBite ? 5 : 3,
    obstaclesReported: isSweetBite
      ? 'Waktu perekaman video proses pagi hari sempat berbenturan dengan jadwal panggangan batch pertama.'
      : '',
    implementationNotes: '',
    lastUpdatedAt: consultation.updatedAt || new Date().toISOString(),
  };
  const baseEval = evaluateImplementationProgress(baseData, 'id');
  return {
    ...baseData,
    implementationNotes: baseEval.summaryText,
  };
}

export function buildVisualDiagramForDomain(
  domain: WorkTopicCategory,
  consultation: Consultation
): VisualDiagramSpec {
  const businessLabel = consultation.businessName || consultation.businessCategory;

  if (domain === 'Finance & Pricing') {
    return {
      type: 'pricing-breakdown',
      title: 'Struktur Pembentukan Harga Jual & Margin Sehat',
      subtitle: `Kerangka evaluasi komponen biaya per unit untuk ${businessLabel}`,
      steps: [
        {
          label: '1. Biaya Bahan Baku & Kemasan (40%–50%)',
          valueOrNote: 'Komponen HPP Langsung',
          detail: 'Seluruh bahan utama, bumbu/pendamping, wadah kemasan, label, dan penyusutan bahan (waste 3–5%).',
        },
        {
          label: '2. Biaya Operasional & Tenaga (15%–20%)',
          valueOrNote: 'Alokasi Overhead Unit',
          detail: 'Listrik, gas/air, kuota komunikasi, transportasi belanja, serta upah waktu produksi per batch.',
        },
        {
          label: '3. Cadangan Promosi & Komisi Kanal (5%–10%)',
          valueOrNote: 'Batas Diskon Aman',
          detail: 'Alokasi sampel produk, voucher paket bundling, atau potongan platform tanpa memakan modal pokok.',
        },
        {
          label: '4. Margin Laba Bersih Usaha (25%–35%)',
          valueOrNote: 'Keuntungan Bersih',
          detail: 'Dana yang benar-benar tersimpan di kas usaha untuk pengembangan dan cadangan darurat.',
        },
      ],
    };
  }

  if (domain === 'Operations') {
    return {
      type: 'operational-workflow',
      title: 'Alur Kerja Operasional & Kendali Stok Harian (SOP)',
      subtitle: `Siklus kontrol mutu dan bahan baku untuk ${businessLabel}`,
      steps: [
        {
          label: '1. Persiapan & Cek Stok Pagi',
          valueOrNote: 'Batas Reorder Point',
          detail: 'Periksa sisa bahan baku utama menggunakan prinsip FIFO (First-In, First-Out) sebelum produksi dimulai.',
        },
        {
          label: '2. Produksi Terstandar (Takaran Baku)',
          valueOrNote: 'Resep / Checklist Baku',
          detail: 'Gunakan takaran timbangan dan waktu proses yang tertulis agar kualitas tidak berubah-ubah.',
        },
        {
          label: '3. Pemeriksaan Kualitas & Pengemasan',
          valueOrNote: 'Quality Check (QC)',
          detail: 'Pastikan tampilan fisik, segel kemasan, dan kelengkapan pesanan sesuai standar sebelum diserahkan.',
        },
        {
          label: '4. Rekonsiliasi Sisa Stok & Kas Sore',
          valueOrNote: 'Audit 15 Menit',
          detail: 'Catat jumlah unit terjual, produk rusak/sampel, dan daftar belanja bahan untuk besok.',
        },
      ],
    };
  }

  if (domain === 'Customer Experience') {
    return {
      type: 'customer-retention',
      title: 'Siklus Retensi Pelanggan & Peningkatan Repeat Order',
      subtitle: `Mengubah pembeli pertama menjadi pelanggan berulang di ${businessLabel}`,
      steps: [
        {
          label: '1. Pengalaman Pesanan Pertama yang Berkesan',
          valueOrNote: 'First Impression',
          detail: 'Respon cepat, produk sesuai ekspektasi, dan sisipan kartu ucapan/panduan penyimpanan di kemasan.',
        },
        {
          label: '2. Tindak Lanjut Ramah (H+2 / H+3)',
          valueOrNote: 'Feedback Loop',
          detail: 'Sapa pelanggan lewat WhatsApp untuk menanyakan kepuasan sekaligus menyimpan kontak mereka.',
        },
        {
          label: '3. Pengingat Momen & Paket Langganan (H+14)',
          valueOrNote: 'Repeat Trigger',
          detail: 'Tawarkan varian favorit atau insentif khusus pembelian kedua pada saat produk biasanya habis.',
        },
        {
          label: '4. Program Rujukan "Ajak Teman"',
          valueOrNote: 'Advokasi Pelanggan',
          detail: 'Berikan bonus porsi mini ketika pelanggan setia merekomendasikan produk ke rekan mereka.',
        },
      ],
    };
  }

  if (domain === 'Starting a Business') {
    return {
      type: 'validation-roadmap',
      title: 'Peta Jalan Validasi Ide & Pelanggan Pertama',
      subtitle: `Langkah peluncuran bertahap yang hemat modal untuk ${businessLabel}`,
      steps: [
        {
          label: '1. Kunci 1 Segmen & 2 Produk Inti (Hero)',
          valueOrNote: 'Minggu 1',
          detail: 'Fokuskan modal awal pada maksimal 2–3 varian utama yang menyelesaikan kebutuhan spesifik pembeli.',
        },
        {
          label: '2. Uji Sampel & Pre-Order Batch Kecil',
          valueOrNote: 'Minggu 2',
          detail: 'Buka kuota terbatas (15–20 porsi) untuk menguji daya beli nyata tanpa menumpuk stok mati.',
        },
        {
          label: '3. Evaluasi Umpan Balik & Struktur HPP',
          valueOrNote: 'Minggu 3',
          detail: 'Sempurnakan rasa/kualitas dan pastikan harga jual sudah menutup seluruh biaya produksi.',
        },
        {
          label: '4. Pembukaan Saluran Penjualan Rutin',
          valueOrNote: 'Minggu 4',
          detail: 'Aktifkan katalog WhatsApp, Google Business Profile, dan jadwal produksi reguler.',
        },
      ],
    };
  }

  // Default: Marketing & Sales / Business Growth Funnel
  return {
    type: 'sales-funnel',
    title: 'Alur Akuisisi Pelanggan Baru & Konversi Penjualan',
    subtitle: `Memperbaiki perjalanan calon pembeli dari mengenal hingga memesan di ${businessLabel}`,
    steps: [
      {
        label: '1. Penemuan Lokal & Konten Proses (Awareness)',
        valueOrNote: 'Jangkauan Audiens Baru',
        detail: 'Calon pembeli menemukan usaha lewat video proses dapur di Instagram, Google Maps lokal, atau sampel komunitas.',
      },
      {
        label: '2. Kejelasan Profil & Bukti Sosial (Trust)',
        valueOrNote: 'Membangun Keyakinan',
        detail: 'Pengunjung melihat bio yang spesifik, kisaran harga jelas, dan sorotan ulasan jujur pelanggan sebelumnya.',
      },
      {
        label: '3. Penawaran "Paket Kenalan / Trial" (Conversion)',
        valueOrNote: 'Pembelian Pertama',
        detail: 'Paket coba dengan harga terjangkau dan tombol pesan WhatsApp 1-klik menurunkan keraguan mencoba.',
      },
      {
        label: '4. Pembelian Berulang & Rujukan Teman (Retention)',
        valueOrNote: 'Pertumbuhan Organik',
        detail: 'Pelanggan baru yang puas disimpan kontaknya dan diajak mengenalkan produk ke rekan sekitar.',
      },
    ],
  };
}

export function buildTailoredDeliverable(
  domain: WorkTopicCategory,
  consultation: Consultation
): TailoredDeliverable {
  const businessLabel = consultation.businessName || `Usaha ${consultation.businessCategory}`;
  const lowerProblem = `${consultation.initialProblem} ${consultation.businessContext.mainChallenge}`.toLowerCase();

  if (domain === 'Finance & Pricing') {
    return {
      id: `deliv-pricing-${consultation.id}`,
      type: 'pricing-hpp-calculator',
      title: 'Product Pricing & HPP Calculator Worksheet',
      subtitle: `Lembar Kerja Perhitungan HPP, Margin, & Simulasi Harga Jual — ${businessLabel}`,
      reasonSuggested:
        'Direkomendasikan karena tantangan utama Anda berkaitan dengan kejelasan biaya produksi (HPP), penentuan harga jual, dan pengamanan margin keuntungan.',
      sections: [
        {
          heading: '1. Prinsip Dasar Perhitungan HPP Lengkap',
          items: [
            'Catat seluruh biaya bahan baku utama dan bahan penolong per 1 batch produksi.',
            'Tambahkan biaya kemasan lengkap (wadah, stiker label, kantong, kartu ucapan).',
            'Masukkan alokasi biaya operasional produksi (gas, listrik, air, penyusutan bahan 3–5%).',
            'Bagi total biaya 1 batch dengan jumlah unit layak jual untuk mendapatkan HPP per unit yang akurat.',
          ],
        },
        {
          heading: '2. Panduan Menetapkan Harga Jual Berjenjang',
          items: [
            'Harga Eceran Langsung (Direct-to-Consumer): Targetkan margin kotor minimal 35%–45% di atas HPP.',
            'Harga Paket Bundling / Hemat: Gunakan untuk meningkatkan nilai rata-rata transaksi dengan tetap menjaga margin minimal 28%.',
            'Harga Mitra / Reseller / Konsinyasi: Pastikan masih menyisakan margin bersih minimal 20% bagi dapur produksi Anda.',
          ],
        },
      ],
      tableHeaders: [
        'Komponen Produk / Menu',
        'Biaya Bahan & Kemasan',
        'Overhead & Penyusutan',
        'Total HPP / Unit',
        'Rekomendasi Harga Jual',
        'Estimasi Margin (%)',
      ],
      tableRows: [
        ['Varian Utama (Hero Product 1)', 'Rp 8.500', 'Rp 1.500', 'Rp 10.000', 'Rp 16.500', '39,4%'],
        ['Varian Utama (Hero Product 2)', 'Rp 10.200', 'Rp 1.800', 'Rp 12.000', 'Rp 20.000', '40,0%'],
        ['Paket Kenalan / Bundling (Isi 3)', 'Rp 24.000', 'Rp 4.000', 'Rp 28.000', 'Rp 42.000', '33,3%'],
        ['Paket Pesanan Komunitas / Kantor (Isi 10)', 'Rp 78.000', 'Rp 12.000', 'Rp 90.000', 'Rp 135.000', '33,3%'],
      ],
    };
  }

  if (domain === 'Operations') {
    return {
      id: `deliv-sop-${consultation.id}`,
      type: 'basic-business-sop',
      title: 'Basic Business SOP & Inventory Checklist',
      subtitle: `Standar Operasional Harian & Kartu Kontrol Stok — ${businessLabel}`,
      reasonSuggested:
        'Direkomendasikan untuk membantu menertibkan alur produksi harian, mencegah kebocoran bahan baku, dan menjaga konsistensi mutu.',
      sections: [
        {
          heading: '1. SOP Persiapan & Penerimaan Bahan Baku',
          items: [
            'Periksa kualitas fisik dan tanggal kedaluwarsa setiap bahan yang baru datang.',
            'Susun penyimpanan dengan sistem FIFO (bahan yang datang lebih dulu diletakkan di bagian paling depan).',
            'Tetapkan Batas Stok Minimum (Reorder Point) untuk 5 bahan baku paling kritis.',
          ],
        },
        {
          heading: '2. SOP Standarisasi Proses Produksi & QC',
          items: [
            'Wajib menggunakan timbangan digital dan takaran tertulis untuk setiap batch produksi.',
            'Lakukan pengecekan kualitas (rasa/tekstur/kerapian kemasan) pada 1 sampel di setiap batch sebelum dijual.',
            'Catat jumlah produk jadi, produk sampel, dan produk gagal (waste) setiap sore.',
          ],
        },
      ],
      tableHeaders: ['Tahap Operasional', 'Waktu Pelaksanaan', 'Penanggung Jawab', 'Standar Keberhasilan (Checklist)'],
      tableRows: [
        ['Cek Stok & Persiapan Alat', '07.00 – 07.30', 'Produksi / Pemilik', 'Bahan utama cukup & alat bersih siap pakai'],
        ['Proses Produksi Batch Inti', '07.30 – 10.30', 'Produksi', 'Takaran sesuai resep baku & waktu tepat'],
        ['Quality Control & Pengemasan', '10.30 – 11.30', 'Pengemasan', 'Segel rapat, label terpasang, tampilan rapi'],
        ['Rekonsiliasi Sisa Stok & Kas', '17.00 – 17.30', 'Pemilik Usaha', 'Catatan stok akhir cocok dengan jumlah transaksi'],
      ],
    };
  }

  if (domain === 'Customer Experience') {
    return {
      id: `deliv-retention-${consultation.id}`,
      type: 'customer-retention-plan',
      title: 'Customer Retention & Repeat Order Plan',
      subtitle: `Panduan Layanan Pelanggan & Jadwal Tindak Lanjut WhatsApp — ${businessLabel}`,
      reasonSuggested:
        'Direkomendasikan karena fokus utama Anda adalah meningkatkan pembelian berulang (repeat order) dan menjaga kepuasan pelanggan.',
      sections: [
        {
          heading: '1. Standar Pengalaman Pelanggan Saat Membeli',
          items: [
            'Balas pesan pertanyaan pelanggan maksimal dalam 10–15 menit pada jam operasional.',
            'Sertakan kartu kecil berisi tips menikmati/menyimpan produk dan kontak WhatsApp resmi di setiap kemasan.',
            'Simpan kontak pembeli dengan label kategori (misal: Pembeli Baru, Pelanggan Rutin, Pesanan Kantor).',
          ],
        },
        {
          heading: '2. Protokol Penanganan Keluhan dengan Empati',
          items: [
            'Dengarkan dan akui ketidaknyamanan pelanggan tanpa berdebat.',
            'Minta foto/detail kendala sebagai bahan evaluasi tim produksi.',
            'Berikan solusi penggantian produk atau voucher pesanan berikutnya pada hari yang sama.',
          ],
        },
      ],
      tableHeaders: ['Waktu Tindak Lanjut', 'Sasaran Pelanggan', 'Tujuan Komunikasi', 'Contoh Pesan Singkat'],
      tableRows: [
        ['H+2 Setelah Pembelian', 'Pembeli Pertama', 'Menanyakan kepuasan & simpan kontak', '"Halo Kak, terima kasih sudah mencoba produk kami kemarin. Semoga cocok ya!"'],
        ['H+14 Setelah Pembelian', 'Pembeli yang Puas', 'Mengingatkan pemesanan ulang', '"Halo Kak, akhir pekan ini kami memanggang batch segar varian favorit Kakak. Mau kami sisihkan?"'],
        ['Setiap Awal Bulan', 'Pelanggan Setia (≥3x beli)', 'Program Ajak Teman / Bundling', '"Khusus pelanggan setia, dapatkan 1 porsi mini gratis saat memesan bersama teman baru."'],
      ],
    };
  }

  if (domain === 'Starting a Business') {
    return {
      id: `deliv-validation-${consultation.id}`,
      type: 'business-validation-checklist',
      title: 'Business Validation Checklist',
      subtitle: `Daftar Periksa Validasi Pasar & Persiapan Peluncuran Usaha — ${businessLabel}`,
      reasonSuggested:
        'Direkomendasikan agar Anda dapat menguji permintaan pasar secara nyata dan memulai usaha dengan risiko modal yang terkendali.',
      sections: [
        {
          heading: '1. Validasi Masalah & Segmen Pembeli Prioritas',
          items: [
            'Tentukan 1 segmen pembeli paling spesifik yang paling membutuhkan produk Anda saat ini.',
            'Pastikan alasan keunggulan produk (Value Proposition) dapat dijelaskan dalam 1 kalimat sederhana.',
            'Bandingkan kisaran harga dan porsi dengan 3 kompetitor terdekat di area yang sama.',
          ],
        },
        {
          heading: '2. Uji Pasar Batch Kecil & Kesiapan Operasional',
          items: [
            'Uji sampel ke minimal 10 calon pembeli di luar keluarga inti dan catat masukan jujur mereka.',
            'Hitung HPP lengkap dan pisahkan rekening/dompet kas usaha dari uang pribadi.',
            'Buka sistem Pre-Order Batch Pertama (15–20 unit) sebelum membeli peralatan besar.',
          ],
        },
      ],
      tableHeaders: ['Langkah Validasi', 'Target Bukti Nyata', 'Status Saat Ini', 'Catatan Tindak Lanjut'],
      tableRows: [
        ['Penentuan 2 Produk Inti (Hero)', 'Resep & takaran baku terkunci', 'Siap Dijalankan', 'Hindari terlalu banyak menu di awal'],
        ['Perhitungan HPP & Harga Jual', 'Margin kotor minimal 35%', 'Siap Dijalankan', 'Termasuk biaya kemasan & gas/listrik'],
        ['Uji Coba 15 Pembeli Pertama', 'Minimal 70% menyatakan puas', 'Prioritas Minggu Ini', 'Kumpulkan testimoni tertulis/foto'],
        ['Pemisahan Kas & Katalog WA', 'Rekening terpisah & menu siap', 'Prioritas Minggu Ini', 'Siapkan tautan pesan 1-klik'],
      ],
    };
  }

  if (/(konten|instagram|posting|reels|ide\s+konten|sosial\s+media)/.test(lowerProblem)) {
    return {
      id: `deliv-calendar-${consultation.id}`,
      type: 'content-calendar-14d',
      title: '14-Day Content Calendar & Promotion Guide',
      subtitle: `Kalender Konten Organik 14 Hari & Pilar Pesan Promosi — ${businessLabel}`,
      reasonSuggested:
        'Direkomendasikan karena usaha Anda membutuhkan jadwal konten yang terarah untuk menarik pelanggan baru secara organik di luar foto katalog biasa.',
      sections: [
        {
          heading: '1. Empat Pilar Konten Organik Penarik Pembeli Baru',
          items: [
            'Pilar 1 — Proses Dapur & Kesegaran Bahan (Membangun kepercayaan visual bagi orang yang belum pernah mencoba).',
            'Pilar 2 — Solusi Momen Spesifik (Menghubungkan produk dengan kebutuhan sarapan kantor, camilan sore, atau hantaran).',
            'Pilar 3 — Bukti Sosial & Cerita Pelanggan (Menampilkan ulasan jujur dan pesanan yang sedang disiapkan).',
            'Pilar 4 — Penawaran Paket Kenalan / Sampler (Ajakan bertindak yang ramah risiko bagi pembeli pertama).',
          ],
        },
        {
          heading: '2. Checklist Optimasi Profil Sebelum Publikasi',
          items: [
            'Cantumkan jenis produk utama, lokasi/area pengiriman, dan jam operasional di baris pertama bio.',
            'Pasang tautan langsung ke WhatsApp dengan teks pesan otomatis.',
            'Sematkan (Pin) 3 unggahan terbaik: Menu Paket Kenalan, Proses Pembuatan, dan Cara Memesan.',
          ],
        },
      ],
      tableHeaders: ['Hari', 'Pilar Konten', 'Ide Topik & Visual Utama', 'Format', 'Ajakan Bertindak (CTA)'],
      tableRows: [
        ['Hari 1', 'Proses Dapur', 'Proses panggangan/pembuatan pagi hari yang masih hangat', 'Reels / Video 15d', 'Tanyakan varian favorit di komentar'],
        ['Hari 3', 'Solusi Momen', 'Rekomendasi paket camilan praktis untuk teman kerja/rapat', 'Carousel 3 Slide', 'Klik tautan bio untuk pesan batch besok'],
        ['Hari 5', 'Penawaran Coba', 'Perkenalan "Paket Kenalan / Sampler" khusus pembeli baru', 'Foto + Story', 'Pesan via WhatsApp (kuota harian)'],
        ['Hari 7', 'Bukti Sosial', 'Kompilasi tangkapan layar kepuasan pelanggan minggu ini', 'Story & Highlight', 'Simpan menu untuk pesanan akhir pekan'],
        ['Hari 10', 'Proses & Bahan', 'Cerita pemilihan bahan baku berkualitas tanpa pengawet', 'Reels Singkat', 'Bagikan ke teman yang suka kuliner lokal'],
        ['Hari 12', 'Komunitas Lokal', 'Cuplikan pengiriman sampel/pesanan ke kantor sekitar', 'Foto Dokumentasi', 'Hubungi WA untuk paket pesanan kantor'],
        ['Hari 14', 'Paket Berbagi', 'Promo "Bawa Teman" — bonus porsi mini untuk pesanan berdua', 'Poster / Carousel', 'Tag teman yang ingin diajak mencoba'],
      ],
    };
  }

  return {
    id: `deliv-marketing-${consultation.id}`,
    type: 'marketing-strategy-plan',
    title: 'Marketing & Customer Acquisition Strategy Plan',
    subtitle: `Rencana Strategi Akuisisi Pelanggan Baru & Penajaman Segmen — ${businessLabel}`,
    reasonSuggested:
      'Direkomendasikan untuk membantu usaha Anda membuka saluran kedatangan pelanggan baru secara konsisten dan terukur.',
    sections: [
      {
        heading: '1. Penajaman Segmen Pembeli Prioritas',
        items: [
          'Fokuskan penawaran pada 2 kelompok pelanggan lokal dengan frekuensi beli tertinggi (misal: pekerja kantor & keluarga muda radius 3–5 km).',
          'Sesuaikan jam unggah promosi dan pilihan paket dengan waktu kebutuhan mereka.',
        ],
      },
      {
        heading: '2. Strategi 3 Jalur Akuisisi Tanpa Iklan Berbayar',
        items: [
          'Jalur Pencarian Lokal: Optimasi Google Business Profile dengan foto produk terbaru dan titik lokasi akurat.',
          'Jalur Komunitas & Sampel: Perkenalan sampel terjadwal ke kantor atau komunitas sekitar.',
          'Jalur Rujukan Pelanggan Lama: Insentif produk mini bagi pelanggan setia yang mengenalkan teman baru.',
        ],
      },
    ],
    tableHeaders: ['Jalur Akuisisi', 'Langkah Eksekusi Mingguan', 'Kebutuhan Sumber Daya', 'Indikator Keberhasilan'],
    tableRows: [
      ['Instagram Organik', '3x konten proses & momen konsumsi + Paket Kenalan', 'Ponsel & produk harian', 'Pertumbuhan chat masuk dari non-followers'],
      ['Google Business Profile', 'Lengkapi profil, jam buka, & minta 5 ulasan pelanggan', 'Tanpa biaya (Gratis)', 'Peningkatan klik petunjuk arah & WA'],
      ['Sampel Komunitas Lokal', 'Antarkan 5–8 sampel mini ke 2 titik kantor/komunitas', 'Alokasi sampel dapur', 'Minimal 2–3 pesanan baru per kunjungan'],
    ],
  };
}

export function createNewConsultation(params?: {
  workTopic?: WorkTopicCategory;
  businessName?: string;
  businessCategory?: string;
  businessStage?: BusinessStageOption;
  businessDescription?: string;
}): Consultation {
  const id = `cons-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();
  const workTopic = params?.workTopic || 'Marketing';
  const businessCategory = params?.businessCategory || 'Food & Beverage';
  const businessStage = params?.businessStage || 'Already Operating';
  const businessName = params?.businessName || '';
  const businessDescription = params?.businessDescription || '';

  return {
    id,
    userId: null,
    title: businessName ? `Konsultasi ${businessName}` : 'Sesi Konsultasi Bisnis Baru',
    businessName,
    businessCategory,
    businessStage,
    workTopic,
    initialProblem: '',
    consultationStatus: 'Discovery',
    currentStep: 'step-04-discovery',
    createdAt: now,
    updatedAt: now,
    messages: [],
    generatedDocuments: [],
    businessContext: {
      id: `ctx-${id}`,
      consultationId: id,
      businessName,
      businessCategory,
      businessStage,
      workTopic,
      businessDescription,
      mainChallenge: '',
      currentStrategy: 'Belum dirinci dalam percakapan',
      targetAudience: 'Belum didefinisikan secara spesifik',
      businessGoals: 'Menemukan arah perbaikan yang paling realistis untuk kondisi usaha saat ini',
      availableResources: 'Dikelola langsung oleh pemilik usaha',
      budgetConstraints: 'Belum dirinci',
      previousAttempts: 'Belum dirinci',
      confirmedFacts: [],
      userReportedSymptoms: [],
      preliminaryInferences: [],
      assumptionsToVerify: [],
      missingInformation: [
        'Rincian kendala utama yang sedang dihadapi',
        'Upaya yang sudah pernah dicoba sejauh ini',
        'Ketersediaan sumber daya, waktu, atau batasan anggaran',
      ],
      problemSummary: '',
    },
    result: null,
  };
}

export function extractContextFromConversation(
  consultation: Consultation,
  messages: Message[]
): BusinessContextData {
  const substantiveUserMessages = messages
    .filter((m) => m.role === 'user' && !isGreetingOrSmallTalk(m.content))
    .map((m) => m.content.trim());

  const initialSubstantive =
    consultation.initialProblem && !isGreetingOrSmallTalk(consultation.initialProblem)
      ? consultation.initialProblem.trim()
      : '';

  const allUserText = [initialSubstantive, ...substantiveUserMessages]
    .filter(Boolean)
    .join(' ')
    .trim();

  // If the user has only said "Halo" or hasn't shared any business context yet, never invent facts!
  if (!allUserText) {
    return {
      ...consultation.businessContext,
      confirmedFacts: [],
      userReportedSymptoms: [],
      preliminaryInferences: [],
      assumptionsToVerify: [],
      problemSummary: '',
    };
  }

  const lower = allUserText.toLowerCase();
  const detectedDomain = detectBusinessDomain(allUserText, consultation.workTopic);

  const confirmedFacts: string[] = [];
  const userReportedSymptoms: string[] = [];
  const preliminaryInferences: string[] = [];
  const assumptionsToVerify: string[] = [];
  const missingInformation: string[] = [];

  if (consultation.businessName) {
    confirmedFacts.push(
      `Usaha bernama ${consultation.businessName} bergerak di bidang ${consultation.businessCategory} (${consultation.businessStage}).`
    );
  }

  let mainChallenge = consultation.businessContext.mainChallenge;

  if (detectedDomain === 'Finance & Pricing') {
    mainChallenge =
      'Ketidakpastian perhitungan HPP, struktur harga jual, atau pengelolaan margin keuntungan usaha';
    userReportedSymptoms.push(
      'Pemilik usaha merasakan margin keuntungan yang tipis atau belum yakin apakah harga jual sudah menutup seluruh biaya operasional.'
    );
    confirmedFacts.push(
      'Fokus masalah berada pada domain Keuangan & Penetapan Harga (HPP/margin/arus kas).'
    );
    preliminaryInferences.push(
      'Indikasi awal: Biaya tak langsung (kemasan, gas/listrik, penyusutan bahan) kemungkinan belum dihitung penuh ke dalam HPP per unit.'
    );
    assumptionsToVerify.push(
      'Perlu diverifikasi apakah keuangan pribadi dan kas operasional usaha sudah dipisahkan secara disiplin.'
    );
  } else if (detectedDomain === 'Operations') {
    mainChallenge =
      'Kendala efisiensi operasional, pengelolaan stok bahan baku, atau konsistensi alur kerja produksi';
    userReportedSymptoms.push(
      'Operasional harian terasa kurang tertata, sering terjadi selisih stok, atau standar hasil produksi belum konsisten.'
    );
    confirmedFacts.push(
      'Fokus masalah berada pada domain Operasional & Pengelolaan Stok/SOP.'
    );
    preliminaryInferences.push(
      'Indikasi awal: Belum adanya pencatatan stok minimum (Reorder Point) dan lembar kerja standar (SOP) harian.'
    );
    assumptionsToVerify.push(
      'Perlu diperiksa bagian alur kerja mana yang paling sering mengalami keterlambatan atau pemborosan bahan.'
    );
  } else if (detectedDomain === 'Customer Experience') {
    mainChallenge =
      'Rendahnya tingkat pembelian berulang (repeat order) atau penanganan pengalaman pelanggan';
    userReportedSymptoms.push(
      'Pelanggan yang sudah pernah membeli jarang kembali memesan ulang atau belum ada alur tindak lanjut pelanggan.'
    );
    confirmedFacts.push(
      'Fokus masalah berada pada domain Pengalaman & Retensi Pelanggan.'
    );
    preliminaryInferences.push(
      'Indikasi awal: Belum tersedianya mekanisme penyimpanan kontak dan pengingat pesanan ulang bagi pembeli lama.'
    );
    assumptionsToVerify.push(
      'Perlu diverifikasi apakah ada umpan balik atau keluhan tersembunyi mengenai produk/layanan pengiriman.'
    );
  } else if (detectedDomain === 'Starting a Business') {
    mainChallenge =
      'Perumusan langkah awal usaha, validasi ide produk, dan penentuan target pembeli pertama';
    userReportedSymptoms.push(
      'Memiliki rencana memulai usaha tetapi masih membutuhkan kepastian langkah validasi pasar agar modal awal aman.'
    );
    confirmedFacts.push(
      'Usaha berada pada fase perencanaan/awal dan membutuhkan kerangka validasi pasar.'
    );
    preliminaryInferences.push(
      'Indikasi awal: Perlu mengunci maksimal 2–3 produk inti dan menguji permintaan lewat pre-order batch kecil.'
    );
    assumptionsToVerify.push(
      'Perlu diverifikasi siapa segmen pembeli pertama yang paling mudah dijangkau di lingkungan sekitar.'
    );
  } else if (
    lower.includes('pelanggan baru') &&
    (lower.includes('menurun') || lower.includes('berkurang') || lower.includes('sedikit'))
  ) {
    mainChallenge = 'Penurunan jumlah pelanggan baru dalam beberapa waktu terakhir';
    userReportedSymptoms.push(
      'Penjualan terasa menurun dalam 1–2 bulan terakhir, terutama karena pembeli baru yang datang semakin sedikit.'
    );
    confirmedFacts.push(
      'Fokus masalah yang paling dirasakan adalah melambatnya akuisisi pelanggan baru.'
    );
  } else if (
    lower.includes('penjualan') &&
    (lower.includes('menurun') || lower.includes('turun') || lower.includes('sepi'))
  ) {
    mainChallenge = 'Penurunan volume penjualan yang berdampak pada perputaran usaha';
    userReportedSymptoms.push(
      'Terjadi penurunan transaksi penjualan dibandingkan periode sebelumnya.'
    );
    confirmedFacts.push('Usaha mengalami perlambatan transaksi penjualan.');
  } else {
    mainChallenge = substantiveUserMessages[0]?.slice(0, 120) || 'Tantangan pengembangan usaha';
    userReportedSymptoms.push(`Situasi yang disampaikan: "${allUserText.slice(0, 160)}"`);
  }

  let currentStrategy = consultation.businessContext.currentStrategy;
  let previousAttempts = consultation.businessContext.previousAttempts || 'Belum dirinci';
  if (lower.includes('instagram')) {
    if (
      lower.includes('foto produk') ||
      lower.includes('organik') ||
      lower.includes('hanya posting') ||
      lower.includes('promo')
    ) {
      currentStrategy =
        'Mengandalkan unggahan organik di Instagram (dominan foto produk dan promo sesekali)';
      previousAttempts =
        'Sudah rutin mengunggah foto produk dan sesekali mengadakan promo di Instagram, namun belum menghasilkan lonjakan pembeli baru.';
      confirmedFacts.push(
        'Saluran pemasaran utama bertumpu pada konten organik Instagram berupa foto produk dan promo sesekali.'
      );
      preliminaryInferences.push(
        'Indikasi awal: Mengandalkan satu saluran organik dengan format katalog foto cenderung hanya menjangkau pengikut lama.'
      );
      assumptionsToVerify.push(
        'Perlu diverifikasi apakah calon pembeli yang mengunjungi profil Instagram sudah memahami keunggulan produk dan cara memesan dengan mudah.'
      );
    } else {
      currentStrategy = 'Promosi melalui Instagram (Organik)';
      confirmedFacts.push('Saluran komunikasi dan promosi utama saat ini menggunakan Instagram.');
    }
  } else if (lower.includes('whatsapp') || lower.includes('wa')) {
    currentStrategy = 'Penjualan melalui WhatsApp & relasi pelanggan sekitar';
    confirmedFacts.push('Pemesanan dan komunikasi pelanggan berjalan melalui WhatsApp.');
  } else {
    missingInformation.push('Pendekatan atau upaya yang sudah pernah dicoba sejauh ini');
  }

  let targetAudience = consultation.businessContext.targetAudience;
  if (
    lower.includes('belum menentukan') ||
    lower.includes('belum jelas') ||
    lower.includes('semua orang') ||
    lower.includes('siapa saja') ||
    lower.includes('belum spesifik')
  ) {
    targetAudience = 'Belum didefinisikan secara spesifik (masih menyasar pembeli umum)';
    confirmedFacts.push('Target pelanggan utama belum dikerucutkan pada segmen spesifik.');
    preliminaryInferences.push(
      'Kemungkinan penyebab: Karena target pembeli masih terlalu luas ("siapa saja"), penawaran menjadi kurang tajam bagi calon pembeli baru.'
    );
  } else if (
    lower.includes('kantor') ||
    lower.includes('keluarga') ||
    lower.includes('mahasiswa') ||
    lower.includes('ibu')
  ) {
    const matchedSegments: string[] = [];
    if (lower.includes('kantor') || lower.includes('pekerja')) matchedSegments.push('Pekerja Kantor');
    if (lower.includes('keluarga') || lower.includes('ibu'))
      matchedSegments.push('Keluarga Muda / Ibu Rumah Tangga');
    if (lower.includes('mahasiswa') || lower.includes('pelajar'))
      matchedSegments.push('Mahasiswa & Pelajar');
    targetAudience = matchedSegments.join(', ') || 'Segmen Pelanggan Lokal';
    confirmedFacts.push(`Segmen pelanggan yang disasar: ${targetAudience}.`);
  } else {
    missingInformation.push('Profil pelanggan utama yang paling sering membeli');
  }

  let budgetConstraints = consultation.businessContext.budgetConstraints;
  if (
    lower.includes('tidak punya budget') ||
    lower.includes('tidak mempunyai budget') ||
    lower.includes('belum ada budget') ||
    lower.includes('tanpa iklan') ||
    lower.includes('tanpa biaya') ||
    lower.includes('modal terbatas') ||
    lower.includes('hanya organik')
  ) {
    budgetConstraints =
      'Tanpa anggaran iklan berbayar — memprioritaskan langkah organik & optimalisasi sumber daya yang ada';
    confirmedFacts.push(
      'Pemilik usaha memprioritaskan solusi tanpa biaya iklan berbayar (zero-ad-budget).'
    );
  } else {
    missingInformation.push('Ketersediaan waktu, tim, dan batasan anggaran');
  }

  let businessGoals = consultation.businessContext.businessGoals;
  if (detectedDomain === 'Finance & Pricing') {
    businessGoals = 'Memastikan struktur HPP akurat dan menetapkan harga jual dengan margin yang sehat';
  } else if (detectedDomain === 'Operations') {
    businessGoals = 'Menertibkan alur produksi dan kontrol stok bahan baku agar efisien dan konsisten';
  } else if (detectedDomain === 'Customer Experience') {
    businessGoals = 'Meningkatkan kepuasan pelanggan dan mendorong pembelian berulang (repeat order)';
  } else if (detectedDomain === 'Starting a Business') {
    businessGoals = 'Memvalidasi produk di pasar nyata dan mendapatkan pelanggan pertama secara bertahap';
  } else {
    businessGoals =
      'Mendatangkan pelanggan baru dan meningkatkan penjualan melalui kanal yang sesuai kapasitas usaha';
  }

  const businessLabel = consultation.businessName || `Usaha Anda`;
  const problemSummary = `${businessLabel} saat ini sedang berfokus mengatasi ${mainChallenge.toLowerCase()}. Berdasarkan percakapan sejauh ini, pendekatan yang berjalan adalah ${currentStrategy.toLowerCase()}, dengan sasaran pelanggan ${targetAudience.toLowerCase()}.`;

  return {
    ...consultation.businessContext,
    businessName: consultation.businessName,
    businessCategory: consultation.businessCategory,
    businessStage: consultation.businessStage,
    workTopic: detectedDomain,
    mainChallenge,
    currentStrategy,
    targetAudience,
    businessGoals,
    budgetConstraints,
    previousAttempts,
    confirmedFacts,
    userReportedSymptoms,
    preliminaryInferences,
    assumptionsToVerify,
    missingInformation,
    problemSummary,
  };
}

export function generateContextualDiscoveryResponse(
  consultation: Consultation,
  messages: Message[],
  documents: KnowledgeDocument[] = INITIAL_KNOWLEDGE_DOCUMENTS
): {
  reply: string;
  updatedContext: BusinessContextData;
  readyForUnderstanding: boolean;
  suggestedFollowUps: string[];
  knowledgeReferences: KnowledgeReference[];
  externalReferences?: ExternalReference[];
  videoResources?: VideoResource[];
} {
  const userMessages = messages.filter((m) => m.role === 'user');
  const lastUserMsg = userMessages[userMessages.length - 1]?.content?.trim() || '';

  // Rule 2.2: A simple greeting such as "Halo" must receive a simple, welcoming greeting.
  // Never invent a business problem or retrieve Knowledge Base references for greetings!
  const substantiveMessages = userMessages.filter(
    (m) => !isGreetingOrSmallTalk(m.content)
  );
  if (isGreetingOrSmallTalk(lastUserMsg) && substantiveMessages.length === 0) {
    return {
      reply: `Halo! Senang bisa berdiskusi dengan Anda. Ceritakan sedikit mengenai usaha yang sedang Anda jalankan (atau yang ingin Anda mulai) beserta kendala utama yang sedang Anda rasakan saat ini. Kita akan menelusuri solusinya bersama.`,
      updatedContext: consultation.businessContext,
      readyForUnderstanding: false,
      suggestedFollowUps: [
        'Penjualan usaha saya menurun sejak 2 bulan terakhir dan pelanggan baru berkurang.',
        'Saya bingung menghitung HPP dan menentukan harga jual agar margin tidak tipis.',
        'Stok bahan baku sering selisih dan alur produksi harian belum rapi.',
      ],
      knowledgeReferences: [],
      externalReferences: [],
      videoResources: [],
    };
  }

  const updatedContext = extractContextFromConversation(consultation, messages);
  const substantiveTurnCount = substantiveMessages.length;
  const detectedDomain = updatedContext.workTopic;

  const refs = retrieveRelevantKnowledge(
    `${consultation.initialProblem} ${lastUserMsg}`,
    detectedDomain,
    documents,
    2
  );

  const { externalReferences, videoResources } = retrieveExternalResources(
    lastUserMsg,
    detectedDomain
  );

  // Domain-adapted natural consultant responses
  if (substantiveTurnCount === 1) {
    if (detectedDomain === 'Finance & Pricing') {
      return {
        reply: `Saya mengerti. Ketidakpastian pada perhitungan HPP dan harga jual memang sering membuat pemilik usaha merasa sibuk berjualan setiap hari tetapi kas bersihnya tidak bertambah.

Agar kita bisa membedah letak kebocorannya secara akurat, boleh ceritakan produk apa yang Anda jual saat ini, dan bagaimana cara Anda menentukan harga jualnya selama ini (misalnya apakah sudah memasukkan biaya kemasan, gas/listrik, dan penyusutan bahan)?`,
        updatedContext,
        readyForUnderstanding: false,
        suggestedFollowUps: [
          'Selama ini saya baru menghitung bahan baku utama saja, belum menghitung kemasan dan gas/listrik.',
          'Saya mengikuti harga kompetitor di sekitar, tapi akhir-akhir ini harga bahan baku naik.',
        ],
        knowledgeReferences: refs,
        externalReferences,
        videoResources,
      };
    }

    if (detectedDomain === 'Operations') {
      return {
        reply: `Saya memahami situasinya. Ketika alur produksi atau pencatatan stok bahan baku belum tertata, waktu dan energi Anda pasti habis untuk memadamkan masalah harian di dapur atau tempat kerja.

Supaya solusi operasional yang kita susun benar-benar pas, boleh ceritakan bagian mana yang paling sering menimbulkan kendala saat ini—apakah bahan baku yang sering habis mendadak/rusak, atau kualitas hasil produksi yang belum seragam?`,
        updatedContext,
        readyForUnderstanding: false,
        suggestedFollowUps: [
          'Bahan baku sering habis mendadak atau ada yang terbuang karena tidak tercatat.',
          'Karena belum ada takaran tertulis (SOP), kualitas produk kadang berubah-ubah.',
        ],
        knowledgeReferences: refs,
        externalReferences,
        videoResources,
      };
    }

    if (detectedDomain === 'Customer Experience') {
      return {
        reply: `Terima kasih sudah berbagi. Ketika pembeli pertama jarang kembali melakukan pembelian ulang (repeat order), kita perlu memeriksa apakah hambatannya ada pada kepuasan produk/layanan atau karena belum adanya pengingat komunikasi setelah mereka membeli.

Boleh ceritakan bagaimana alur transaksi pelanggan Anda saat ini—apakah Anda menyimpan kontak mereka (misalnya di WhatsApp) dan pernah menanyakan kesan mereka setelah membeli?`,
        updatedContext,
        readyForUnderstanding: false,
        suggestedFollowUps: [
          'Sebagian besar beli langsung atau lewat chat, tapi saya belum pernah menghubungi mereka lagi setelah transaksi selesai.',
          'Ada beberapa pelanggan yang sempat komplain soal waktu pengiriman yang agak lama.',
        ],
        knowledgeReferences: refs,
        externalReferences,
        videoResources,
      };
    }

    if (detectedDomain === 'Starting a Business') {
      return {
        reply: `Langkah yang tepat untuk mendiskusikan hal ini sejak awal. Banyak usaha baru kehilangan modal karena langsung memproduksi dalam jumlah besar sebelum menguji siapa pembeli pertamanya.

Boleh ceritakan produk atau jasa spesifik apa yang ingin Anda tawarkan, serta berapa kisaran modal awal dan waktu luang yang Anda siapkan untuk memulai usaha ini?`,
        updatedContext,
        readyForUnderstanding: false,
        suggestedFollowUps: [
          'Saya ingin memulai dari rumah dengan sistem pre-order dan modal awal yang hemat.',
          'Produknya sudah saya coba buat sendiri, tapi saya bingung cara mendapatkan 10 pembeli pertama.',
        ],
        knowledgeReferences: refs,
        externalReferences,
        videoResources,
      };
    }

    // Marketing & Sales / General
    return {
      reply: `Saya mengerti. Jadi penurunan yang Anda rasakan ini bukan sekadar fluktuasi harian biasa, melainkan sudah mulai berdampak pada jumlah pelanggan baru yang masuk.

Agar kita bisa melihat di mana letak hambatannya—apakah pada jangkauan audiens baru atau pada jenis penawarannya—boleh ceritakan sedikit saluran penjualan apa yang Anda gunakan sekarang dan upaya promosi apa yang sudah pernah Anda coba selama ini?`,
      updatedContext,
      readyForUnderstanding: false,
      suggestedFollowUps: [
        'Selama ini saya hanya posting foto produk organik dan sesekali membuat promo potongan harga di Instagram.',
        'Saya mengandalkan penjualan di toko offline dan pesan WhatsApp dari pelanggan lama.',
      ],
      knowledgeReferences: refs,
      externalReferences,
      videoResources,
    };
  }

  if (substantiveTurnCount === 2) {
    if (detectedDomain === 'Finance & Pricing') {
      return {
        reply: `Gambaran itu sangat jelas. Jika komponen kemasan, biaya energi (gas/listrik), dan penyusutan bahan belum masuk ke dalam perhitungan HPP, maka margin yang terlihat di atas kertas sebenarnya tergerus oleh biaya operasional harian.

Satu hal lagi sebelum saya menyusun simulasi struktur HPP dan rencana perbaikan harga untuk Anda: siapa segmen pembeli utama Anda saat ini, dan apakah Anda menjual langsung ke konsumen akhir atau juga melalui mitra/aplikasi pesan-antar?`,
        updatedContext,
        readyForUnderstanding: false,
        suggestedFollowUps: [
          'Saya menjual langsung ke konsumen (eceran) dan sesekali menerima pesanan acara/kantor.',
          'Sebagian dijual langsung lewat WhatsApp, sebagian lagi lewat platform online yang ada potongan komisinya.',
        ],
        knowledgeReferences: refs,
        externalReferences,
        videoResources,
      };
    }

    if (detectedDomain === 'Operations') {
      return {
        reply: `Saya menangkap inti masalahnya. Tanpa batas stok minimum dan standar takaran tertulis, risiko pemborosan bahan dan ketidakkonsistenan mutu memang sangat tinggi.

Sebelum kita menyusun SOP Harian dan Rencana Tindakan untuk usaha Anda, boleh saya tahu apakah saat ini operasional dikerjakan oleh Anda sendiri atau dibantu oleh anggota tim/karyawan?`,
        updatedContext,
        readyForUnderstanding: false,
        suggestedFollowUps: [
          'Saat ini saya masih mengerjakan sebagian besar sendiri dibantu 1 orang asisten.',
          'Ada 2–3 orang staf produksi sehingga perlu panduan tertulis yang mudah mereka ikuti.',
        ],
        knowledgeReferences: refs,
        externalReferences,
        videoResources,
      };
    }

    return {
      reply: `Gambaran dari Anda sangat memperjelas situasinya. Ketika aktivitas promosi bertumpu pada pola yang sama secara organik, jangkauannya sering kali hanya berputar di pengikut lama dan belum memberi alasan kuat bagi orang baru untuk mencoba.

Sebelum kita menyusun analisis penyebab, rekomendasi prioritas, dan dokumen kerja untuk Anda: apakah Anda sudah menentukan segmen pembeli utama yang paling ingin dijangkau, serta apakah ada batasan anggaran promosi atau waktu yang perlu kita perhatikan?`,
      updatedContext,
      readyForUnderstanding: false,
      suggestedFollowUps: [
        'Jujur saya belum menentukan target pelanggan secara spesifik, dan saat ini saya tidak punya budget untuk iklan berbayar.',
        'Kebanyakan pembeli saya pekerja kantor dan keluarga sekitar, tapi waktu saya terbatas karena mengurus produksi sendiri.',
      ],
      knowledgeReferences: refs,
      externalReferences,
      videoResources,
    };
  }

  return {
    reply: `Terima kasih, gambaran situasi usaha Anda sudah sangat utuh. Kita telah memetakan fakta kondisi usaha, gejala yang terjadi, serta batasan sumber daya yang perlu dijaga.

Saya telah menyusun **Analisis Masalah, Rekomendasi Solusi Prioritas, Rencana Tindakan Praktis, serta Dokumen Kerja Bisnis yang dapat Anda unduh (PDF)** langsung di bawah ini.`,
    updatedContext,
    readyForUnderstanding: true,
    suggestedFollowUps: [
      'Sesuaikan strategi tanpa biaya iklan',
      'Jelaskan lebih rinci langkah Hari 1 sampai Hari 3',
    ],
    knowledgeReferences: refs,
    externalReferences,
    videoResources,
  };
}

export function generateKnowledgeBasedDiagnosis(
  consultation: Consultation,
  documents: KnowledgeDocument[] = INITIAL_KNOWLEDGE_DOCUMENTS
): ConsultationResult {
  const ctx = extractContextFromConversation(consultation, consultation.messages);
  const detectedDomain = ctx.workTopic;

  const queryString = [
    detectedDomain,
    consultation.businessCategory,
    ctx.mainChallenge,
    ctx.currentStrategy,
    ctx.targetAudience,
    ctx.budgetConstraints,
    consultation.initialProblem,
  ].join(' ');

  const matchedRefs = retrieveRelevantKnowledge(
    queryString,
    detectedDomain,
    documents,
    4
  );
  const { externalReferences, videoResources } = retrieveExternalResources(
    queryString,
    detectedDomain
  );
  const visualDiagram = buildVisualDiagramForDomain(detectedDomain, {
    ...consultation,
    workTopic: detectedDomain,
  });
  const tailoredDeliverable = buildTailoredDeliverable(detectedDomain, {
    ...consultation,
    workTopic: detectedDomain,
  });
  const problemAnalysisMatrix = buildProblemAnalysisMatrixForDomain(detectedDomain, ctx);
  const deterministicAnalysis = buildDeterministicAnalysisForConsultation({
    ...consultation,
    workTopic: detectedDomain,
  });
  const implementationMonitoring =
    consultation.result?.implementationMonitoring ||
    createDefaultImplementationMonitoring(consultation);

  const now = new Date().toISOString();
  const supportingFindings: string[] = [
    ...ctx.confirmedFacts,
    ...(ctx.userReportedSymptoms || []),
  ];

  // Domain-specific diagnosis & recommendations so we NEVER turn every problem into a marketing problem!
  if (detectedDomain === 'Finance & Pricing') {
    const possibleCauses: PossibleCause[] = [
      {
        cause: 'Komponen biaya kemasan, energi, dan penyusutan bahan belum masuk ke dalam HPP per unit',
        confidence: 'Kemungkinan penyebab',
        explanation:
          'Banyak UMKM hanya menghitung bahan baku utama saat menetapkan harga jual, sehingga biaya kemasan, gas/listrik, dan bahan terbuang (waste) memakan margin keuntungan bersih.',
      },
      {
        cause: 'Harga jual disamakan dengan kompetitor tanpa memperhitungkan perbedaan kualitas bahan & porsi',
        confidence: 'Indikasi awal',
        explanation:
          'Mengikuti harga pasar secara mentah tanpa batas bawah HPP membuat usaha rentan merugi ketika harga bahan baku naik.',
      },
      {
        cause: 'Pencampuran kas operasional usaha dengan pengeluaran pribadi/rumah tangga',
        confidence: 'Perlu diperiksa lebih lanjut',
        explanation:
          'Perlu diverifikasi apakah hasil penjualan harian langsung terpakai untuk kebutuhan non-usaha sehingga modal kerja terasa selalu kurang.',
      },
    ];

    const recommendations: Recommendation[] = [
      {
        id: 'rec-fin-01',
        title: 'Hitung Ulang HPP Lengkap per Unit Beserta Cadangan Penyusutan 5%',
        description:
          'Susun daftar seluruh komponen biaya per 1 batch produksi (bahan utama, bumbu/pendamping, kemasan lengkap, gas/listrik, dan cadangan penyusutan 3–5%), lalu bagi dengan jumlah porsi layak jual.',
        whyItMatters:
          'Mengacu pada Knowledge Base (Financial & Pricing Guide — Section 01), akurasi HPP adalah fondasi utama agar setiap transaksi benar-benar menyisakan laba bersih.',
        whyItFits:
          'Dapat langsung dikerjakan menggunakan catatan belanja bahan baku yang sudah Anda miliki tanpa memerlukan software akuntansi berbayar.',
        steps: [
          'Daftar 3–5 produk yang paling laku terjual saat ini.',
          'Catat biaya bahan baku + kemasan + alokasi gas/listrik untuk 1 kali produksi.',
          'Tetapkan batas margin kotor minimal 35%–40% untuk penjualan langsung ke konsumen.',
        ],
        expectedOutcome:
          'Mengetahui secara pasti berapa rupiah keuntungan bersih dari setiap produk yang terjual.',
        requiredResources: 'Catatan belanja bahan baku mingguan dan Lembar Kerja HPP Noevia.',
        limitationsToConsider:
          'Perbarui perhitungan setiap kali ada kenaikan harga bahan baku utama lebih dari 8%.',
        priority: 'High',
        helpfulFeedback: null,
      },
      {
        id: 'rec-fin-02',
        title: 'Terapkan Strategi Penyesuaian Harga Melalui Paket Bundling & Ukuran Porsi',
        description:
          'Jika harga jual saat ini terlalu mepet dengan HPP namun Anda khawatir pelanggan kaget bila harga dinaikkan langsung, perkenalkan ukuran porsi baru atau paket bundling yang memiliki margin lebih sehat.',
        whyItMatters:
          'Berdasarkan Knowledge Base (Financial & Pricing Guide — Section 02), penyesuaian nilai melalui bundling menjaga daya beli pelanggan sekaligus memperbaiki rata-rata keuntungan per transaksi.',
        whyItFits:
          'Menghindari risiko kehilangan pelanggan sensitif harga sembari mengamankan arus kas produksi.',
        steps: [
          'Identifikasi produk dengan margin paling tipis dan sesuaikan takaran/kemasannya secara proporsional.',
          'Buat 1 Paket Hemat/Keluarga yang menggabungkan produk margin tinggi dan produk favorit.',
          'Komunikasikan keunggulan kualitas bahan saat memberlakukan daftar harga baru.',
        ],
        expectedOutcome:
          'Peningkatan nilai transaksi rata-rata (average order value) dan margin bersih usaha.',
        requiredResources: 'Penyesuaian daftar menu/katalog dan informasi ke pelanggan.',
        limitationsToConsider:
          'Berikan pemberitahuan ramah kepada pelanggan tetap beberapa hari sebelum penyesuaian harga berlaku.',
        priority: 'High',
        helpfulFeedback: null,
      },
      {
        id: 'rec-fin-03',
        title: 'Pisahkan Rekening Kas Usaha & Tetapkan Alokasi Pembagian Hasil Penjualan',
        description:
          'Gunakan satu rekening atau dompet digital khusus untuk menampung seluruh pembayaran pelanggan dan belanja bahan baku, terpisah sepenuhnya dari kebutuhan pribadi.',
        whyItMatters:
          'Mengacu pada Knowledge Base (UMKM Business Fundamentals — Section 02), disiplin pemisahan kas mencegah kebocoran modal kerja yang tidak disadari.',
        whyItFits:
          'Memberikan kejelasan posisi uang tunai usaha setiap akhir minggu.',
        steps: [
          'Tentukan 1 rekening/e-wallet khusus operasional usaha mulai minggu ini.',
          'Sisihkan otomatis persentase HPP setiap malam untuk belanja bahan baku besok.',
          'Tetapkan jadwal pengambilan bagi hasil pemilik secara tetap (mingguan/bulanan).',
        ],
        expectedOutcome:
          'Modal belanja bahan baku selalu aman dan arus kas usaha tercatat transparan.',
        requiredResources: 'Rekening bank/e-wallet terpisah dan catatan kas harian sederhana.',
        limitationsToConsider:
          'Membutuhkan kedisiplinan mencatat setiap pengeluaran tunai kecil di tempat produksi.',
        priority: 'Medium',
        helpfulFeedback: null,
      },
    ];

    const actionPlan: ActionPlanItem[] = [
      {
        day: 1,
        action: 'Data seluruh biaya bahan baku & kemasan untuk 3 produk terlaris',
        objective: 'Mengumpulkan angka riil belanja bahan dan kemasan per 1 batch produksi',
        priority: 'Tinggi',
        timeline: 'Hari 1',
        requiredResources: 'Nota belanja bahan terakhir',
        expectedOutcome: 'Daftar biaya bahan langsung per batch',
        successMeasurement: '3 produk utama tercatat rincian bahannya 100%',
        completed: false,
      },
      {
        day: 2,
        action: 'Hitung alokasi biaya gas, listrik, dan penyusutan bahan (5%)',
        objective: 'Menemukan angka HPP per unit yang sesungguhnya tanpa biaya tersembunyi',
        priority: 'Tinggi',
        timeline: 'Hari 2',
        requiredResources: 'Lembar Kerja HPP Calculator Noevia',
        expectedOutcome: 'Angka HPP final per unit produk',
        successMeasurement: 'Selisih antara HPP lama dan HPP baru teridentifikasi',
        completed: false,
      },
      {
        day: 3,
        action: 'Evaluasi margin harga jual saat ini & simulasi harga baru',
        objective: 'Menentukan produk mana yang perlu penyesuaian harga atau ukuran porsi',
        priority: 'Tinggi',
        timeline: 'Hari 3',
        requiredResources: 'Daftar menu/harga saat ini',
        expectedOutcome: 'Tabel harga jual baru dengan margin minimal 35%',
        successMeasurement: 'Tidak ada lagi produk dengan margin di bawah 25%',
        completed: false,
      },
      {
        day: 4,
        action: 'Rancang 2 pilihan Paket Bundling dengan margin sehat',
        objective: 'Memberikan opsi pembelian bernilai lebih bagi pelanggan sekaligus menaikkan omzet per transaksi',
        priority: 'Menengah',
        timeline: 'Hari 4',
        requiredResources: 'Kombinasi produk unggulan',
        expectedOutcome: '2 menu paket bundling siap tawar',
        successMeasurement: 'Margin paket bundling terjaga di atas 30%',
        completed: false,
      },
      {
        day: 5,
        action: 'Pisahkan dompet/rekening kas operasional usaha',
        objective: 'Menghentikan pencampuran uang modal belanja bahan dengan pengeluaran pribadi',
        priority: 'Tinggi',
        timeline: 'Hari 5',
        requiredResources: '1 rekening atau dompet digital khusus usaha',
        expectedOutcome: 'Saldo awal kas usaha tercatat terpisah',
        successMeasurement: '100% pemasukan penjualan masuk ke rekening khusus',
        completed: false,
      },
      {
        day: 6,
        action: 'Perbarui daftar harga di katalog WhatsApp & media sosial',
        objective: 'Menerapkan struktur harga dan paket bundling baru kepada pelanggan',
        priority: 'Menengah',
        timeline: 'Hari 6',
        requiredResources: 'Desain daftar menu sederhana',
        expectedOutcome: 'Katalog harga terbaru aktif digunakan',
        successMeasurement: 'Pelanggan memesan menggunakan struktur harga/paket baru',
        completed: false,
      },
      {
        day: 7,
        action: 'Rekap pemasukan, HPP, dan laba bersih minggu pertama',
        objective: 'Memverifikasi peningkatan margin keuntungan bersih setelah perbaikan harga',
        priority: 'Menengah',
        timeline: 'Hari 7',
        requiredResources: 'Catatan penjualan 7 hari',
        expectedOutcome: 'Laporan ringkas laba kotor vs laba bersih mingguan',
        successMeasurement: 'Kas modal produksi minggu depan aman tersedia',
        completed: false,
      },
    ];

    return {
      id: `res-${consultation.id}`,
      consultationId: consultation.id,
      mainProblem: ctx.mainChallenge,
      problemSummary: ctx.problemSummary,
      supportingFindings,
      possibleCauses,
      problemAnalysisMatrix,
      deterministicAnalysis,
      implementationMonitoring,
      additionalConsiderations: [
        ...(ctx.assumptionsToVerify || []),
        'Periksa potensi potongan komisi jika menjual melalui aplikasi pesan-antar pihak ketiga.',
      ],
      knowledgeReferences: matchedRefs,
      externalReferences,
      videoResources,
      visualDiagram,
      tailoredDeliverable,
      successIndicators: [
        'Seluruh produk utama memiliki perhitungan HPP lengkap termasuk kemasan dan energi.',
        'Margin keuntungan kotor rata-rata terjaga minimal 35% untuk penjualan langsung.',
        'Kas operasional usaha terpisah 100% dari pengeluaran pribadi.',
      ],
      recommendations,
      actionPlan,
      createdAt: now,
      updatedAt: now,
    };
  }

  // Default / Marketing & Customer Acquisition (including SweetBite Bakery & general cases)
  const possibleCauses: PossibleCause[] = [
    {
      cause: 'Jangkauan akuisisi pelanggan baru terbatas pada satu saluran organik',
      confidence: 'Kemungkinan penyebab',
      explanation: `Aktivitas usaha saat ini bertumpu pada ${ctx.currentStrategy}. Ketika algoritma organik pada satu kanal melambat, belum tersedia jalur penemuan kedua (seperti pencarian lokal atau rujukan komunitas) untuk membawa pembeli baru.`,
    },
    {
      cause: 'Pesan promosi dan variasi konten belum diarahkan ke segmen pembeli spesifik',
      confidence: 'Indikasi awal',
      explanation: `Karena profil target pelanggan (${ctx.targetAudience}) masih cukup luas, unggahan foto produk statis belum menjawab momen kebutuhan spesifik calon pembeli (misalnya camilan rapat kantor atau hantaran keluarga).`,
    },
    {
      cause: 'Belum terukurnya rasio konversi dari pengunjung profil menjadi pembeli pertama',
      confidence: 'Perlu diperiksa lebih lanjut',
      explanation:
        'Masih perlu diverifikasi apakah calon pelanggan sebenarnya sudah melihat profil usaha tetapi ragu mencoba karena belum ada paket perkenalan (sampler) atau bukti ulasan pelanggan yang menonjol.',
    },
  ];

  const recommendations: Recommendation[] = [
    {
      id: 'rec-01',
      title: 'Fokuskan Target Pembeli pada 1–2 Segmen Lokal yang Spesifik',
      description:
        'Kerucutkan sasaran pemasaran Anda pada kelompok pembeli dengan kebutuhan nyata di sekitar Anda (misalnya pekerja kantor atau keluarga muda di radius 3–5 km) agar pesan promosi dan pilihan paket produk jauh lebih tajam.',
      whyItMatters:
        'Mengacu pada Knowledge Base (Marketing & Customer Acquisition — Section 01), pesan promosi yang mencoba menyasar "semua orang" cenderung terasa generik dan sulit menggerakkan orang asing untuk melakukan pembelian pertama.',
      whyItFits: `Sangat sesuai dengan kondisi ${consultation.businessName || 'usaha Anda'} yang saat ini belum mengunci segmen target spesifik dan membutuhkan hasil nyata tanpa biaya riset yang rumit.`,
      steps: [
        'Amati 10–15 pembeli terakhir Anda dan catat alasan utama mereka membeli (misal: untuk sarapan praktis, teman minum kopi sore, atau acara kumpul keluarga).',
        'Pilih maksimal 2 kelompok pembeli prioritas yang paling mudah dijangkau dari lokasi operasional Anda.',
        'Perbarui bio Instagram dan pesan sambutan WhatsApp agar langsung menyebutkan solusi produk bagi segmen tersebut.',
      ],
      expectedOutcome:
        'Calon pelanggan baru yang mengunjungi profil Anda langsung merasa produk tersebut relevan dengan kebutuhan harian mereka.',
      requiredResources: 'Waktu refleksi 1–2 jam dan catatan pesanan pelanggan sebelumnya (Tanpa biaya uang tunai).',
      limitationsToConsider:
        'Penajaman segmen membutuhkan konsistensi komunikasi minimal 2–3 minggu sebelum perubahan pola pembeli baru terlihat stabil.',
      priority: 'High',
      helpfulFeedback: null,
    },
    {
      id: 'rec-02',
      title: 'Ubah Pola Konten dari Katalog Foto Menjadi Cerita Proses & Paket Kenalan',
      description:
        'Kurangi unggahan yang hanya menampilkan foto produk di atas meja. Kombinasikan dengan video singkat proses pembuatan di dapur, kesegaran bahan, testimoni jujur pembeli, dan paket coba (trial box) untuk pembeli pertama.',
      whyItMatters:
        'Berdasarkan Knowledge Base (Marketing & Customer Acquisition — Section 02), konten yang memperlihatkan proses di balik layar dan momen konsumsi membangun kepercayaan (trust) jauh lebih cepat bagi orang yang belum pernah mencicipi produk Anda.',
      whyItFits:
        'Dapat langsung dijalankan menggunakan akun Instagram yang sudah Anda kelola sehari-hari tanpa perlu menambah beban pengelolaan platform baru.',
      steps: [
        'Tentukan 2–3 produk unggulan (hero products) yang paling disukai pelanggan lama sebagai ujung tombak perkenalan.',
        'Terapkan rotasi 3 jenis unggahan setiap minggu: (1) Proses panggangan/pembuatan segar, (2) Cerita kepuasan pelanggan, dan (3) Rekomendasi paket untuk momen spesifik.',
        'Sediakan 1 "Paket Kenalan / Sampler" dengan porsi dan harga terjangkau agar pembeli baru berani mencoba tanpa ragu.',
      ],
      expectedOutcome:
        'Meningkatkan interaksi organik dari non-pengikut serta menurunkan keraguan calon pelanggan untuk melakukan pesanan pertama.',
      requiredResources: 'Kamera ponsel saat jam produksi berlangsung dan penataan jadwal konten 3 kali seminggu.',
      limitationsToConsider:
        'Pertumbuhan jangkauan organik bersifat bertahap dan bergantung pada konsistensi kualitas visual serta kejelasan ajakan memesan (Call-to-Action).',
      priority: 'High',
      helpfulFeedback: null,
    },
    {
      id: 'rec-03',
      title: 'Buka Jalur Pelanggan Baru Melalui Komunitas Lokal & Rujukan Pelanggan Lama',
      description:
        'Jangan biarkan usaha hanya bergantung pada algoritma Instagram. Manfaatkan pencarian lokal (Google Business Profile), pembagian sampel terukur ke komunitas/kantor sekitar, dan insentif ajak teman bagi pelanggan setia.',
      whyItMatters:
        'Mengacu pada Knowledge Base (Marketing & Customer Acquisition — Section 03 & Business Development — Section 02), perpaduan jalur digital dan sentuhan komunitas lokal merupakan cara paling efektif mengakuisisi pelanggan baru tanpa anggaran iklan.',
      whyItFits: `Dirancang khusus untuk menjawab keterbatasan anggaran promosi (${ctx.budgetConstraints}) dengan memaksimalkan produk yang memang sudah Anda produksi setiap hari.`,
      steps: [
        'Pastikan titik lokasi usaha di Google Business Profile dilengkapi foto produk terbaru dan tautan WhatsApp aktif.',
        'Siapkan 5–8 porsi sampel ukuran mini sekali seminggu untuk diperkenalkan ke komunitas warga, ruang kantor sekitar, atau kedai kopi lokal yang membutuhkan pemasok pendamping.',
        'Sertakan kartu kecil di setiap kemasan pelanggan lama: berikan bonus 1 produk mini pada pesanan berikutnya jika mereka merekomendasikan ke 1 teman baru.',
      ],
      expectedOutcome:
        'Terciptanya saluran kedatangan pelanggan baru dari lingkungan sekitar dan rujukan mulut ke mulut yang tidak bergantung pada iklan berbayar.',
      requiredResources: 'Alokasi sedikit sampel produk harian dan kartu pesan sederhana di dalam kemasan.',
      limitationsToConsider:
        'Pendekatan komunitas lokal memerlukan keberanian membangun relasi langsung dan tindak lanjut WhatsApp yang ramah.',
      priority: 'Medium',
      helpfulFeedback: null,
    },
  ];

  const actionPlan: ActionPlanItem[] = [
    {
      day: 1,
      action: 'Petakan 2 segmen pembeli prioritas & 2 produk unggulan (hero products)',
      objective: 'Mengidentifikasi pembeli paling potensial dari histori pesanan dan menentukan pintu masuk bagi pembeli baru',
      priority: 'Tinggi',
      timeline: 'Hari 1',
      requiredResources: 'Catatan pelanggan & daftar menu',
      expectedOutcome: '2 segmen target & 2 produk unggulan terkunci',
      successMeasurement: 'Profil target tertulis jelas dan spesifik',
      completed: false,
    },
    {
      day: 2,
      action: 'Perbarui bio Instagram, katalog WhatsApp, & Google Business Profile',
      objective: 'Memastikan calon pelanggan baru langsung memahami keunikan produk, kisaran harga, lokasi, dan cara pesan satu klik',
      priority: 'Tinggi',
      timeline: 'Hari 2',
      requiredResources: 'Ponsel & 5 foto produk terbaik',
      expectedOutcome: 'Profil toko online dan pencarian lokal rapi',
      successMeasurement: 'Tautan pesan WhatsApp 1-klik berfungsi aktif',
      completed: false,
    },
    {
      day: 3,
      action: 'Rancang "Paket Kenalan / Trial" & rekam proses produksi segar',
      objective: 'Menyiapkan paket coba hemat risiko bagi pembeli pertama sekaligus mendokumentasikan proses pembuatan di dapur',
      priority: 'Tinggi',
      timeline: 'Hari 3',
      requiredResources: 'Kamera ponsel saat produksi pagi',
      expectedOutcome: '1 menu Paket Kenalan & 2 video pendek proses dapur',
      successMeasurement: 'Harga Paket Kenalan tetap memiliki margin positif',
      completed: false,
    },
    {
      day: 4,
      action: 'Publikasikan konten cerita proses & penawaran Paket Kenalan',
      objective: 'Menguji respons audiens terhadap format konten di balik layar yang lebih hangat dibandingkan foto katalog biasa',
      priority: 'Menengah',
      timeline: 'Hari 4',
      requiredResources: 'Akun Instagram & WhatsApp Story',
      expectedOutcome: 'Konten tayang pada jam aktif segmen sasaran',
      successMeasurement: 'Adanya peningkatan interaksi atau tanya harga di DM/WA',
      completed: false,
    },
    {
      day: 5,
      action: 'Jalankan perkenalan sampel ke 2 komunitas / kantor sekitar',
      objective: 'Membuka jalur penemuan pelanggan baru secara langsung di radius lokal tanpa biaya iklan digital',
      priority: 'Menengah',
      timeline: 'Hari 5',
      requiredResources: '6–8 potong sampel mini & kartu kontak WA',
      expectedOutcome: 'Kontak pengelola kantor/komunitas lokal tersimpan',
      successMeasurement: 'Minimal 2 titik lokal menerima sampel dan katalog',
      completed: false,
    },
    {
      day: 6,
      action: 'Kumpulkan ulasan pembeli & aktifkan ajakan "Bawa Teman"',
      objective: 'Mengubah kepuasan pelanggan yang ada menjadi bukti sosial (social proof) dan rujukan pembeli baru',
      priority: 'Menengah',
      timeline: 'Hari 6',
      requiredResources: 'Pesan tindak lanjut WhatsApp ke pelanggan lama',
      expectedOutcome: '3–5 testimoni jujur pelanggan terkumpul',
      successMeasurement: 'Sorotan (Highlight) testimoni baru terpasang di profil',
      completed: false,
    },
    {
      day: 7,
      action: 'Evaluasi jumlah chat masuk & pesanan dari pembeli pertama',
      objective: 'Meninjau saluran mana yang paling efektif mendatangkan pembeli baru untuk dilanjutkan pada minggu berikutnya',
      priority: 'Menengah',
      timeline: 'Hari 7',
      requiredResources: 'Rekap chat WhatsApp & transaksi mingguan',
      expectedOutcome: 'Catatan jumlah pembeli baru selama 7 hari',
      successMeasurement: 'Jalur akuisisi paling efektif teridentifikasi untuk minggu ke-2',
      completed: false,
    },
  ];

  return {
    id: `res-${consultation.id}`,
    consultationId: consultation.id,
    mainProblem:
      ctx.mainChallenge ||
      'Kesulitan menjangkau pelanggan baru melalui pendekatan promosi yang berjalan saat ini.',
    problemSummary: ctx.problemSummary,
    supportingFindings,
    possibleCauses,
    problemAnalysisMatrix,
    deterministicAnalysis,
    implementationMonitoring,
    additionalConsiderations: [
      ...(ctx.assumptionsToVerify || []),
      'Perbandingan proporsi transaksi dari pembeli baru vs pelanggan lama selama 30 hari terakhir.',
      '2–3 varian produk unggulan (hero products) dengan margin sehat dan tingkat kepuasan tertinggi.',
    ],
    knowledgeReferences: matchedRefs,
    externalReferences,
    videoResources,
    visualDiagram,
    tailoredDeliverable,
    successIndicators: [
      'Peningkatan jumlah pertanyaan dan pesanan dari pembeli pertama dalam 14 hari ke depan.',
      'Konsistensi publikasi konten berbasis proses dan momen konsumsi minimal 3 kali seminggu.',
      'Terbentuknya minimal 2 jalur kedatangan pelanggan baru di luar unggahan katalog biasa (pencarian lokal & rujukan pelanggan).',
    ],
    recommendations,
    actionPlan,
    createdAt: now,
    updatedAt: now,
  };
}

export function generateContextualContinuationResponse(
  consultation: Consultation,
  userQuestion: string,
  documents: KnowledgeDocument[] = INITIAL_KNOWLEDGE_DOCUMENTS
): {
  reply: string;
  knowledgeReferences: KnowledgeReference[];
  externalReferences?: ExternalReference[];
  videoResources?: VideoResource[];
  updatedActionPlan?: ActionPlanItem[];
  updatedRecommendations?: Recommendation[];
} {
  if (isGreetingOrSmallTalk(userQuestion)) {
    return {
      reply: `Halo! Silakan beri tahu saya jika ada bagian dari rekomendasi, rencana tindakan, atau dokumen bisnis di atas yang ingin Anda sesuaikan atau tanyakan lebih lanjut.`,
      knowledgeReferences: [],
      externalReferences: [],
      videoResources: [],
    };
  }

  const lower = userQuestion.toLowerCase();
  const detectedDomain = detectBusinessDomain(
    `${consultation.initialProblem} ${userQuestion}`,
    consultation.workTopic
  );
  const refs = retrieveRelevantKnowledge(
    `${consultation.initialProblem} ${userQuestion}`,
    detectedDomain,
    documents,
    3
  );
  const { externalReferences, videoResources } = retrieveExternalResources(
    userQuestion,
    detectedDomain
  );

  const isZeroBudgetOrStrategyShift =
    lower.includes('budget') ||
    lower.includes('biaya') ||
    lower.includes('iklan') ||
    lower.includes('gratis') ||
    lower.includes('tanpa modal') ||
    lower.includes('alternatif') ||
    lower.includes('sesuaikan');

  if (isZeroBudgetOrStrategyShift && consultation.result) {
    const updatedRecommendations: Recommendation[] = [
      {
        id: 'rec-zero-01',
        title: 'Strategi Paket Kenalan & Rujukan Pelanggan Setia (Zero-Ad-Budget)',
        description:
          'Ubah pelanggan lama Anda menjadi duta produk dengan memberikan insentif produk mini setiap kali mereka mengajak teman kantor atau kerabat memesan pertama kali.',
        whyItMatters:
          'Rekomendasi dari teman yang sudah dipercaya memiliki tingkat konversi tinggi tanpa membutuhkan anggaran iklan sepeser pun.',
        whyItFits: `Memanfaatkan basis pelanggan dan produksi harian ${consultation.businessName || 'usaha Anda'} yang sudah berjalan.`,
        steps: [
          'Siapkan pesan singkat atau kartu kecil di setiap kemasan pesanan pelanggan lama.',
          'Tawarkan bonus 1 varian mini gratis untuk pesanan berikutnya bila teman yang mereka rekomendasikan bertransaksi.',
          'Catat setiap pelanggan baru yang datang dari jalur rekomendasi ini di WhatsApp.',
        ],
        expectedOutcome:
          'Pertumbuhan pelanggan baru organik dari lingkaran pertemanan pembeli yang sudah puas.',
        requiredResources: 'HPP 1 potong produk ukuran mini saat terjadi transaksi nyata.',
        limitationsToConsider:
          'Pastikan kualitas pesanan pertama bagi teman yang direkomendasikan terjaga prima agar rujukan terus berlanjut.',
        priority: 'High',
        helpfulFeedback: null,
      },
      {
        id: 'rec-zero-02',
        title: 'Product Seeding & Titip Sampel Terjadwal di Komunitas Lokal',
        description:
          'Jangkau kelompok pembeli potensial di radius 1–3 km (kantor, arisan warga, atau kedai kopi lokal) melalui sampel terjadwal dan kemitraan konsinyasi/suplai.',
        whyItMatters:
          'Untuk produk kuliner dan UMKM lokal, pengalaman mencicipi langsung sering kali jauh lebih efektif memicu pembelian daripada melihat poster digital.',
        whyItFits:
          'Menggantikan biaya iklan digital dengan interaksi tatap muka yang biayanya sepenuhnya terkendali.',
        steps: [
          'Daftar 3 titik kumpul potensial di sekitar lokasi usaha (kantor, komunitas olahraga/warga, atau kedai kopi tanpa dapur pastry).',
          'Antarkan kotak sampel potongan kecil disertai kartu menu QR WhatsApp pada jam istirahat.',
          'Tawarkan paket pesanan rapat atau skema suplai rutin ke pengelola tempat tersebut.',
        ],
        expectedOutcome:
          'Membuka peluang pesanan kolektif (kantoran/komunitas) sekaligus pembeli eceran baru.',
        requiredResources: '5–8 potong sampel per minggu dan waktu kunjungan singkat 1 jam.',
        limitationsToConsider:
          'Pilih waktu kunjungan di luar jam sibuk produksi agar operasional dapur tidak terganggu.',
        priority: 'High',
        helpfulFeedback: null,
      },
      consultation.result.recommendations[1] || consultation.result.recommendations[0],
    ];

    const updatedActionPlan: ActionPlanItem[] = [
      {
        day: 1,
        action: 'Kunci 2 segmen pembeli lokal (radius 3 km) & 2 produk hero',
        objective: 'Memfokuskan penawaran tanpa biaya riset pada pembeli kantor dan keluarga muda sekitar',
        priority: 'Tinggi',
        timeline: 'Hari 1',
        requiredResources: 'Catatan penjualan sebelumnya',
        expectedOutcome: 'Target pasar lokal spesifik terkunci',
        successMeasurement: '2 segmen prioritas ditetapkan',
        completed: consultation.result.actionPlan[0]?.completed || false,
      },
      {
        day: 2,
        action: 'Rapikan bio Instagram & titik Google Business Profile',
        objective: 'Memudahkan orang di sekitar lokasi menemukan produk melalui pencarian lokal gratis',
        priority: 'Tinggi',
        timeline: 'Hari 2',
        requiredResources: 'Ponsel & foto produk',
        expectedOutcome: 'Profil lokal aktif dan mudah dihubungi',
        successMeasurement: 'Tautan WA aktif di bio & Google Maps',
        completed: consultation.result.actionPlan[1]?.completed || false,
      },
      {
        day: 3,
        action: 'Siapkan "Paket Kenalan" & rekam video proses dapur',
        objective: 'Membangun kepercayaan visual organik dan menurunkan batas keraguan pembeli pertama',
        priority: 'Tinggi',
        timeline: 'Hari 3',
        requiredResources: 'Batch produksi harian',
        expectedOutcome: 'Paket coba siap dipasarkan',
        successMeasurement: 'Konten proses dapur siap unggah',
        completed: false,
      },
      {
        day: 4,
        action: 'Luncurkan program "Ajak Teman" kepada pelanggan lama di WhatsApp',
        objective: 'Menggerakkan pelanggan setia untuk mengenalkan produk ke rekan mereka tanpa biaya iklan',
        priority: 'Menengah',
        timeline: 'Hari 4',
        requiredResources: 'Daftar kontak pelanggan lama',
        expectedOutcome: 'Pesan ajakan terkirim ke minimal 15 pelanggan setia',
        successMeasurement: 'Minimal 3 pelanggan merespons penawaran rujukan',
        completed: false,
      },
      {
        day: 5,
        action: 'Antarkan sampel terukur ke 2 kantor / komunitas sekitar',
        objective: 'Memperkenalkan rasa produk secara langsung ke kelompok pembeli potensial',
        priority: 'Menengah',
        timeline: 'Hari 5',
        requiredResources: '6–8 potong sampel mini',
        expectedOutcome: 'Perkenalan langsung dengan pengelola kantor/komunitas',
        successMeasurement: 'Kontak WhatsApp pengurus tempat tersimpan',
        completed: false,
      },
      {
        day: 6,
        action: 'Publikasikan cerita testimoni pembeli baru di Instagram',
        objective: 'Memperkuat bukti sosial organik bagi pengunjung profil yang masih ragu memesan',
        priority: 'Menengah',
        timeline: 'Hari 6',
        requiredResources: 'Tangkapan layar ulasan pelanggan',
        expectedOutcome: 'Bukti sosial tampil di Story & Highlight',
        successMeasurement: 'Minimal 3 ulasan ditampilkan',
        completed: false,
      },
      {
        day: 7,
        action: 'Evaluasi penambahan kontak baru dari jalur komunitas & rujukan',
        objective: 'Menentukan kanal tanpa biaya iklan mana yang paling banyak menghasilkan transaksi',
        priority: 'Menengah',
        timeline: 'Hari 7',
        requiredResources: 'Catatan pesanan mingguan',
        expectedOutcome: 'Rekap jumlah pembeli pertama minggu ini',
        successMeasurement: 'Saluran organik terbaik teridentifikasi',
        completed: false,
      },
    ];

    return {
      reply: `Saya mengerti sepenuhnya. Anda tidak perlu memaksakan anggaran iklan berbayar jika kondisi kas usaha saat ini lebih baik dijaga untuk modal produksi.

Untuk situasi **${consultation.businessName || 'usaha Anda'}**, kita menggeser titik tumpu akuisisi pelanggan baru menjadi **100% organik melalui pendekatan komunitas lokal dan rujukan pembeli setia**:

1. **Mengaktifkan Rujukan dari Pelanggan Lama**: Pembeli yang sudah menyukai produk Anda adalah saluran promosi paling tepercaya. Dengan menghadiahkan 1 porsi mini pada pesanan berikutnya ketika mereka mengajak teman baru memesan, Anda hanya mengeluarkan biaya bahan baku saat transaksi baru benar-benar terjadi.
2. **Perkenalan Sampel Terjadwal di Radius Dekat**: Sisihkan sedikit potongan sampel dari panggangan harian untuk diperkenalkan ke kantor, grup warga, atau kedai kopi lokal di radius 1–3 km.

Saya juga telah **memperbarui daftar Rekomendasi dan Rencana Tindakan** di atas (serta dokumen PDF yang dapat Anda unduh) agar sepenuhnya menyesuaikan strategi tanpa biaya iklan.`,
      knowledgeReferences: refs,
      externalReferences,
      videoResources,
      updatedActionPlan,
      updatedRecommendations,
    };
  }

  return {
    reply: `Terima kasih atas pertanyaannya. Melihat kembali kondisi **${consultation.businessName || consultation.businessCategory}** yang sedang berfokus mengatasi *${consultation.businessContext.mainChallenge.toLowerCase()}*, poin ini sangat tepat untuk kita perdalam.

Agar pelaksanaannya tetap realistis dengan waktu dan sumber daya Anda:
- Fokuskan eksekusi pada langkah prioritas di **Hari 1 hingga Hari 3** terlebih dahulu sebelum memperluas ke langkah berikutnya.
- Gunakan **Dokumen Kerja Bisnis** yang sudah disiapkan di kartu unduhan di atas sebagai panduan kerja harian Anda.

Jika Anda ingin menyesuaikan target waktu atau memiliki kendala teknis saat menerapkannya, silakan ceritakan di sini agar kita sesuaikan bersama.`,
    knowledgeReferences: refs,
    externalReferences,
    videoResources,
  };
}

export function validateDiagnosisPayload(
  rawJson: unknown,
  consultation: Consultation,
  documents: KnowledgeDocument[] = INITIAL_KNOWLEDGE_DOCUMENTS
): ConsultationResult {
  const fallback = generateKnowledgeBasedDiagnosis(consultation, documents);
  if (!rawJson || typeof rawJson !== 'object') {
    return fallback;
  }

  const data = rawJson as Record<string, unknown>;
  const mainProblem =
    typeof data.main_problem === 'string' && data.main_problem.trim().length > 5
      ? data.main_problem.trim()
      : fallback.mainProblem;

  const problemSummary =
    typeof data.problem_summary === 'string' && data.problem_summary.trim().length > 10
      ? data.problem_summary.trim()
      : fallback.problemSummary;

  const supportingFindings = Array.isArray(data.supporting_findings)
    ? data.supporting_findings.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : fallback.supportingFindings;

  const additionalConsiderations = Array.isArray(data.additional_considerations)
    ? data.additional_considerations.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : fallback.additionalConsiderations;

  const validConfidences: Array<PossibleCause['confidence']> = [
    'Kemungkinan penyebab',
    'Indikasi awal',
    'Perlu diperiksa lebih lanjut',
  ];

  const possibleCauses: PossibleCause[] = Array.isArray(data.possible_causes)
    ? data.possible_causes
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((item, idx) => ({
          cause:
            typeof item.cause === 'string' && item.cause.trim()
              ? item.cause.trim()
              : fallback.possibleCauses[idx % fallback.possibleCauses.length].cause,
          confidence: validConfidences.includes(item.confidence as PossibleCause['confidence'])
            ? (item.confidence as PossibleCause['confidence'])
            : validConfidences[idx % validConfidences.length],
          explanation:
            typeof item.explanation === 'string' && item.explanation.trim()
              ? item.explanation.trim()
              : fallback.possibleCauses[idx % fallback.possibleCauses.length].explanation,
        }))
    : fallback.possibleCauses;

  const recommendations: Recommendation[] = Array.isArray(data.recommendations)
    ? data.recommendations
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .slice(0, 3)
        .map((item, idx) => {
          const fbRec = fallback.recommendations[idx % fallback.recommendations.length];
          return {
            id: `rec-ai-${idx + 1}`,
            title:
              typeof item.title === 'string' && item.title.trim()
                ? item.title.trim()
                : fbRec.title,
            description:
              typeof item.description === 'string' && item.description.trim()
                ? item.description.trim()
                : fbRec.description,
            whyItMatters:
              typeof item.why_it_matters === 'string' && item.why_it_matters.trim()
                ? item.why_it_matters.trim()
                : typeof item.reason === 'string' && item.reason.trim()
                  ? item.reason.trim()
                  : fbRec.whyItMatters,
            whyItFits:
              typeof item.why_it_fits === 'string' && item.why_it_fits.trim()
                ? item.why_it_fits.trim()
                : fbRec.whyItFits,
            steps:
              Array.isArray(item.steps) && item.steps.length > 0
                ? item.steps.filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
                : fbRec.steps,
            expectedOutcome:
              typeof item.expected_outcome === 'string' && item.expected_outcome.trim()
                ? item.expected_outcome.trim()
                : fbRec.expectedOutcome,
            requiredResources:
              typeof item.required_resources === 'string' && item.required_resources.trim()
                ? item.required_resources.trim()
                : fbRec.requiredResources,
            limitationsToConsider:
              typeof item.limitations_to_consider === 'string' && item.limitations_to_consider.trim()
                ? item.limitations_to_consider.trim()
                : fbRec.limitationsToConsider,
            priority:
              item.priority === 'High' || item.priority === 'Medium' || item.priority === 'Foundational'
                ? item.priority
                : 'High',
            helpfulFeedback: null,
          };
        })
    : fallback.recommendations;

  const actionPlan: ActionPlanItem[] =
    Array.isArray(data.action_plan) && data.action_plan.length > 0
      ? data.action_plan
          .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
          .map((item, idx) => {
            const fbItem = fallback.actionPlan[idx % fallback.actionPlan.length];
            return {
              day: typeof item.day === 'number' ? item.day : idx + 1,
              action:
                typeof item.action === 'string' && item.action.trim()
                  ? item.action.trim()
                  : typeof item.task === 'string' && item.task.trim()
                    ? item.task.trim()
                    : fbItem.action,
              objective:
                typeof item.objective === 'string' && item.objective.trim()
                  ? item.objective.trim()
                  : fbItem.objective,
              priority: fbItem.priority || 'Tinggi',
              timeline: fbItem.timeline || `Hari ${idx + 1}`,
              requiredResources: fbItem.requiredResources || 'Sumber daya internal UMKM',
              expectedOutcome: fbItem.expectedOutcome || fbItem.objective,
              successMeasurement: fbItem.successMeasurement || 'Langkah terlaksana sesuai target',
              completed: false,
            };
          })
      : fallback.actionPlan;

  // Validate Knowledge References strictly against ready documents to prevent hallucinated sources
  const readyDocNames = new Set(
    documents.filter((d) => d.processingStatus === 'Ready').map((d) => d.documentName.toLowerCase())
  );

  let knowledgeReferences = fallback.knowledgeReferences;
  if (Array.isArray(data.knowledge_references) && data.knowledge_references.length > 0) {
    const verifiedRefs: KnowledgeReference[] = [];
    for (const rawRef of data.knowledge_references) {
      if (rawRef && typeof rawRef === 'object') {
        const r = rawRef as Record<string, unknown>;
        const docTitle = typeof r.document === 'string' ? r.document.trim() : '';
        if (docTitle && readyDocNames.has(docTitle.toLowerCase())) {
          const matchedDoc = documents.find((d) => d.documentName.toLowerCase() === docTitle.toLowerCase())!;
          const secHeading =
            typeof r.section === 'string' && r.section.trim()
              ? r.section.trim()
              : matchedDoc.sections[0]?.sectionHeading || 'Section 01';
          const matchedSec =
            matchedDoc.sections.find((s) =>
              s.sectionHeading.toLowerCase().includes(secHeading.toLowerCase())
            ) || matchedDoc.sections[0];

          verifiedRefs.push({
            id: `ref-verified-${matchedDoc.id}-${verifiedRefs.length}`,
            documentId: matchedDoc.id,
            documentTitle: matchedDoc.documentName,
            sectionHeading: matchedSec ? matchedSec.sectionHeading : secHeading,
            pageNumber: matchedSec ? matchedSec.pageNumber : typeof r.page === 'number' ? r.page : null,
            relevantContent: matchedSec ? matchedSec.content : matchedDoc.description,
          });
        }
      }
    }
    if (verifiedRefs.length > 0) {
      knowledgeReferences = verifiedRefs;
    }
  }

  return {
    ...fallback,
    mainProblem,
    problemSummary,
    supportingFindings: supportingFindings.length > 0 ? supportingFindings : fallback.supportingFindings,
    possibleCauses: possibleCauses.length > 0 ? possibleCauses : fallback.possibleCauses,
    additionalConsiderations:
      additionalConsiderations.length > 0 ? additionalConsiderations : fallback.additionalConsiderations,
    knowledgeReferences,
    recommendations: recommendations.length > 0 ? recommendations : fallback.recommendations,
    actionPlan: actionPlan.length > 0 ? actionPlan : fallback.actionPlan,
  };
}

export function createSweetBiteDemoConsultation(): Consultation {
  const id = 'cons-sweetbite-demo';
  const createdAt = '2026-10-29T09:15:00.000Z';
  const updatedAt = '2026-10-30T14:40:00.000Z';

  const messages: Message[] = [
    {
      id: 'msg-sb-1',
      consultationId: id,
      role: 'user',
      content: SWEETBITE_DEMO_PRESET.initialProblem,
      createdAt: '2026-10-29T09:15:10.000Z',
      phase: 'discovery',
    },
    {
      id: 'msg-sb-2',
      consultationId: id,
      role: 'assistant',
      content: `Saya mengerti. Jadi masalah ini bukan sekadar penurunan penjualan sesaat, melainkan sudah berlangsung sekitar dua bulan dan paling terasa pada berkurangnya pelanggan baru yang datang.

Saya ingin memahami bagian yang paling terdampak dan upaya yang sudah berjalan terlebih dahulu. Selama ini di Instagram, apakah Anda lebih banyak mengunggah foto produk dan promo sesekali, atau sudah pernah mencoba pendekatan lain untuk menjangkau orang di luar pengikut lama?`,
      createdAt: '2026-10-29T09:15:25.000Z',
      phase: 'discovery',
    },
    {
      id: 'msg-sb-3',
      consultationId: id,
      role: 'user',
      content:
        'Benar, pelanggan baru yang berkurang drastis. Selama ini saya hanya mengandalkan Instagram dengan memposting foto katalog roti dan sesekali membuat promo potongan harga.',
      createdAt: '2026-10-29T09:16:40.000Z',
      phase: 'discovery',
    },
    {
      id: 'msg-sb-4',
      consultationId: id,
      role: 'assistant',
      content: `Gambaran itu sangat memperjelas situasinya. Ketika unggahan didominasi foto produk dan promo sesekali secara organik, jangkauannya sering kali hanya berputar di pelanggan lama yang sudah mengenal rasa roti Anda, sementara calon pembeli baru belum memiliki alasan kuat untuk mencoba pertama kali.

Sebelum kita menyusun langkah solusinya, boleh saya tahu apakah Anda sudah menentukan segmen pelanggan utama yang ingin diprioritaskan (misalnya pekerja kantor atau keluarga di sekitar toko), serta bagaimana ketersediaan waktu dan anggaran promosi Anda saat ini?`,
      createdAt: '2026-10-29T09:17:00.000Z',
      phase: 'discovery',
    },
    {
      id: 'msg-sb-5',
      consultationId: id,
      role: 'user',
      content:
        'Jujur saya belum menentukan target pelanggan secara spesifik, pokoknya siapa saja yang suka roti. Untuk anggaran iklan berbayar saat ini juga belum ada karena fokus menjaga kas produksi.',
      createdAt: '2026-10-29T09:18:10.000Z',
      phase: 'discovery',
    },
    {
      id: 'msg-sb-6',
      consultationId: id,
      role: 'assistant',
      content: `Terima kasih atas keterbukaannya. Menjaga arus kas produksi adalah keputusan yang bijak, jadi kita tidak perlu memaksakan iklan berbayar. Kuncinya sekarang adalah menajamkan sasaran pembeli di sekitar lokasi Anda dan mengubah cara memperkenalkan produk agar orang baru berani mencoba.

Saya telah menyusun rangkuman situasi bisnis, pemetaan kemungkinan penyebab, rekomendasi langkah prioritas, rencana tindakan 7 hari, serta dokumen **14-Day Content Calendar & Promotion Guide** yang disesuaikan untuk SweetBite Bakery.`,
      createdAt: '2026-10-29T09:18:30.000Z',
      phase: 'discovery',
    },
  ];

  const baseConsultation: Consultation = {
    id,
    userId: null,
    title: 'SweetBite Bakery — Akuisisi Pelanggan Baru (Contoh Studi Kasus)',
    businessName: SWEETBITE_DEMO_PRESET.businessName,
    businessCategory: SWEETBITE_DEMO_PRESET.businessCategory,
    businessStage: SWEETBITE_DEMO_PRESET.businessStage,
    workTopic: SWEETBITE_DEMO_PRESET.workTopic,
    initialProblem: SWEETBITE_DEMO_PRESET.initialProblem,
    consultationStatus: 'Analyzed & Active',
    currentStep: 'step-06-results',
    createdAt,
    updatedAt,
    messages,
    generatedDocuments: [],
    businessContext: {
      id: 'ctx-sweetbite',
      consultationId: id,
      businessName: SWEETBITE_DEMO_PRESET.businessName,
      businessCategory: SWEETBITE_DEMO_PRESET.businessCategory,
      businessStage: SWEETBITE_DEMO_PRESET.businessStage,
      workTopic: SWEETBITE_DEMO_PRESET.workTopic,
      businessDescription: SWEETBITE_DEMO_PRESET.businessDescription,
      mainChallenge: 'Penurunan akuisisi pelanggan baru selama dua bulan terakhir',
      currentStrategy: 'Mengandalkan unggahan organik Instagram (dominan foto katalog produk & promo sesekali)',
      targetAudience: 'Belum didefinisikan secara spesifik (masih menyasar pembeli umum)',
      businessGoals: 'Mendatangkan pelanggan baru secara konsisten tanpa membebani arus kas produksi',
      availableResources: 'Dapur produksi aktif, toko offline, akun Instagram, dan kontak WhatsApp',
      budgetConstraints: 'Tanpa anggaran iklan berbayar — fokus pada langkah organik & kemitraan lokal',
      previousAttempts: 'Mengunggah foto produk secara rutin dan mengadakan promo potongan harga sesekali di Instagram.',
      confirmedFacts: [
        'Usaha bakery sedang berjalan (Already Operating) dengan kanal penjualan toko offline dan Instagram.',
        'Penjualan menurun selama dua bulan terakhir akibat berkurangnya jumlah pelanggan baru.',
        'Aktivitas pemasaran saat ini hanya mengandalkan konten organik Instagram berupa foto produk dan promo sesekali.',
        'Target pelanggan utama belum didefinisikan secara spesifik dan belum ada anggaran khusus untuk iklan berbayar.',
      ],
      userReportedSymptoms: [
        'Jumlah pembeli baru yang datang atau memesan berkurang terasa sejak dua bulan terakhir.',
        'Promosi yang diunggah di Instagram belum memberikan dampak penjualan yang terlihat jelas.',
      ],
      preliminaryInferences: [
        'Indikasi awal: Ketergantungan pada satu kanal organik dengan format katalog foto membatasi jangkauan ke calon pembeli baru di luar pengikut lama.',
        'Kemungkinan penyebab: Pesan promosi masih bersifat umum sehingga belum relevan dengan momen konsumsi spesifik pembeli lokal.',
      ],
      assumptionsToVerify: [
        'Perlu diverifikasi apakah pelanggan lama masih melakukan pembelian berulang secara normal (yang menandakan kualitas rasa tetap disukai).',
        'Perlu diperiksa apakah informasi lokasi, harga, dan kemudahan pesan di profil Instagram sudah cukup jelas bagi pengunjung pertama.',
      ],
      missingInformation: [
        'Data jangkauan akun non-pengikut (reach) Instagram dalam 30 hari terakhir',
        'Proporsi penjualan harian antara pembeli langsung (walk-in) dan pesanan lewat pesan singkat',
      ],
      problemSummary:
        'SweetBite Bakery mengalami penurunan akuisisi pelanggan baru selama dua bulan terakhir. Aktivitas pemasaran saat ini bertumpu pada unggahan organik di Instagram (foto katalog produk) dengan cakupan target pasar yang belum didefinisikan secara spesifik serta tanpa alokasi anggaran iklan berbayar.',
    },
    result: null,
  };

  baseConsultation.result = generateKnowledgeBasedDiagnosis(baseConsultation, INITIAL_KNOWLEDGE_DOCUMENTS);
  return baseConsultation;
}
