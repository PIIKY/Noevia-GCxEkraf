import { KnowledgeDocument, KnowledgeReference, WorkTopicCategory } from '../types';

export const INITIAL_KNOWLEDGE_DOCUMENTS: KnowledgeDocument[] = [
  {
    id: 'KB-01',
    documentName: 'UMKM Business Fundamentals',
    description: 'Panduan fondasi model bisnis, proporsi nilai unik (UVP), pemisahan arus kas usaha, dan kepatuhan izin dasar UMKM di Indonesia.',
    category: 'Starting a Business',
    source: 'Noevia UMKM Knowledge Repository — Seri Fondasi Usaha (2026)',
    fileType: 'PDF',
    storagePath: '/kb/KB-01_UMKM_Business_Fundamentals.pdf',
    processingStatus: 'Ready',
    mainTopics: [
      'Proposisi Nilai Unik (UVP)',
      'Segmentasi Pelanggan Awal',
      'Pemisahan Keuangan Pribadi & Usaha',
      'Legalitas Dasar UMKM (NIB, PIRT, Halal)',
    ],
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-10-15T10:30:00.000Z',
    sections: [
      {
        sectionId: 'KB-01-S01',
        sectionHeading: 'Section 01 — Merumuskan Value Proposition yang Spesifik',
        pageNumber: 4,
        keywords: ['ide bisnis', 'memulai', 'keunggulan', 'kompetitor', 'produk', 'nilai', 'diferensiasi', 'starting'],
        content:
          'Banyak usaha baru gagal menarik pembeli pertama karena menawarkan produk yang terlalu umum ("roti enak", "baju murah"). UMKM perlu menetapkan Value Proposition yang menjawab tiga hal: (1) Siapa segmen pembeli paling spesifik, (2) Masalah atau momen konsumsi apa yang diselesaikan (misal: camilan rapat kantor pagi hari, hampers ulang tahun mendadak), dan (3) Alasan rasional mengapa pelanggan memilih produk ini dibanding alternatif terdekat.',
      },
      {
        sectionId: 'KB-01-S02',
        sectionHeading: 'Section 02 — Disiplin Pemisahan Keuangan Pribadi dan Operasional',
        pageNumber: 9,
        keywords: ['modal', 'keuangan', 'rekening', 'arus kas', 'untung', 'bocor', 'pencatatan'],
        content:
          'Sejak hari pertama beroperasi, pemilik UMKM wajib memisahkan rekening atau dompet kas usaha dari pengeluaran rumah tangga. Tetapkan alokasi gaji pemilik yang tetap atau berbasis persentase laba bersih, serta catat seluruh pemasukan dan pengeluaran bahan baku harian agar modal kerja (working capital) tidak tergerus tanpa disadari.',
      },
      {
        sectionId: 'KB-01-S03',
        sectionHeading: 'Section 03 — Tahapan Memulai Usaha dengan Risiko Terukur',
        pageNumber: 14,
        keywords: ['mulai usaha', 'langkah awal', 'perencanaan', 'modal kecil', 'persiapan', 'launching'],
        content:
          'Saat memulai usaha dengan sumber daya terbatas, hindari investasi peralatan mahal atau sewa tempat jangka panjang sebelum ada bukti permintaan berulang. Gunakan skema produksi batch kecil dari rumah (home business), fokuskan pada 2–3 varian produk inti (hero product), dan kumpulkan umpan balik dari 20 pembeli pertama yang tidak memiliki hubungan keluarga.',
      },
    ],
  },
  {
    id: 'KB-02',
    documentName: 'Marketing & Customer Acquisition',
    description: 'Strategi akuisisi pelanggan baru untuk UMKM, optimasi konten organik media sosial, diversifikasi kanal pemasaran tanpa iklan berbayar, dan kemitraan lokal.',
    category: 'Marketing',
    source: 'Noevia UMKM Knowledge Repository — Modul Pemasaran & Akuisisi (2026)',
    fileType: 'PDF',
    storagePath: '/kb/KB-02_Marketing_Customer_Acquisition.pdf',
    processingStatus: 'Ready',
    mainTopics: [
      'Target Market Identification',
      'Customer Acquisition Funnel',
      'Organic Instagram & Short-Video Content Pillars',
      'Zero-Budget Local Community & Micro-Partnership',
    ],
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-18T11:00:00.000Z',
    sections: [
      {
        sectionId: 'KB-02-S01',
        sectionHeading: 'Section 01 — Target Market Identification & Buyer Persona UMKM',
        pageNumber: 3,
        keywords: ['target pelanggan', 'target pasar', 'audiens', 'pembeli', 'segmen', 'siapa', 'bakery', 'minuman', 'fashion'],
        content:
          'Kesalahan utama pemasaran UMKM adalah mencoba menjual ke "semua orang". Tentukan 1–2 segmen prioritas berdasarkan perilaku nyata: misalnya untuk usaha bakery/kuliner lokal, bedakan antara (a) pekerja kantor/keluarga muda radius 3–5 km yang mencari sarapan/camilan sore praktis, dan (b) pembeli pesanan acara komunitas/arisan/kantor. Ketajaman target menentukan jam posting, gaya bahasa, dan paket produk yang ditawarkan.',
      },
      {
        sectionId: 'KB-02-S02',
        sectionHeading: 'Section 02 — Diversifikasi Konten Organik (Bukan Sekadar Foto Produk)',
        pageNumber: 8,
        keywords: ['instagram', 'konten', 'organik', 'foto produk', 'sepi', 'interaksi', 'promosi', 'sosial media', 'reels'],
        content:
          'Akun Instagram UMKM yang hanya mengunggah foto katalog produk cenderung mengalami penurunan jangkauan (reach) ke audiens baru karena algoritma memprioritaskan retensi tontonan dan interaksi. Terapkan 4 Pilar Konten Organik: (1) Behind-the-Scenes & Proses Produksi (menunjukkan kesegaran bahan/pemanggangan), (2) Problem/Moment Hook (rekomendasi menu untuk momen spesifik seperti oleh-oleh atau rapat), (3) Social Proof & Testimoni jujur pelanggan, serta (4) Penawaran Terbatas (batch harian atau paket coba/sampler).',
      },
      {
        sectionId: 'KB-02-S03',
        sectionHeading: 'Section 03 — Customer Acquisition Tanpa Budget Iklan Berbayar',
        pageNumber: 15,
        keywords: ['pelanggan baru', 'penjualan menurun', 'tanpa biaya iklan', 'budget', 'gratis', 'komunitas', 'kolaborasi', 'lokal', 'offline'],
        content:
          'Ketika akuisisi pelanggan baru menurun dan bisnis tidak memiliki anggaran iklan berbayar (Zero-Ad-Budget Strategy), perluas kanal penemuan di luar satu akun sosial media: (1) Optimasi Google Business Profile agar mudah ditemukan pencari lokal, (2) Program Tester/Sampling ke komunitas lokal, kantor sekitar, atau grup warga, (3) Kolaborasi barter produk (product seeding) dengan mikro-kreator lokal (1.000–10.000 pengikut di kota yang sama), dan (4) Paket "Bawa Teman / Bundling Berbagi" yang mendorong pelanggan lama mengenalkan produk ke kenalan baru.',
      },
      {
        sectionId: 'KB-02-S04',
        sectionHeading: 'Section 04 — Evaluasi Metrik Akuisisi vs Retensi Sederhana',
        pageNumber: 21,
        keywords: ['evaluasi', 'data', 'penurunan', 'omzet', 'insight', 'konversi', 'whatsapp'],
        content:
          'Sebelum mengubah seluruh strategi pemasaran, pisahkan diagnosis antara masalah jangkauan (orang belum tahu bisnis kita) dan masalah konversi (orang melihat profil tetapi tidak jadi membeli). Periksa kejelasan informasi di bio/profil (lokasi, kisaran harga, cara pesan satu klik ke WhatsApp, dan menu rekomendasi untuk pembeli pertama).',
      },
    ],
  },
  {
    id: 'KB-03',
    documentName: 'Financial Management & Pricing',
    description: 'Metode perhitungan Harga Pokok Produksi (HPP/COGS), struktur biaya operasional, strategi penetapan harga jual, dan pengamanan margin laba UMKM.',
    category: 'Finance & Pricing',
    source: 'Noevia UMKM Knowledge Repository — Modul Keuangan & Harga (2026)',
    fileType: 'CSV',
    storagePath: '/kb/KB-03_Financial_Management_Pricing.csv',
    processingStatus: 'Ready',
    mainTopics: [
      'Perhitungan HPP (Harga Pokok Produksi)',
      'Biaya Tetap vs Biaya Variabel',
      'Strategi Harga Jual & Bundling',
      'Titik Impas (Break-Even Point)',
    ],
    createdAt: '2026-10-03T08:00:00.000Z',
    updatedAt: '2026-10-19T09:15:00.000Z',
    sections: [
      {
        sectionId: 'KB-03-S01',
        sectionHeading: 'Section 01 — Komponen HPP Lengkap (Bahan Baku, Kemasan, dan Penyusutan)',
        pageNumber: 2,
        keywords: ['hpp', 'biaya produksi', 'harga pokok', 'modal', 'kemasan', 'listrik', 'gas', 'hitung'],
        content:
          'Kesalahan paling umum UMKM dalam menghitung HPP adalah hanya memasukkan bahan baku utama dan melupakan biaya kemasan (packaging), gas/listrik produksi, tenaga kerja langsung, serta persentase produk gagal/susut (waste factor 3%–5%). HPP per unit harus dihitung dari total biaya satu batch produksi dibagi jumlah unit layak jual yang dihasilkan.',
      },
      {
        sectionId: 'KB-03-S02',
        sectionHeading: 'Section 02 — Strategi Penetapan Harga Jual & Margin Bertingkat',
        pageNumber: 7,
        keywords: ['harga jual', 'margin', 'untung', 'diskon', 'promo', 'kompetitor', 'mahal', 'murah'],
        content:
          'Jangan menetapkan harga jual hanya dengan menyamakan atau membanting harga di bawah kompetitor tanpa mengetahui struktur biaya sendiri. Gunakan kombinasi Cost-Plus Pricing (memastikan margin kotor minimal 35%–50% untuk F&B/kerajinan guna menutup biaya operasional) dan Value-Tiered Bundling: sediakan produk entry-level dengan harga terjangkau untuk menarik pembeli baru, serta paket bundling/hampers dengan margin nominal lebih tinggi.',
      },
      {
        sectionId: 'KB-03-S03',
        sectionHeading: 'Section 03 — Mengelola Promo Tanpa Mengorbankan Laba Bersih',
        pageNumber: 12,
        keywords: ['promo', 'potongan harga', 'rugi', 'bundling', 'voucher', 'cashflow'],
        content:
          'Diskon persentase langsung pada produk satuan sering menggerus margin laba UMKM secara drastis. Sebagai alternatif yang lebih sehat secara finansial, gunakan promo berbasis peningkatan nilai transaksi rata-rata (Average Order Value), seperti bonus produk ukuran mini untuk pembelian di atas nominal tertentu atau harga khusus paket isi 4.',
      },
    ],
  },
  {
    id: 'KB-04',
    documentName: 'Business Operations',
    description: 'Panduan pengelolaan stok bahan baku, pengendalian bahan mudah rusak (perishable), standardisasi kualitas produksi (SOP), dan manajemen kapasitas harian.',
    category: 'Operations',
    source: 'Noevia UMKM Knowledge Repository — Modul Operasional & Produksi (2026)',
    fileType: 'PDF',
    storagePath: '/kb/KB-04_Business_Operations.pdf',
    processingStatus: 'Ready',
    mainTopics: [
      'Manajemen Stok & Metode FIFO',
      'Pengendalian Waste Produk Segar',
      'Standardisasi Resep / SOP Kualitas',
      'Efisiensi Kapasitas & Lead Time',
    ],
    createdAt: '2026-10-04T08:00:00.000Z',
    updatedAt: '2026-10-20T14:00:00.000Z',
    sections: [
      {
        sectionId: 'KB-04-S01',
        sectionHeading: 'Section 01 — Pengendalian Stok Bahan Baku & Sistem FIFO',
        pageNumber: 5,
        keywords: ['stok', 'bahan baku', 'basi', 'rusak', 'gudang', 'operasional', 'inventori', 'fifo'],
        content:
          'Untuk usaha dengan bahan baku berumur simpan pendek, terapkan prinsip First-In First-Out (FIFO) dengan pelabelan tanggal masuk dan batas pakai. Tetapkan titik pemesanan kembali (Reorder Point) sederhana untuk 5 bahan baku paling kritis agar produksi tidak terhenti mendadak saat pesanan meningkat.',
      },
      {
        sectionId: 'KB-04-S02',
        sectionHeading: 'Section 02 — Menyeimbangkan Kapasitas Produksi Harian & Sistem Pre-Order',
        pageNumber: 11,
        keywords: ['kapasitas', 'produksi', 'sisa', 'tidak laku', 'pre-order', 'jadwal', 'tenaga kerja', 'kewalahan'],
        content:
          'Jika permintaan harian masih fluktuatif, kombinasikan kuota ready-stock harian yang konservatif untuk produk best-seller dengan sistem Pre-Order (H-1) untuk varian spesial atau pesanan jumlah banyak. Pendekatan hybrid ini menekan risiko produk terbuang sekaligus menjaga ketersediaan barang bagi pelanggan impulsif.',
      },
    ],
  },
  {
    id: 'KB-05',
    documentName: 'Customer Experience & Retention',
    description: 'Strategi meningkatkan kepuasan pelanggan, membangun pembelian berulang (repeat order), pengelolaan database pelanggan WhatsApp, dan penanganan komplain.',
    category: 'Customer Experience',
    source: 'Noevia UMKM Knowledge Repository — Modul Retensi & Layanan Pelanggan (2026)',
    fileType: 'PDF',
    storagePath: '/kb/KB-05_Customer_Experience_Retention.pdf',
    processingStatus: 'Ready',
    mainTopics: [
      'Alur Pelayanan Pelanggan Cepat & Ramah',
      'Strategi Repeat Order & Loyalitas',
      'Pencatatan Database Pelanggan Sederhana',
      'Penanganan Komplain Menjadi Kepercayaan',
    ],
    createdAt: '2026-10-05T08:00:00.000Z',
    updatedAt: '2026-10-21T16:20:00.000Z',
    sections: [
      {
        sectionId: 'KB-05-S01',
        sectionHeading: 'Section 01 — Membangun Kebiasaan Repeat Order dari Pelanggan Pertama',
        pageNumber: 4,
        keywords: ['pelanggan lama', 'repeat order', 'beli lagi', 'loyalitas', 'retensi', 'kartu', 'member'],
        content:
          'Biaya mempertahankan pelanggan yang sudah pernah membeli jauh lebih rendah daripada mencari pelanggan baru. Sertakan pemicu pembelian kembali pada setiap kemasan produk (packaging insert), misalnya kartu apresiasi berisi rekomendasi cara penyajian terbaik dan penawaran khusus untuk pemesanan kedua dalam 14 hari.',
      },
      {
        sectionId: 'KB-05-S02',
        sectionHeading: 'Section 02 — Pengelolaan Kontak WhatsApp & Follow-Up Non-Spam',
        pageNumber: 10,
        keywords: ['whatsapp', 'pelayanan', 'respon', 'komplain', 'testimoni', 'review', 'kepuasan'],
        content:
          'Simpan kontak pelanggan dengan label kategori minat produknya. Lakukan pesan tindak lanjut singkat 1–2 hari setelah produk diterima untuk menanyakan kepuasan rasa/kualitas tanpa langsung berjualan. Umpan balik positif yang terkumpul dapat diminta izinnya untuk dijadikan bukti sosial (social proof) guna meyakinkan calon pelanggan baru.',
      },
    ],
  },
  {
    id: 'KB-06',
    documentName: 'Business Development & Validation',
    description: 'Kerangka validasi ide bisnis baru, pengujian produk dengan MVP hemat biaya, kemitraan B2B/konsinyasi lokal, dan ekspansi saluran penjualan.',
    category: 'Business Growth',
    source: 'Noevia UMKM Knowledge Repository — Modul Validasi & Ekspansi Usaha (2026)',
    fileType: 'PDF',
    storagePath: '/kb/KB-06_Business_Development_Validation.pdf',
    processingStatus: 'Ready',
    mainTopics: [
      'Validasi Pasar Sebelum Produksi Massal',
      'Pengembangan Produk Baru & Paket Musiman',
      'Kemitraan B2B, Kafe, & Konsinyasi Lokal',
      'Evaluasi Pertumbuhan Usaha Bertahap',
    ],
    createdAt: '2026-10-06T08:00:00.000Z',
    updatedAt: '2026-10-22T12:10:00.000Z',
    sections: [
      {
        sectionId: 'KB-06-S01',
        sectionHeading: 'Section 01 — Validasi Ide & Produk Baru melalui Uji Batch Terbatas',
        pageNumber: 3,
        keywords: ['validasi', 'ide', 'produk baru', 'uji pasar', 'tes', 'minat', 'inovasi'],
        content:
          'Sebelum meluncurkan menu atau lini produk baru secara permanen, lakukan validasi permintaan dengan metode Pre-Order Batch Terbatas (misal: kuota 15–25 paket akhir pekan). Ukur berapa banyak orang yang benar-benar membayar, bukan sekadar memberikan komentar suka di media sosial.',
      },
      {
        sectionId: 'KB-06-S02',
        sectionHeading: 'Section 02 — Ekspansi Saluran Distribusi Melalui Kemitraan B2B Lokal',
        pageNumber: 9,
        keywords: ['mengembangkan bisnis', 'ekspansi', 'cabang', 'reseller', 'konsinyasi', 'b2b', 'kafe', 'kantor', 'event'],
        content:
          'Untuk mengembangkan omzet tanpa harus membuka toko fisik baru yang mahal, bangun saluran distribusi kemitraan lokal: tawarkan skema suplai rutin atau konsinyasi terkurasi ke kedai kopi lokal (yang membutuhkan pendamping pastry/roti), koperasi kantor, penyelenggara rapat, atau toko oleh-oleh komunitas setempat.',
      },
    ],
  },
];

