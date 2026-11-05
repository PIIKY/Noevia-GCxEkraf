import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Database,
  FileSpreadsheet,
  FileText,
  Plus,
  RotateCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AppLanguage,
  KnowledgeDocument,
  WorkTopicCategory,
} from '../types';
import {
  createKnowledgeDocumentFromUpload,
  formatKnowledgeCitation,
  retrieveRelevantKnowledge,
} from '../lib/knowledgeBase';
import { WORK_TOPIC_OPTIONS } from '../lib/consultationEngine';
import {
  MAX_UPLOAD_FILE_BYTES,
   sanitizeDisplayText,
  validateUploadedDocumentFile,
} from '../lib/securityHardening';

interface AdminToolsViewProps {
  documents: KnowledgeDocument[];
  consultationCount: number;
  onAddDocument: (doc: KnowledgeDocument) => void;
  onUpdateDocumentStatus: (
    docId: string,
    status: KnowledgeDocument['processingStatus']
  ) => void;
  onDeleteDocument: (docId: string) => void;
  onResetDefaultDocuments: () => void;
  onRestoreDemoConsultation: () => void;
  onClearConsultationHistoryOnly: () => void;
  onExitAdminMode: () => void;
  language: AppLanguage;
}

export const AdminToolsView: React.FC<AdminToolsViewProps> = ({
  documents,
  consultationCount,
  onAddDocument,
  onUpdateDocumentStatus,
  onDeleteDocument,
  onResetDefaultDocuments,
  onRestoreDemoConsultation,
  onClearConsultationHistoryOnly,
  onExitAdminMode,
  language,
}) => {
  const isEn = language === 'en';

  // Internal Document Management State
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [selectedDocCategoryFilter, setSelectedDocCategoryFilter] =
    useState<string>('ALL');
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSizeBytes, setUploadFileSizeBytes] = useState<number>(0);
  const [uploadFileMimeType, setUploadFileMimeType] = useState<string>('');
  const [uploadCategory, setUploadCategory] =
    useState<WorkTopicCategory>('Marketing');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadRawContent, setUploadRawContent] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Retrieval Testing Sandbox State
  const [testQuery, setTestQuery] = useState(
    'Penjualan bakery saya menurun dan pelanggan baru semakin sedikit di Instagram'
  );
  const [testTopic, setTestTopic] = useState<WorkTopicCategory>('Marketing');

  // Confirmation Dialog States for Separated Actions (Section 5)
  const [confirmClearHistoryOpen, setConfirmClearHistoryOpen] = useState(false);
  const [confirmResetKbOpen, setConfirmResetKbOpen] = useState(false);
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  const retrievedTestChunks = retrieveRelevantKnowledge(
    testQuery,
    testTopic,
    documents,
    3
  );

  const filteredDocs = documents.filter(
    (doc) =>
      selectedDocCategoryFilter === 'ALL' ||
      doc.category === selectedDocCategoryFilter
  );

  const showToast = (msg: string) => {
    setStatusBanner(msg);
    setTimeout(() => setStatusBanner(null), 4000);
  };

  const handleFileInputChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_FILE_BYTES) {
      setUploadError(
        isEn
          ? 'File size exceeds the 2 MB security limit.'
          : 'Ukuran berkas melebihi batas keamanan maksimum 2 MB.'
      );
      e.target.value = '';
      return;
    }

    let extractedText = '';
    try {
      extractedText = await file.text();
    } catch {
      extractedText = `Materi referensi dari berkas ${file.name} untuk panduan operasional dan analisis bisnis UMKM.`;
    }

    const validation = validateUploadedDocumentFile({
      fileName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type,
      rawContent:
        extractedText.slice(0, 4000) ||
        `Materi referensi dari berkas ${file.name} untuk panduan operasional dan analisis bisnis UMKM.`,
    });

    if (!validation.valid) {
      setUploadError(validation.error || 'Berkas tidak valid.');
      e.target.value = '';
      return;
    }

    setUploadFileName(validation.sanitizedFileName || file.name);
    setUploadFileSizeBytes(file.size);
    setUploadFileMimeType(file.type);
    setUploadError(null);
    setUploadRawContent(
      validation.sanitizedContent ||
        `Materi referensi dari berkas ${file.name} untuk panduan operasional dan analisis bisnis UMKM.`
    );
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = uploadFileName.trim();
    if (!trimmedName) {
      setUploadError(
        isEn
          ? 'Please enter a document name (e.g., Packaging_Guide.pdf or Pricing_Data.csv).'
          : 'Masukkan nama dokumen (misal: Panduan_Kemasan_F&B.pdf atau Data_Harga.csv).'
      );
      return;
    }

    const candidateName = trimmedName.match(/\.(pdf|csv|txt)$/i)
      ? trimmedName
      : `${trimmedName}.pdf`;
    const candidateContent =
      uploadRawContent.trim() ||
      `Panduan praktis UMKM pada kategori ${uploadCategory}. Pastikan target pelanggan didefinisikan secara spesifik dan evaluasi biaya dilakukan secara berkala.`;

    const validation = validateUploadedDocumentFile({
      fileName: candidateName,
      fileSizeBytes: uploadFileSizeBytes || candidateContent.length,
      mimeType: uploadFileMimeType || undefined,
      rawContent: candidateContent,
    });

    if (!validation.valid) {
      setUploadError(validation.error || 'Dokumen tidak lolos pemeriksaan keamanan.');
      return;
    }

    setUploadError(null);

    const newDoc = createKnowledgeDocumentFromUpload({
      fileName: validation.sanitizedFileName || candidateName,
      category: uploadCategory,
      description:
        sanitizeDisplayText(uploadDescription.trim()) ||
        `Referensi tambahan untuk kategori ${uploadCategory}.`,
      rawText: validation.sanitizedContent || candidateContent,
      existingCount: documents.length,
    });

    const uploadedStageDoc: KnowledgeDocument = {
      ...newDoc,
      processingStatus: 'Uploaded',
    };
    onAddDocument(uploadedStageDoc);

    setTimeout(() => {
      onUpdateDocumentStatus(newDoc.id, 'Processing');
    }, 250);

    setTimeout(() => {
      onUpdateDocumentStatus(newDoc.id, 'Ready');
    }, 700);

    setUploadFileName('');
    setUploadFileSizeBytes(0);
    setUploadFileMimeType('');
    setUploadDescription('');
    setUploadRawContent('');
    setShowUploadPanel(false);
    setExpandedDocId(newDoc.id);
    showToast(
      isEn
        ? `Document ${newDoc.id} uploaded and indexed.`
        : `Dokumen ${newDoc.id} berhasil diunggah dan diindeks.`
    );
  };

  return (
    <div className="max-w-[920px] mx-auto px-6 lg:px-8 py-8 lg:py-12 space-y-10 bg-app text-primary">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-subtle pb-6">
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 font-mono-meta text-[12px] px-3 py-1 rounded-full border border-subtle bg-surface-secondary text-primary">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin / Developer Tools (Internal Route)</span>
          </span>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-primary">
            {isEn
              ? 'Internal Knowledge Base & Data Administration'
              : 'Administrasi Knowledge Base & Pengelolaan Data Internal'}
          </h1>
          <p className="text-[15px] text-secondary leading-[1.6] max-w-2xl">
            {isEn
              ? 'Restricted developer and administrator workspace for testing retrieval relevance, inspecting indexed Knowledge Base documents, and managing separated data actions.'
              : 'Area khusus administrator dan pengembang untuk menguji relevansi pencarian Knowledge Base, mengelola indeks dokumen sumber, dan menjalankan tindakan data secara terpisah.'}
          </p>
        </div>

        <button
          type="button"
          onClick={onExitAdminMode}
          className="px-4 py-2.5 rounded-[11px] border border-subtle bg-surface hover:bg-surface-secondary text-[13px] font-medium text-primary cursor-pointer shrink-0"
        >
          {isEn ? 'Exit Admin Mode' : 'Keluar dari Mode Admin'}
        </button>
      </div>

      {statusBanner && (
        <div
          role="status"
          className="p-4 rounded-[14px] border border-[var(--text-primary)] bg-surface-secondary flex items-center gap-2.5 text-[14px] font-medium text-primary"
        >
          <Check className="w-4 h-4 shrink-0" />
          <span>{statusBanner}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 1. RETRIEVAL TESTING & SEARCH RELEVANCE VERIFICATION (Section 4)    */}
      {/* =================================================================== */}
      <section className="rounded-[16px] border border-subtle bg-surface p-6 sm:p-7 space-y-5">
        <div>
          <p className="font-mono-meta text-[12px] text-secondary">
            {isEn
              ? '1. Retrieval Testing & Relevance Threshold Sandbox'
              : '1. Pengujian Pencarian & Verifikasi Relevansi Knowledge Base'}
          </p>
          <h2 className="text-[20px] font-semibold text-primary mt-1">
            {isEn
              ? 'Test Query Retrieval Against Indexed Documents'
              : 'Uji Kueri terhadap Dokumen Knowledge Base Terindeks'}
          </h2>
          <p className="text-[14px] text-secondary mt-0.5">
            {isEn
              ? 'Verify which sections pass the strict relevance threshold before being cited by the AI consultant.'
              : 'Verifikasi bagian dokumen mana yang lolos ambang batas relevansi sebelum dikutip oleh AI.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label={
                isEn ? 'Test Knowledge Base query' : 'Uji kueri Knowledge Base'
              }
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-[11px] text-[15px] border border-subtle bg-surface-secondary text-primary"
            />
          </div>
          <div className="sm:col-span-4">
            <select
              aria-label={
                isEn ? 'Retrieval test category' : 'Kategori uji retrieval'
              }
              value={testTopic}
              onChange={(e) =>
                setTestTopic(e.target.value as WorkTopicCategory)
              }
              className="w-full px-3.5 py-2.5 rounded-[11px] text-[15px] border border-subtle bg-surface-secondary text-primary"
            >
              {WORK_TOPIC_OPTIONS.map((opt) => (
                <option key={opt.category} value={opt.category}>
                  {opt.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2.5">
          {retrievedTestChunks.length === 0 ? (
            <div className="p-4 rounded-[12px] border border-subtle bg-surface-secondary text-[14px] text-secondary">
              {isEn
                ? '0 sections matched. Query did not pass the relevance threshold (or is a simple greeting).'
                : '0 bagian ditemukan. Kueri tidak melewati ambang batas relevansi (atau merupakan sapaan singkat).'}
            </div>
          ) : (
            retrievedTestChunks.map((ref) => (
              <div
                key={ref.id}
                className="p-4 rounded-[12px] border border-subtle bg-surface-secondary space-y-1"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono-meta text-[12px]">
                  <span className="font-medium text-primary">
                    {formatKnowledgeCitation(ref)}
                  </span>
                  <span className="text-secondary">{ref.relevanceReason}</span>
                </div>
                <p className="text-[14px] text-secondary leading-relaxed">
                  {ref.relevantContent}
                </p>
              </div>
            ))
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 2. KNOWLEDGE BASE DOCUMENT CATALOG & INDEXING MANAGEMENT            */}
      {/* =================================================================== */}
      <section className="rounded-[16px] border border-subtle bg-surface p-6 sm:p-7 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-subtle pb-4">
          <div>
            <p className="font-mono-meta text-[12px] text-secondary">
              {isEn
                ? '2. Knowledge Base Document Source & Indexing Management'
                : '2. Manajemen Dokumen Sumber & Status Indeks Knowledge Base'}
            </p>
            <h2 className="text-[20px] font-semibold text-primary mt-1">
              {isEn
                ? `Indexed Knowledge Base Catalog (${documents.length} Documents)`
                : `Katalog Dokumen Terindeks (${documents.length} Dokumen)`}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setShowUploadPanel(!showUploadPanel)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] btn-primary text-[14px] font-medium cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>
              {showUploadPanel
                ? isEn
                  ? 'Close Upload Form'
                  : 'Tutup Form'
                : isEn
                  ? 'Upload Document (PDF/CSV)'
                  : 'Tambah Dokumen (PDF/CSV)'}
            </span>
          </button>
        </div>

        {showUploadPanel && (
          <form
            onSubmit={handleUploadSubmit}
            className="rounded-[14px] border border-subtle bg-surface-secondary p-5 space-y-4"
          >
            <h3 className="text-[17px] font-semibold text-primary">
              {isEn
                ? 'Upload & Index New Reference Document'
                : 'Unggah & Indeks Dokumen Referensi Baru'}
            </h3>

            {uploadError && (
              <div className="p-3 rounded-[11px] border border-[var(--text-primary)] bg-surface text-[14px] text-primary">
                {uploadError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="admin-kb-file"
                  className="block text-[13px] font-medium text-primary mb-1"
                >
                  {isEn ? 'File or Document Name' : 'Berkas atau Nama Dokumen'}
                </label>
                <input
                  id="admin-kb-file"
                  type="file"
                  accept=".pdf,.csv,.txt"
                  onChange={handleFileInputChange}
                  className="w-full text-[12px] text-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border file:border-subtle file:bg-surface file:text-[12px] file:font-medium file:text-primary mb-2"
                />
                <input
                  type="text"
                  aria-label="Document filename"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="Panduan_Pemasaran_Lokal.pdf"
                  className="w-full px-3.5 py-2 rounded-[10px] text-[14px] border border-subtle bg-surface text-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="admin-kb-category"
                  className="block text-[13px] font-medium text-primary mb-1"
                >
                  {isEn ? 'Domain Category' : 'Kategori Domain'}
                </label>
                <select
                  id="admin-kb-category"
                  value={uploadCategory}
                  onChange={(e) =>
                    setUploadCategory(e.target.value as WorkTopicCategory)
                  }
                  className="w-full px-3.5 py-2 rounded-[10px] text-[14px] border border-subtle bg-surface text-primary"
                >
                  {WORK_TOPIC_OPTIONS.map((opt) => (
                    <option key={opt.category} value={opt.category}>
                      {opt.category}
                    </option>
                  ))}
                </select>

                <label
                  htmlFor="admin-kb-desc"
                  className="block text-[13px] font-medium text-primary mt-2.5 mb-1"
                >
                  {isEn ? 'Short Description' : 'Deskripsi Singkat'}
                </label>
                <input
                  id="admin-kb-desc"
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder={
                    isEn
                      ? 'Brief summary of document contents...'
                      : 'Ringkasan singkat isi dokumen...'
                  }
                  className="w-full px-3.5 py-2 rounded-[10px] text-[14px] border border-subtle bg-surface text-primary"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="admin-kb-content"
                className="block text-[13px] font-medium text-primary mb-1"
              >
                {isEn ? 'Extracted Reference Text' : 'Isi Materi Referensi'}
              </label>
              <textarea
                id="admin-kb-content"
                rows={3}
                value={uploadRawContent}
                onChange={(e) => setUploadRawContent(e.target.value)}
                className="w-full p-3 rounded-[10px] text-[14px] border border-subtle bg-surface text-primary"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUploadPanel(false)}
                className="px-4 py-2 rounded-[10px] border border-subtle bg-surface text-[13px] text-secondary cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] btn-primary text-[13px] font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {isEn ? 'Save & Index Document' : 'Simpan & Indeks Dokumen'}
                </span>
              </button>
            </div>
          </form>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-[13px] text-secondary">
              {isEn ? 'Filter Category:' : 'Filter Kategori:'}
            </span>
            <select
              aria-label="Filter Knowledge Base category"
              value={selectedDocCategoryFilter}
              onChange={(e) => setSelectedDocCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-[10px] text-[13px] border border-subtle bg-surface-secondary text-primary"
            >
              <option value="ALL">
                {isEn
                  ? `All Documents (${documents.length})`
                  : `Semua Dokumen (${documents.length})`}
              </option>
              {WORK_TOPIC_OPTIONS.map((opt) => (
                <option key={opt.category} value={opt.category}>
                  {opt.category}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-[14px] border border-subtle divide-y divide-[var(--border-subtle)] overflow-hidden">
          {filteredDocs.map((doc) => {
            const isExpanded = expandedDocId === doc.id;
            return (
              <div key={doc.id} className="p-4 sm:p-5 bg-surface">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex flex-wrap items-center gap-2 font-mono-meta text-[11px] text-secondary">
                      <span className="px-2 py-0.5 rounded-full bg-surface-secondary border border-subtle font-medium text-primary">
                        {doc.id}
                      </span>
                      <span>{doc.category}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1">
                        {doc.fileType === 'CSV' ? (
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        ) : (
                          <FileText className="w-3.5 h-3.5" />
                        )}
                        {doc.fileType}
                      </span>
                      <span>·</span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-secondary border border-subtle text-primary">
                        Status: {doc.processingStatus}
                      </span>
                    </div>
                    <h3 className="text-[16px] font-semibold text-primary">
                      {doc.documentName}
                    </h3>
                    <p className="text-[13px] text-secondary">
                      {doc.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedDocId(isExpanded ? null : doc.id)
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-subtle bg-surface-secondary text-[12px] font-medium text-primary cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        {isExpanded
                          ? isEn
                            ? 'Hide Sections'
                            : 'Tutup Bagian'
                          : `${doc.sections.length} ${isEn ? 'Sections' : 'Bagian'}`}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteDocument(doc.id)}
                      aria-label={`Delete ${doc.documentName}`}
                      className="p-2 rounded-[10px] border border-subtle bg-surface text-secondary hover:text-primary cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-subtle space-y-2.5">
                    {doc.sections.map((sec) => (
                      <div
                        key={sec.sectionId}
                        className="p-3.5 rounded-[10px] border border-subtle bg-surface-secondary space-y-1"
                      >
                        <div className="flex justify-between font-mono-meta text-[11px] text-secondary">
                          <span className="font-medium text-primary">
                            {sec.sectionHeading}
                          </span>
                          <span>p. {sec.pageNumber}</span>
                        </div>
                        <p className="text-[13px] text-primary leading-relaxed">
                          {sec.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 3. SEPARATED DATA MANAGEMENT ACTIONS (Section 5: A, B, C)           */}
      {/* =================================================================== */}
      <section className="rounded-[16px] border border-subtle bg-surface p-6 sm:p-7 space-y-6">
        <div>
          <p className="font-mono-meta text-[12px] text-secondary">
            {isEn
              ? '3. Separated Storage & Data Controls (Local Browser Storage Scope)'
              : '3. Pengelolaan Data Terpisah (Cakupan Penyimpanan Lokal Peramban)'}
          </p>
          <h2 className="text-[20px] font-semibold text-primary mt-1">
            {isEn
              ? 'Granular Data Actions (Demo Data, Consultation History, & Knowledge Base)'
              : 'Tindakan Data Terpisah (Data Demo, Riwayat Konsultasi, & Knowledge Base)'}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* A. Restore Demo Data */}
          <div className="p-5 rounded-[14px] border border-subtle bg-surface-secondary flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-[16px]">
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>
                  {isEn
                    ? 'A. Restore Demo Data'
                    : 'A. Pulihkan Data Demo'}
                </span>
              </div>
              <p className="text-[13px] text-secondary leading-relaxed">
                {isEn
                  ? 'Restores the predefined SweetBite Bakery demonstration consultation without deleting user consultations or Knowledge Base documents.'
                  : 'Memulihkan sesi contoh konsultasi SweetBite Bakery untuk keperluan demonstrasi tanpa menghapus riwayat konsultasi pengguna maupun dokumen Knowledge Base.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onRestoreDemoConsultation();
                showToast(
                  isEn
                    ? 'SweetBite Bakery demo consultation restored.'
                    : 'Data contoh konsultasi SweetBite Bakery berhasil dipulihkan.'
                );
              }}
              className="w-full py-2.5 px-4 rounded-[11px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-[13px] font-medium text-primary cursor-pointer"
            >
              {isEn ? 'Restore Demo Consultation' : 'Pulihkan Contoh Konsultasi'}
            </button>
          </div>

          {/* B. Clear Consultation History Only */}
          <div className="p-5 rounded-[14px] border border-subtle bg-surface-secondary flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-[16px]">
                <Trash2 className="w-4 h-4 shrink-0" />
                <span>
                  {isEn
                    ? 'B. Clear Consultation History'
                    : 'B. Hapus Riwayat Konsultasi'}
                </span>
              </div>
              <p className="text-[13px] text-secondary leading-relaxed">
                {isEn
                  ? `Deletes only saved user consultations in localStorage (${consultationCount} records). Does NOT reset or delete Knowledge Base documents.`
                  : `Hanya menghapus daftar percakapan konsultasi pengguna di penyimpanan lokal (${consultationCount} sesi). TIDAK menghapus katalog Knowledge Base.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmClearHistoryOpen(true)}
              className="w-full py-2.5 px-4 rounded-[11px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-[13px] font-medium text-primary cursor-pointer"
            >
              {isEn
                ? 'Clear Consultation History...'
                : 'Hapus Riwayat Konsultasi...'}
            </button>
          </div>

          {/* C. Reset Knowledge Base Catalog Separately */}
          <div className="p-5 rounded-[14px] border border-subtle bg-surface-secondary flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-primary font-semibold text-[16px]">
                <Database className="w-4 h-4 shrink-0" />
                <span>
                  {isEn
                    ? 'C. Reset Knowledge Base Catalog'
                    : 'C. Kembalikan Katalog Knowledge Base'}
                </span>
              </div>
              <p className="text-[13px] text-secondary leading-relaxed">
                {isEn
                  ? 'Restores the Knowledge Base catalog (noevia_kb_documents_v2) to the 6 default modules (KB-01..KB-06) without touching user consultations.'
                  : 'Mengembalikan katalog dokumen Knowledge Base (noevia_kb_documents_v2) ke 6 modul standar (KB-01..KB-06) tanpa mengubah riwayat konsultasi.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmResetKbOpen(true)}
              className="w-full py-2.5 px-4 rounded-[11px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-[13px] font-medium text-primary cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1.5" />
              <span>
                {isEn
                  ? 'Reset Knowledge Base Only...'
                  : 'Reset Katalog Knowledge Base...'}
              </span>
            </button>
          </div>
        </div>

        {/* Confirmation Dialog for B: Clear Consultation History */}
        {confirmClearHistoryOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-clear-history-title"
            className="p-5 rounded-[16px] border border-[var(--text-primary)] bg-surface space-y-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3
                  id="admin-clear-history-title"
                  className="text-[16px] font-semibold text-primary"
                >
                  {isEn
                    ? 'Confirm Permanent Deletion of Consultation History'
                    : 'Konfirmasi Penghapusan Permanen Riwayat Konsultasi'}
                </h3>
                <p className="text-[14px] text-secondary leading-relaxed">
                  {isEn
                    ? 'This will permanently delete all user consultation threads stored under "noevia_consultations_v2" in this browser. Your Knowledge Base documents ("noevia_kb_documents_v2") will remain untouched.'
                    : 'Tindakan ini akan menghapus secara permanen seluruh percakapan konsultasi yang tersimpan pada kunci "noevia_consultations_v2" di peramban ini. Katalog dokumen Knowledge Base ("noevia_kb_documents_v2") tidak akan berubah.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmClearHistoryOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-subtle bg-surface-secondary text-[13px] font-medium text-primary cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClearConsultationHistoryOnly();
                  setConfirmClearHistoryOpen(false);
                  showToast(
                    isEn
                      ? 'User consultation history cleared. Knowledge Base preserved.'
                      : 'Riwayat konsultasi berhasil dihapus. Katalog Knowledge Base tetap aman.'
                  );
                }}
                className="px-4 py-2 rounded-[10px] btn-primary text-[13px] font-medium cursor-pointer"
              >
                {isEn
                  ? 'Yes, Clear Consultation History'
                  : 'Ya, Hapus Riwayat Konsultasi'}
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Dialog for C: Reset Knowledge Base Catalog */}
        {confirmResetKbOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-reset-kb-title"
            className="p-5 rounded-[16px] border border-[var(--text-primary)] bg-surface space-y-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3
                  id="admin-reset-kb-title"
                  className="text-[16px] font-semibold text-primary"
                >
                  {isEn
                    ? 'Confirm Knowledge Base Catalog Reset'
                    : 'Konfirmasi Pengaturan Ulang Katalog Knowledge Base'}
                </h3>
                <p className="text-[14px] text-secondary leading-relaxed">
                  {isEn
                    ? 'This will remove any custom uploaded documents in "noevia_kb_documents_v2" and restore the 6 standard Knowledge Base modules (KB-01 to KB-06). Your consultation history will not be affected.'
                    : 'Tindakan ini akan menghapus dokumen tambahan yang diunggah secara manual pada "noevia_kb_documents_v2" dan mengembalikan 6 modul standar (KB-01 hingga KB-06). Riwayat konsultasi pengguna tidak akan terpengaruh.'}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmResetKbOpen(false)}
                className="px-4 py-2 rounded-[10px] border border-subtle bg-surface-secondary text-[13px] font-medium text-primary cursor-pointer"
              >
                {isEn ? 'Cancel' : 'Batal'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetDefaultDocuments();
                  setConfirmResetKbOpen(false);
                  showToast(
                    isEn
                      ? 'Knowledge Base catalog restored to KB-01..KB-06.'
                      : 'Katalog Knowledge Base dikembalikan ke modul standar KB-01..KB-06.'
                  );
                }}
                className="px-4 py-2 rounded-[10px] btn-primary text-[13px] font-medium cursor-pointer"
              >
                {isEn
                  ? 'Yes, Reset Knowledge Base Catalog'
                  : 'Ya, Reset Katalog Knowledge Base'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
