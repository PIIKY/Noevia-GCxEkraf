import { AppLanguage, WorkTopicCategory } from '../types';

export type LearningCategorySlug =
  | 'memulai-bisnis'
  | 'marketing-branding'
  | 'keuangan-harga'
  | 'operasional'
  | 'pelanggan-penjualan'
  | 'pengembangan-bisnis';

export interface LearningCategoryMeta {
  slug: LearningCategorySlug;
  labelId: string;
  labelEn: string;
  descriptionId: string;
  descriptionEn: string;
  workTopic: WorkTopicCategory;
}

export interface LearningArticle {
  id: string;
  categorySlug: LearningCategorySlug;
  categoryLabel: string;
  categoryLabelEn: string;
  title: string;
  titleEn: string;
  summary: string;
  summaryEn: string;
  readingTime: string;
  readingTimeEn: string;
  difficulty: 'Pemula' | 'Menengah' | 'Lanjutan';
  difficultyEn: 'Beginner' | 'Intermediate' | 'Advanced';
  isFeatured: boolean;
  // 9 Required Article Sections (ID & EN)
  introduction: string;
  introductionEn: string;
  whyItMatters: string;
  whyItMattersEn: string;
  explanation: string;
  explanationEn: string;
  umkmExample: {
    businessName: string;
    situation: string;
    situationEn: string;
    solutionApplied: string;
    solutionAppliedEn: string;
    outcome: string;
    outcomeEn: string;
  };
  stepByStep: string[];
  stepByStepEn: string[];
  commonMistakes: string[];
  commonMistakesEn: string[];
  actionChecklist: string[];
  actionChecklistEn: string[];
  relatedResources: {
    title: string;
    titleEn: string;
    type: 'Artikel' | 'Panduan' | 'Referensi Resmi';
    typeEn: 'Article' | 'Guide' | 'Official Reference';
    targetIdOrUrl: string;
  }[];
  sourceReferences: {
    docId: string;
    docTitle: string;
    section: string;
    page: number;
  }[];
  consultationPrompt: string;
  consultationPromptEn: string;
}

export interface ActionableGuide {
  id: string;
  title: string;
  titleEn: string;
  category: string;
  categoryEn: string;
  readingTime: string;
  readingTimeEn: string;
  explanation: string;
  explanationEn: string;
  practicalSteps: string[];
  practicalStepsEn: string[];
  simpleExample: string;
  simpleExampleEn: string;
  commonMistakes: string[];
  commonMistakesEn: string[];
  relatedTopics: string[];
  relatedTopicsEn: string[];
  consultationPrompt: string;
  consultationPromptEn: string;
}

export interface FaqItem {
  id: string;
  question: string;
  questionEn: string;
  topic:
    | 'Penjualan & Konversi'
    | 'Keuangan & Harga'
    | 'Marketing & Iklan'
    | 'Pelanggan & Retensi'
    | 'Memulai Usaha'
    | 'Operasional & Stok';
  topicEn:
    | 'Sales & Conversion'
    | 'Finance & Pricing'
    | 'Marketing & Ads'
    | 'Customers & Retention'
    | 'Starting a Business'
    | 'Operations & Inventory';
  shortAnswer: string;
  shortAnswerEn: string;
  detailedExplanation: string[];
  detailedExplanationEn: string[];
  relatedGuideId: string;
  relatedGuideTitle: string;
  relatedGuideTitleEn: string;
  consultationPrompt: string;
  consultationPromptEn: string;
}

export const LEARNING_CATEGORIES: LearningCategoryMeta[] = [
  {
    slug: 'memulai-bisnis',
    labelId: 'Memulai Bisnis',
    labelEn: 'Starting a Business',
    descriptionId:
      'Validasi ide usaha, penentuan model bisnis, dan langkah awal mendapatkan pembeli pertama.',
    descriptionEn:
      'Business idea validation, business model selection, and practical steps to get your first customers.',
    workTopic: 'Starting a Business',
  },
  {
    slug: 'marketing-branding',
    labelId: 'Marketing & Branding',
    labelEn: 'Marketing & Branding',
    descriptionId:
      'Segmentasi pasar, positioning produk, strategi konten organik, dan akuisisi pelanggan.',
    descriptionEn:
      'Market segmentation, product positioning, organic content strategy, and customer acquisition.',
    workTopic: 'Marketing',
  },
  {
    slug: 'keuangan-harga',
    labelId: 'Keuangan & Harga',
    labelEn: 'Finance & Pricing',
    descriptionId:
      'Perhitungan HPP (COGS), strategi harga jual bertingkat, margin keuntungan, dan arus kas.',
    descriptionEn:
      'COGS calculation, tiered pricing strategies, profit margins, and cash flow management.',
    workTopic: 'Finance & Pricing',
  },
  {
    slug: 'operasional',
    labelId: 'Operasional',
    labelEn: 'Operations',
    descriptionId:
      'Manajemen stok bahan baku, efisiensi produksi, alur kerja harian, dan pembuatan SOP.',
    descriptionEn:
      'Inventory management, production efficiency, daily workflows, and SOP creation.',
    workTopic: 'Operations',
  },
  {
    slug: 'pelanggan-penjualan',
    labelId: 'Pelanggan & Penjualan',
    labelEn: 'Customers & Sales',
    descriptionId:
      'Meningkatkan konversi chat ke pembelian, layanan pelanggan, penanganan komplain, dan repeat order.',
    descriptionEn:
      'Improving chat-to-sale conversion, customer service, complaint handling, and repeat orders.',
    workTopic: 'Customer Experience',
  },
  {
    slug: 'pengembangan-bisnis',
    labelId: 'Pengembangan Bisnis',
    labelEn: 'Business Growth',
    descriptionId:
      'Ekspansi saluran distribusi, kemitraan B2B lokal, diversifikasi produk, dan kesiapan skala usaha.',
    descriptionEn:
      'Distribution channel expansion, local B2B partnerships, product diversification, and scaling readiness.',
    workTopic: 'Business Growth',
  },
];

