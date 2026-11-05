import {
  Consultation,
  DeterministicBusinessAnalysis,
  ImplementationMonitoringData,
  WorkTopicCategory,
} from '../types';

function formatRupiah(amount: number): string {
  const rounded = Math.round(amount);
  return `Rp ${rounded.toLocaleString('id-ID')}`;
}

/**
 * Deterministic HPP (COGS), Gross Margin vs. Markup, Platform Fee Adjustment,
 * and Monthly Break-Even Point (BEP) Calculator.
 */
export function calculateHppAndPricingMetrics(inputs: {
  rawMaterialPerUnit?: number;
  packagingPerUnit?: number;
  directBatchCost?: number;
  unitsPerBatch?: number;
  currentSellingPrice?: number;
  platformFeePct?: number;
  monthlyFixedCost?: number;
  isIllustrative?: boolean;
}): DeterministicBusinessAnalysis {
  const rawMaterialPerUnit = Math.max(0, inputs.rawMaterialPerUnit ?? 7500);
  const packagingPerUnit = Math.max(0, inputs.packagingPerUnit ?? 1500);
  const directBatchCost = Math.max(0, inputs.directBatchCost ?? 50000);
  const unitsPerBatch = Math.max(1, inputs.unitsPerBatch ?? 25);
  const currentSellingPrice = Math.max(1, inputs.currentSellingPrice ?? 18000);
  const platformFeePct = Math.min(
    90,
    Math.max(0, inputs.platformFeePct ?? 15)
  );
  const monthlyFixedCost = Math.max(0, inputs.monthlyFixedCost ?? 2400000);

  const directCostPerUnit = directBatchCost / unitsPerBatch;
  const hppPerUnit = rawMaterialPerUnit + packagingPerUnit + directCostPerUnit;

  // Direct sales gross profit & gross margin vs markup
  const grossProfitDirect = currentSellingPrice - hppPerUnit;
  const grossMarginDirectPct =
    (grossProfitDirect / currentSellingPrice) * 100;
  const markupDirectPct =
    hppPerUnit > 0 ? (grossProfitDirect / hppPerUnit) * 100 : 0;

  // Net revenue & margin after marketplace/delivery platform commission
  const platformFeeAmount = currentSellingPrice * (platformFeePct / 100);
  const netPriceAfterPlatform = currentSellingPrice - platformFeeAmount;
  const netProfitAfterPlatform = netPriceAfterPlatform - hppPerUnit;
  const netMarginAfterPlatformPct =
    netPriceAfterPlatform > 0
      ? (netProfitAfterPlatform / currentSellingPrice) * 100
      : 0;

  // Recommended selling price on platform to preserve direct gross profit
  const recommendedPlatformPrice =
    1 - platformFeePct / 100 > 0
      ? currentSellingPrice / (1 - platformFeePct / 100)
      : currentSellingPrice;

  // Monthly Break-Even Point (Units)
  const breakEvenUnits =
    grossProfitDirect > 0
      ? Math.ceil(monthlyFixedCost / grossProfitDirect)
      : 0;

  return {
    kind: 'hpp-pricing',
    titleId: 'Kalkulator Deterministik HPP, Margin vs Markup & Komisi Platform',
    titleEn:
      'Deterministic COGS (HPP), Gross Margin vs. Markup & Platform Fee Calculator',
    isIllustrative: inputs.isIllustrative ?? true,
    inputs: {
      rawMaterialPerUnit,
      packagingPerUnit,
      directBatchCost,
      unitsPerBatch,
      currentSellingPrice,
      platformFeePct,
      monthlyFixedCost,
    },
    computedMetrics: [
      {
        key: 'hppPerUnit',
        labelId: 'HPP (Harga Pokok Produksi) per Unit',
        labelEn: 'COGS (HPP) per Unit',
        valueFormatted: formatRupiah(hppPerUnit),
        rawValue: Math.round(hppPerUnit),
        formula:
          'HPP = Biaya Bahan Baku + Biaya Kemasan + (Biaya Produksi Batch / Unit per Batch)',
        explanationId: `Total biaya langsung untuk memproduksi 1 unit siap jual (${formatRupiah(rawMaterialPerUnit)} + ${formatRupiah(packagingPerUnit)} + ${formatRupiah(directCostPerUnit)}).`,
        explanationEn: `Total direct cost to produce 1 ready-to-sell unit (${formatRupiah(rawMaterialPerUnit)} + ${formatRupiah(packagingPerUnit)} + ${formatRupiah(directCostPerUnit)}).`,
      },
      {
        key: 'grossMarginDirectPct',
        labelId: 'Gross Margin Penjualan Langsung (%)',
        labelEn: 'Direct Sales Gross Margin (%)',
        valueFormatted: `${grossMarginDirectPct.toFixed(1)}% (${formatRupiah(grossProfitDirect)}/unit)`,
        rawValue: Number(grossMarginDirectPct.toFixed(1)),
        formula: 'Gross Margin (%) = ((Harga Jual - HPP) / Harga Jual) × 100%',
        explanationId:
          'Persentase laba kotor terhadap harga jual sebelum biaya tetap bulanan.',
        explanationEn:
          'Gross profit percentage relative to selling price before monthly fixed overhead.',
      },
      {
        key: 'markupDirectPct',
        labelId: 'Markup terhadap HPP (%)',
        labelEn: 'Markup over COGS (%)',
        valueFormatted: `${markupDirectPct.toFixed(1)}%`,
        rawValue: Number(markupDirectPct.toFixed(1)),
        formula: 'Markup (%) = ((Harga Jual - HPP) / HPP) × 100%',
        explanationId:
          'Penting: Markup berbeda dengan Gross Margin. Markup dihitung dari HPP, sedangkan Margin dihitung dari Harga Jual.',
        explanationEn:
          'Important: Markup is distinct from Gross Margin. Markup divides by COGS, whereas Margin divides by Selling Price.',
      },
      {
        key: 'netMarginAfterPlatformPct',
        labelId: `Margin Bersih di Aplikasi/Platform (Komisi ${platformFeePct}%)`,
        labelEn: `Net Margin on Platform (${platformFeePct}% Commission)`,
        valueFormatted: `${netMarginAfterPlatformPct.toFixed(1)}% (${formatRupiah(netProfitAfterPlatform)}/unit)`,
        rawValue: Number(netMarginAfterPlatformPct.toFixed(1)),
        formula:
          'Laba Platform = (Harga Jual × (1 - Komisi%)) - HPP; Harga Ideal Platform = Harga Target / (1 - Komisi%)',
        explanationId: `Jika harga jual disamakan tanpa penyesuaian komisi ${platformFeePct}%, laba per unit turun menjadi ${formatRupiah(netProfitAfterPlatform)}. Harga jual di aplikasi sebaiknya sekitar ${formatRupiah(recommendedPlatformPrice)} agar laba per unit tetap terjaga.`,
        explanationEn: `If selling price is unchanged under a ${platformFeePct}% fee, profit per unit drops to ${formatRupiah(netProfitAfterPlatform)}. Recommended platform price is ~${formatRupiah(recommendedPlatformPrice)} to preserve unit profit.`,
      },
      {
        key: 'breakEvenUnits',
        labelId: 'Titik Impas (BEP) Bulanan',
        labelEn: 'Monthly Break-Even Point (Units)',
        valueFormatted:
          grossProfitDirect > 0
            ? `${breakEvenUnits.toLocaleString('id-ID')} unit / bulan`
            : 'Margin negatif (Harga Jual ≤ HPP)',
        rawValue: breakEvenUnits,
        formula: 'BEP (Unit) = ⌈Biaya Tetap Bulanan / (Harga Jual - HPP)⌉',
        explanationId: `Jumlah minimum produk yang harus terjual per bulan untuk menutup biaya tetap ${formatRupiah(monthlyFixedCost)}.`,
        explanationEn: `Minimum units required per month to cover ${formatRupiah(monthlyFixedCost)} in fixed overhead.`,
      },
    ],
    assumptionsId: [
      'Perhitungan memisahkan dengan tegas antara Gross Margin ((Harga Jual - HPP) / Harga Jual) dan Markup ((Harga Jual - HPP) / HPP).',
      'Biaya tetap bulanan (sewa, gaji tetap, kuota/internet, listrik dasar) dihitung pada analisis Titik Impas (BEP), bukan dicampur ke HPP variabel per unit.',
      inputs.isIllustrative !== false
        ? 'Angka awal menggunakan simulasi ilustratif UMKM — Anda dapat mengubah nilai input di bawah sesuai angka riil usaha Anda.'
        : 'Angka dihitung langsung dari data numerik yang Anda masukkan.',
    ],
    assumptionsEn: [
      'Strictly distinguishes Gross Margin ((Price - COGS) / Price) from Markup ((Price - COGS) / COGS).',
      'Monthly fixed costs (rent, base wages, utilities) are evaluated in Break-Even Point (BEP) rather than mixed into unit COGS.',
      inputs.isIllustrative !== false
        ? 'Initial values use illustrative UMKM benchmarks — you can edit any input value below to match your actual business numbers.'
        : 'Calculated directly from the numerical inputs you provided.',
    ],
  };
}