export function formatKnowledgeCitation(ref: Pick<KnowledgeReference, 'documentTitle' | 'sectionHeading' | 'pageNumber'>): string {
  const base = `Source: ${ref.documentTitle} — ${ref.sectionHeading}`;
  return ref.pageNumber ? `${base} (Hal. ${ref.pageNumber})` : base;
}

const TOPIC_TO_KB_MAP: Record<WorkTopicCategory, string[]> = {
  'Starting a Business': ['KB-01', 'KB-06', 'KB-02'],
  'Marketing': ['KB-02', 'KB-05', 'KB-06'],
  'Finance & Pricing': ['KB-03', 'KB-01', 'KB-04'],
  'Operations': ['KB-04', 'KB-03', 'KB-01'],
  'Customer Experience': ['KB-05', 'KB-02', 'KB-04'],
  'Business Growth': ['KB-06', 'KB-02', 'KB-05'],
  'Other Challenges': ['KB-01', 'KB-02', 'KB-03', 'KB-04', 'KB-05', 'KB-06'],
};

const INDONESIAN_STOPWORDS = new Set([
  'dan', 'yang', 'ini', 'itu', 'ada', 'untuk', 'dari', 'dengan', 'saya',
  'kami', 'kita', 'bisa', 'atau', 'tapi', 'tetapi', 'belum', 'sudah',
  'hanya', 'masih', 'dalam', 'pada', 'ke', 'di', 'oleh', 'karena',
  'seperti', 'agar', 'supaya', 'lebih', 'sangat', 'juga', 'tidak', 'bukan',
  'apa', 'bagaimana', 'apakah', 'mempunyai', 'punya', 'usaha', 'bisnis',
  'halo', 'hai', 'hello', 'selamat', 'pagi', 'siang', 'sore', 'malam',
  'permisi', 'terima', 'kasih', 'tolong', 'mau', 'ingin', 'tanya',
  'noevia', 'kak', 'min', 'admin', 'hari', 'sedang', 'sekali',
]);