export const LEARNING_ARTICLES: LearningArticle[] = [
  {
    id: 'art-memulai-01',
    categorySlug: 'memulai-bisnis',
    categoryLabel: 'Memulai Bisnis',
    categoryLabelEn: 'Starting a Business',
    title: 'Cara Memvalidasi Ide Produk Sebelum Mengeluarkan Modal Besar',
    titleEn: 'How to Validate Your Product Idea Before Spending Large Capital',
    summary:
      'Pelajari metode uji pasar skala kecil dan sistem pre-order agar produk baru Anda terbukti diminati pembeli sebelum membeli peralatan mahal.',
    summaryEn:
      'Learn small-batch market validation and pre-order methods so your product is proven to have real buyers before investing in expensive equipment.',
    readingTime: '5 menit baca',
    readingTimeEn: '5 min read',
    difficulty: 'Pemula',
    difficultyEn: 'Beginner',
    isFeatured: true,
    introduction:
      'Banyak calon pengusaha langsung menghabiskan tabungan untuk menyewa tempat, mencetak ribuan kemasan, atau membeli peralatan produksi lengkap sebelum mengetahui apakah ada orang yang bersedia membeli produk mereka.',
    introductionEn:
      'Many aspiring entrepreneurs spend their savings on rent, thousands of custom packages, or full production equipment before knowing whether anyone is willing to pay for their product.',
    whyItMatters:
      'Validasi pasar memisahkan asumsi pribadi pemilik usaha dari permintaan pasar yang nyata. Dengan menguji minat beli lebih awal, Anda menghemat modal kerja dan mendapatkan masukan langsung dari pembeli pertama.',
    whyItMattersEn:
      'Market validation separates personal assumptions from real customer demand. By testing buying intent early, you protect working capital and gain direct feedback from paying customers.',
    explanation:
      'Validasi ide produk bukan berarti bertanya kepada teman atau keluarga apakah produk Anda terlihat bagus. Validasi sejati terjadi ketika calon pembeli bersedia melakukan transaksi nyata—misalnya melalui pemesanan awal (pre-order) atau pembelian paket sampel berbayar. Fokuskan tahap awal pada 1 hingga 2 varian produk unggulan (Minimum Viable Product) yang menyelesaikan masalah spesifik satu segmen pelanggan.',
    explanationEn:
      'Product validation does not mean asking friends if your product looks nice. True validation happens when prospects commit to a real transaction—such as a paid pre-order or trial bundle. Focus your launch on 1 to 2 core product variants (Minimum Viable Product) solving a specific problem for one clear customer segment.',
    umkmExample: {
      businessName: 'Dapur Rinjani (Artisanal Sambal)',
      situation:
        'Pemilik usaha awalnya berencana memproduksi 8 varian sambal sekaligus dan menyewa dapur komersial dengan biaya Rp12 juta.',
      situationEn:
        'The founder initially planned to produce 8 chili paste variants at once and rent a commercial kitchen for Rp12 million.',
      solutionApplied:
        'Memilih 2 varian terkuat (Sambal Cumi Asap & Sambal Bawang Roa), lalu membuka Batch Pre-Order 30 botol melalui WhatsApp komunitas kantor sekitar tanpa stok mengendap.',
      solutionAppliedEn:
        'Selected the 2 strongest variants and opened a 30-bottle Pre-Order batch via nearby office WhatsApp communities with zero unsold inventory.',
      outcome:
        '30 botol habis terjual dalam 4 hari, menghasilkan modal tunai di muka dan masukan tingkat kepedasan sebelum mencetak label kemasan ribuan lembar.',
      outcomeEn:
        'All 30 bottles sold out in 4 days, generating upfront cash and spice-level feedback before printing thousands of labels.',
    },
    stepByStep: [
      'Tentukan 1 segmen pembeli paling spesifik yang paling membutuhkan produk Anda (misal: pekerja kantor yang butuh lauk praktis tahan 2 minggu).',
      'Batasi pilihan awal maksimal 2 varian produk inti agar biaya bahan baku terkendali.',
      'Susun penawaran Pre-Order gelombang pertama (kuota terbatas 15–25 porsi/unit) dengan jadwal pengiriman yang jelas.',
      'Tawarkan langsung ke 30 kontak relevan di WhatsApp dan komunitas lokal tanpa iklan berbayar.',
      'Kumpulkan testimoni dan tanyakan 1 hal yang perlu diperbaiki kepada 10 pembeli pertama.',
    ],
    stepByStepEn: [
      'Define 1 specific buyer segment that needs your product most (e.g., busy office workers needing ready-to-eat side dishes).',
      'Limit your initial offering to a maximum of 2 core variants to control raw material costs.',
      'Create a Batch-1 Pre-Order offer (limited to 15–25 units) with a clear delivery date.',
      'Reach out directly to 30 relevant contacts on WhatsApp and local communities without paid ads.',
      'Collect testimonials and ask your first 10 buyers for 1 specific improvement.',
    ],
    commonMistakes: [
      'Menyediakan terlalu banyak varian menu/produk di minggu pertama sehingga bahan baku banyak terbuang.',
      'Menganggap pujian di media sosial sama dengan kesiapan membeli.',
      'Mencetak kemasan custom dalam jumlah ribuan sebelum rasa atau fungsi produk teruji.',
    ],
    commonMistakesEn: [
      'Launching too many product variants in week one, leading to wasted ingredients.',
      'Mistaking social media likes or compliments for actual buying intent.',
      'Printing thousands of custom packages before product quality is validated.',
    ],
    actionChecklist: [
      'Tulis 1 kalimat proposisi nilai yang menjelaskan siapa pembeli utama dan manfaat produk Anda.',
      'Tetapkan maksimal 2 produk inti untuk uji pasar minggu ini.',
      'Buat pesan penawaran Pre-Order singkat beserta harga dan tanggal kirim.',
      'Hubungi minimal 20 calon pembeli potensial dan catat jumlah yang benar-benar membayar.',
    ],
    actionChecklistEn: [
      'Write a 1-sentence value proposition defining your primary buyer and key product benefit.',
      'Select a maximum of 2 core products for this week’s market test.',
      'Draft a concise Pre-Order offer message including price and delivery schedule.',
      'Contact at least 20 potential buyers and record how many complete payment.',
    ],
    relatedResources: [
      {
        title: 'Cara Mendapatkan Pelanggan Pertama',
        titleEn: 'How to Get Your First Customers',
        type: 'Panduan',
        typeEn: 'Guide',
        targetIdOrUrl: 'guide-first-customer',
      },
      {
        title: 'Portal Resmi OSS Indonesia — Perizinan Berusaha NIB UMKM',
        titleEn: 'Official Indonesia OSS Portal — Business Licensing (NIB)',
        type: 'Referensi Resmi',
        typeEn: 'Official Reference',
        targetIdOrUrl: 'https://oss.go.id',
      },
    ],
    sourceReferences: [
      {
        docId: 'KB-01',
        docTitle: 'Foundational Business & UMKM Guide',
        section: 'Section 01 — Validasi Ide Bisnis & Pemahaman Kebutuhan Pasar',
        page: 3,
      },
      {
        docId: 'KB-01',
        docTitle: 'Foundational Business & UMKM Guide',
        section: 'Section 02 — Penentuan Target Pasar & Value Proposition',
        page: 7,
      },
    ],
    consultationPrompt:
      'Saya baru ingin memulai usaha dengan modal terbatas. Bantu saya menyusun langkah validasi produk dan mendapatkan pembeli pertama.',
    consultationPromptEn:
      'I am planning to start a new business with a limited budget. Help me structure a product validation plan and get my first paying customers.',
  },
  {
    id: 'art-marketing-01',
    categorySlug: 'marketing-branding',
    categoryLabel: 'Marketing & Branding',
    categoryLabelEn: 'Marketing & Branding',
    title: 'Strategi Konten Organik & Akuisisi Pelanggan Lokal Tanpa Biaya Iklan',
    titleEn: 'Organic Content Strategy & Local Customer Acquisition Without Paid Ads',
    summary:
      'Mengapa unggahan katalog produk biasa sering sepi interaksi, dan bagaimana mengubahnya menjadi konten yang mendatangkan pesan pemesanan di WhatsApp.',
    summaryEn:
      'Why static product catalog posts often fail to convert, and how to turn them into engaging content that drives WhatsApp orders.',
    readingTime: '6 menit baca',
    readingTimeEn: '6 min read',
    difficulty: 'Pemula',
    difficultyEn: 'Beginner',
    isFeatured: true,
    introduction:
      'Banyak pemilik UMKM mengeluhkan jangkauan Instagram atau TikTok yang menurun meskipun sudah rutin mengunggah foto produk setiap hari. Akibatnya, jumlah pelanggan baru melambat padahal kualitas produk sangat baik.',
    introductionEn:
      'Many small business owners notice declining Instagram or TikTok reach despite posting product photos daily. As a result, new customer acquisition slows down even when product quality is excellent.',
    whyItMatters:
      'Calon pembeli di media sosial tidak membuka aplikasi untuk melihat katalog harga, melainkan mencari solusi, inspirasi, atau bukti kepercayaan. Mengubah sudut pandang konten dari sekadar "menjual produk" menjadi "menjawab kebutuhan spesifik pelanggan" mampu meningkatkan konversi tanpa anggaran iklan.',
    whyItMattersEn:
      'Social media users do not open apps to browse price catalogs—they look for solutions, occasion ideas, and social proof. Shifting from "product-centric" posts to "customer-occasion" content increases conversion without ad spend.',
    explanation:
      'Strategi pemasaran organik yang efektif menggabungkan tiga pilar: (1) Penajaman segmen target (misalnya kado ulang tahun, camilan rapat kantor, atau bekal anak), (2) Bukti sosial dan proses di balik layar yang membangun kepercayaan, serta (3) Ajakan bertindak (Call-to-Action) yang mengarahkan penonton ke paket percobaan (trial bundle) dengan risiko rendah.',
    explanationEn:
      'Effective organic marketing combines three pillars: (1) Clear occasion positioning (e.g., office meeting snacks, family breakfast, or gift hampers), (2) Behind-the-scenes process and customer testimonials that build trust, and (3) A clear Call-to-Action directing viewers to a low-risk trial bundle.',
    umkmExample: {
      businessName: 'SweetBite Bakery',
      situation:
        'Penjualan menurun selama 2 bulan karena konten Instagram hanya berisi foto roti di atas meja dengan caption harga.',
      situationEn:
        'Sales declined over 2 months because Instagram posts only showed static bread photos with price captions.',
      solutionApplied:
        'Mengubah konten menjadi video proses roti keluar dari oven pagi hari, membuat "Paket Kenalan Isi 4 Varian", dan bekerja sama dengan 2 kedai kopi lokal untuk sampel akhir pekan.',
      solutionAppliedEn:
        'Switched to short videos of fresh bread coming out of the morning oven, introduced a "4-Variant Trial Box", and partnered with 2 local coffee shops for weekend sampling.',
      outcome:
        'Jumlah chat pemesanan dari pelanggan baru meningkat 45% dalam 14 hari tanpa biaya iklan berbayar.',
      outcomeEn:
        'WhatsApp inquiries from new customers increased by 45% within 14 days with zero paid advertising.',
    },
    stepByStep: [
      'Audit 9 unggahan terakhir Anda: pastikan tidak lebih dari 30% yang berupa poster katalog kaku.',
      'Buat 1 Paket Perkenalan (Trial Bundle) dengan harga terjangkau agar orang yang baru kenal berani mencoba.',
      'Rekam video singkat (15–30 detik) yang memperlihatkan tekstur produk, proses pembuatan higienis, atau reaksi pelanggan asli.',
      'Tulis kalimat penutup (CTA) yang spesifik di setiap unggahan, misalnya: "Ketik MAU COBA di WhatsApp untuk kuota panggangan pagi ini".',
      'Jalin kolaborasi silang (cross-promotion) dengan 2 usaha lokal yang memiliki target pelanggan serupa namun tidak bersaing langsung.',
    ],
    stepByStepEn: [
      'Audit your last 9 posts: ensure no more than 30% are static price-catalog posters.',
      'Create 1 affordable Trial Bundle so first-time visitors feel comfortable trying your product.',
      'Record 15–30 second clips showing product texture, hygienic preparation, or genuine customer reactions.',
      'Include a specific Call-to-Action in every caption directing viewers to your WhatsApp link.',
      'Partner with 2 complementary local businesses serving the same neighborhood audience.',
    ],
    commonMistakes: [
      'Hanya mengunggah foto produk tampak depan tanpa menceritakan untuk momen apa produk tersebut cocok.',
      'Tidak mencantumkan cara pemesanan dan lokasi pengiriman secara jelas di bio profil.',
      'Langsung memberikan diskon harga terus-menerus yang justru menggerus margin dan menurunkan citra merek.',
    ],
    commonMistakesEn: [
      'Posting plain product photos without explaining the customer occasion or benefit.',
      'Leaving out delivery area and ordering instructions from the profile bio.',
      'Running constant price discounts that erode profit margins and brand value.',
    ],
    actionChecklist: [
      'Perbarui bio Instagram/profil toko dengan informasi jenis produk, kota/area pengiriman, dan tautan WhatsApp aktif.',
      'Susun jadwal konten 14 hari dengan komposisi 40% solusi/momen pelanggan, 30% proses & testimoni, 30% penawaran paket.',
      'Siapkan 1 penawaran Paket Coba / Bundling untuk pelanggan baru minggu ini.',
      'Hubungi minimal 2 komunitas atau mitra usaha lokal untuk kolaborasi sampel.',
    ],
    actionChecklistEn: [
      'Update your store bio with product specialty, service area, and a direct WhatsApp ordering link.',
      'Draft a 14-day content calendar (40% customer occasions, 30% process & reviews, 30% bundle offers).',
      'Launch 1 Trial Bundle offer for first-time buyers this week.',
      'Reach out to at least 2 local partners or communities for cross-promotion.',
    ],
    relatedResources: [
      {
        title: 'Cara Membuat Konten Instagram yang Relevan',
        titleEn: 'How to Create Relevant Instagram Content',
        type: 'Panduan',
        typeEn: 'Guide',
        targetIdOrUrl: 'guide-instagram-content',
      },
      {
        title: 'Panduan Profil Bisnis Google (Google Maps UMKM)',
        titleEn: 'Google Business Profile Help Center',
        type: 'Referensi Resmi',
        typeEn: 'Official Reference',
        targetIdOrUrl: 'https://support.google.com/business',
      },
    ],
    sourceReferences: [
      {
        docId: 'KB-02',
        docTitle: 'Marketing & Customer Acquisition',
        section: 'Section 01 — Diagnosa Penurunan Penjualan & Akuisisi Pelanggan Baru',
        page: 4,
      },
      {
        docId: 'KB-02',
        docTitle: 'Marketing & Customer Acquisition',
        section: 'Section 02 — Strategi Konten Instagram Organik yang Menghasilkan Konversi',
        page: 9,
      },
    ],
    consultationPrompt:
      'Penjualan usaha saya melambat dan pelanggan baru dari Instagram semakin sedikit. Bantu saya menyusun strategi konten organik tanpa biaya iklan.',
    consultationPromptEn:
      'My sales have slowed down and new customers from Instagram are decreasing. Help me build an organic content and local acquisition strategy without paid ads.',
  },
  {
    id: 'art-keuangan-01',
    categorySlug: 'keuangan-harga',
    categoryLabel: 'Keuangan & Harga',
    categoryLabelEn: 'Finance & Pricing',
    title: 'Panduan Menghitung HPP (COGS) Sebenarnya & Menentukan Harga Jual yang Sehat',
    titleEn: 'How to Calculate True COGS (HPP) & Set Profitable Product Prices',
    summary:
      'Hindari jebakan "ramai pesanan tapi kas selalu habis" dengan memasukkan seluruh komponen biaya tersembunyi ke dalam perhitungan HPP per unit.',
    summaryEn:
      'Avoid the "busy orders but empty cash" trap by including all hidden packaging, utility, and platform fee components in your unit COGS.',
    readingTime: '7 menit baca',
    readingTimeEn: '7 min read',
    difficulty: 'Menengah',
    difficultyEn: 'Intermediate',
    isFeatured: true,
    introduction:
      'Salah satu masalah paling berbahaya bagi UMKM adalah volume penjualan yang terlihat tinggi namun saldo kas usaha tidak pernah bertambah. Ketika diperiksa, harga jual ternyata hanya dihitung dari bahan baku utama atau sekadar mengikuti harga pesaing.',
    introductionEn:
      'One of the most dangerous traps for small businesses is high order volume with zero cash growth. Often, selling prices are based only on raw ingredients or copied from competitors.',
    whyItMatters:
      'Tanpa perhitungan Harga Pokok Penjualan (HPP) yang akurat, setiap peningkatan pesanan justru memperbesar kebocoran biaya operasional. Mengetahui HPP per unit secara presisi memberi Anda keberanian menentukan batas diskon dan memilih produk mana yang paling layak dipromosikan.',
    whyItMattersEn:
      'Without accurate Cost of Goods Sold (COGS), selling more units can actually increase cash leakage. Knowing exact unit economics lets you set safe discount limits and promote high-margin products.',
    explanation:
      'HPP per unit yang lengkap wajib mencakup 4 komponen: (1) Bahan baku langsung sesuai takaran resep/gramasi, (2) Kemasan penuh (wadah, segel, stiker, kantong kirim), (3) Alokasi biaya utilitas & tenaga produksi (gas, listrik, tenaga kerja per batch dibagi jumlah output), serta (4) Cadangan penyusutan/produk rusak (waste allowance 3–5%) dan potongan biaya admin platform bila dijual di marketplace.',
    explanationEn:
      'True unit COGS must include 4 components: (1) Direct raw ingredients based on standardized recipe weights, (2) Complete packaging (containers, seals, labels, carrier bags), (3) Allocated utilities & direct production labor per batch, and (4) A 3–5% spoilage allowance plus platform commission buffers.',
    umkmExample: {
      businessName: 'Kopi Senja Literan',
      situation:
        'Pemilik menghitung modal 1 botol kopi susu hanya Rp18.000 (kopi + susu + gula) dan menjualnya Rp25.000 di aplikasi pesan-antar dengan potongan komisi 20%.',
      situationEn:
        'The owner calculated 1 liter of iced coffee at Rp18,000 (coffee + milk + sugar only) and sold it for Rp25,000 on delivery apps charging a 20% commission.',
      solutionApplied:
        'Menghitung ulang HPP lengkap (termasuk botol Rp2.500, label Rp800, es & listrik Rp1.200 = HPP riil Rp22.500), lalu membedakan harga beli langsung vs. harga platform serta membuat paket bundling 2 botol.',
      solutionAppliedEn:
        'Recalculated full COGS (including Rp2,500 bottle, Rp800 label, Rp1,200 ice/electricity = Rp22,500 true COGS), separated direct vs. platform pricing, and introduced a 2-bottle bundle.',
      outcome:
        'Margin kotor bersih naik dari Rp0 (impas) menjadi Rp11.500 per transaksi tanpa kehilangan pelanggan tetap.',
      outcomeEn:
        'Net gross profit rose from Rp0 (break-even) to Rp11,500 per order without losing regular customers.',
    },
    stepByStep: [
      'Daftar seluruh bahan baku untuk 1 batch produksi dan bagi dengan jumlah unit layak jual yang dihasilkan.',
      'Tambahkan biaya kemasan lengkap hingga produk siap diserahkan ke kurir.',
      'Hitung estimasi biaya gas, listrik, dan tenaga produksi per batch, lalu bagi ke setiap unit produk.',
      'Tetapkan target margin kotor yang sehat (35%–50% untuk kuliner/produksi, 25%–40% untuk ritel) untuk mendapatkan Harga Jual Ideal.',
      'Pisahkan rekening bank usaha dari rekening rumah tangga agar arus kas bersih dapat dipantau setiap minggu.',
    ],
    stepByStepEn: [
      'List all raw materials for 1 production batch and divide by the number of sellable units produced.',
      'Add complete packaging costs required until the order is handed to the courier.',
      'Estimate gas, electricity, and direct batch labor, then divide across each unit.',
      'Set a healthy gross margin target (35%–50% for F&B/production, 25%–40% for retail) to determine your ideal selling price.',
      'Separate your business bank account from household expenses to track weekly cash flow accurately.',
    ],
    commonMistakes: [
      'Melupakan biaya kemasan, stiker, gas, listrik, dan bahan terbuang saat menghitung modal produk.',
      'Menyamakan harga jual di toko/WhatsApp dengan harga di aplikasi yang memotong komisi 15%–25%.',
      'Menggunakan uang hasil penjualan harian untuk belanja kebutuhan pribadi tanpa pencatatan.',
    ],
    commonMistakesEn: [
      'Forgetting packaging, labels, gas, electricity, and spoilage when calculating unit cost.',
      'Charging the same price on 20%-commission delivery apps as on direct WhatsApp orders.',
      'Mixing daily sales revenue with personal household spending.',
    ],
    actionChecklist: [
      'Bedah ulang HPP lengkap untuk 3 produk terlaris Anda hari ini.',
      'Hitung selisih antara harga jual saat ini dan HPP riil untuk mengetahui margin bersih aktual.',
      'Sesuaikan harga atau ukuran porsi pada produk yang margin kotornya di bawah 25%.',
      'Buat rekening atau dompet digital khusus transaksi usaha.',
    ],
    actionChecklistEn: [
      'Audit the full unit COGS for your top 3 best-selling products today.',
      'Calculate the gap between your current selling price and true COGS.',
      'Adjust pricing or portion sizes on any item with a gross margin below 25%.',
      'Set up a dedicated bank account or e-wallet strictly for business transactions.',
    ],
    relatedResources: [
      {
        title: 'Cara Menentukan Harga Jual Produk',
        titleEn: 'How to Set Product Selling Prices',
        type: 'Panduan',
        typeEn: 'Guide',
        targetIdOrUrl: 'guide-pricing-hpp',
      },
      {
        title: 'Bank Indonesia — Standar QRIS & Pencatatan Keuangan UMKM (SIAPIK)',
        titleEn: 'Bank Indonesia — QRIS & MSME Financial Recording Standards',
        type: 'Referensi Resmi',
        typeEn: 'Official Reference',
        targetIdOrUrl: 'https://www.bi.go.id',
      },
    ],
    sourceReferences: [
      {
        docId: 'KB-03',
        docTitle: 'Basic Financial & Pricing Guide',
        section: 'Section 01 — Menghitung Harga Pokok Penjualan (HPP) Secara Akurat',
        page: 6,
      },
      {
        docId: 'KB-03',
        docTitle: 'Basic Financial & Pricing Guide',
        section: 'Section 02 — Strategi Harga Bundling vs Diskon Potong Harga',
        page: 12,
      },
    ],
    consultationPrompt:
      'Saya merasa omzet usaha cukup ramai tetapi keuntungan bersih selalu tipis. Bantu saya mengevaluasi HPP dan strategi harga jual produk saya.',
    consultationPromptEn:
      'My sales volume is fairly busy, but net profit is always thin. Help me evaluate my unit COGS and pricing strategy.',
  },
  {
    id: 'art-operasional-01',
    categorySlug: 'operasional',
    categoryLabel: 'Operasional',
    categoryLabelEn: 'Operations',
    title: 'Menyusun SOP Produksi & Manajemen Stok agar Kualitas Produk Selalu Konsisten',
    titleEn: 'Building Production SOPs & Inventory Controls for Consistent Quality',
    summary:
      'Langkah praktis menstandarkan takaran produksi, mengatur batas stok minimum bahan baku (reorder point), dan mencegah keterlambatan pesanan.',
    summaryEn:
      'Practical steps to standardize production measurements, set minimum stock reorder points, and prevent order delays.',
    readingTime: '6 menit baca',
    readingTimeEn: '6 min read',
    difficulty: 'Menengah',
    difficultyEn: 'Intermediate',
    isFeatured: false,
    introduction:
      'Ketika pesanan mulai meningkat, banyak UMKM mengalami masalah klasik: rasa atau kualitas produk berubah-ubah, bahan baku mendadak habis di tengah produksi, atau pemilik usaha kelelahan karena semua pekerjaan harus diawasi sendiri.',
    introductionEn:
      'As orders grow, many small businesses hit operational bottlenecks: inconsistent product quality, sudden ingredient stockouts mid-production, or founder burnout from supervising every task manually.',
    whyItMatters:
      'Pelanggan membeli kembali karena mengharapkan kualitas yang sama seperti pembelian pertama. Standar Operasional Prosedur (SOP) sederhana dan pencatatan stok minimum melindungi reputasi usaha Anda sekaligus memungkinkan pendelegasian tugas.',
    whyItMattersEn:
      'Customers reorder because they expect the same quality they experienced the first time. Simple SOPs and reorder point controls protect your brand reputation and let you delegate safely.',
    explanation:
      'SOP untuk UMKM tidak perlu berupa dokumen ratusan halaman. Cukup buat lembar kerja 1 halaman di setiap area kerja yang memuat: takaran bahan dalam gram/mililiter, urutan proses kerja, waktu pengerjaan, dan daftar periksa kualitas sebelum produk dikemas. Padukan dengan metode FIFO (First-In, First-Out) dan titik pemesanan ulang (Reorder Point) untuk 10 bahan baku utama.',
    explanationEn:
      'An MSME SOP does not need to be a 100-page manual. A single laminated sheet at each workstation listing exact gram/ml measurements, process sequence, target time, and a 5-point packaging quality checklist—combined with FIFO inventory and minimum reorder points—is enough to transform daily operations.',
    umkmExample: {
      businessName: 'Rasa Nusantara Catering',
      situation:
        'Sering terjadi keterlambatan pengiriman makan siang dan keluhan rasa masakan yang kadang terlalu asin saat asisten dapur bertugas.',
      situationEn:
        'Frequent lunch delivery delays and customer complaints about inconsistent seasoning when kitchen assistants cooked.',
      solutionApplied:
        'Menimbang bumbu dasar dalam kemasan porsi siap pakai per batch dan memasang poster checklist 5 poin pemeriksaan sebelum kotak makan ditutup.',
      solutionAppliedEn:
        'Pre-portioned base spice packs in exact gram weights per batch and posted a 5-point quality checklist at the packing table.',
      outcome:
        'Tingkat komplain pelanggan turun hingga 80% dan waktu persiapan dapur lebih cepat 45 menit setiap pagi.',
      outcomeEn:
        'Customer complaints dropped by 80% and morning kitchen prep finished 45 minutes faster.',
    },
    stepByStep: [
      'Identifikasi 10 bahan baku paling kritis yang tidak boleh habis saat jam operasional.',
      'Tetapkan angka Stok Minimum (Reorder Point) untuk setiap bahan (misal: wajib belanja ulang saat sisa stok cukup untuk 3 hari).',
      'Ubah seluruh ukuran kira-kira ("secukupnya", "satu genggam") menjadi satuan timbangan pasti (gram, ml, menit, suhu).',
      'Buat checklist 5 poin pemeriksaan kualitas akhir (Quality Control) sebelum produk diserahkan ke pelanggan.',
      'Terapkan aturan FIFO di rak penyimpanan dengan menempelkan label tanggal masuk pada setiap bahan.',
    ],
    stepByStepEn: [
      'Identify the 10 most critical ingredients and packaging items that must never run out.',
      'Set a Minimum Reorder Point for each item based on supplier lead time plus a 2-day buffer.',
      'Convert all guesswork measurements into exact gram, milliliter, minute, and temperature standards.',
      'Create a 5-point final Quality Control checklist before any order is sealed.',
      'Enforce First-In, First-Out (FIFO) storage by labeling arrival dates on all stock.',
    ],
    commonMistakes: [
      'Mengandalkan ingatan kepala untuk memantau sisa bahan baku dan kemasan.',
      'Membiarkan staf produksi bekerja tanpa panduan takaran tertulis.',
      'Menerima pesanan melebihi kapasitas produksi harian tanpa sistem kuota pre-order.',
    ],
    commonMistakesEn: [
      'Relying on memory to track remaining raw materials and packaging.',
      'Allowing production staff to work without written measurement standards.',
      'Accepting orders beyond daily production capacity without a pre-order cutoff.',
    ],
    actionChecklist: [
      'Catat 10 bahan baku/kemasan utama beserta batas stok minimumnya.',
      'Tulis SOP 1 halaman untuk proses produksi produk terlaris Anda.',
      'Pasang daftar periksa QC (Quality Control) di meja pengemasan.',
      'Evaluasi waktu rata-rata penyelesaian 1 pesanan dari order masuk hingga siap kirim.',
    ],
    actionChecklistEn: [
      'List your top 10 ingredients/packaging items and their minimum reorder points.',
      'Write a 1-page production SOP for your best-selling product.',
      'Place a 5-point Quality Control checklist at your packing station.',
      'Measure average order fulfillment time from payment to dispatch.',
    ],
    relatedResources: [
      {
        title: 'Cara Mengelola Stok Produk',
        titleEn: 'How to Manage Product Inventory',
        type: 'Panduan',
        typeEn: 'Guide',
        targetIdOrUrl: 'guide-inventory-stock',
      },
      {
        title: 'BPJPH Kementerian Agama RI — Sertifikasi Halal UMKM',
        titleEn: 'BPJPH Official Portal — Halal Certification for MSMEs',
        type: 'Referensi Resmi',
        typeEn: 'Official Reference',
        targetIdOrUrl: 'https://ptsp.halal.go.id',
      },
    ],
    sourceReferences: [
      {
        docId: 'KB-04',
        docTitle: 'Business Operations',
        section: 'Section 01 — Pengendalian Stok Bahan Baku & Sistem FIFO',
        page: 5,
      },
      {
        docId: 'KB-04',
        docTitle: 'Business Operations',
        section: 'Section 02 — Menyeimbangkan Kapasitas Produksi Harian & Sistem Pre-Order',
        page: 11,
      },
    ],
    consultationPrompt:
      'Operasional usaha saya sering keteteran saat pesanan ramai dan stok bahan sering tidak tercatat. Bantu saya menyusun SOP dan kontrol stok.',
    consultationPromptEn:
      'My daily operations get overwhelmed during busy periods and inventory records are often inaccurate. Help me build an SOP and inventory control system.',
  },
  {
    id: 'art-pelanggan-01',
    categorySlug: 'pelanggan-penjualan',
    categoryLabel: 'Pelanggan & Penjualan',
    categoryLabelEn: 'Customers & Sales',
    title: 'Mengubah Chat Tanya Harga Menjadi Pembelian & Meningkatkan Repeat Order',
    titleEn: 'Converting Price Inquiries into Sales & Increasing Repeat Orders',
    summary:
      'Teknik membalas pesan calon pembeli secara konsultatif di WhatsApp serta alur tindak lanjut H+3 dan H+14 agar pelanggan kembali memesan.',
    summaryEn:
      'Consultative WhatsApp reply techniques and Day-3 / Day-14 follow-up workflows that turn first-time buyers into loyal repeat customers.',
    readingTime: '6 menit baca',
    readingTimeEn: '6 min read',
    difficulty: 'Pemula',
    difficultyEn: 'Beginner',
    isFeatured: false,
    introduction:
      'Banyak pelaku usaha berhasil mendatangkan pesan masuk di WhatsApp atau DM, namun calon pembeli langsung menghilang (ghosting) setelah diberi tahu daftar harga. Di sisi lain, pelanggan yang sudah pernah membeli jarang dihubungi kembali.',
    introductionEn:
      'Many business owners generate incoming WhatsApp or DM inquiries, only for prospects to disappear after receiving the price list—while past buyers are rarely contacted again.',
    whyItMatters:
      'Meningkatkan konversi dari chat yang sudah masuk dan mempertahankan pelanggan lama jauh lebih hemat biaya dibandingkan terus-menerus mencari pembeli baru dari nol.',
    whyItMattersEn:
      'Improving chat conversion and retaining existing customers is far more cost-effective than constantly acquiring strangers from scratch.',
    explanation:
      'Calon pembeli sering batal membeli bukan semata-mata karena harga mahal, melainkan karena bingung memilih varian yang tepat atau belum yakin dengan nilai produk. Gunakan skrip respons konsultatif: jawab harga dengan ramah, rekomendasikan 1 paket terlaris sesuai kebutuhan mereka, dan akhiri dengan pertanyaan penutup yang memudahkan keputusan. Setelah transaksi selesai, jalankan siklus retensi H+3 (tanya kepuasan) dan H+14 (pengingat pesan ulang).',
    explanationEn:
      'Prospects often hesitate not because of price alone, but because they are unsure which option fits their needs. Use a consultative reply structure: answer the price warmly, recommend 1 best-selling package tailored to their occasion, and end with a simple closing question. Post-purchase, run a Day-3 satisfaction check and a Day-14 reorder reminder.',
    umkmExample: {
      businessName: 'Laras Skin Care & Hampers',
      situation:
        'Dari 20 chat masuk per minggu, hanya 3 orang yang jadi membeli karena admin hanya membalas dengan daftar harga panjang.',
      situationEn:
        'Out of 20 weekly chat inquiries, only 3 converted because replies consisted only of a long text price list.',
      solutionApplied:
        'Mengganti balasan awal dengan menanyakan kebutuhan pembeli (untuk pemakaian sendiri atau hadiah), merekomendasikan 1 paket paling pas, dan mencatat database pembeli untuk sapaan H+14.',
      solutionAppliedEn:
        'Updated replies to ask about the buyer’s occasion, recommended 1 best-fit bundle, and logged buyer contacts for Day-14 follow-ups.',
      outcome:
        'Rasio konversi chat menjadi transaksi naik dari 15% menjadi 38%, dan 30% pembeli bulan lalu melakukan pemesanan ulang.',
      outcomeEn:
        'Chat-to-sale conversion jumped from 15% to 38%, and 30% of prior buyers placed repeat orders.',
    },
    stepByStep: [
      'Targetkan waktu respons pesan di bawah 10 menit pada jam operasional.',
      'Susun template balasan WhatsApp 3 bagian: Sapaan hangat + Rekomendasi produk terlaris beserta manfaatnya + Pertanyaan penutup ("Mau dikirim untuk hari apa, Kak?").',
      'Simpan nama, nomor kontak, dan varian favorit setiap pembeli di buku/spreadsheet pelanggan.',
      'Kirim pesan singkat H+3 setelah produk diterima untuk memastikan produk sampai dalam kondisi baik.',
      'Kirim pengingat ramah pada H+14 atau H+21 sesuai siklus habisnya produk beserta penawaran khusus pelanggan tetap.',
    ],
    stepByStepEn: [
      'Target a chat response time under 10 minutes during operating hours.',
      'Use a 3-part WhatsApp reply template: Warm greeting + Best-seller recommendation with benefit + Closing question ("Which delivery day works best for you?").',
      'Save each buyer’s name, phone number, and favorite variant in a simple customer log.',
      'Send a brief Day-3 check-in message to confirm their order arrived in great condition.',
      'Send a friendly Day-14 or Day-21 reorder reminder aligned with your product’s consumption cycle.',
    ],
    commonMistakes: [
      'Membalas chat hanya dengan angka harga singkat atau mengirim foto daftar menu yang sulit dibaca.',
      'Tidak pernah menindaklanjuti (follow-up) calon pembeli yang belum membalas setelah 24 jam.',
      'Melupakan pelanggan lama begitu pesanan selesai dikirim.',
    ],
    commonMistakesEn: [
      'Replying with a bare price number or an unreadable menu image.',
      'Never following up with warm prospects who go quiet after 24 hours.',
      'Forgetting past customers as soon as their package is delivered.',
    ],
    actionChecklist: [
      'Perbarui template balasan cepat (Quick Reply) WhatsApp Bisnis Anda hari ini.',
      'Rekap daftar 20 pelanggan terakhir yang pernah membeli produk Anda.',
      'Kirim sapaan ramah ke 10 pelanggan lama minggu ini tanpa kesan memaksa.',
      'Siapkan kartu ucapan/stiker kemasan dengan kode voucher khusus pembelian kedua.',
    ],
    actionChecklistEn: [
      'Update your WhatsApp Business Quick Reply templates today.',
      'Compile a list of your last 20 paying customers.',
      'Send a warm, non-pushy check-in message to 10 past buyers this week.',
      'Include a thank-you insert card offering a perk on their second order.',
    ],
    relatedResources: [
      {
        title: 'Cara Meningkatkan Repeat Order',
        titleEn: 'How to Increase Repeat Orders',
        type: 'Panduan',
        typeEn: 'Guide',
        targetIdOrUrl: 'guide-repeat-order',
      },
    ],
    sourceReferences: [
      {
        docId: 'KB-05',
        docTitle: 'Customer Experience & Retention',
        section: 'Section 01 — Membangun Kebiasaan Repeat Order dari Pelanggan Pertama',
        page: 4,
      },
      {
        docId: 'KB-05',
        docTitle: 'Customer Experience & Retention',
        section: 'Section 02 — Pengelolaan Kontak WhatsApp & Follow-Up Non-Spam',
        page: 10,
      },
    ],
    consultationPrompt:
      'Banyak calon pembeli yang bertanya di WhatsApp tetapi jarang jadi membeli, dan pelanggan lama jarang repeat order. Bantu saya memperbaikinya.',
    consultationPromptEn:
      'Many prospects ask for prices on WhatsApp without buying, and past customers rarely reorder. Help me improve conversion and retention.',
  },
  {
    id: 'art-pengembangan-01',
    categorySlug: 'pengembangan-bisnis',
    categoryLabel: 'Pengembangan Bisnis',
    categoryLabelEn: 'Business Growth',
    title: 'Strategi Ekspansi Saluran Distribusi & Kemitraan B2B Lokal untuk UMKM',
    titleEn: 'Distribution Channel Expansion & Local B2B Partnerships for MSMEs',
    summary:
      'Cara menumbuhkan omzet secara stabil melalui kemitraan kedai lokal, pesanan korporat/acara, dan program reseller terkurasi setelah produk inti teruji.',
    summaryEn:
      'How to grow revenue steadily through local cafe partnerships, corporate/event orders, and curated reseller programs once your core product is proven.',
    readingTime: '7 menit baca',
    readingTimeEn: '7 min read',
    difficulty: 'Lanjutan',
    difficultyEn: 'Advanced',
    isFeatured: false,
    introduction:
      'Setelah usaha berjalan stabil dari penjualan eceran harian, pemilik usaha sering menghadapi titik jenuh pertumbuhan. Mengandalkan pesanan satuan dari media sosial saja terkadang membuat omzet bulanan naik-turun secara drastis.',
    introductionEn:
      'Once daily retail sales stabilize, business owners often hit a growth plateau. Relying solely on single-item social media orders can make monthly revenue unpredictable.',
    whyItMatters:
      'Membuka saluran distribusi kedua—seperti kemitraan B2B lokal, suplai kafe/kantor, atau jaringan reseller aktif—menciptakan pendapatan berulang (recurring revenue) dengan volume pesanan per transaksi yang jauh lebih besar.',
    whyItMattersEn:
      'Opening a second distribution channel—such as local B2B supply, office event packages, or curated resellers—creates recurring revenue with much larger average order volumes.',
    explanation:
      'Ekspansi bisnis yang sehat hanya boleh dilakukan setelah unit economics (margin per produk) dan kapasitas produksi harian terbukti stabil. Alih-alih langsung membuka cabang fisik yang memakan biaya sewa tinggi, mulailah dengan kemitraan konsinyasi terukur, paket pesanan rapat/hampers instansi, atau kemitraan reseller dengan struktur margin bertingkat yang tidak merusak harga eceran.',
    explanationEn:
      'Healthy expansion requires stable unit economics and reliable production capacity. Instead of rushing into expensive physical branches, start with curated local cafe supply, corporate meeting packages, or tiered reseller partnerships that protect retail pricing.',
    umkmExample: {
      businessName: 'Kriya Kayu & Kudapan Lokal',
      situation:
        'Omzet tertahan di angka Rp15 juta per bulan karena hanya mengandalkan penjualan satuan di Instagram.',
      situationEn:
        'Monthly revenue plateaued at Rp15 million from single-item Instagram orders.',
      solutionApplied:
        'Menyusun katalog khusus "Paket Kudapan Rapat & Souvenir Kantor" dan mengajukan sampel ke 10 kafe serta kantor di radius 5 km.',
      solutionAppliedEn:
        'Created a 1-page "Office Meeting & Cafe Supply Catalog" and delivered samples to 10 cafes and offices within a 5 km radius.',
      outcome:
        'Mendapatkan 3 mitra kafe tetap dan 4 pesanan acara kantor rutin yang menambah omzet stabil Rp9 juta/bulan.',
      outcomeEn:
        'Secured 3 recurring cafe partners and 4 monthly office accounts, adding Rp9 million in predictable monthly revenue.',
    },
    stepByStep: [
      'Pastikan produk utama Anda memiliki margin kotor minimal 35% sehingga masih menyisakan keuntungan saat memberikan harga grosir/mitra.',
      'Susun 1 halaman penawaran kemitraan (B2B/Reseller Sheet) yang memuat harga eceran, harga mitra, minimum order (MOQ), dan masa simpan produk.',
      'Daftar 10 calon mitra lokal (kedai kopi, toko oleh-oleh, penyelenggara acara, atau admin kantor) di kota Anda.',
      'Kirimkan paket sampel fisik beserta lembar penawaran dan jadwalkan tindak lanjut dalam 3 hari.',
      'Evaluasi perputaran produk di setiap mitra setiap 2 minggu dan fokuskan suplai pada mitra dengan penjualan tercepat.',
    ],
    stepByStepEn: [
      'Ensure your core product has at least a 35% gross margin so wholesale/partner pricing remains profitable.',
      'Prepare a 1-page Partner Offer Sheet detailing retail price, partner price, minimum order quantity (MOQ), and shelf life.',
      'List 10 prospective local partners (coffee shops, gift stores, event organizers, or office admins) in your area.',
      'Deliver a physical sample pack with your offer sheet and follow up within 3 days.',
      'Review sell-through rates every 2 weeks and focus supply on the fastest-moving partner locations.',
    ],
    commonMistakes: [
      'Membuka cabang baru atau merekrut banyak reseller saat perhitungan HPP dan stok masih berantakan.',
      'Memberikan sistem titip jual (konsinyasi) tanpa batas waktu evaluasi dan pencatatan stok yang jelas.',
      'Menambah terlalu banyak produk baru yang tidak berhubungan dengan keahlian utama usaha.',
    ],
    commonMistakesEn: [
      'Opening a new branch or recruiting resellers before unit COGS and inventory controls are solid.',
      'Offering consignment stock without clear payment terms or bi-weekly stock audits.',
      'Launching unrelated product lines that distract from your core strength.',
    ],
    actionChecklist: [
      'Hitung simulasi margin khusus untuk harga grosir/reseller/B2B.',
      'Buat 1 lembar PDF Katalog Kemitraan / Pesanan Acara.',
      'Siapkan daftar 10 calon mitra bisnis lokal di sekitar lokasi usaha Anda.',
      'Kirimkan 3 penawaran atau sampel kemitraan pertama minggu ini.',
    ],
    actionChecklistEn: [
      'Run a margin simulation for wholesale/B2B partner pricing.',
      'Create a 1-page B2B / Event Order Catalog sheet.',
      'List 10 prospective local business partners near your location.',
      'Deliver your first 3 partner sample packages this week.',
    ],
    relatedResources: [
      {
        title: 'Cara Mengembangkan Usaha dengan Budget Terbatas',
        titleEn: 'How to Grow Your Business on a Limited Budget',
        type: 'Panduan',
        typeEn: 'Guide',
        targetIdOrUrl: 'guide-growth-low-budget',
      },
    ],
    sourceReferences: [
      {
        docId: 'KB-06',
        docTitle: 'Business Development & Validation',
        section: 'Section 01 — Validasi Ide & Produk Baru melalui Uji Batch Terbatas',
        page: 3,
      },
      {
        docId: 'KB-06',
        docTitle: 'Business Development & Validation',
        section: 'Section 02 — Ekspansi Saluran Distribusi Melalui Kemitraan B2B Lokal',
        page: 9,
      },
    ],
    consultationPrompt:
      'Usaha saya sudah berjalan stabil dan saya ingin meningkatkan skala penjualan melalui kemitraan lokal atau saluran distribusi baru. Bantu saya menyusun strateginya.',
    consultationPromptEn:
      'My business is operating steadily and I want to scale revenue through local B2B partnerships or new distribution channels. Help me design the strategy.',
  },
];