/**
 * Deterministic Sales Funnel, Conversion Rate, Repeat Order Rate, & Revenue Estimator.
 */
export function calculateSalesFunnelMetrics(inputs: {
  weeklyReach?: number;
  weeklyInquiries?: number;
  weeklyTransactions?: number;
  averageOrderValue?: number;
  repeatCustomersMonthly?: number;
  totalUniqueCustomersMonthly?: number;
  isIllustrative?: boolean;
}): DeterministicBusinessAnalysis {
  const weeklyReach = Math.max(1, inputs.weeklyReach ?? 1200);
  const weeklyInquiries = Math.max(0, inputs.weeklyInquiries ?? 20);
  const weeklyTransactions = Math.max(0, inputs.weeklyTransactions ?? 6);
  const averageOrderValue = Math.max(0, inputs.averageOrderValue ?? 65000);
  const repeatCustomersMonthly = Math.max(
    0,
    inputs.repeatCustomersMonthly ?? 9
  );
  const totalUniqueCustomersMonthly = Math.max(
    1,
    inputs.totalUniqueCustomersMonthly ?? 30
  );

  const inquiryRatePct = (weeklyInquiries / weeklyReach) * 100;
  const chatToSaleConversionPct =
    weeklyInquiries > 0 ? (weeklyTransactions / weeklyInquiries) * 100 : 0;
  const repeatPurchaseRatePct =
    (repeatCustomersMonthly / totalUniqueCustomersMonthly) * 100;
  const estimatedMonthlyRevenue = weeklyTransactions * 4 * averageOrderValue;

  return {
    kind: 'sales-funnel',
    titleId:
      'Analisis Deterministik Corong Penjualan (Funnel), Konversi & Repeat Order',
    titleEn:
      'Deterministic Sales Funnel, Conversion Rate & Repeat Purchase Analysis',
    isIllustrative: inputs.isIllustrative ?? true,
    inputs: {
      weeklyReach,
      weeklyInquiries,
      weeklyTransactions,
      averageOrderValue,
      repeatCustomersMonthly,
      totalUniqueCustomersMonthly,
    },
    computedMetrics: [
      {
        key: 'inquiryRatePct',
        labelId: 'Rasio Minat ke Chat Masuk (Inquiry Rate)',
        labelEn: 'Reach-to-Inquiry Rate',
        valueFormatted: `${inquiryRatePct.toFixed(2)}% (${weeklyInquiries} chat / ${weeklyReach} jangkauan)`,
        rawValue: Number(inquiryRatePct.toFixed(2)),
        formula: 'Inquiry Rate (%) = (Chat Masuk Mingguan / Jangkauan Konten Mingguan) × 100%',
        explanationId:
          'Mengukur seberapa efektif konten atau profil lokal mendorong calon pembeli menghubungi bisnis Anda.',
        explanationEn:
          'Measures how effectively content or local discovery drives prospects to contact your business.',
      },
      {
        key: 'chatToSaleConversionPct',
        labelId: 'Konversi Chat ke Transaksi (Closing Rate)',
        labelEn: 'Inquiry-to-Transaction Conversion Rate',
        valueFormatted: `${chatToSaleConversionPct.toFixed(1)}% (${weeklyTransactions} transaksi dari ${weeklyInquiries} chat)`,
        rawValue: Number(chatToSaleConversionPct.toFixed(1)),
        formula: 'Closing Rate (%) = (Transaksi Mingguan / Chat Masuk Mingguan) × 100%',
        explanationId:
          'Mengukur efektivitas katalog, kecepatan balasan, dan penawaran paket saat calon pembeli bertanya.',
        explanationEn:
          'Measures how effectively your catalog, response speed, and offer structure convert inquiries into orders.',
      },
      {
        key: 'repeatPurchaseRatePct',
        labelId: 'Rasio Pembelian Berulang (Repeat Order Rate)',
        labelEn: 'Repeat Purchase Rate',
        valueFormatted: `${repeatPurchaseRatePct.toFixed(1)}% (${repeatCustomersMonthly} dari ${totalUniqueCustomersMonthly} pelanggan)`,
        rawValue: Number(repeatPurchaseRatePct.toFixed(1)),
        formula: 'Repeat Order Rate (%) = (Pelanggan Berulang Bulanan / Total Pelanggan Unik Bulanan) × 100%',
        explanationId:
          'Menunjukkan proporsi pelanggan yang kembali membeli ulang tanpa biaya akuisisi baru.',
        explanationEn:
          'Shows the proportion of customers who reorder without requiring new acquisition spend.',
      },
      {
        key: 'estimatedMonthlyRevenue',
        labelId: 'Estimasi Omzet Kotor Bulanan (4 Minggu)',
        labelEn: 'Estimated Monthly Gross Revenue (4 Weeks)',
        valueFormatted: formatRupiah(estimatedMonthlyRevenue),
        rawValue: Math.round(estimatedMonthlyRevenue),
        formula: 'Omzet Bulanan = Transaksi Mingguan × 4 × Nilai Rata-Rata Pesanan (AOV)',
        explanationId: `Estimasi pendapatan kotor bulanan pada rata-rata nilai belanja ${formatRupiah(averageOrderValue)}.`,
        explanationEn: `Estimated monthly gross revenue at an average order value of ${formatRupiah(averageOrderValue)}.`,
      },
    ],
    assumptionsId: [
      'Estimasi bulanan menggunakan asumsi 4 minggu operasional aktif.',
      'Konversi chat dipengaruhi oleh waktu respons, kejelasan harga/katalog, dan kesesuaian ongkos kirim.',
      inputs.isIllustrative !== false
        ? 'Data awal bersifat ilustratif — silakan sesuaikan angka jangkauan, chat masuk, dan transaksi di bawah dengan catatan riil usaha Anda.'
        : 'Dihitung dari angka aktual yang Anda berikan.',
    ],
    assumptionsEn: [
      'Monthly revenue estimate assumes 4 active operating weeks.',
      'Inquiry-to-sale conversion depends on response speed, catalog clarity, and delivery fee fit.',
      inputs.isIllustrative !== false
        ? 'Initial figures are illustrative — update reach, inquiries, and transactions below with your actual business records.'
        : 'Calculated directly from your provided figures.',
    ],
  };
}