const GREETING_PATTERNS =
  /^(halo+|hai+|hi+|hello+|hey+|selamat\s+(pagi|siang|sore|malam)|permisi|tes|test|assalamualaikum|apa\s+kabar|terima\s+kasih|makasih|thanks|ok|oke|baik|siap)(\s+(noevia|kak|min|admin|semua))?[\s!.,?]*$/i;

export function isGreetingOrSmallTalk(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return true;
  if (GREETING_PATTERNS.test(trimmed)) return true;
  const words = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (words.length <= 3 && words.every((w) => INDONESIAN_STOPWORDS.has(w))) {
    return true;
  }
  return false;
}

export function detectBusinessDomain(
  text: string,
  fallback: WorkTopicCategory = 'Marketing'
): WorkTopicCategory {
  const lower = text.toLowerCase();
  if (!lower.trim() || isGreetingOrSmallTalk(lower)) {
    return fallback;
  }

  const domainPatterns: Record<WorkTopicCategory, RegExp[]> = {
    'Finance & Pricing': [
      /\bharga\s+jual\b/,
      /\bhpp\b/,
      /\bbiaya\s+produksi\b/,
      /\bmargin\b/,
      /\buntung\b|\brugi\b|\bkeuntungan\b/,
      /\barus\s+kas\b|\bcash\s*flow\b/,
      /\bmodal\s+kerja\b|\bkeuangan\b|\bpembukuan\b/,
      /\bbocor\b|\bkemahalan\b/,
    ],
    'Operations': [
      /\bstok\b|\bbahan\s+baku\b/,
      /\binventori\b|\binventory\b|\bgudang\b/,
      /\bsop\b|\balur\s+kerja\b/,
      /\bkualitas\s+tidak\s+konsisten\b|\brusak\b|\bbasi\b/,
      /\boperasional\b|\bterlambat\b|\bketeteran\b/,
    ],
    'Customer Experience': [
      /\brepeat\s+order\b|\bbeli\s+lagi\b/,
      /\bpelanggan\s+lama\b|\bjarang\s+kembali\b/,
      /\bkomplain\b|\bkeluhan\b|\bkecewa\b/,
      /\bkepuasan\b|\bloyalitas\b|\bretensi\b/,
      /\bpelayanan\b|\bcustomer\s+service\b|\bulasan\s+buruk\b/,
    ],
    'Starting a Business': [
      /\bbaru\s+ingin\s+mulai\b|\bmau\s+buka\s+usaha\b/,
      /\bide\s+bisnis\b|\bvalidasi\s+pasar\b/,
      /\bbelum\s+punya\s+usaha\b|\bmulai\s+usaha\b|\bmemulai\s+bisnis\b/,
      /\blangkah\s+awal\b|\bpembeli\s+pertama\b|\bpelanggan\s+pertama\b/,
    ],
    'Business Growth': [
      /\bcabang\s+baru\b|\bekspansi\b/,
      /\breseller\b|\bb2b\b|\bkemitraan\b|\bkonsinyasi\b/,
      /\bpasar\s+baru\b|\bscale\s+up\b|\bmengembangkan\s+usaha\b/,
    ],
    'Marketing': [
      /\binstagram\b|\btiktok\b/,
      /\bpromosi\b|\biklan\b|\bkonten\b/,
      /\bpelanggan\s+baru\b|\bsepi\s+pembeli\b/,
      /\bpenjualan\s+menurun\b|\bomzet\s+menurun\b/,
      /\bpemasaran\b|\bmarketing\b|\bbranding\b/,
      /\bjangkauan\b|\bfollowers\b|\bkonversi\b/,
    ],
    'Other Challenges': [],
  };

  let bestDomain: WorkTopicCategory = fallback;
  let bestScore = 0;

  for (const [domain, patterns] of Object.entries(domainPatterns) as Array<
    [WorkTopicCategory, RegExp[]]
  >) {
    let score = 0;
    for (const pat of patterns) {
      if (pat.test(lower)) {
        score += 10;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestDomain = domain;
    }
  }

  return bestScore > 0 ? bestDomain : fallback;
}

export function retrieveRelevantKnowledge(
  queryText: string,
  workTopic: WorkTopicCategory,
  documents: KnowledgeDocument[],
  limit = 4
): KnowledgeReference[] {
  if (!queryText || isGreetingOrSmallTalk(queryText)) {
    return [];
  }

  const readyDocs = documents.filter((doc) => doc.processingStatus === 'Ready');
  if (readyDocs.length === 0) {
    return [];
  }

  const detectedTopic = detectBusinessDomain(queryText, workTopic);
  const normalizedQuery = queryText.toLowerCase();
  const queryTokens = normalizedQuery
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !INDONESIAN_STOPWORDS.has(token));

  if (queryTokens.length === 0) {
    return [];
  }

  const preferredKbIds = TOPIC_TO_KB_MAP[detectedTopic] || [];

  const scoredSections: Array<{
    score: number;
    explicitKeywordMatches: number;
    tokenMatches: number;
    doc: KnowledgeDocument;
    section: KnowledgeDocument['sections'][number];
    matchedTerms: string[];
  }> = [];

  for (const doc of readyDocs) {
    const priorityRank = preferredKbIds.indexOf(doc.id);
    const categoryBoost = priorityRank === 0 ? 6 : priorityRank > 0 ? 3 : 0;

    for (const section of doc.sections) {
      let score = 0;
      let explicitKeywordMatches = 0;
      let tokenMatches = 0;
      const matchedTerms: string[] = [];

      for (const kw of section.keywords) {
        const lowerKw = kw.toLowerCase();
        if (normalizedQuery.includes(lowerKw)) {
          score += 9;
          explicitKeywordMatches += 1;
          matchedTerms.push(kw);
        }
      }

      const combinedText = `${doc.documentName} ${section.sectionHeading} ${section.content}`.toLowerCase();
      for (const token of queryTokens) {
        if (combinedText.includes(token)) {
          score += 3;
          tokenMatches += 1;
          if (!matchedTerms.includes(token) && matchedTerms.length < 4) {
            matchedTerms.push(token);
          }
        }
      }

      if (explicitKeywordMatches > 0 || tokenMatches >= 2) {
        score += categoryBoost;
      }

      scoredSections.push({
        score,
        explicitKeywordMatches,
        tokenMatches,
        doc,
        section,
        matchedTerms,
      });
    }
  }

  // Filter by relevance threshold so unrelated sections are never cited
  const relevantSections = scoredSections
    .filter(
      (item) =>
        (item.explicitKeywordMatches >= 1 || item.tokenMatches >= 2) &&
        item.score >= 9
    )
    .sort((a, b) => b.score - a.score);

  const topResults = relevantSections.slice(0, limit);

  return topResults.map((item, idx) => ({
    id: `ref-${item.doc.id}-${item.section.sectionId}-${idx}`,
    documentId: item.doc.id,
    documentTitle: item.doc.documentName,
    sectionHeading: item.section.sectionHeading,
    pageNumber: item.section.pageNumber,
    relevantContent: item.section.content,
    relevanceReason:
      item.matchedTerms.length > 0
        ? `Relevan dengan konteks: ${item.matchedTerms.slice(0, 3).join(', ')}`
        : `Relevan dengan topik ${detectedTopic}`,
  }));
}