// ============================================================================
// SECTION 5.A — 6 REQUIRED ACTIONABLE GUIDES FOR UMKM (BILINGUAL ID / EN)
// ============================================================================
export const ACTIONABLE_GUIDES: ActionableGuide[] = [
  {
    id: 'guide-first-customer',
    title: 'Cara Mendapatkan Pelanggan Pertama',
    titleEn: 'How to Get Your First Customers',
    category: 'Memulai Bisnis',
    categoryEn: 'Starting a Business',
    readingTime: '4 menit',
    readingTimeEn: '4 min',
    explanation:
      'Pelanggan pertama jarang datang dari iklan rumit atau logo mahal. Mereka datang dari lingkaran terdekat dan komunitas yang memiliki masalah spesifik yang langsung terjawab oleh produk Anda melalui penawaran percobaan yang mudah diakses.',
    explanationEn:
      'Your first customers rarely come from complex ads or expensive logos. They come from your immediate network and local communities whose specific needs are solved by an accessible trial offer.',
    practicalSteps: [
      'Tentukan 1 masalah atau kebutuhan spesifik yang dijawab produk Anda (misal: sarapan praktis, kado wisuda, atau camilan sehat).',
      'Siapkan "Paket Perkenalan / Batch Pertama" dengan kuota terbatas (misal 15–20 porsi) agar kualitas terjaga.',
      'Hubungi secara personal 25 kenalan, rekan kerja, atau anggota grup WhatsApp lokal dengan pesan ramah (bukan broadcast spam).',
      'Minta testimoni jujur dan foto produk dari 5 pembeli pertama sebagai bukti sosial untuk calon pembeli berikutnya.',
    ],
    practicalStepsEn: [
      'Define 1 specific need your product solves (e.g., quick office breakfast, graduation gift, or healthy snack).',
      'Prepare a limited "Batch-1 Introductory Offer" (15–20 units) to maintain high quality.',
      'Send personal, friendly messages to 25 contacts or local community groups rather than generic spam broadcasts.',
      'Request honest feedback and product photos from your first 5 buyers to build social proof.',
    ],
    simpleExample:
      'Usaha salad buah rumahan menawarkan "Paket Segar Siang Hari Rp25.000" khusus ke 3 grup WhatsApp kantor di dekat rumah dengan pengantaran gratis jam 11.30 siang. Dari 40 anggota grup, 12 orang langsung memesan di hari pertama.',
    simpleExampleEn:
      'A home fruit-salad maker offered a "Rp25,000 Fresh Lunch Cup" with free 11:30 AM delivery to 3 nearby office WhatsApp groups. Out of 40 members, 12 ordered on day one.',
    commonMistakes: [
      'Menunggu sampai semua peralatan, kemasan cetak ribuan, dan akun media sosial sempurna baru berani menawarkan produk.',
      'Menawarkan terlalu banyak pilihan menu sehingga calon pembeli bingung memilih.',
    ],
    commonMistakesEn: [
      'Waiting for perfect equipment and thousands of printed packages before offering the product.',
      'Offering too many menu variants, causing buyer hesitation.',
    ],
    relatedTopics: ['Validasi Ide Bisnis', 'Penawaran Pre-Order', 'Bukti Sosial'],
    relatedTopicsEn: ['Idea Validation', 'Pre-Order Batch', 'Social Proof'],
    consultationPrompt:
      'Saya ingin mendapatkan pelanggan pertama untuk usaha saya. Bantu saya menyusun langkah penawaran awalnya.',
    consultationPromptEn:
      'I want to get the first paying customers for my business. Help me structure my initial offer and outreach.',
  },
  {
    id: 'guide-pricing-hpp',
    title: 'Cara Menentukan Harga Jual Produk',
    titleEn: 'How to Set Product Selling Prices',
    category: 'Keuangan & Harga',
    categoryEn: 'Finance & Pricing',
    readingTime: '5 menit',
    readingTimeEn: '5 min',
    explanation:
      'Harga jual yang sehat harus menutup seluruh komponen Harga Pokok Penjualan (HPP)—termasuk kemasan, energi, dan penyusutan—serta memberikan margin kotor yang cukup untuk biaya operasional dan pengembangan usaha.',
    explanationEn:
      'A healthy selling price must cover all Cost of Goods Sold (COGS) components—including packaging, utilities, and spoilage—while leaving enough gross margin for operations and growth.',
    practicalSteps: [
      'Hitung biaya bahan baku per unit sesuai takaran resep atau gramasi standar.',
      'Tambahkan biaya kemasan lengkap (wadah, stiker, segel, plastik/tas kirim) dan alokasi biaya gas/listrik per unit.',
      'Tambahkan cadangan risiko bahan terbuang (3%–5%) untuk mendapatkan total HPP Riil per unit.',
      'Tetapkan harga jual dengan rumus: Harga Jual = HPP Riil / (1 - Target Margin %). Untuk kuliner/kerajinan UMKM, targetkan margin kotor minimal 35%–50%.',
      'Buat opsi Paket Bundling untuk meningkatkan nilai rata-rata per transaksi tanpa harus perang harga satuan.',
    ],
    practicalStepsEn: [
      'Calculate direct ingredient cost per unit using standardized recipe weights.',
      'Add full packaging costs (container, label, seal, carrier bag) and utility allocation per unit.',
      'Include a 3%–5% spoilage buffer to obtain your True Unit COGS.',
      'Set your selling price using: Selling Price = True COGS / (1 - Target Margin %). Aim for a 35%–50% gross margin.',
      'Create Value Bundles to increase Average Order Value without cutting single-item prices.',
    ],
    simpleExample:
      'Jika HPP bahan + kemasan + gas 1 kotak brownies adalah Rp30.000 dan Anda menargetkan margin kotor 40%, maka Harga Jual = Rp30.000 / (1 - 0,40) = Rp50.000 per kotak.',
    simpleExampleEn:
      'If ingredients + packaging + gas for 1 box of brownies total Rp30,000 and your target gross margin is 40%, then Selling Price = Rp30,000 / (1 - 0.40) = Rp50,000 per box.',
    commonMistakes: [
      'Menentukan harga semata-mata ikut-ikutan pesaing tanpa menghitung struktur biaya sendiri.',
      'Lupa menambahkan komisi platform 15%–25% saat menjual di aplikasi pesan-antar atau marketplace.',
    ],
    commonMistakesEn: [
      'Copying competitor prices blindly without knowing your own cost structure.',
      'Forgetting to factor in 15%–25% marketplace or delivery app commissions.',
    ],
    relatedTopics: ['Perhitungan HPP (COGS)', 'Margin Keuntungan', 'Strategi Bundling'],
    relatedTopicsEn: ['COGS Calculation', 'Profit Margins', 'Bundling Strategy'],
    consultationPrompt:
      'Bantu saya menghitung HPP dan menentukan harga jual yang sehat agar usaha saya tidak rugi.',
    consultationPromptEn:
      'Help me calculate my unit COGS and set a healthy selling price so my business stays profitable.',
  },
  {
    id: 'guide-instagram-content',
    title: 'Cara Membuat Konten Instagram yang Relevan',
    titleEn: 'How to Create Relevant Instagram Content',
    category: 'Marketing & Branding',
    categoryEn: 'Marketing & Branding',
    readingTime: '4 menit',
    readingTimeEn: '4 min',
    explanation:
      'Konten Instagram yang menghasilkan penjualan bukan sekadar poster harga, melainkan konten yang memperlihatkan kualitas produk secara nyata, menjawab keraguan pembeli, dan memudahkan mereka memesan.',
    explanationEn:
      'High-converting Instagram content goes beyond price posters—it demonstrates tangible product quality, answers buyer doubts, and makes ordering effortless.',
    practicalSteps: [
      'Gunakan rumus konten 40-30-30: 40% Konten Solusi/Momen penggunaan produk, 30% Proses pembuatan & Testimoni pelanggan, 30% Penawaran Paket/Promo.',
      'Tampilkan visual produk dalam jarak dekat (close-up tekstur, proses pengemasan higienis, atau pemakaian nyata) pada 3 detik pertama.',
      'Tulis caption yang dimulai dengan masalah/situasi pelanggan, bukan langsung spesifikasi teknis.',
      'Akhiri setiap konten dengan 1 ajakan bertindak (Call-to-Action) jelas menuju link WhatsApp di bio.',
    ],
    practicalStepsEn: [
      'Follow the 40-30-30 content mix: 40% Customer Occasions/Solutions, 30% Behind-the-Scenes & Testimonials, 30% Direct Bundle Offers.',
      'Show close-up product visuals or real usage in the first 3 seconds.',
      'Start captions with a relatable customer situation rather than technical specs.',
      'End every post with one clear Call-to-Action pointing to your bio WhatsApp link.',
    ],
    simpleExample:
      'Alih-alih mengunggah foto roti dengan tulisan "Roti Cokelat Rp12.000", unggah video singkat roti hangat yang disobek hingga cokelatnya meleleh dengan judul: "Teman ngopi sore untuk keluarga di rumah — pesan Paket Hangat Sore via link di bio".',
    simpleExampleEn:
      'Instead of a static photo saying "Chocolate Bread Rp12,000", post a 15-second clip pulling apart warm bread with melting chocolate captioned: "Afternoon coffee companion for your family — order the Afternoon Warm Box via the link in bio."',
    commonMistakes: [
      'Mengunggah poster penuh tulisan kecil yang sulit dibaca di layar ponsel.',
      'Tidak mencantumkan kota lokasi usaha dan cara pemesanan di bio profil.',
    ],
    commonMistakesEn: [
      'Uploading text-heavy flyers that are hard to read on mobile screens.',
      'Omitting your city/delivery area and ordering link from your profile bio.',
    ],
    relatedTopics: ['Pemasaran Organik', 'Konversi Sosial Media', 'Bukti Sosial'],
    relatedTopicsEn: ['Organic Marketing', 'Social Media Conversion', 'Social Proof'],
    consultationPrompt:
      'Konten Instagram usaha saya masih sepi interaksi dan belum menghasilkan banyak pesanan. Bantu saya menyusun ide konten yang relevan.',
    consultationPromptEn:
      'My business Instagram gets low engagement and few orders. Help me plan relevant content that converts.',
  },
  {
    id: 'guide-repeat-order',
    title: 'Cara Meningkatkan Repeat Order',
    titleEn: 'How to Increase Repeat Orders',
    category: 'Pelanggan & Penjualan',
    categoryEn: 'Customers & Sales',
    readingTime: '4 menit',
    readingTimeEn: '4 min',
    explanation:
      'Pelanggan yang puas sekalipun sering lupa membeli kembali jika tidak diingatkan pada waktu yang tepat. Membangun alur sapaan pasca-pembelian mengubah pembeli satu kali menjadi pelanggan tetap.',
    explanationEn:
      'Even satisfied customers forget to reorder if they are not reminded at the right moment. A structured post-purchase follow-up turns one-time buyers into regulars.',
    practicalSteps: [
      'Catat nama, nomor WhatsApp, tanggal beli, dan produk yang dipesan setiap pelanggan.',
      'Sertakan kartu terima kasih kecil di dalam kemasan berisi insentif pembelian berikutnya (misal: gratis 1 item tambahan untuk pemesanan kedua).',
      'Kirim pesan H+3 setelah produk diterima untuk menanyakan kepuasan dan meminta masukan.',
      'Hubungi kembali pada H+14 atau H+21 (sesuai siklus habisnya produk) dengan informasi menu baru atau pengingat restock.',
    ],
    practicalStepsEn: [
      'Record every buyer’s name, WhatsApp number, purchase date, and ordered item.',
      'Include a packaging insert card with a perk for their second order within 14 days.',
      'Send a polite Day-3 check-in message asking how they enjoyed the product.',
      'Follow up on Day-14 or Day-21 (aligned with consumption cycle) with a restock reminder.',
    ],
    simpleExample:
      'Penjual kopi bubuk 250g menghubungi pembeli pada hari ke-18 via WhatsApp: "Halo Kak Budi, semoga sehat selalu! Biasanya stok kopi 250g sudah mulai menipis di minggu ketiga. Besok pagi kami baru sangrai batch segar, mau sekalian kami sisihkan 1 bungkus?"',
    simpleExampleEn:
      'A 250g coffee roaster messages a buyer on Day 18: "Hi Budi, hope your week is going well! Usually a 250g bag starts running low around week three. We are roasting a fresh batch tomorrow morning—would you like us to set aside a bag for you?"',
    commonMistakes: [
      'Mengirim pesan broadcast promosi massal setiap hari hingga nomor diblokir pelanggan.',
      'Tidak memiliki catatan siapa saja pelanggan yang pernah membeli bulan lalu.',
    ],
    commonMistakesEn: [
      'Sending daily mass promotional broadcasts that annoy customers.',
      'Keeping no record of who bought from you last month.',
    ],
    relatedTopics: ['Retensi Pelanggan', 'CRM WhatsApp', 'Loyalitas Pelanggan'],
    relatedTopicsEn: ['Customer Retention', 'WhatsApp CRM', 'Customer Loyalty'],
    consultationPrompt:
      'Pelanggan saya jarang melakukan pembelian ulang (repeat order). Bantu saya merancang program retensi pelanggan untuk usaha saya.',
    consultationPromptEn:
      'My customers rarely place repeat orders. Help me design a customer retention and follow-up program.',
  },
  {
    id: 'guide-inventory-stock',
    title: 'Cara Mengelola Stok Produk',
    titleEn: 'How to Manage Product Inventory',
    category: 'Operasional',
    categoryEn: 'Operations',
    readingTime: '5 menit',
    readingTimeEn: '5 min',
    explanation:
      'Pengelolaan stok yang rapi mencegah dua kerugian sekaligus: kehilangan penjualan karena bahan habis mendadak (stockout) dan modal macet akibat bahan baku kedaluwarsa atau menumpuk (overstock).',
    explanationEn:
      'Disciplined inventory management prevents two costly problems at once: lost sales from sudden stockouts and tied-up cash from expired or overstocked materials.',
    practicalSteps: [
      'Daftar 10 bahan baku dan kemasan utama yang paling menentukan kelancaran produksi harian.',
      'Tetapkan angka Stok Minimum (Reorder Point) untuk tiap item berdasarkan waktu tunggu belanja pemasok.',
      'Terapkan aturan FIFO (First-In, First-Out): bahan yang datang lebih dulu diletakkan di bagian depan agar terpakai lebih awal.',
      'Lakukan cek fisik stok (stock opname) singkat selama 15 menit setiap akhir pekan dan cocokkan dengan jumlah penjualan.',
    ],
    practicalStepsEn: [
      'List the top 10 raw materials and packaging items critical to daily operations.',
      'Set a Minimum Reorder Point for each item based on supplier delivery lead time.',
      'Apply FIFO (First-In, First-Out): place older stock in front so it is used first.',
      'Run a 15-minute weekly physical stock count and reconcile it with sales records.',
    ],
    simpleExample:
      'Jika usaha minuman Anda menghabiskan 100 cup per hari dan pemasok butuh 2 hari pengiriman, tetapkan Stok Minimum di angka 300 cup. Begitu sisa cup menyentuh 300, pesanan ke pemasok wajib langsung dilakukan.',
    simpleExampleEn:
      'If your beverage shop uses 100 cups per day and your supplier takes 2 days to deliver, set your Reorder Point at 300 cups. Reorder immediately whenever stock hits 300.',
    commonMistakes: [
      'Membeli bahan baku dalam jumlah sangat besar hanya karena tergiur diskon grosir padahal perputaran produknya lambat.',
      'Tidak mencatat produk yang rusak, tumpah, atau diberikan sebagai sampel gratis.',
    ],
    commonMistakesEn: [
      'Buying excessive bulk quantities for a small supplier discount on slow-moving items.',
      'Failing to log spoiled, spilled, or complimentary sample units.',
    ],
    relatedTopics: ['Manajemen Stok FIFO', 'Efisiensi Operasional', 'SOP Produksi'],
    relatedTopicsEn: ['FIFO Inventory', 'Operational Efficiency', 'Production SOP'],
    consultationPrompt:
      'Saya ingin merapikan pencatatan stok bahan baku dan operasional harian usaha saya agar tidak sering kehabisan atau terbuang.',
    consultationPromptEn:
      'I want to organize my raw material inventory and daily operations to prevent stockouts and waste.',
  },
  {
    id: 'guide-growth-low-budget',
    title: 'Cara Mengembangkan Usaha dengan Budget Terbatas',
    titleEn: 'How to Grow Your Business on a Limited Budget',
    category: 'Pengembangan Bisnis',
    categoryEn: 'Business Growth',
    readingTime: '5 menit',
    readingTimeEn: '5 min',
    explanation:
      'Mengembangkan usaha tidak selalu membutuhkan pinjaman besar atau iklan mahal. Pertumbuhan paling berkelanjutan bagi UMKM berasal dari kolaborasi komunitas, optimalisasi pelanggan yang sudah ada, dan kemitraan lokal.',
    explanationEn:
      'Growing a small business does not require large loans or expensive ads. The most sustainable growth comes from community collaborations, existing customer referrals, and local B2B partnerships.',
    practicalSteps: [
      'Maksimalkan potensi dari daftar pelanggan lama melalui penawaran paket bundling atau program referensi (referral).',
      'Jalin kemitraan silang (cross-promotion) dengan 2–3 usaha lokal yang memiliki profil pelanggan serupa namun produknya saling melengkapi.',
      'Optimalkan halaman Google Business Profile (Google Maps) dengan foto produk terbaru dan ulasan pelanggan asli agar mudah ditemukan pencari lokal.',
      'Buka saluran penjualan B2B sederhana seperti paket konsumsi rapat kantor, arisan, atau suvenir acara komunitas.',
    ],
    practicalStepsEn: [
      'Maximize revenue from existing customers through value bundles and referral perks.',
      'Set up cross-promotions with 2–3 complementary local businesses serving the same audience.',
      'Optimize your Google Business Profile (Google Maps) with fresh photos and customer reviews.',
      'Introduce a simple B2B package for office meetings, community events, or local cafes.',
    ],
    simpleExample:
      'Usaha kue kering rumahan bekerja sama dengan penjual buket bunga lokal untuk membuat "Paket Hadiah Ulang Tahun Hemat". Keduanya mempromosikan paket tersebut ke pelanggan masing-masing tanpa mengeluarkan biaya iklan sepeser pun.',
    simpleExampleEn:
      'A home cookie baker partnered with a local florist to create a "Birthday Gift Bundle." Both promoted the bundle to their existing followers with zero ad spend.',
    commonMistakes: [
      'Menghabiskan anggaran terbatas untuk iklan berbayar tanpa memperbaiki penawaran dan kejelasan pesan produk terlebih dahulu.',
      'Menambah banyak produk baru yang membuat biaya bahan baku membengkak.',
    ],
    commonMistakesEn: [
      'Spending limited cash on paid ads before fixing product positioning and chat conversion.',
      'Adding too many new SKUs that inflate inventory costs.',
    ],
    relatedTopics: ['Kemitraan Lokal', 'Pertumbuhan Organik', 'Strategi Bundling'],
    relatedTopicsEn: ['Local Partnerships', 'Organic Growth', 'Bundling Strategy'],
    consultationPrompt:
      'Saya ingin mengembangkan penjualan usaha saya tetapi tidak memiliki anggaran untuk iklan berbayar. Bantu saya menyusun langkah pertumbuhannya.',
    consultationPromptEn:
      'I want to grow my business sales without a budget for paid ads. Help me create an organic growth plan.',
  },
];