/**
 * Deterministic Inventory Reorder Point (ROP), Safety Stock, & Spoilage Cost Calculator.
 */
export function calculateInventoryAndOperationalMetrics(inputs: {
  avgDailyUsage?: number;
  maxDailyUsage?: number;
  avgLeadTimeDays?: number;
  maxLeadTimeDays?: number;
  monthlySpoilageCost?: number;
  monthlyMaterialPurchase?: number;
  isIllustrative?: boolean;
}): DeterministicBusinessAnalysis {
  const avgDailyUsage = Math.max(0.5, inputs.avgDailyUsage ?? 10);
  const maxDailyUsage = Math.max(avgDailyUsage, inputs.maxDailyUsage ?? 15);
  const avgLeadTimeDays = Math.max(0.5, inputs.avgLeadTimeDays ?? 2);
  const maxLeadTimeDays = Math.max(
    avgLeadTimeDays,
    inputs.maxLeadTimeDays ?? 3
  );
  const monthlySpoilageCost = Math.max(0, inputs.monthlySpoilageCost ?? 350000);
  const monthlyMaterialPurchase = Math.max(
    1,
    inputs.monthlyMaterialPurchase ?? 5000000
  );

  const safetyStock =
    maxDailyUsage * maxLeadTimeDays - avgDailyUsage * avgLeadTimeDays;
  const reorderPoint = avgDailyUsage * avgLeadTimeDays + safetyStock;
  const wasteRatePct = (monthlySpoilageCost / monthlyMaterialPurchase) * 100;

  return {
    kind: 'inventory-cashflow',
    titleId:
      'Kalkulator Deterministik Stok Pengaman (Safety Stock), Titik Pesan Ulang (ROP) & Waste Rate',
    titleEn:
      'Deterministic Safety Stock, Reorder Point (ROP) & Spoilage Rate Calculator',
    isIllustrative: inputs.isIllustrative ?? true,
    inputs: {
      avgDailyUsage,
      maxDailyUsage,
      avgLeadTimeDays,
      maxLeadTimeDays,
      monthlySpoilageCost,
      monthlyMaterialPurchase,
    },
    computedMetrics: [
      {
        key: 'safetyStock',
        labelId: 'Stok Pengaman Minimum (Safety Stock)',
        labelEn: 'Minimum Safety Stock',
        valueFormatted: `${Math.ceil(safetyStock)} unit bahan`,
        rawValue: Math.ceil(safetyStock),
        formula:
          'Safety Stock = (Pemakaian Maks Harian × Lead Time Maks) - (Pemakaian Rata-rata × Lead Time Rata-rata)',
        explanationId:
          'Cadangan stok untuk mencegah kehabisan bahan saat pesanan melonjak atau pemasok terlambat.',
        explanationEn:
          'Buffer stock to prevent stockouts during demand spikes or supplier delays.',
      },
      {
        key: 'reorderPoint',
        labelId: 'Titik Pesan Ulang (Reorder Point / ROP)',
        labelEn: 'Reorder Point (ROP)',
        valueFormatted: `${Math.ceil(reorderPoint)} unit bahan`,
        rawValue: Math.ceil(reorderPoint),
        formula:
          'ROP = (Pemakaian Rata-rata Harian × Lead Time Rata-rata) + Safety Stock',
        explanationId: `Segera lakukan pemesanan ulang ke pemasok saat sisa stok menyentuh ${Math.ceil(reorderPoint)} unit.`,
        explanationEn: `Trigger a supplier reorder immediately when remaining stock reaches ${Math.ceil(reorderPoint)} units.`,
      },
      {
        key: 'wasteRatePct',
        labelId: 'Rasio Bahan Terbuang / Rusak (Waste Rate)',
        labelEn: 'Material Spoilage / Waste Rate',
        valueFormatted: `${wasteRatePct.toFixed(1)}% (${formatRupiah(monthlySpoilageCost)}/bulan)`,
        rawValue: Number(wasteRatePct.toFixed(1)),
        formula: 'Waste Rate (%) = (Nilai Bahan Rusak Bulanan / Total Belanja Bahan Bulanan) × 100%',
        explanationId:
          'Disiplin FEFO (First-Expired, First-Out) dan takaran baku bertujuan menekan waste rate di bawah 3%.',
        explanationEn:
          'FEFO (First-Expired, First-Out) discipline and standardized portioning aim to keep waste below 3%.',
      },
    ],
    assumptionsId: [
      'Perhitungan ROP mengasumsikan bahan baku kunci dipantau secara harian saat tutup operasional.',
      inputs.isIllustrative !== false
        ? 'Angka awal menggunakan simulasi ilustratif — ubah sesuai pemakaian harian dan waktu tunggu pemasok usaha Anda.'
        : 'Dihitung berdasarkan data operasional yang Anda masukkan.',
    ],
    assumptionsEn: [
      'ROP calculation assumes key raw materials are checked daily at closing.',
      inputs.isIllustrative !== false
        ? 'Initial values are illustrative — adjust to match your daily usage and supplier lead time.'
        : 'Calculated directly from your operational data.',
    ],
  };
}

