import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Edit3,
  Loader2,
  Plus,
  RefreshCw,
  Save,
  Send,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import {
  ActionPlanItem,
  Consultation,
  KnowledgeDocument,
  Message,
} from '../types';
import { formatKnowledgeCitation } from '../lib/knowledgeBase';
import { sendContinuationMessage } from '../services/aiService';

interface ConsultationResultViewProps {
  consultation: Consultation;
  documents: KnowledgeDocument[];
  onUpdateConsultation: (updated: Consultation) => void;
  onBackToUnderstanding: () => void;
  onStartNewConsultation: () => void;
}

export const ConsultationResultView: React.FC<ConsultationResultViewProps> = ({
  consultation,
  documents,
  onUpdateConsultation,
  onBackToUnderstanding,
  onStartNewConsultation,
}) => {
  const [showKnowledgeSources, setShowKnowledgeSources] = useState(false);
  const [expandedRefId, setExpandedRefId] = useState<string | null>(null);
  const [expandedContMsgKb, setExpandedContMsgKb] = useState<Record<string, boolean>>({});

  // Editable Business Understanding state (Section 8: Keep Consultation Results Editable)
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [draftSummary, setDraftSummary] = useState(
    consultation.result?.problemSummary || ''
  );
  const [draftMainProblem, setDraftMainProblem] = useState(
    consultation.result?.mainProblem || ''
  );
  const [draftConfirmedFactsText, setDraftConfirmedFactsText] = useState(
    (consultation.businessContext.confirmedFacts || []).join('\n')
  );

  // Editable Action Plan state
  const [editingActionPlan, setEditingActionPlan] = useState(false);
  const [draftActionPlan, setDraftActionPlan] = useState<ActionPlanItem[]>(
    consultation.result?.actionPlan || []
  );

  // Continuous Consultation state
  const [continuationInput, setContinuationInput] = useState('');
  const [isSendingContinuation, setIsSendingContinuation] = useState(false);
  const [continuationError, setContinuationError] = useState<string | null>(null);
  const [lastFailedQuestion, setLastFailedQuestion] = useState<string | null>(null);
  const [strategyUpdatedNotice, setStrategyUpdatedNotice] = useState<string | null>(null);

  const result = consultation.result;

  if (!result) {
    return (
      <div className="max-w-[1020px] mx-auto px-6 py-16 text-center">
        <p className="text-[16px] text-[#555555]">
          Ringkasan rekomendasi belum tersedia untuk konsultasi ini.
        </p>
        <button
          type="button"
          onClick={onBackToUnderstanding}
          className="mt-4 px-5 py-3 bg-[#111111] text-[#FFFFFF] text-[14px] font-medium cursor-pointer"
        >
          Kembali ke Ruang Diskusi Konsultasi
        </button>
      </div>
    );
  }

  const continuationMessages = consultation.messages.filter(
    (m) => m.phase === 'continuation'
  );

  const prioritizedRecommendations = result.recommendations.slice(0, 3);

  const handleSaveEditedSummary = () => {
    const cleanedFacts = draftConfirmedFactsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    onUpdateConsultation({
      ...consultation,
      businessContext: {
        ...consultation.businessContext,
        confirmedFacts:
          cleanedFacts.length > 0
            ? cleanedFacts
            : consultation.businessContext.confirmedFacts,
      },
      result: {
        ...result,
        problemSummary: draftSummary.trim() || result.problemSummary,
        mainProblem: draftMainProblem.trim() || result.mainProblem,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
    setIsEditingSummary(false);
  };

  // Toggle Day completion in 7-Day Action Plan
  const handleToggleDayTask = (dayNumber: number) => {
    if (editingActionPlan) return;
    const updatedPlan = result.actionPlan.map((item) =>
      item.day === dayNumber ? { ...item, completed: !item.completed } : item
    );
    onUpdateConsultation({
      ...consultation,
      result: {
        ...result,
        actionPlan: updatedPlan,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  const handleSaveEditedActionPlan = () => {
    onUpdateConsultation({
      ...consultation,
      result: {
        ...result,
        actionPlan: draftActionPlan,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
    setEditingActionPlan(false);
  };

  // Toggle Recommendation feedback
  const handleRecommendationFeedback = (
    recId: string,
    feedback: 'helpful' | 'needs-adjustment'
  ) => {
    const updatedRecs = result.recommendations.map((rec) =>
      rec.id === recId
        ? {
            ...rec,
            helpfulFeedback: rec.helpfulFeedback === feedback ? null : feedback,
          }
        : rec
    );
    onUpdateConsultation({
      ...consultation,
      result: {
        ...result,
        recommendations: updatedRecs,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  // Export Consultation Report as .txt
  const handleExportReport = () => {
    const lines: string[] = [
      '====================================================================',
      'NOEVIA — RINGKASAN KONSULTASI & RENCANA TINDAKAN BISNIS',
      'Understand the person behind the business before trying to solve the problem.',
      '====================================================================',
      `Judul Konsultasi : ${consultation.title}`,
      `Nama Usaha       : ${consultation.businessName || '-'}`,
      `Kategori Usaha   : ${consultation.businessCategory}`,
      `Tahap Usaha      : ${consultation.businessStage}`,
      `Tanggal          : ${new Date(consultation.updatedAt).toLocaleDateString('id-ID')}`,
      '',
      '01. YOUR BUSINESS SITUATION (KONDISI USAHA SAAT INI)',
      '--------------------------------------------------------------------',
      result.problemSummary,
      '',
      '02. WHAT WE UNDERSTAND (FAKTA, GEJALA, & ASUMSI)',
      '--------------------------------------------------------------------',
      'Fakta Terkonfirmasi:',
      ...(consultation.businessContext.confirmedFacts || []).map(
        (f, i) => `  ${i + 1}. ${f}`
      ),
      '',
      'Gejala yang Dilaporkan:',
      ...(consultation.businessContext.userReportedSymptoms || []).map(
        (s, i) => `  ${i + 1}. ${s}`
      ),
      '',
      '03. WHAT MAY BE HAPPENING (KEMUNGKINAN PENYEBAB)',
      '--------------------------------------------------------------------',
      `Permasalahan Utama: ${result.mainProblem}`,
      '',
      'Kemungkinan Penyebab:',
      ...result.possibleCauses.map(
        (c, i) => `  ${i + 1}. [${c.confidence}] ${c.cause} — ${c.explanation}`
      ),
      '',
      'Observasi Pendukung:',
      ...result.supportingFindings.map((f, i) => `  ${i + 1}. ${f}`),
      '',
      '04. WHAT WE RECOMMEND (REKOMENDASI SOLUSI PRIORITAS)',
      '--------------------------------------------------------------------',
      ...prioritizedRecommendations.flatMap((rec, idx) => [
        `${idx + 1}. ${rec.title} [Prioritas: ${rec.priority}]`,
        `   Apa yang Perlu Dilakukan : ${rec.description}`,
        `   Mengapa Ini Penting      : ${rec.whyItMatters}`,
        `   Mengapa Cocok untuk Anda : ${rec.whyItFits || '-'}`,
        `   Langkah Pelaksanaan      : ${rec.steps.join(' -> ')}`,
        `   Sumber Daya Dibutuhkan   : ${rec.requiredResources}`,
        `   Batasan & Pertimbangan   : ${rec.limitationsToConsider || '-'}`,
        '',
      ]),
      '05. YOUR NEXT STEPS (RENCANA TINDAKAN 7 HARI)',
      '--------------------------------------------------------------------',
      ...result.actionPlan.map(
        (item) => `  Hari ${item.day}: ${item.action} | Tujuan: ${item.objective}`
      ),
      '',
      '06. KNOWLEDGE SOURCES USED',
      '--------------------------------------------------------------------',
      ...result.knowledgeReferences.map((r) => `  * ${formatKnowledgeCitation(r)}`),
    ];

    const blob = new Blob([lines.join('\n')], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Noevia_Konsultasi_${(consultation.businessName || 'Bisnis').replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // STEP 08: Send Continuation Message
  const handleSendContinuation = async (overrideQuestion?: string) => {
    const questionText = (overrideQuestion ?? continuationInput).trim();
    if (!questionText || isSendingContinuation) return;

    if (!overrideQuestion) {
      setContinuationInput('');
    }
    setContinuationError(null);
    setStrategyUpdatedNotice(null);

    const userMsg: Message = {
      id: `msg-cont-${Date.now()}-user`,
      consultationId: consultation.id,
      role: 'user',
      content: questionText,
      createdAt: new Date().toISOString(),
      phase: 'continuation',
    };

    const messagesWithUser = [...consultation.messages, userMsg];
    const updatedConsultationWithUser: Consultation = {
      ...consultation,
      messages: messagesWithUser,
      updatedAt: new Date().toISOString(),
    };
    onUpdateConsultation(updatedConsultationWithUser);

    setIsSendingContinuation(true);
    try {
      const response = await sendContinuationMessage({
        consultation: updatedConsultationWithUser,
        userQuestion: questionText,
        documents,
      });

      const aiMsg: Message = {
        id: `msg-cont-${Date.now()}-ai`,
        consultationId: consultation.id,
        role: 'assistant',
        content: response.reply,
        createdAt: new Date().toISOString(),
        phase: 'continuation',
        knowledgeReferences: response.knowledgeReferences,
      };

      const nextRecommendations =
        response.updatedRecommendations && response.updatedRecommendations.length > 0
          ? response.updatedRecommendations
          : result.recommendations;

      const nextActionPlan =
        response.updatedActionPlan && response.updatedActionPlan.length > 0
          ? response.updatedActionPlan
          : result.actionPlan;

      const updatedResult = {
        ...result,
        recommendations: nextRecommendations,
        actionPlan: nextActionPlan,
        updatedAt: new Date().toISOString(),
      };

      if (response.updatedRecommendations || response.updatedActionPlan) {
        setStrategyUpdatedNotice(
          'Rekomendasi solusi dan Rencana Tindakan 7 Hari di atas telah diperbarui menyesuaikan arahan terbaru Anda.'
        );
        setDraftActionPlan(nextActionPlan);
      }

      onUpdateConsultation({
        ...updatedConsultationWithUser,
        messages: [...messagesWithUser, aiMsg],
        result: updatedResult,
        updatedAt: new Date().toISOString(),
      });
      setLastFailedQuestion(null);
    } catch (err) {
      setContinuationError(
        err instanceof Error
          ? err.message
          : 'Gagal memproses konsultasi lanjutan.'
      );
      setLastFailedQuestion(questionText);
    } finally {
      setIsSendingContinuation(false);
    }
  };

  return (
    <div className="max-w-[1020px] mx-auto px-6 lg:px-10 py-8 lg:py-12 space-y-14">
      {/* Top Navigation & Export Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EAEAEA] pb-5">
        <button
          type="button"
          onClick={onBackToUnderstanding}
          className="inline-flex items-center gap-2 text-[14px] text-[#555555] hover:text-[#111111] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Percakapan Konsultasi</span>
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setDraftSummary(result.problemSummary);
              setDraftMainProblem(result.mainProblem);
              setDraftConfirmedFactsText(
                (consultation.businessContext.confirmedFacts || []).join('\n')
              );
              setIsEditingSummary(!isEditingSummary);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#D8D8D8] bg-[#FFFFFF] text-[13px] font-medium text-[#111111] hover:border-[#111111] transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{isEditingSummary ? 'Tutup Edit Ringkasan' : 'Edit Ringkasan & Konteks'}</span>
          </button>

          <button
            type="button"
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#111111] bg-[#FFFFFF] text-[13px] font-medium text-[#111111] hover:bg-[#F7F7F5] transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Simpan Ringkasan (.TXT)</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 01. YOUR BUSINESS SITUATION                                         */}
      {/* =================================================================== */}
      <section aria-labelledby="heading-situation" className="max-w-[820px] space-y-4">
        <p className="font-mono-meta text-[12px] uppercase tracking-[0.12em] text-[#777777]">
          YOUR BUSINESS SITUATION · {consultation.businessCategory.toUpperCase()} · {consultation.businessStage.toUpperCase()}
        </p>
        <h1
          id="heading-situation"
          className="text-[32px] sm:text-[38px] font-semibold tracking-[-0.025em] text-[#111111] leading-[1.18]"
        >
          {consultation.businessName
            ? `Ringkasan Konsultasi: ${consultation.businessName}`
            : `Ringkasan Konsultasi Bisnis (${consultation.businessCategory})`}
        </h1>

        {isEditingSummary ? (
          <div className="p-6 border border-[#111111] bg-[#F7F7F5] space-y-4 mt-4">
            <div className="flex items-center justify-between border-b border-[#D8D8D8] pb-3">
              <p className="text-[14px] font-semibold text-[#111111]">
                Perbarui Ringkasan Situasi &amp; Fakta Bisnis
              </p>
              <span className="font-mono-meta text-[12px] text-[#777777]">
                EDITABLE CONSULTATION SUMMARY
              </span>
            </div>

            <div>
              <label
                htmlFor="edit-problem-summary"
                className="block text-[13px] font-medium text-[#111111] mb-1.5"
              >
                Ringkasan Situasi Usaha (Your Business Situation)
              </label>
              <textarea
                id="edit-problem-summary"
                rows={3}
                value={draftSummary}
                onChange={(e) => setDraftSummary(e.target.value)}
                className="w-full p-3.5 text-[15px] border border-[#D8D8D8] bg-[#FFFFFF] text-[#111111] focus:border-[#111111] focus:outline-none leading-relaxed"
              />
            </div>

            <div>
              <label
                htmlFor="edit-main-problem"
                className="block text-[13px] font-medium text-[#111111] mb-1.5"
              >
                Inti Permasalahan yang Teridentifikasi
              </label>
              <input
                id="edit-main-problem"
                type="text"
                value={draftMainProblem}
                onChange={(e) => setDraftMainProblem(e.target.value)}
                className="w-full p-3 text-[15px] border border-[#D8D8D8] bg-[#FFFFFF] text-[#111111] focus:border-[#111111] focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="edit-confirmed-facts"
                className="block text-[13px] font-medium text-[#111111] mb-1.5"
              >
                Fakta Terkonfirmasi (Satu poin per baris)
              </label>
              <textarea
                id="edit-confirmed-facts"
                rows={4}
                value={draftConfirmedFactsText}
                onChange={(e) => setDraftConfirmedFactsText(e.target.value)}
                className="w-full p-3.5 text-[14px] border border-[#D8D8D8] bg-[#FFFFFF] text-[#111111] focus:border-[#111111] focus:outline-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingSummary(false)}
                className="px-4 py-2 border border-[#D8D8D8] bg-[#FFFFFF] text-[13px] font-medium text-[#555555] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSummary}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-[#FFFFFF] text-[13px] font-medium cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[16px] sm:text-[17px] text-[#333333] leading-[1.7] pt-1">
            {result.problemSummary}
          </p>
        )}
      </section>

      {/* =================================================================== */}
      {/* 02. WHAT WE UNDERSTAND (Facts, Symptoms, & Assumptions)             */}
      {/* =================================================================== */}
      <section aria-labelledby="heading-what-we-understand" className="space-y-6">
        <div className="border-b border-[#D8D8D8] pb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono-meta text-[12px] uppercase tracking-[0.12em] text-[#777777]">
              WHAT WE UNDERSTAND
            </p>
            <h2
              id="heading-what-we-understand"
              className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#111111] mt-1"
            >
              Apa yang Kami Pahami dari Cerita Anda
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setDraftSummary(result.problemSummary);
              setDraftMainProblem(result.mainProblem);
              setDraftConfirmedFactsText(
                (consultation.businessContext.confirmedFacts || []).join('\n')
              );
              setIsEditingSummary(true);
            }}
            className="font-mono-meta text-[12px] text-[#555555] hover:text-[#111111] underline underline-offset-4 cursor-pointer"
          >
            Koreksi poin pemahaman
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Confirmed Facts */}
          <div className="p-6 border border-[#D8D8D8] bg-[#FFFFFF] space-y-3">
            <p className="font-mono-meta text-[12px] uppercase tracking-[0.08em] text-[#111111] font-semibold">
              Fakta Terkonfirmasi
            </p>
            <ul className="space-y-2.5 text-[15px] text-[#222222] leading-[1.6]">
              {(consultation.businessContext.confirmedFacts || []).map((fact, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-meta text-[12px] text-[#777777] mt-1">
                    •
                  </span>
                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* User-Reported Symptoms */}
          <div className="p-6 border border-[#D8D8D8] bg-[#FFFFFF] space-y-3">
            <p className="font-mono-meta text-[12px] uppercase tracking-[0.08em] text-[#111111] font-semibold">
              Gejala yang Dilaporkan
            </p>
            <ul className="space-y-2.5 text-[15px] text-[#222222] leading-[1.6]">
              {(
                consultation.businessContext.userReportedSymptoms ||
                result.supportingFindings.slice(0, 2)
              ).map((symptom, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-meta text-[12px] text-[#777777] mt-1">
                    •
                  </span>
                  <span>{symptom}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Assumptions & To Verify */}
          <div className="p-6 border border-[#D8D8D8] bg-[#F7F7F5] space-y-3">
            <p className="font-mono-meta text-[12px] uppercase tracking-[0.08em] text-[#111111] font-semibold">
              Asumsi &amp; Hal yang Perlu Diverifikasi
            </p>
            <ul className="space-y-2.5 text-[14px] text-[#555555] leading-[1.6]">
              {(
                consultation.businessContext.assumptionsToVerify ||
                result.additionalConsiderations
              ).map((assumption, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono-meta text-[12px] text-[#777777] mt-1">
                    •
                  </span>
                  <span>{assumption}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 03. WHAT MAY BE HAPPENING (Possible Causes & Supporting Observations) */}
      {/* =================================================================== */}
      <section aria-labelledby="heading-what-may-be-happening" className="space-y-7">
        <div className="border-b border-[#D8D8D8] pb-3">
          <p className="font-mono-meta text-[12px] uppercase tracking-[0.12em] text-[#777777]">
            WHAT MAY BE HAPPENING
          </p>
          <h2
            id="heading-what-may-be-happening"
            className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#111111] mt-1"
          >
            Apa yang Mungkin Sedang Terjadi pada Bisnis Anda
          </h2>
        </div>

        {/* Core Focus Banner */}
        <div className="p-6 sm:p-7 border border-[#111111] bg-[#F7F7F5] max-w-[820px]">
          <p className="font-mono-meta text-[12px] uppercase tracking-[0.1em] text-[#777777] mb-2">
            INTI PERMASALAHAN YANG TERIDENTIFIKASI
          </p>
          <p className="text-[18px] sm:text-[20px] font-semibold text-[#111111] leading-[1.45]">
            {result.mainProblem}
          </p>
        </div>

        {/* Possible Causes */}
        <div className="space-y-4">
          <p className="font-mono-meta text-[12px] uppercase tracking-[0.1em] text-[#111111] font-semibold">
            Kemungkinan Penyebab Utama (Disusun Secara Non-Mutlak)
          </p>
          <div className="border-t border-[#D8D8D8] divide-y divide-[#D8D8D8]">
            {result.possibleCauses.map((cause, idx) => (
              <div
                key={idx}
                className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
              >
                <div className="md:col-span-4">
                  <span className="font-mono-meta text-[12px] uppercase text-[#777777] block mb-1">
                    0{idx + 1} · {cause.confidence}
                  </span>
                  <h3 className="text-[16px] font-semibold text-[#111111] leading-snug">
                    {cause.cause}
                  </h3>
                </div>
                <div className="md:col-span-8 text-[16px] text-[#333333] leading-[1.65]">
                  {cause.explanation}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Supporting Observations */}
        <div className="p-6 border border-[#D8D8D8] bg-[#FFFFFF] max-w-[820px]">
          <p className="font-mono-meta text-[12px] uppercase tracking-[0.1em] text-[#111111] font-semibold mb-3.5">
            Observasi Pendukung dari Situasi Usaha Anda
          </p>
          <ul className="space-y-2.5 text-[15px] text-[#333333] leading-[1.6]">
            {result.supportingFindings.map((finding, idx) => (
              <li key={idx} className="flex items-start gap-3">
                <span className="font-mono-meta text-[12px] text-[#777777] mt-1">
                  0{idx + 1}
                </span>
                <span>{finding}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 04. WHAT WE RECOMMEND (Max 3 Prioritized Recommendations)           */}
      {/* =================================================================== */}
      <section aria-labelledby="heading-what-we-recommend" className="space-y-7">
        <div className="border-b border-[#D8D8D8] pb-3 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="font-mono-meta text-[12px] uppercase tracking-[0.12em] text-[#777777]">
              WHAT WE RECOMMEND
            </p>
            <h2
              id="heading-what-we-recommend"
              className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#111111] mt-1"
            >
              Rekomendasi Langkah yang Paling Relevan untuk Anda
            </h2>
          </div>
          <span className="font-mono-meta text-[12px] text-[#777777]">
            Maksimal {prioritizedRecommendations.length} Fokus Prioritas
          </span>
        </div>

        <div className="space-y-6">
          {prioritizedRecommendations.map((rec, idx) => (
            <div
              key={rec.id}
              className="border border-[#D8D8D8] bg-[#FFFFFF] p-6 sm:p-8 space-y-6"
            >
              {/* Recommendation Header */}
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EAEAEA] pb-4">
                <div>
                  <p className="font-mono-meta text-[12px] uppercase text-[#777777]">
                    REKOMENDASI 0{idx + 1} · PRIORITAS: {rec.priority.toUpperCase()}
                  </p>
                  <h3 className="text-[20px] sm:text-[22px] font-semibold text-[#111111] mt-1">
                    {rec.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2 font-mono-meta text-[12px]">
                  <button
                    type="button"
                    onClick={() => handleRecommendationFeedback(rec.id, 'helpful')}
                    aria-label={`Tandai ${rec.title} relevan`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors cursor-pointer ${
                      rec.helpfulFeedback === 'helpful'
                        ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                        : 'border-[#D8D8D8] text-[#555555] hover:border-[#111111]'
                    }`}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>Cocok</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleRecommendationFeedback(rec.id, 'needs-adjustment')
                    }
                    aria-label={`Tandai ${rec.title} perlu disesuaikan`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 border transition-colors cursor-pointer ${
                      rec.helpfulFeedback === 'needs-adjustment'
                        ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                        : 'border-[#D8D8D8] text-[#555555] hover:border-[#111111]'
                    }`}
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                    <span>Perlu Penyesuaian</span>
                  </button>
                </div>
              </div>

              {/* 5 Required Practical Explanations from Section 8 */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-6 space-y-4">
                  <div>
                    <p className="font-mono-meta text-[12px] uppercase text-[#777777] mb-1">
                      Apa yang Perlu Dilakukan (What to Do)
                    </p>
                    <p className="text-[16px] text-[#111111] leading-[1.65]">
                      {rec.description}
                    </p>
                  </div>

                  <div>
                    <p className="font-mono-meta text-[12px] uppercase text-[#777777] mb-1">
                      Mengapa Langkah Ini Penting (Why It Matters)
                    </p>
                    <p className="text-[15px] text-[#333333] leading-[1.65]">
                      {rec.whyItMatters}
                    </p>
                  </div>

                  {rec.whyItFits && (
                    <div className="p-4 bg-[#F7F7F5] border-l-2 border-[#111111]">
                      <p className="font-mono-meta text-[12px] uppercase text-[#111111] font-semibold mb-1">
                        Mengapa Cocok dengan Situasi Anda (Why It Fits Your Situation)
                      </p>
                      <p className="text-[14px] text-[#333333] leading-[1.6]">
                        {rec.whyItFits}
                      </p>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-6 space-y-4 border-t lg:border-t-0 lg:border-l border-[#EAEAEA] pt-4 lg:pt-0 lg:pl-6">
                  <div>
                    <p className="font-mono-meta text-[12px] uppercase text-[#777777] mb-2">
                      Langkah Pelaksanaan Praktis
                    </p>
                    <ol className="space-y-2.5 text-[15px] text-[#111111] leading-[1.6]">
                      {rec.steps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2.5">
                          <span className="font-mono-meta text-[12px] text-[#777777] mt-1">
                            {sIdx + 1}.
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#EAEAEA] text-[14px]">
                    <div>
                      <span className="font-mono-meta text-[12px] uppercase text-[#777777] block mb-1">
                        Sumber Daya yang Dibutuhkan
                      </span>
                      <span className="text-[#111111] leading-relaxed">
                        {rec.requiredResources}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono-meta text-[12px] uppercase text-[#777777] block mb-1">
                        Hasil yang Diharapkan
                      </span>
                      <span className="text-[#111111] leading-relaxed">
                        {rec.expectedOutcome}
                      </span>
                    </div>
                  </div>

                  {rec.limitationsToConsider && (
                    <div className="pt-3 border-t border-[#EAEAEA] text-[14px]">
                      <span className="font-mono-meta text-[12px] uppercase text-[#777777] block mb-1">
                        Batasan yang Perlu Diperhatikan (Limitations to Consider)
                      </span>
                      <span className="text-[#555555] leading-relaxed">
                        {rec.limitationsToConsider}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 05. YOUR NEXT STEPS (Practical & Editable 7-Day Action Plan)        */}
      {/* =================================================================== */}
      <section aria-labelledby="heading-your-next-steps" className="space-y-6">
        <div className="border-b border-[#D8D8D8] pb-3 flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="font-mono-meta text-[12px] uppercase tracking-[0.12em] text-[#777777]">
              YOUR NEXT STEPS
            </p>
            <h2
              id="heading-your-next-steps"
              className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-[#111111] mt-1"
            >
              Rencana Tindakan Praktis 7 Hari ke Depan
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {editingActionPlan ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditingActionPlan(false)}
                  className="px-3.5 py-1.5 border border-[#D8D8D8] bg-[#FFFFFF] text-[12px] text-[#555555] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedActionPlan}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#111111] text-[#FFFFFF] text-[12px] font-medium cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Rencana Aksi</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setDraftActionPlan(result.actionPlan);
                  setEditingActionPlan(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-[#D8D8D8] bg-[#FFFFFF] hover:border-[#111111] text-[12px] font-medium text-[#111111] cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sesuaikan Jadwal 7 Hari</span>
              </button>
            )}
          </div>
        </div>

        {strategyUpdatedNotice && (
          <div className="p-4 border border-[#111111] bg-[#F7F7F5] text-[14px] text-[#111111]">
            ✓ {strategyUpdatedNotice}
          </div>
        )}

        <div className="border border-[#D8D8D8] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D8D8D8] bg-[#F7F7F5] font-mono-meta text-[12px] text-[#777777]">
                <th className="py-3.5 px-4 w-28">Hari</th>
                <th className="py-3.5 px-4">Langkah Praktis</th>
                <th className="py-3.5 px-4">Target / Tujuan</th>
                <th className="py-3.5 px-4 w-24 text-right">Selesai</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA] text-[15px]">
              {(editingActionPlan ? draftActionPlan : result.actionPlan).map(
                (item, idx) => (
                  <tr
                    key={item.day}
                    onClick={() => handleToggleDayTask(item.day)}
                    className={`transition-colors ${
                      editingActionPlan
                        ? 'bg-[#FFFFFF]'
                        : 'hover:bg-[#F7F7F5] cursor-pointer'
                    }`}
                  >
                    <td className="py-4 px-4 font-mono-meta text-[13px] font-medium text-[#111111] whitespace-nowrap align-top">
                      Hari {item.day}
                    </td>
                    <td className="py-4 px-4 align-top">
                      {editingActionPlan ? (
                        <input
                          type="text"
                          value={item.action}
                          onChange={(e) => {
                            const updated = [...draftActionPlan];
                            updated[idx] = {
                              ...updated[idx],
                              action: e.target.value,
                            };
                            setDraftActionPlan(updated);
                          }}
                          className="w-full p-2 text-[14px] border border-[#D8D8D8] bg-[#FFFFFF] text-[#111111]"
                        />
                      ) : (
                        <span
                          className={`font-medium leading-relaxed ${
                            item.completed
                              ? 'line-through text-[#777777]'
                              : 'text-[#111111]'
                          }`}
                        >
                          {item.action}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-[#555555] align-top leading-relaxed">
                      {editingActionPlan ? (
                        <input
                          type="text"
                          value={item.objective}
                          onChange={(e) => {
                            const updated = [...draftActionPlan];
                            updated[idx] = {
                              ...updated[idx],
                              objective: e.target.value,
                            };
                            setDraftActionPlan(updated);
                          }}
                          className="w-full p-2 text-[14px] border border-[#D8D8D8] bg-[#FFFFFF] text-[#555555]"
                        />
                      ) : (
                        item.objective
                      )}
                    </td>
                    <td className="py-4 px-4 text-right font-mono-meta text-xs align-top">
                      <button
                        type="button"
                        disabled={editingActionPlan}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleDayTask(item.day);
                        }}
                        aria-label={`Tandai Hari ${item.day} selesai`}
                        className={`inline-flex items-center justify-center w-6 h-6 border ${
                          item.completed
                            ? 'border-[#111111] bg-[#111111] text-[#FFFFFF]'
                            : 'border-[#D8D8D8] bg-[#FFFFFF] text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* =================================================================== */}
      {/* 06. KNOWLEDGE SOURCES USED (Compact Expandable Drawer - Section 7)  */}
      {/* =================================================================== */}
      <section aria-labelledby="heading-knowledge-sources" className="space-y-4">
        <div className="border border-[#D8D8D8] bg-[#F7F7F5] p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-mono-meta text-[12px] uppercase tracking-[0.12em] text-[#777777]">
                KNOWLEDGE SOURCES USED
              </p>
              <h2
                id="heading-knowledge-sources"
                className="text-[18px] font-semibold text-[#111111] mt-0.5"
              >
                Referensi Knowledge Base yang Mendukung Rekomendasi Ini (
                {result.knowledgeReferences.length} sumber)
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowKnowledgeSources(!showKnowledgeSources)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-[#111111] bg-[#FFFFFF] text-[13px] font-medium text-[#111111] hover:bg-[#EAEAEA] transition-colors cursor-pointer self-start sm:self-center"
            >
              <BookOpen className="w-4 h-4" />
              <span>
                {showKnowledgeSources
                  ? 'Sembunyikan Rincian Sumber'
                  : 'Knowledge Sources Used'}
              </span>
              {showKnowledgeSources ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>

          {showKnowledgeSources && (
            <div className="mt-5 pt-5 border-t border-[#D8D8D8] space-y-3">
              {result.knowledgeReferences.length === 0 ? (
                <p className="text-[14px] text-[#555555]">
                  Saat ini tidak ditemukan dokumen Knowledge Base yang spesifik. Analisis disusun berdasarkan konteks usaha Anda.
                </p>
              ) : (
                result.knowledgeReferences.map((ref) => {
                  const isRefExpanded = expandedRefId === ref.id;
                  return (
                    <div
                      key={ref.id}
                      className="p-4 border border-[#D8D8D8] bg-[#FFFFFF] space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <p className="font-mono-meta text-[12px] text-[#777777]">
                            [{ref.documentId}] · {ref.relevanceReason || 'Referensi Utama'}
                          </p>
                          <p className="text-[15px] font-semibold text-[#111111]">
                            {formatKnowledgeCitation(ref)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedRefId(isRefExpanded ? null : ref.id)
                          }
                          className="font-mono-meta text-[12px] text-[#111111] underline underline-offset-4 cursor-pointer self-start sm:self-center"
                        >
                          {isRefExpanded ? 'Tutup Kutipan' : 'Lihat Kutipan Materi'}
                        </button>
                      </div>

                      {isRefExpanded && (
                        <p className="text-[14px] text-[#555555] bg-[#F7F7F5] p-3.5 border-t border-[#EAEAEA] leading-relaxed">
                          {ref.relevantContent}
                        </p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </section>

      {/* =================================================================== */}
      {/* 07. CONTINUOUS CONSULTATION ("Where Would You Like to Go From Here?") */}
      {/* =================================================================== */}
      <section
        aria-labelledby="heading-continue-consultation"
        className="border-t-2 border-[#111111] pt-10 space-y-6"
      >
        <div>
          <p className="font-mono-meta text-[12px] uppercase tracking-[0.12em] text-[#777777]">
            STAGE 08 — CONTINUE CONSULTATION
          </p>
          <h2
            id="heading-continue-consultation"
            className="text-[26px] sm:text-[30px] font-semibold tracking-tight text-[#111111] mt-1"
          >
            Where Would You Like to Go From Here?
          </h2>
          <p className="text-[16px] text-[#555555] mt-1 max-w-[780px] leading-relaxed">
            Konsultasi tidak berhenti di sini. Jika ada kendala biaya, keterbatasan waktu, atau Anda ingin mengeksplorasi alternatif lain, Noevia akan menyesuaikan rekomendasi dan rencana tindakan di atas secara langsung.
          </p>
        </div>

        {/* 5 Guided Options from Section 9 */}
        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            disabled={isSendingContinuation}
            onClick={() =>
              handleSendContinuation(
                'Bisa bantu eksplorasi alternatif solusi lain yang lebih sederhana untuk mendatangkan pelanggan?'
              )
            }
            className="px-4 py-2.5 border border-[#D8D8D8] bg-[#FFFFFF] hover:border-[#111111] text-[13px] font-medium text-[#111111] transition-colors cursor-pointer"
          >
            Explore Another Solution
          </button>

          <button
            type="button"
            disabled={isSendingContinuation}
            onClick={() =>
              handleSendContinuation(
                'Saya tidak mempunyai budget untuk iklan berbayar. Bisakah strategi dan rencana aksi disesuaikan menjadi 100% organik tanpa biaya iklan?'
              )
            }
            className="px-4 py-2.5 border border-[#111111] bg-[#F7F7F5] hover:bg-[#111111] hover:text-[#FFFFFF] text-[13px] font-medium text-[#111111] transition-colors cursor-pointer"
          >
            Adjust My Strategy (Tanpa Biaya Iklan)
          </button>

          <button
            type="button"
            onClick={() => {
              const inputEl = document.getElementById('continuation-chat-input');
              if (inputEl) {
                inputEl.focus();
              }
            }}
            className="px-4 py-2.5 border border-[#D8D8D8] bg-[#FFFFFF] hover:border-[#111111] text-[13px] font-medium text-[#111111] transition-colors cursor-pointer"
          >
            I Have Another Question
          </button>

          <button
            type="button"
            disabled={isSendingContinuation}
            onClick={() =>
              handleSendContinuation(
                'Tolong perinci Rencana Tindakan Hari 1 sampai Hari 3 agar lebih mudah dijalankan oleh tim kecil.'
              )
            }
            className="px-4 py-2.5 border border-[#D8D8D8] bg-[#FFFFFF] hover:border-[#111111] text-[13px] font-medium text-[#111111] transition-colors cursor-pointer"
          >
            Refine My Action Plan
          </button>

          <button
            type="button"
            onClick={onStartNewConsultation}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[#D8D8D8] bg-[#FFFFFF] hover:border-[#111111] text-[13px] font-medium text-[#111111] transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Discuss Another Business Problem</span>
          </button>
        </div>

        {/* Continuation Conversation History */}
        {continuationMessages.length > 0 && (
          <div className="max-w-[780px] border border-[#D8D8D8] divide-y divide-[#EAEAEA]">
            {continuationMessages.map((msg) => {
              const isUser = msg.role === 'user';
              const hasKb =
                !isUser &&
                msg.knowledgeReferences &&
                msg.knowledgeReferences.length > 0;
              const isKbOpen = Boolean(expandedContMsgKb[msg.id]);

              return (
                <div
                  key={msg.id}
                  className={`p-6 ${isUser ? 'bg-[#FFFFFF]' : 'bg-[#F7F7F5]'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2.5 font-mono-meta text-[12px] text-[#777777]">
                    <span className="font-semibold text-[#111111]">
                      {isUser ? 'ANDA' : 'NOEVIA — KONSULTAN BISNIS'}
                    </span>
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-[16px] sm:text-[17px] text-[#111111] leading-[1.7] whitespace-pre-line">
                    {msg.content}
                  </div>
                  {hasKb && (
                    <div className="mt-4 pt-3 border-t border-[#E2E2E0]">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedContMsgKb((prev) => ({
                            ...prev,
                            [msg.id]: !prev[msg.id],
                          }))
                        }
                        className="inline-flex items-center gap-1.5 font-mono-meta text-[12px] text-[#555555] hover:text-[#111111] cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          Knowledge Sources Used ({msg.knowledgeReferences!.length})
                        </span>
                        {isKbOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isKbOpen && (
                        <div className="mt-2.5 space-y-2">
                          {msg.knowledgeReferences!.map((ref) => (
                            <div
                              key={ref.id}
                              className="p-3 border border-[#D8D8D8] bg-[#FFFFFF] text-[13px]"
                            >
                              <p className="font-semibold text-[#111111]">
                                {formatKnowledgeCitation(ref)}
                              </p>
                              <p className="text-[#555555] mt-1 leading-relaxed">
                                {ref.relevantContent}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {isSendingContinuation && (
          <div className="max-w-[780px] p-4 border border-[#D8D8D8] bg-[#F7F7F5] flex items-center gap-3 text-[14px] text-[#555555]">
            <Loader2 className="w-4 h-4 animate-spin text-[#111111]" />
            <span>
              Noevia sedang memperbarui strategi dan rencana tindakan sesuai masukan Anda...
            </span>
          </div>
        )}

        {continuationError && (
          <div className="max-w-[780px] p-4 border border-[#111111] bg-[#F7F7F5] flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-[14px] text-[#111111]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{continuationError}</span>
            </div>
            {lastFailedQuestion && (
              <button
                type="button"
                onClick={() => handleSendContinuation(lastFailedQuestion)}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#111111] text-[#FFFFFF] text-[12px] cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Coba Lagi</span>
              </button>
            )}
          </div>
        )}

        {/* Continuation Chat Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendContinuation();
          }}
          className="max-w-[780px] flex flex-col sm:flex-row gap-3"
        >
          <label htmlFor="continuation-chat-input" className="sr-only">
            Diskusikan penyesuaian strategi atau pertanyaan lanjutan dengan Noevia
          </label>
          <input
            id="continuation-chat-input"
            type="text"
            value={continuationInput}
            onChange={(e) => setContinuationInput(e.target.value)}
            placeholder="Tanyakan langkah lanjutan atau minta penyesuaian strategi (misal: Saya tidak punya anggaran iklan)..."
            disabled={isSendingContinuation}
            className="flex-1 px-4 py-3.5 text-[15px] border border-[#111111] bg-[#FFFFFF] text-[#111111] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isSendingContinuation || !continuationInput.trim()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111111] text-[#FFFFFF] text-[14px] font-medium hover:bg-[#080808] transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-40"
          >
            <span>Lanjutkan Diskusi</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </section>
    </div>
  );
};