// ============================================================================
// SECTION 5.B — CONVERSATIONAL FAQ ITEMS (BILINGUAL ID / EN)
// ============================================================================
export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-01',
    question: 'Kenapa produk saya dilihat banyak orang tapi jarang ada yang beli?',
    questionEn: 'Why do many people view my product, but very few actually buy?',
    topic: 'Penjualan & Konversi',
    topicEn: 'Sales & Conversion',
    shortAnswer:
      'Biasanya disebabkan oleh tiga hal: penawaran nilai (value proposition) yang belum spesifik, belum adanya paket percobaan berisiko rendah untuk pembeli baru, atau alur pemesanan yang kurang praktis.',
    shortAnswerEn:
      'Usually caused by three factors: an unclear value proposition, the lack of a low-risk trial bundle for first-time buyers, or friction in your ordering flow.',
    detailedExplanation: [
      'Ketika banyak orang melihat konten atau profil toko Anda namun tidak membeli, artinya rasa ingin tahu sudah terbentuk tetapi kepercayaan atau alasan membeli sekarang belum cukup kuat.',
      'Periksa apakah harga, manfaat utama produk, dan bukti ulasan pelanggan sudah terlihat jelas tanpa harus bertanya panjang lebar.',
      'Buat 1 "Paket Coba / Starter Pack" dengan harga terjangkau khusus untuk pelanggan pertama agar mereka tidak ragu mencoba kualitas produk Anda.',
    ],
    detailedExplanationEn: [
      'When people view your profile without buying, curiosity exists but trust or urgency is still missing.',
      'Check whether pricing, key benefits, and customer reviews are immediately visible without requiring a long chat.',
      'Create 1 affordable "Starter / Trial Pack" specifically designed to remove hesitation for first-time buyers.',
    ],
    relatedGuideId: 'guide-instagram-content',
    relatedGuideTitle: 'Cara Membuat Konten Instagram yang Relevan',
    relatedGuideTitleEn: 'How to Create Relevant Instagram Content',
    consultationPrompt:
      'Produk saya dilihat cukup banyak orang di media sosial/toko, tetapi jarang ada yang benar-benar membeli. Bantu saya menganalisis penyebabnya.',
    consultationPromptEn:
      'Many people view my products on social media, but very few convert into buyers. Help me diagnose the cause.',
  },
  {
    id: 'faq-02',
    question: 'Bagaimana cara menentukan harga jual supaya tidak rugi?',
    questionEn: 'How do I set my selling price so I do not lose money?',
    topic: 'Keuangan & Harga',
    topicEn: 'Finance & Pricing',
    shortAnswer:
      'Jangan hanya menghitung bahan baku utama. Anda wajib menghitung HPP Riil per unit (bahan baku + kemasan lengkap + gas/listrik + penyusutan 3–5% + biaya komisi platform) lalu menambahkan margin kotor sehat minimal 30%–50%.',
    shortAnswerEn:
      'Never calculate raw ingredients alone. Compute your True Unit COGS (ingredients + full packaging + utilities + 3–5% spoilage + platform commissions) and add a healthy 30%–50% gross margin.',
    detailedExplanation: [
      'Banyak UMKM merasa sudah untung karena menjual di atas harga bahan pokok, padahal biaya stiker, kardus, gas, dan potongan aplikasi belum dihitung.',
      'Gunakan rumus: Harga Jual = HPP Riil / (1 - Target Margin). Jika HPP Riil Rp15.000 dan target margin 40%, maka harga jual sehat adalah Rp25.000.',
      'Jika harga satuan terasa tinggi dibanding kompetitor, buat Paket Hemat / Bundling 2–3 unit agar margin rupiah per transaksi tetap aman.',
    ],
    detailedExplanationEn: [
      'Many small businesses think they are profitable because they price above raw ingredients, forgetting labels, boxes, gas, and app commissions.',
      'Use the formula: Selling Price = True COGS / (1 - Target Margin). If True COGS is Rp15,000 and target margin is 40%, your healthy selling price is Rp25,000.',
      'If single-unit pricing feels high against competitors, offer 2–3 unit Value Bundles to protect total profit per order.',
    ],
    relatedGuideId: 'guide-pricing-hpp',
    relatedGuideTitle: 'Cara Menentukan Harga Jual Produk',
    relatedGuideTitleEn: 'How to Set Product Selling Prices',
    consultationPrompt:
      'Bantu saya mengecek perhitungan HPP dan menentukan harga jual produk supaya usaha saya tidak rugi.',
    consultationPromptEn:
      'Help me review my unit COGS calculation and set profitable selling prices.',
  },
  {
    id: 'faq-03',
    question: 'Apa yang harus saya lakukan kalau penjualan tiba-tiba menurun?',
    questionEn: 'What should I do when sales suddenly decline?',
    topic: 'Penjualan & Konversi',
    topicEn: 'Sales & Conversion',
    shortAnswer:
      'Lakukan diagnosis dengan memisahkan apakah penurunan berasal dari berkurangnya pembeli baru (akuisisi) atau berkurangnya pembelian ulang dari pelanggan lama (retensi), lalu jalankan pemulihan 7 hari.',
    shortAnswerEn:
      'Diagnose whether the drop comes from fewer new buyers (acquisition) or fewer repeat orders from past buyers (retention), then execute a focused 7-day recovery plan.',
    detailedExplanation: [
      'Jangan langsung panik menurunkan harga secara drastis karena hal itu justru memangkas margin keuntungan Anda.',
      'Langkah pertama: hubungi 10–15 pelanggan lama yang sudah lebih dari 3 minggu tidak memesan untuk menanyakan kabar dan menawarkan paket spesial minggu ini.',
      'Langkah kedua: evaluasi apakah ada perubahan kualitas produk, kecepatan balasan chat, atau kejenuhan konten promosi dalam 1 bulan terakhir.',
    ],
    detailedExplanationEn: [
      'Avoid panic discounting, which immediately erodes your gross margin.',
      'First step: reach out personally to 10–15 past customers who have not ordered in over 3 weeks with a warm check-in and weekly bundle.',
      'Second step: audit whether product quality, chat response speed, or content frequency slipped over the past month.',
    ],
    relatedGuideId: 'guide-repeat-order',
    relatedGuideTitle: 'Cara Meningkatkan Repeat Order',
    relatedGuideTitleEn: 'How to Increase Repeat Orders',
    consultationPrompt:
      'Penjualan usaha saya menurun akhir-akhir ini. Bantu saya menelusuri penyebab utamanya dan menyusun rencana pemulihan.',
    consultationPromptEn:
      'My business sales have declined recently. Help me investigate the root causes and build a recovery plan.',
  },
  {
    id: 'faq-04',
    question: 'Apakah saya harus pasang iklan berbayar untuk menaikkan penjualan?',
    questionEn: 'Do I need to run paid ads to increase sales?',
    topic: 'Marketing & Iklan',
    topicEn: 'Marketing & Ads',
    shortAnswer:
      'Tidak harus. Jika penawaran produk, konversi chat WhatsApp, dan retensi pelanggan lama belum rapi, iklan berbayar justru berisiko menghabiskan modal tanpa hasil yang sepadan.',
    shortAnswerEn:
      'Not necessarily. If your product positioning, WhatsApp chat conversion, and customer retention are not solid yet, paid ads risk burning cash with poor returns.',
    detailedExplanation: [
      'Iklan berbayar berfungsi sebagai pengeras suara: ia memperbesar apa yang sudah berhasil secara organik.',
      'Untuk UMKM dengan anggaran terbatas, fokuskan 14 hari pertama pada aktivasi database pelanggan lama, konten video produk nyata, optimalisasi Google Maps, dan kolaborasi dengan komunitas/usaha lokal.',
    ],
    detailedExplanationEn: [
      'Paid advertising acts as an amplifier—it scales offers that already convert organically.',
      'For budget-conscious businesses, spend the first 14 days activating past buyers, posting authentic product videos, optimizing Google Maps, and partnering with local businesses.',
    ],
    relatedGuideId: 'guide-growth-low-budget',
    relatedGuideTitle: 'Cara Mengembangkan Usaha dengan Budget Terbatas',
    relatedGuideTitleEn: 'How to Grow Your Business on a Limited Budget',
    consultationPrompt:
      'Saya ingin menaikkan penjualan tanpa menggunakan iklan berbayar. Strategi organik apa yang paling cocok untuk usaha saya?',
    consultationPromptEn:
      'I want to increase sales without paid ads. What organic strategy fits my business best?',
  },
  {
    id: 'faq-05',
    question: 'Bagaimana cara membuat pelanggan membeli lagi?',
    questionEn: 'How do I get customers to buy again (repeat orders)?',
    topic: 'Pelanggan & Retensi',
    topicEn: 'Customers & Retention',
    shortAnswer:
      'Pastikan kualitas produk konsisten di pembelian pertama, simpan kontak setiap pembeli di database sederhana, dan jalankan pengingat ramah pada H+3 serta H+14 setelah transaksi.',
    shortAnswerEn:
      'Deliver consistent quality on the first order, save every buyer’s contact in a simple log, and run friendly Day-3 and Day-14 follow-ups.',
    detailedExplanation: [
      'Sebagian besar pelanggan tidak membeli lagi bukan karena kecewa, melainkan karena lupa atau terdistraksi oleh penawaran lain.',
      'Sertakan kartu ucapan di kemasan dengan keuntungan khusus untuk pesanan kedua, lalu sapa mereka secara personal melalui WhatsApp saat produk diperkirakan sudah habis.',
    ],
    detailedExplanationEn: [
      'Most customers fail to reorder not because they were unhappy, but simply because they forgot.',
      'Include a thank-you insert with a second-order perk, and message them personally on WhatsApp around the time their product runs out.',
    ],
    relatedGuideId: 'guide-repeat-order',
    relatedGuideTitle: 'Cara Meningkatkan Repeat Order',
    relatedGuideTitleEn: 'How to Increase Repeat Orders',
    consultationPrompt:
      'Bagaimana cara menyusun sistem follow-up dan program repeat order yang sopan untuk pelanggan usaha saya?',
    consultationPromptEn:
      'How do I set up a polite follow-up workflow and repeat-order program for my customers?',
  },
  {
    id: 'faq-06',
    question: 'Saya baru ingin memulai usaha, harus mulai dari mana?',
    questionEn: 'I want to start a business—where should I begin?',
    topic: 'Memulai Usaha',
    topicEn: 'Starting a Business',
    shortAnswer:
      'Mulailah dari menetapkan 1 segmen pembeli spesifik dan menguji maksimal 2 varian produk inti melalui sistem Pre-Order kepada lingkaran terdekat sebelum mengeluarkan modal tetap yang besar.',
    shortAnswerEn:
      'Start by choosing 1 specific customer segment and testing at most 2 core product variants via a small-batch Pre-Order before spending money on fixed overhead.',
    detailedExplanation: [
      'Hindari membeli peralatan mahal atau menyewa tempat sebelum Anda membuktikan ada minimal 15–20 orang yang bersedia membayar produk Anda.',
      'Gunakan hasil penjualan batch pertama untuk menyempurnakan rasa/kualitas produk, menghitung HPP riil, dan mengurus Nomor Induk Berusaha (NIB) secara gratis di portal resmi OSS.',
    ],
    detailedExplanationEn: [
      'Avoid buying expensive equipment or signing leases until at least 15–20 people have paid for your first batch.',
      'Use proceeds from Batch 1 to refine product quality, verify unit COGS, and register your free Business Identification Number (NIB) on the official OSS portal.',
    ],
    relatedGuideId: 'guide-first-customer',
    relatedGuideTitle: 'Cara Mendapatkan Pelanggan Pertama',
    relatedGuideTitleEn: 'How to Get Your First Customers',
    consultationPrompt:
      'Saya baru ingin memulai usaha dari nol. Bantu saya memetakan langkah awal yang paling aman dan terarah.',
    consultationPromptEn:
      'I am starting a new business from scratch. Help me map out the safest, most practical first steps.',
  },
  {
    id: 'faq-07',
    question: 'Bagaimana cara mengatasi stok bahan yang sering habis mendadak atau justru terbuang?',
    questionEn: 'How do I prevent ingredients from running out suddenly or going to waste?',
    topic: 'Operasional & Stok',
    topicEn: 'Operations & Inventory',
    shortAnswer:
      'Tetapkan angka Stok Minimum (Reorder Point) untuk 10 bahan utama, gunakan takaran resep standar tertulis (SOP), dan terapkan prinsip FIFO (First-In, First-Out) di tempat penyimpanan.',
    shortAnswerEn:
      'Set Minimum Reorder Points for your top 10 ingredients, enforce written gram-based recipe SOPs, and apply First-In, First-Out (FIFO) storage.',
    detailedExplanation: [
      'Catat pemakaian rata-rata harian untuk bahan baku terpenting dan kalikan dengan waktu tunggu pengiriman pemasok ditambah cadangan 2 hari.',
      'Untuk produk mudah rusak, kombinasikan stok harian terbatas dengan sistem Pre-Order H-1 untuk pesanan jumlah besar.',
    ],
    detailedExplanationEn: [
      'Track average daily usage for critical ingredients and multiply by supplier lead time plus a 2-day safety buffer.',
      'For perishable products, combine conservative daily ready-stock with H-1 Pre-Orders for larger quantities.',
    ],
    relatedGuideId: 'guide-inventory-stock',
    relatedGuideTitle: 'Cara Mengelola Stok Produk',
    relatedGuideTitleEn: 'How to Manage Product Inventory',
    consultationPrompt:
      'Saya sering kesulitan mengatur stok bahan baku dan jadwal produksi harian. Bantu saya merapikan operasional usaha saya.',
    consultationPromptEn:
      'I struggle with raw material inventory and daily production scheduling. Help me streamline my operations.',
  },
];