/**
 * Selects and computes the appropriate deterministic business analysis for a consultation,
 * extracting any numbers the user has mentioned in the conversation or preserving custom inputs.
 */
export function buildDeterministicAnalysisForConsultation(
  consultation: Consultation,
  overrideInputs?: Record<string, number>,
  markAsUserVerified = false
): DeterministicBusinessAnalysis {
  const domain: WorkTopicCategory = consultation.workTopic;
  const transcript = [
    consultation.initialProblem,
    ...consultation.messages.map((m) => m.content),
  ].join(' ');

  // Check if user already has saved deterministicAnalysis inputs
  const existing = consultation.result?.deterministicAnalysis;
  const mergedInputs = {
    ...(existing?.inputs || {}),
    ...(overrideInputs || {}),
  };

  // Detect if user provided numbers in conversation
  const hasUserNumbers =
    markAsUserVerified ||
    existing?.isIllustrative === false ||
    /\b(rp\s*\d+|\d+\s*(ribu|rb|juta|jt|%|persen|transaksi|order|chat|pcs|box|unit))\b/i.test(
      transcript
    );

  if (domain === 'Finance & Pricing') {
    return calculateHppAndPricingMetrics({
      ...mergedInputs,
      isIllustrative: !hasUserNumbers,
    });
  }

  if (domain === 'Operations') {
    return calculateInventoryAndOperationalMetrics({
      ...mergedInputs,
      isIllustrative: !hasUserNumbers,
    });
  }

  return calculateSalesFunnelMetrics({
    ...mergedInputs,
    isIllustrative: !hasUserNumbers,
  });
}