export function createKnowledgeDocumentFromUpload(params: {
  fileName: string;
  category: string;
  description: string;
  rawText: string;
  existingCount: number;
}): KnowledgeDocument {
  const cleanName = params.fileName.replace(/\.(pdf|csv|txt)$/i, '').replace(/[_-]+/g, ' ');
  const fileType: 'PDF' | 'CSV' = params.fileName.toLowerCase().endsWith('.csv') ? 'CSV' : 'PDF';
  const nextNumber = String(params.existingCount + 1).padStart(2, '0');
  const id = `KB-${nextNumber}`;
  const now = new Date().toISOString();

  const paragraphs = params.rawText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 20);

  const sections =
    paragraphs.length > 0
      ? paragraphs.slice(0, 5).map((para, idx) => {
          const words = para
            .toLowerCase()
            .replace(/[^a-z0-9\s]/gi, ' ')
            .split(/\s+/)
            .filter((w) => w.length >= 4)
            .slice(0, 8);
          return {
            sectionId: `${id}-S0${idx + 1}`,
            sectionHeading: `Section 0${idx + 1} — ${para.slice(0, 48).trim()}${para.length > 48 ? '...' : ''}`,
            pageNumber: idx + 1,
            content: para,
            keywords: Array.from(new Set([params.category.toLowerCase(), ...words])),
          };
        })
      : [
          {
            sectionId: `${id}-S01`,
            sectionHeading: `Section 01 — Panduan ${cleanName}`,
            pageNumber: 1,
            content:
              params.rawText.trim() ||
              params.description ||
              `Panduan operasional dan referensi konsultasi untuk ${cleanName}.`,
            keywords: [params.category.toLowerCase(), cleanName.toLowerCase()],
          },
        ];

  return {
    id,
    documentName: cleanName,
    description: params.description || `Dokumen referensi Knowledge Base kategori ${params.category}.`,
    category: params.category,
    source: `Uploaded Document — ${params.fileName}`,
    fileType,
    storagePath: `/kb/${params.fileName}`,
    processingStatus: 'Ready',
    mainTopics: sections.map((s) => s.sectionHeading.replace(/^Section \d+\s*—\s*/, '')),
    sections,
    createdAt: now,
    updatedAt: now,
  };
}