// ============================================================================
// SECTION 3 — CENTRALIZED BILINGUAL UI LOCALIZATION DICTIONARY (ID / EN)
// ============================================================================
export const UI_TEXT: Record<
  AppLanguage,
  {
    nav: {
      newConsultation: string;
      history: string;
      knowledgeCenter: string;
      tipsAndFaq: string;
      settings: string;
      adminTools: string;
      recentConversations: string;
      sampleConsultation: string;
      openWorkspace: string;
      openSidebar: string;
      collapseSidebar: string;
      openMobileMenu: string;
      switchToLight: string;
      switchToDark: string;
    };
    home: {
      headline: string;
      subheadline: string;
      inputPlaceholder: string;
      primaryCta: string;
      sendButton: string;
    };
    workspace: {
      defaultTitle: string;
      subtitle: string;
      showAnalysisBtn: string;
      analyzingBtn: string;
      retryBtn: string;
      consultantRole: string;
      openingGreeting: string;
      starterPromptIntro: string;
      starterPrompt1: string;
      starterPrompt2: string;
      starterPrompt3: string;
      contextReadyTitle: string;
      contextReadySubtitle: string;
      analysisHeaderBadge: string;
      analysisHeaderTitle: string;
      editUnderstandingBtn: string;
      closeEditBtn: string;
      sec1Title: string;
      editSummaryLabel: string;
      editChallengeLabel: string;
      editFactsLabel: string;
      cancelBtn: string;
      saveBtn: string;
      confirmedFactsTitle: string;
      assumptionsTitle: string;
      sec2Title: string;
      sec3Title: string;
      visualFrameworkBadge: string;
      sec4Title: string;
      priorityPrefix: string;
      helpfulBtn: string;
      adjustBtn: string;
      whyItFitsLabel: string;
      executionStepsLabel: string;
      resourcesLabel: string;
      expectedOutcomeLabel: string;
      sec5Title: string;
      sec5Subtitle: string;
      completedSuffix: string;
      successIndicatorLabel: string;
      solutionReadyBadge: string;
      solutionReadyTitle: string;
      solutionReadySubtitle: string;
      tailoredDocPrefix: string;
      tailoredBadge: string;
      downloadReportBtn: string;
      downloadReportSub: string;
      downloadActionPlanBtn: string;
      downloadActionPlanSub: string;
      downloadTailoredBtn: string;
      sessionDocsLabel: string;
      continueChatNote: string;
      referencesButtonPrefix: string;
      internalKbHeader: string;
      externalRefsHeader: string;
      publisherLabel: string;
      openSourceLink: string;
      videoResourcesHeader: string;
      watchVideoBtn: string;
      followUpIntro: string;
      followUpChip1: string;
      followUpChip2: string;
      followUpChip3: string;
      loadingAnalysisText: string;
      loadingReplyText: string;
      composerPlaceholder: string;
      composerContinuationPlaceholder: string;
      sendBtn: string;
      composerHintLeft: string;
      composerHintRight: string;
    };
    history: {
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      allCategories: string;
      emptyTitle: string;
      emptySubtitle: string;
      startNewBtn: string;
      sampleBtn: string;
      statusReady: string;
      statusActive: string;
      docsDownloadedSuffix: string;
      openChatBtn: string;
      clearHistoryBtn: string;
      clearConfirmTitle: string;
      clearConfirmBody: string;
      clearConfirmAction: string;
    };
    learning: {
      badge: string;
      title: string;
      subtitle: string;
      searchPlaceholder: string;
      allTopics: string;
      domainsHeading: string;
      domainsSub: string;
      viewMaterial: string;
      featuredHeading: string;
      levelPrefix: string;
      readGuide: string;
      allArticlesHeading: string;
      categoryArticlesPrefix: string;
      articlesAvailableSuffix: string;
      caseStudyLabel: string;
      discussInChatBtn: string;
      readMoreBtn: string;
      backToCenterBtn: string;
      sec1: string;
      sec2: string;
      sec3: string;
      sec4: string;
      initialSituation: string;
      solutionApplied: string;
      measurableOutcome: string;
      sec5: string;
      sec6: string;
      sec7: string;
      sec8: string;
      sec9: string;
      pageLabel: string;
      applyCtaTitle: string;
      applyCtaSub: string;
      applyCtaBtn: string;
    };
    tips: {
      badge: string;
      title: string;
      subtitle: string;
      secATitle: string;
      secASub: string;
      guidesCountSuffix: string;
      currentlyOpen: string;
      openGuide: string;
      readTimePrefix: string;
      discussWithNoeviaBtn: string;
      mainExplanation: string;
      practicalSteps: string;
      simpleExample: string;
      commonMistakes: string;
      relatedTopicsLabel: string;
      applyWithNoeviaLink: string;
      secBTitle: string;
      secBSub: string;
      faqSearchPlaceholder: string;
      allTopics: string;
      relatedGuidePrefix: string;
      consultIssueBtn: string;
      sampleBannerBadge: string;
      sampleBannerTitle: string;
      sampleBannerDesc: string;
      openSampleBtn: string;
      startMyConsultationBtn: string;
    };
    settings: {
      title: string;
      subtitle: string;
      themeTitle: string;
      themeSubtitle: string;
      lightMode: string;
      lightModeSub: string;
      darkMode: string;
      darkModeSub: string;
      systemDefault: string;
      systemDefaultSub: string;
      languageTitle: string;
      languageSubtitle: string;
      langIdLabel: string;
      langIdSub: string;
      langEnLabel: string;
      langEnSub: string;
    };
  }