/**
 * Deterministic evaluation comparing initial baseline metrics against updated implementation metrics.
 * Explicitly avoids claiming sole causation without evidence (Section 10).
 */
export function evaluateImplementationProgress(
  monitoring: ImplementationMonitoringData,
  language: 'id' | 'en' = 'id'
): {
  inquiryDelta: number;
  inquiryDeltaPct: number;
  transactionDelta: number;
  transactionDeltaPct: number;
  baselineConversionPct: number;
  currentConversionPct: number;
  summaryText: string;
} {
  const baseInq = Math.max(0, monitoring.baselineInquiriesWeekly);
  const currInq = Math.max(0, monitoring.currentInquiriesWeekly);
  const baseTx = Math.max(0, monitoring.baselineTransactionsWeekly);
  const currTx = Math.max(0, monitoring.currentTransactionsWeekly);

  const inquiryDelta = currInq - baseInq;
  const inquiryDeltaPct =
    baseInq > 0 ? ((currInq - baseInq) / baseInq) * 100 : 0;

  const transactionDelta = currTx - baseTx;
  const transactionDeltaPct =
    baseTx > 0 ? ((currTx - baseTx) / baseTx) * 100 : 0;

  const baselineConversionPct = baseInq > 0 ? (baseTx / baseInq) * 100 : 0;
  const currentConversionPct = currInq > 0 ? (currTx / currInq) * 100 : 0;

  const signInq = inquiryDelta >= 0 ? `+${inquiryDelta}` : `${inquiryDelta}`;
  const signTx =
    transactionDelta >= 0 ? `+${transactionDelta}` : `${transactionDelta}`;

  const summaryText =
    language === 'en'
      ? `Weekly inquiries changed from ${baseInq} to ${currInq} (${signInq}, ${inquiryDeltaPct >= 0 ? '+' : ''}${inquiryDeltaPct.toFixed(1)}%), and weekly transactions changed from ${baseTx} to ${currTx} (${signTx}, ${transactionDeltaPct >= 0 ? '+' : ''}${transactionDeltaPct.toFixed(1)}%). Inquiry-to-transaction conversion shifted from ${baselineConversionPct.toFixed(1)}% to ${currentConversionPct.toFixed(1)}%. Note: This comparison reflects reported operational changes; external factors (seasonality, local events, or timing) may also contribute alongside the actions implemented.`
      : `Chat/pertanyaan mingguan bergerak dari ${baseInq} menjadi ${currInq} (${signInq} atau ${inquiryDeltaPct >= 0 ? '+' : ''}${inquiryDeltaPct.toFixed(1)}%), dan transaksi mingguan bergerak dari ${baseTx} menjadi ${currTx} (${signTx} atau ${transactionDeltaPct >= 0 ? '+' : ''}${transactionDeltaPct.toFixed(1)}%). Rasio konversi chat ke transaksi berubah dari ${baselineConversionPct.toFixed(1)}% menjadi ${currentConversionPct.toFixed(1)}%. Catatan: Perbandingan ini mencerminkan perubahan data yang dilaporkan; faktor eksternal (musiman, momen lokal, atau waktu) juga dapat berkontribusi selain langkah aksi yang dijalankan.`;

  return {
    inquiryDelta,
    inquiryDeltaPct: Number(inquiryDeltaPct.toFixed(1)),
    transactionDelta,
    transactionDeltaPct: Number(transactionDeltaPct.toFixed(1)),
    baselineConversionPct: Number(baselineConversionPct.toFixed(1)),
    currentConversionPct: Number(currentConversionPct.toFixed(1)),
    summaryText,
  };
}