> = {
  id: {
    nav: {
      newConsultation: 'Konsultasi Baru',
      history: 'Riwayat Konsultasi',
      knowledgeCenter: 'Pusat Pengetahuan Bisnis',
      tipsAndFaq: 'Tips, Panduan & FAQ',
      settings: 'Pengaturan',
      adminTools: 'Admin & Developer Tools',
      recentConversations: 'Percakapan Terakhir',
      sampleConsultation: 'Contoh Konsultasi',
      openWorkspace: 'Buka Ruang Konsultasi',
      openSidebar: 'Buka Sidebar',
      collapseSidebar: 'Sembunyikan Sidebar',
      openMobileMenu: 'Buka Menu Navigasi',
      switchToLight: 'Ganti ke Light Mode',
      switchToDark: 'Ganti ke Dark Mode',
    },
    home: {
      headline: 'Kami membantu Anda menemukan solusi untuk tantangan bisnis.',
      subheadline:
        'Ceritakan masalah usaha yang sedang Anda hadapi. Mari kita pahami dan temukan langkah terbaik bersama.',
      inputPlaceholder: 'Ceritakan masalah usaha Anda di sini...',
      primaryCta: 'Mulai Konsultasi',
      sendButton: 'Kirim',
    },
    workspace: {
      defaultTitle: 'Konsultasi Bisnis',
      subtitle:
        'Ceritakan situasi usaha Anda secara alami—kita telusuri penyebab dan langkah solusinya bersama.',
      showAnalysisBtn: 'Susun Analisis & Solusi Lengkap',
      analyzingBtn: 'Menyusun Solusi...',
      retryBtn: 'Coba Lagi',
      consultantRole: 'Konsultan Bisnis AI',
      openingGreeting:
        'Halo! Ceritakan tantangan yang sedang Anda hadapi pada usaha Anda saat ini. Kita akan menelusuri akar masalahnya dan menyusun langkah solusinya bersama.',
      starterPromptIntro:
        'Anda dapat langsung mengetik di bawah, atau memilih salah satu topik masalah usaha berikut:',
      starterPrompt1:
        '“Penjualan bakery saya menurun sejak 2 bulan terakhir dan pelanggan baru berkurang...”',
      starterPrompt2:
        '“Omzet ramai tapi keuntungan tipis — bantu evaluasi HPP dan harga jual...”',
      starterPrompt3:
        '“Stok bahan sering selisih dan produksi belum punya SOP tertulis...”',
      contextReadyTitle: 'Konteks permasalahan Anda sudah cukup jelas.',
      contextReadySubtitle:
        'Anda dapat terus bercerita di kolom chat, atau meminta Noevia menyusun analisis masalah, rencana tindakan, dan dokumen bisnis siap unduh sekarang.',
      analysisHeaderBadge: 'Noevia · Analisis & Solusi Bisnis Terstruktur',
      analysisHeaderTitle: 'Ringkasan Analisis & Jalan Keluar Usaha Anda',
      editUnderstandingBtn: 'Sesuaikan Pemahaman',
      closeEditBtn: 'Tutup Edit',
      sec1Title: '1. Apa yang Kami Pahami',
      editSummaryLabel: 'Ringkasan Situasi Usaha',
      editChallengeLabel: 'Tantangan Utama Bisnis',
      editFactsLabel: 'Fakta Terkonfirmasi (Satu poin per baris)',
      cancelBtn: 'Batal',
      saveBtn: 'Simpan',
      confirmedFactsTitle: 'Fakta Terkonfirmasi',
      assumptionsTitle: 'Asumsi & Hal yang Perlu Diverifikasi',
      sec2Title: '2. Tantangan Utama Bisnis',
      sec3Title: '3. Kemungkinan Penyebab Utama',
      visualFrameworkBadge: 'Kerangka Visual Kontekstual',
      sec4Title: '4. Rekomendasi Solusi Prioritas',
      priorityPrefix: 'Prioritas',
      helpfulBtn: 'Cocok',
      adjustBtn: 'Sesuaikan',
      whyItFitsLabel: 'Mengapa cocok untuk usaha Anda:',
      executionStepsLabel: 'Langkah Pelaksanaan:',
      resourcesLabel: 'Sumber Daya:',
      expectedOutcomeLabel: 'Target Hasil:',
      sec5Title: '5. Rencana Tindakan Praktis',
      sec5Subtitle:
        'Dilengkapi prioritas, jadwal pelaksanaan, kebutuhan sumber daya, dan ukuran keberhasilan.',
      completedSuffix: 'selesai',
      successIndicatorLabel: 'Indikator Sukses:',
      solutionReadyBadge: 'Generator Solusi & Dokumen Bisnis',
      solutionReadyTitle: 'Solusi Anda sudah siap.',
      solutionReadySubtitle:
        'Kami telah menyiapkan ringkasan konsultasi, rencana tindakan, dan dokumen pendukung yang dapat Anda gunakan untuk menjalankan solusi ini.',
      tailoredDocPrefix: 'Dokumen Khusus Usaha Anda:',
      tailoredBadge: 'Disesuaikan Konteks',
      downloadReportBtn: 'Unduh Laporan Konsultasi (PDF)',
      downloadReportSub: 'Laporan lengkap 9 bagian (.PDF)',
      downloadActionPlanBtn: 'Unduh Rencana Tindakan (PDF)',
      downloadActionPlanSub: 'Jadwal eksekusi & KPI (.PDF)',
      downloadTailoredBtn: 'Unduh Dokumen Kerja Bisnis',
      sessionDocsLabel: 'Riwayat dokumen sesi ini:',
      continueChatNote:
        'Anda tetap dapat melanjutkan diskusi atau meminta penyesuaian strategi langsung di kolom chat di bawah.',
      referencesButtonPrefix: 'Referensi & Sumber Pendukung',
      internalKbHeader: 'Referensi Knowledge Base Internal Noevia',
      externalRefsHeader:
        'Referensi Eksternal Resmi (Pemerintah & Lembaga Terverifikasi)',
      publisherLabel: 'Penerbit:',
      openSourceLink: 'Buka Sumber Asli',
      videoResourcesHeader: 'Rekomendasi Video Pembelajaran Eksternal',
      watchVideoBtn: 'Tonton Video',
      followUpIntro:
        'Ingin mendiskusikan atau menyesuaikan rekomendasi di atas? Pilih atau ketik pertanyaan Anda di bawah:',
      followUpChip1: 'Sesuaikan tanpa biaya iklan',
      followUpChip2: 'Rincikan langkah Hari 1–3',
      followUpChip3: 'Cari alternatif solusi lain',
      loadingAnalysisText:
        'Noevia sedang menganalisis akar masalah dan menyiapkan dokumen solusi usaha Anda...',
      loadingReplyText: 'Noevia sedang menyiapkan tanggapan...',
      composerPlaceholder: 'Ceritakan masalah usaha Anda di sini...',
      composerContinuationPlaceholder:
        'Tanyakan langkah lanjutan atau minta penyesuaian strategi...',
      sendBtn: 'Kirim',
      composerHintLeft: 'Tekan Enter untuk mengirim · Shift + Enter baris baru',
      composerHintRight:
        'Noevia memahami konteks usaha secara berkelanjutan',
    },
    history: {
      title: 'Riwayat Konsultasi',
      subtitle:
        'Lanjutkan percakapan konsultasi Anda sebelumnya beserta analisis, daftar rencana tindakan, dan dokumen bisnis yang tersimpan.',
      searchPlaceholder: 'Cari topik masalah atau nama usaha...',
      allCategories: 'Semua Kategori',
      emptyTitle: 'Belum Ada Riwayat Konsultasi',
      emptySubtitle:
        'Mulai sesi konsultasi baru untuk mendiskusikan tantangan bisnis Anda atau buka contoh konsultasi SweetBite Bakery.',
      startNewBtn: 'Mulai Konsultasi Baru',
      sampleBtn: 'Contoh: SweetBite Bakery',
      statusReady: 'Solusi & Dokumen Siap',
      statusActive: 'Diskusi Aktif',
      docsDownloadedSuffix: 'dokumen diunduh',
      openChatBtn: 'Buka Percakapan',
      clearHistoryBtn: 'Bersihkan Riwayat Konsultasi',
      clearConfirmTitle: 'Hapus Seluruh Riwayat Konsultasi Lokal?',
      clearConfirmBody:
        'Tindakan ini akan menghapus daftar percakapan konsultasi Anda yang tersimpan di peramban ini secara permanen. Katalog dokumen Pusat Pengetahuan Bisnis (Knowledge Base) tidak akan terhapus.',
      clearConfirmAction: 'Ya, Hapus Riwayat Konsultasi',
    },
    learning: {
      badge: 'Pusat Pembelajaran UMKM',
      title: 'Pusat Pengetahuan Bisnis',
      subtitle:
        'Temukan panduan dan pengetahuan praktis untuk memahami serta mengembangkan usaha Anda.',
      searchPlaceholder:
        'Cari topik seperti HPP, harga jual, konten Instagram, repeat order, atau stok...',
      allTopics: 'Semua Topik',
      domainsHeading: '6 Domain Pengetahuan Bisnis UMKM',
      domainsSub: 'Pilih kategori untuk memfilter panduan',
      viewMaterial: 'Lihat Materi',
      featuredHeading: 'Panduan Pilihan',
      levelPrefix: 'Tingkat:',
      readGuide: 'Baca Panduan',
      allArticlesHeading: 'Semua Artikel & Modul Pembelajaran UMKM',
      categoryArticlesPrefix: 'Artikel Kategori:',
      articlesAvailableSuffix: 'artikel tersedia',
      caseStudyLabel: 'Studi kasus:',
      discussInChatBtn: 'Diskusikan di Chat',
      readMoreBtn: 'Baca Selengkapnya',
      backToCenterBtn: 'Kembali ke Pusat Pengetahuan Bisnis',
      sec1: '1. Pengantar Masalah',
      sec2: '2. Mengapa Hal Ini Penting bagi Usaha Anda',
      sec3: '3. Penjelasan Konsep Secara Praktis',
      sec4: '4. Contoh Penerapan Nyata pada UMKM',
      initialSituation: 'Kondisi Awal:',
      solutionApplied: 'Solusi yang Diterapkan:',
      measurableOutcome: 'Hasil Terukur:',
      sec5: '5. Langkah Penerapan Bertahap',
      sec6: '6. Kesalahan Umum yang Perlu Dihindari',
      sec7: '7. Daftar Periksa Tindakan',
      sec8: '8. Materi & Sumber Terkait',
      sec9: '9. Referensi Sumber Knowledge Base',
      pageLabel: 'Halaman',
      applyCtaTitle: 'Ingin menerapkan panduan ini pada usaha Anda?',
      applyCtaSub:
        'Diskusikan langsung dengan Noevia agar langkah-langkahnya disesuaikan dengan kondisi bisnis Anda.',
      applyCtaBtn: 'Konsultasikan Topik Ini',
    },
    tips: {
      badge: 'Tips, Panduan Praktis & Pertanyaan Umum',
      title: 'Tips, Panduan & Pertanyaan Umum (FAQ)',
      subtitle:
        'Panduan langkah demi langkah yang siap dipraktikkan oleh UMKM serta jawaban langsung atas berbagai masalah usaha yang paling sering dihadapi.',
      secATitle: 'A. Tips & Panduan Praktis UMKM',
      secASub:
        'Pilih salah satu panduan di bawah untuk membaca langkah penerapan, contoh nyata, dan hal yang perlu dihindari.',
      guidesCountSuffix: 'Panduan Utama',
      currentlyOpen: 'Sedang Dibuka',
      openGuide: 'Buka Panduan',
      readTimePrefix: 'Estimasi baca:',
      discussWithNoeviaBtn: 'Diskusikan Topik Ini dengan Noevia',
      mainExplanation: 'Penjelasan Utama',
      practicalSteps: 'Langkah Praktis yang Bisa Langsung Diterapkan',
      simpleExample: 'Contoh Sederhana pada UMKM',
      commonMistakes: 'Kesalahan Umum yang Sering Terjadi',
      relatedTopicsLabel: 'Topik terkait:',
      applyWithNoeviaLink: 'Terapkan panduan ini bersama Noevia',
      secBTitle: 'B. Pertanyaan Umum Seputar Tantangan Usaha (FAQ)',
      secBSub:
        'Temukan jawaban cepat untuk pertanyaan yang paling sering diajukan pemilik UMKM atau langsung mulai konsultasi dari pertanyaan yang mirip dengan kondisi Anda.',
      faqSearchPlaceholder:
        'Cari pertanyaan umum (misal: kenapa jarang yang beli, cara hitung harga jual, iklan berbayar)...',
      allTopics: 'Semua Topik',
      relatedGuidePrefix: 'Panduan Terkait:',
      consultIssueBtn: 'Konsultasikan Masalah Ini',
      sampleBannerBadge: 'Contoh Percakapan & Dokumen Solusi Lengkap',
      sampleBannerTitle: 'Pelajari Contoh Kasus Nyata: SweetBite Bakery',
      sampleBannerDesc:
        'Lihat bagaimana sebuah usaha bakery rumahan mendiskusikan penurunan pelanggan baru bersama Noevia, menelusuri penyebabnya, dan mendapatkan Laporan Konsultasi PDF, Rencana Tindakan 7 Hari, serta Kalender Konten 14 Hari siap unduh.',
      openSampleBtn: 'Buka Contoh Konsultasi SweetBite Bakery',
      startMyConsultationBtn: 'Mulai Konsultasi Usaha Saya',
    },
    settings: {
      title: 'Pengaturan',
      subtitle:
        'Sesuaikan tampilan tema dan bahasa antarmuka aplikasi Noevia.',
      themeTitle: 'Tampilan Tema',
      themeSubtitle:
        'Pilih tampilan warna yang paling nyaman untuk membaca dan berdiskusi.',
      lightMode: 'Light Mode',
      lightModeSub: 'Tampilan terang hangat',
      darkMode: 'Dark Mode',
      darkModeSub: 'Tampilan gelap nyaman di mata',
      systemDefault: 'System Default',
      systemDefaultSub: 'Mengikuti pengaturan perangkat',
      languageTitle: 'Bahasa Antarmuka',
      languageSubtitle:
        'Pilih bahasa untuk menu navigasi, tombol, dan halaman aplikasi. Bahasa percakapan AI tetap menyesuaikan bahasa yang Anda gunakan saat mengobrol.',
      langIdLabel: 'Bahasa Indonesia (Default)',
      langIdSub: 'Gunakan Bahasa Indonesia di seluruh antarmuka aplikasi',
      langEnLabel: 'English',
      langEnSub: 'Use English across all application menus and pages',
    },
  },
  en: {
    nav: {
      newConsultation: 'New Consultation',
      history: 'Consultation History',
      knowledgeCenter: 'Business Learning Center',
      tipsAndFaq: 'Tips, Guides & FAQ',
      settings: 'Settings',
      adminTools: 'Admin & Developer Tools',
      recentConversations: 'Recent Conversations',
      sampleConsultation: 'Sample Consultation',
      openWorkspace: 'Open Consultation Workspace',
      openSidebar: 'Expand Sidebar',
      collapseSidebar: 'Collapse Sidebar',
      openMobileMenu: 'Open Navigation Menu',
      switchToLight: 'Switch to Light Mode',
      switchToDark: 'Switch to Dark Mode',
    },
    home: {
      headline: 'We help you find practical solutions to your business challenges.',
      subheadline:
        'Tell us the business challenge you are facing right now. Let us understand the root cause and find the best next steps together.',
      inputPlaceholder: 'Tell us about your business challenge here...',
      primaryCta: 'Start Consultation',
      sendButton: 'Send',
    },
    workspace: {
      defaultTitle: 'Business Consultation',
      subtitle:
        'Discuss your business situation naturally—we will investigate the root causes and build an actionable plan together.',
      showAnalysisBtn: 'Generate Full Analysis & Solution',
      analyzingBtn: 'Preparing Solutions...',
      retryBtn: 'Try Again',
      consultantRole: 'AI Business Consultant',
      openingGreeting:
        'Hello! Tell me about your business and the challenge you are currently facing. We will explore the root causes and build a practical solution together.',
      starterPromptIntro:
        'You can type directly below, or choose one of these common business challenges:',
      starterPrompt1:
        '“My bakery sales have declined over the past 2 months and new customers are slowing down...”',
      starterPrompt2:
        '“Orders are busy but net profit is always thin — help me audit COGS and selling prices...”',
      starterPrompt3:
        '“Raw material stock is often inaccurate and daily production lacks a written SOP...”',
      contextReadyTitle: 'Your business context is clear enough for diagnosis.',
      contextReadySubtitle:
        'You can continue sharing details in the chat, or ask Noevia to generate a structured problem analysis, action plan, and downloadable business documents now.',
      analysisHeaderBadge: 'Noevia · Structured Business Analysis & Solution',
      analysisHeaderTitle: 'Consultation Analysis & Actionable Roadmap',
      editUnderstandingBtn: 'Refine Understanding',
      closeEditBtn: 'Close Editor',
      sec1Title: '1. What We Understand',
      editSummaryLabel: 'Business Situation Summary',
      editChallengeLabel: 'Main Business Challenge',
      editFactsLabel: 'Confirmed Facts (One item per line)',
      cancelBtn: 'Cancel',
      saveBtn: 'Save Changes',
      confirmedFactsTitle: 'Confirmed Facts',
      assumptionsTitle: 'Assumptions & Points to Verify',
      sec2Title: '2. Main Business Challenge',
      sec3Title: '3. Possible Root Causes',
      visualFrameworkBadge: 'Contextual Visual Framework',
      sec4Title: '4. Prioritized Solution Recommendations',
      priorityPrefix: 'Priority',
      helpfulBtn: 'Helpful',
      adjustBtn: 'Needs Adjustment',
      whyItFitsLabel: 'Why this fits your business:',
      executionStepsLabel: 'Implementation Steps:',
      resourcesLabel: 'Required Resources:',
      expectedOutcomeLabel: 'Expected Outcome:',
      sec5Title: '5. Practical Action Plan',
      sec5Subtitle:
        'Includes priority level, execution timeline, required resources, and success indicators.',
      completedSuffix: 'completed',
      successIndicatorLabel: 'Success Metric:',
      solutionReadyBadge: 'Business Solution & Document Generator',
      solutionReadyTitle: 'Your business solution package is ready.',
      solutionReadySubtitle:
        'We have prepared your consultation summary, structured action plan, and a tailored business worksheet ready to help you execute these solutions.',
      tailoredDocPrefix: 'Tailored Business Document:',
      tailoredBadge: 'Context-Matched',
      downloadReportBtn: 'Download Consultation Report (PDF)',
      downloadReportSub: 'Complete 9-section report (.PDF)',
      downloadActionPlanBtn: 'Download Action Plan (PDF)',
      downloadActionPlanSub: 'Execution schedule & KPIs (.PDF)',
      downloadTailoredBtn: 'Download Tailored Business Document',
      sessionDocsLabel: 'Documents generated in this session:',
      continueChatNote:
        'You can continue asking questions or requesting strategy adjustments directly in the chat below.',
      referencesButtonPrefix: 'References & Supporting Sources',
      internalKbHeader: 'Noevia Internal Knowledge Base References',
      externalRefsHeader:
        'Verified Official External References (Government & Institutions)',
      publisherLabel: 'Publisher:',
      openSourceLink: 'Open Original Source',
      videoResourcesHeader: 'Recommended External Learning Videos',
      watchVideoBtn: 'Watch Video',
      followUpIntro:
        'Want to discuss or refine the recommendations above? Pick a prompt or type your question below:',
      followUpChip1: 'Adjust for zero ad budget',
      followUpChip2: 'Break down Days 1–3 in detail',
      followUpChip3: 'Explore faster alternative solutions',
      loadingAnalysisText:
        'Noevia is analyzing the root causes and preparing your business solution package...',
      loadingReplyText: 'Noevia is preparing a response...',
      composerPlaceholder: 'Tell us about your business challenge here...',
      composerContinuationPlaceholder:
        'Ask a follow-up question or request a strategy adjustment...',
      sendBtn: 'Send',
      composerHintLeft: 'Press Enter to send · Shift + Enter for new line',
      composerHintRight:
        'Noevia maintains context throughout your consultation',
    },
    history: {
      title: 'Consultation History',
      subtitle:
        'Resume your previous consultations along with saved analysis, action plans, and generated business documents.',
      searchPlaceholder: 'Search by business challenge or business name...',
      allCategories: 'All Categories',
      emptyTitle: 'No Consultation History Yet',
      emptySubtitle:
        'Start a new consultation to discuss your business challenge or explore the SweetBite Bakery sample consultation.',
      startNewBtn: 'Start New Consultation',
      sampleBtn: 'Sample: SweetBite Bakery',
      statusReady: 'Solutions & Documents Ready',
      statusActive: 'Active Discussion',
      docsDownloadedSuffix: 'documents downloaded',
      openChatBtn: 'Open Conversation',
      clearHistoryBtn: 'Clear Consultation History',
      clearConfirmTitle: 'Clear Local Consultation History?',
      clearConfirmBody:
        'This action will permanently delete your saved consultation conversations in this browser. Your Business Learning Center (Knowledge Base) catalog will not be deleted.',
      clearConfirmAction: 'Yes, Clear Consultation History',
    },
    learning: {
      badge: 'Business Learning Center',
      title: 'Business Learning Center',
      subtitle:
        'Find practical guides and curated knowledge to understand and grow your business.',
      searchPlaceholder:
        'Search topics like COGS, pricing, Instagram content, repeat orders, or inventory...',
      allTopics: 'All Topics',
      domainsHeading: '6 Core MSME Business Knowledge Domains',
      domainsSub: 'Select a category to filter practical guides',
      viewMaterial: 'Explore Topic',
      featuredHeading: 'Featured Practical Guides',
      levelPrefix: 'Level:',
      readGuide: 'Read Guide',
      allArticlesHeading: 'All Business Learning Articles & Modules',
      categoryArticlesPrefix: 'Category:',
      articlesAvailableSuffix: 'articles available',
      caseStudyLabel: 'Case study:',
      discussInChatBtn: 'Discuss in Chat',
      readMoreBtn: 'Read Full Article',
      backToCenterBtn: 'Back to Business Learning Center',
      sec1: '1. Problem & Topic Introduction',
      sec2: '2. Why This Matters for Your Business',
      sec3: '3. Practical Concept Explanation',
      sec4: '4. Real-World MSME Case Example',
      initialSituation: 'Initial Situation:',
      solutionApplied: 'Solution Applied:',
      measurableOutcome: 'Measurable Outcome:',
      sec5: '5. Step-by-Step Application',
      sec6: '6. Common Mistakes to Avoid',
      sec7: '7. Practical Action Checklist',
      sec8: '8. Related Resources & Official Links',
      sec9: '9. Knowledge Base Source Citations',
      pageLabel: 'Page',
      applyCtaTitle: 'Want to apply this guide to your own business?',
      applyCtaSub:
        'Discuss directly with Noevia to tailor these steps to your specific business situation.',
      applyCtaBtn: 'Consult on This Topic',
    },
    tips: {
      badge: 'Practical Tips, Step-by-Step Guides & FAQ',
      title: 'Business Tips, Practical Guides & FAQ',
      subtitle:
        'Actionable step-by-step guides for small business owners and direct answers to the most common operational, financial, and marketing questions.',
      secATitle: 'A. Actionable MSME Business Guides',
      secASub:
        'Select any guide below to read step-by-step instructions, real examples, and common pitfalls to avoid.',
      guidesCountSuffix: 'Core Guides',
      currentlyOpen: 'Currently Open',
      openGuide: 'Open Guide',
      readTimePrefix: 'Reading time:',
      discussWithNoeviaBtn: 'Discuss This Topic with Noevia',
      mainExplanation: 'Core Explanation',
      practicalSteps: 'Practical Steps You Can Apply Today',
      simpleExample: 'Simple MSME Example',
      commonMistakes: 'Common Mistakes to Avoid',
      relatedTopicsLabel: 'Related topics:',
      applyWithNoeviaLink: 'Apply this guide with Noevia',
      secBTitle: 'B. Frequently Asked Business Questions (FAQ)',
      secBSub:
        'Find quick answers to common questions asked by business owners or start a tailored consultation directly from any question.',
      faqSearchPlaceholder:
        'Search common questions (e.g., why few people buy, how to price products, paid ads)...',
      allTopics: 'All Topics',
      relatedGuidePrefix: 'Related Guide:',
      consultIssueBtn: 'Consult on This Issue',
      sampleBannerBadge: 'Sample Consultation & Complete Solution Package',
      sampleBannerTitle: 'Explore a Real Case Study: SweetBite Bakery',
      sampleBannerDesc:
        'See how a home bakery owner discussed declining customer acquisition with Noevia, diagnosed the root causes, and generated a downloadable PDF Consultation Report, 7-Day Action Plan, and 14-Day Content Calendar.',
      openSampleBtn: 'Open SweetBite Bakery Sample Consultation',
      startMyConsultationBtn: 'Start My Business Consultation',
    },
    settings: {
      title: 'Settings',
      subtitle:
        'Customize the theme appearance and interface language of Noevia.',
      themeTitle: 'Theme Appearance',
      themeSubtitle:
        'Choose the color appearance that feels most comfortable for reading and consulting.',
      lightMode: 'Light Mode',
      lightModeSub: 'Warm daylight surface',
      darkMode: 'Dark Mode',
      darkModeSub: 'Low-glare dark slate surface',
      systemDefault: 'System Default',
      systemDefaultSub: 'Follows your device appearance setting',
      languageTitle: 'Interface Language',
      languageSubtitle:
        'Select the display language for menus, buttons, and pages. AI consultation replies automatically follow the language you write in during conversation.',
      langIdLabel: 'Bahasa Indonesia (Default)',
      langIdSub: 'Use Indonesian across all application menus and pages',
      langEnLabel: 'English',
      langEnSub: 'Use English across all application menus and pages',
    },
  },
};
