import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  Edit3,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Layers,
  Loader2,
  PlayCircle,
  RefreshCw,
  Save,
  Send,
  Sparkles,
  Table,
  ThumbsDown,
  ThumbsUp,
} from 'lucide-react';
import {
  AppLanguage,
  Consultation,
  DeliverableFormat,
  DeterministicBusinessAnalysis,
  ExternalReference,
  GeneratedDocumentMeta,
  ImplementationMonitoringData,
  KnowledgeDocument,
  KnowledgeReference,
  Message,
  VideoResource,
} from '../types';
import {
  SWEETBITE_DEMO_PRESET,
  buildProblemAnalysisMatrixForDomain,
  buildTailoredDeliverable,
  buildVisualDiagramForDomain,
  createDefaultImplementationMonitoring,
  extractContextFromConversation,
} from '../lib/consultationEngine';
import {
  buildDeterministicAnalysisForConsultation,
  evaluateImplementationProgress,
} from '../lib/businessCalculators';
import {
  downloadActionPlanPdf,
  downloadConsultationReportPdf,
  downloadTailoredBusinessDocument,
} from '../lib/documentGenerator';
import {
  buildDeliverableCatalogForDomain,
  buildProfessionalConsultingReport,
} from '../lib/reportSynthesisEngine';
import { ProfessionalReportModal } from './ProfessionalReportModal';
import { UI_TEXT } from '../lib/learningCenterData';
import {
  inspectPublicUrl,
  requestBusinessDiagnosis,
  sendContinuationMessage,
  sendDiscoveryMessage,
} from '../services/aiService';

interface ConsultationWorkspaceProps {
  consultation: Consultation;
  documents: KnowledgeDocument[];
  onUpdateConsultation: (updated: Consultation) => void;
  initialPendingMessage?: string | null;
  onClearPendingMessage?: () => void;
  language?: AppLanguage;
  actingUserId?: string | null;
}

export const ConsultationWorkspace: React.FC<ConsultationWorkspaceProps> = ({
  consultation,
  documents,
  onUpdateConsultation,
  initialPendingMessage,
  onClearPendingMessage,
  language = 'id',
  actingUserId = null,
}) => {
  const isEn = language === 'en';
  const t = UI_TEXT[language].workspace;

  const [composerInput, setComposerInput] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastFailedAction, setLastFailedAction] = useState<
    null | (() => Promise<void>)
  >(null);

  // URL Context Inspector state
  const [showUrlInspector, setShowUrlInspector] = useState(false);
  const [publicUrlInput, setPublicUrlInput] = useState('');
  const [isInspectingUrl, setIsInspectingUrl] = useState(false);

  // Expandable references state per message or analysis block
  const [expandedRefs, setExpandedRefs] = useState<Record<string, boolean>>({});

  // Optional inline editing of What We Understand inside the conversation
  const [isEditingUnderstanding, setIsEditingUnderstanding] = useState(false);
  const [draftSummary, setDraftSummary] = useState(
    consultation.result?.problemSummary ||
      consultation.businessContext.problemSummary ||
      ''
  );
  const [draftMainChallenge, setDraftMainChallenge] = useState(
    consultation.result?.mainProblem ||
      consultation.businessContext.mainChallenge ||
      ''
  );
  const [draftFactsText, setDraftFactsText] = useState(
    (consultation.businessContext.confirmedFacts || []).join('\n')
  );

  // Interactive Calculator Input Overrides
  const [calcInputValues, setCalcInputValues] = useState<Record<string, number>>({});
  const [isReportPreviewOpen, setIsReportPreviewOpen] = useState(false);
  const [selectedDeliverableIndex, setSelectedDeliverableIndex] = useState(0);

  // Implementation Monitoring state
  const defaultMonitoring =
    consultation.result?.implementationMonitoring ||
    createDefaultImplementationMonitoring(consultation);
  const [baselineInquiries, setBaselineInquiries] = useState<number>(
    defaultMonitoring.baselineInquiriesWeekly
  );
  const [currentInquiries, setCurrentInquiries] = useState<number>(
    defaultMonitoring.currentInquiriesWeekly
  );
  const [baselineTransactions, setBaselineTransactions] = useState<number>(
    defaultMonitoring.baselineTransactionsWeekly
  );
  const [currentTransactions, setCurrentTransactions] = useState<number>(
    defaultMonitoring.currentTransactionsWeekly
  );
  const [obstaclesText, setObstaclesText] = useState<string>(
    defaultMonitoring.obstaclesReported
  );

  // Sync monitoring state when consultation switches
  useEffect(() => {
    const mon =
      consultation.result?.implementationMonitoring ||
      createDefaultImplementationMonitoring(consultation);
    setBaselineInquiries(mon.baselineInquiriesWeekly);
    setCurrentInquiries(mon.currentInquiriesWeekly);
    setBaselineTransactions(mon.baselineTransactionsWeekly);
    setCurrentTransactions(mon.currentTransactionsWeekly);
    setObstaclesText(mon.obstaclesReported);
    setCalcInputValues({});
    setSelectedDeliverableIndex(0);
    setIsReportPreviewOpen(false);
  }, [consultation.id]);

  // Notice when continuation updates recommendations or action plan, or when a document is downloaded
  const [strategyUpdatedNotice, setStrategyUpdatedNotice] = useState<
    string | null
  >(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const hasSentInitialRef = useRef<string | null>(null);

  const allMessages = consultation.messages;
  const discoveryMessages = allMessages.filter(
    (m) => m.phase !== 'continuation'
  );
  const continuationMessages = allMessages.filter(
    (m) => m.phase === 'continuation'
  );
  const userMessageCount = allMessages.filter((m) => m.role === 'user').length;
  const hasAnalysisResult = Boolean(consultation.result);

  const scrollToBottom = () => {
    if (
      messagesEndRef.current &&
      typeof messagesEndRef.current.scrollIntoView === 'function'
    ) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  };

  // Automatically send initial message typed on the Home screen or Tips/Guides
  useEffect(() => {
    if (
      initialPendingMessage &&
      initialPendingMessage.trim() &&
      hasSentInitialRef.current !== initialPendingMessage
    ) {
      hasSentInitialRef.current = initialPendingMessage;
      const msgToSend = initialPendingMessage.trim();
      if (onClearPendingMessage) {
        onClearPendingMessage();
      }
      void handleSendUserMessage(msgToSend);
    }
  }, [initialPendingMessage]);

  const toggleRefs = (key: string) => {
    setExpandedRefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Persist generated document metadata into consultation
  const recordGeneratedDocument = (meta: GeneratedDocumentMeta | null) => {
    if (!meta) return;
    const existing = consultation.generatedDocuments || [];
    const filtered = existing.filter((d) => d.fileName !== meta.fileName);
    const updated: Consultation = {
      ...consultation,
      generatedDocuments: [meta, ...filtered],
      updatedAt: new Date().toISOString(),
    };
    onUpdateConsultation(updated);
    setDownloadFeedback(
      isEn
        ? `Document downloaded: ${meta.fileName}`
        : `Dokumen berhasil diunduh: ${meta.fileName}`
    );
    setTimeout(() => {
      setDownloadFeedback(null);
    }, 4500);
  };

  const handleDownloadConsultationReport = () => {
    const meta = downloadConsultationReportPdf(
      consultation,
      actingUserId,
      language
    );
    recordGeneratedDocument(meta);
  };

  const handleDownloadActionPlan = () => {
    const meta = downloadActionPlanPdf(consultation, actingUserId, language);
    recordGeneratedDocument(meta);
  };

  const handleDownloadTailoredDoc = (
    format: DeliverableFormat = 'PDF',
    customDeliverable?: typeof activeDeliverable
  ) => {
    const targetDeliverable = customDeliverable || activeDeliverable || undefined;
    const meta = downloadTailoredBusinessDocument(
      consultation,
      format,
      actingUserId,
      targetDeliverable
    );
    recordGeneratedDocument(meta);
  };

  // Inspect a public URL using Gemini URL Context tool
  const handleInspectPublicUrl = async () => {
    const cleanUrl = publicUrlInput.trim();
    if (!cleanUrl || isInspectingUrl) return;
    setIsInspectingUrl(true);
    setApiError(null);
    try {
      const inspected = await inspectPublicUrl({
        url: cleanUrl,
        consultation,
        actingUserId,
      });

      const userUrlMsg: Message = {
        id: `msg-url-user-${Date.now()}`,
        consultationId: consultation.id,
        role: 'user',
        content: isEn
          ? `Please inspect this public link for my business: ${cleanUrl}`
          : `Tolong periksa tautan publik berikut untuk usaha saya: ${cleanUrl}`,
        createdAt: new Date().toISOString(),
        phase: consultation.result ? 'continuation' : 'discovery',
      };

      const aiUrlMsg: Message = {
        id: `msg-url-ai-${Date.now()}`,
        consultationId: consultation.id,
        role: 'assistant',
        content: inspected.summary,
        createdAt: new Date().toISOString(),
        phase: consultation.result ? 'continuation' : 'discovery',
        externalReferences: inspected.externalReferences,
      };

      const updated: Consultation = {
        ...consultation,
        messages: [...consultation.messages, userUrlMsg, aiUrlMsg],
        result: consultation.result
          ? {
              ...consultation.result,
              externalReferences: [
                ...(inspected.externalReferences || []),
                ...(consultation.result.externalReferences || []),
              ].slice(0, 5),
            }
          : null,
        updatedAt: new Date().toISOString(),
      };

      onUpdateConsultation(updated);
      setPublicUrlInput('');
      setShowUrlInspector(false);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setApiError(
        err instanceof Error
          ? err.message
          : isEn
            ? 'Failed to inspect public URL.'
            : 'Gagal memeriksa URL publik.'
      );
    } finally {
      setIsInspectingUrl(false);
    }
  };

  // Run AI Analysis & Recommendations directly inside the conversation
  const handleGenerateInlineAnalysis = async (
    targetConsultation: Consultation = consultation
  ) => {
    if (isAnalyzing) return;

    const executeAnalysis = async () => {
      setIsAnalyzing(true);
      setApiError(null);
      try {
        const refreshedCtx = extractContextFromConversation(
          targetConsultation,
          targetConsultation.messages
        );
        const consultationWithCtx: Consultation = {
          ...targetConsultation,
          workTopic: refreshedCtx.workTopic,
          businessContext: refreshedCtx,
        };

        const { result } = await requestBusinessDiagnosis({
          consultation: consultationWithCtx,
          documents,
          actingUserId,
        });

        const updated: Consultation = {
          ...consultationWithCtx,
          result,
          currentStep: 'step-06-results',
          consultationStatus: 'Analyzed & Active',
          updatedAt: new Date().toISOString(),
        };

        setDraftSummary(result.problemSummary);
        setDraftMainChallenge(result.mainProblem);
        setDraftFactsText((refreshedCtx.confirmedFacts || []).join('\n'));

        onUpdateConsultation(updated);
        setLastFailedAction(null);
        setTimeout(scrollToBottom, 120);
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : isEn
              ? 'Failed to generate consultation analysis and recommendations.'
              : 'Gagal menyusun analisis dan rekomendasi konsultasi.'
        );
        setLastFailedAction(() => executeAnalysis);
      } finally {
        setIsAnalyzing(false);
      }
    };

    await executeAnalysis();
  };

  // Unified Chat Message Handler (AI conversation language follows user's message naturally)
  const handleSendUserMessage = async (overrideText?: string) => {
    const content = (overrideText ?? composerInput).trim();
    if (!content || isLoadingAI || isAnalyzing) return;

    if (!overrideText) {
      setComposerInput('');
    }
    setApiError(null);
    setStrategyUpdatedNotice(null);

    if (consultation.result) {
      const userMsg: Message = {
        id: `msg-cont-${Date.now()}-user`,
        consultationId: consultation.id,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
        phase: 'continuation',
      };

      const messagesWithUser = [...consultation.messages, userMsg];
      const updatedWithUser: Consultation = {
        ...consultation,
        messages: messagesWithUser,
        updatedAt: new Date().toISOString(),
      };
      onUpdateConsultation(updatedWithUser);
      setTimeout(scrollToBottom, 80);

      const executeContinuation = async () => {
        setIsLoadingAI(true);
        setApiError(null);
        try {
          const response = await sendContinuationMessage({
            consultation: updatedWithUser,
            userQuestion: content,
            documents,
            actingUserId,
          });

          const aiMsg: Message = {
            id: `msg-cont-${Date.now()}-ai`,
            consultationId: consultation.id,
            role: 'assistant',
            content: response.reply,
            createdAt: new Date().toISOString(),
            phase: 'continuation',
            knowledgeReferences: response.knowledgeReferences,
            externalReferences: response.externalReferences,
            videoResources: response.videoResources,
          };

          const currentResult = consultation.result!;
          const nextRecommendations =
            response.updatedRecommendations &&
            response.updatedRecommendations.length > 0
              ? response.updatedRecommendations
              : currentResult.recommendations;

          const nextActionPlan =
            response.updatedActionPlan && response.updatedActionPlan.length > 0
              ? response.updatedActionPlan
              : currentResult.actionPlan;

          if (response.updatedRecommendations || response.updatedActionPlan) {
            setStrategyUpdatedNotice(
              isEn
                ? 'The recommendations and action plan above have been updated to reflect your latest discussion.'
                : 'Rekomendasi dan rencana tindakan di atas telah diperbarui menyesuaikan diskusi terbaru Anda.'
            );
          }

          onUpdateConsultation({
            ...updatedWithUser,
            messages: [...messagesWithUser, aiMsg],
            result: {
              ...currentResult,
              recommendations: nextRecommendations,
              actionPlan: nextActionPlan,
              updatedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          });
          setLastFailedAction(null);
          setTimeout(scrollToBottom, 100);
        } catch (err) {
          setApiError(
            err instanceof Error
              ? err.message
              : isEn
                ? 'Failed to process follow-up message.'
                : 'Gagal memproses pesan lanjutan.'
          );
          setLastFailedAction(() => executeContinuation);
        } finally {
          setIsLoadingAI(false);
        }
      };

      await executeContinuation();
      return;
    }

    const isFirstMessage = discoveryMessages.length === 0;
    const initialProblemText = isFirstMessage
      ? content
      : consultation.initialProblem || content;

    const shortSnippet =
      content.length > 44 ? `${content.slice(0, 44).trim()}...` : content;

    const userMsg: Message = {
      id: `msg-${Date.now()}-user`,
      consultationId: consultation.id,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      phase: 'discovery',
    };

    const nextMessages = [...consultation.messages, userMsg];
    const baseDraft: Consultation = {
      ...consultation,
      initialProblem: initialProblemText,
      title:
        consultation.businessName.trim()
          ? `${consultation.businessName.trim()} — ${consultation.workTopic}`
          : isFirstMessage && content.length > 5
            ? shortSnippet
            : consultation.title,
      currentStep: 'step-04-discovery',
      consultationStatus: 'Discovery',
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    };

    const extractedCtx = extractContextFromConversation(baseDraft, nextMessages);
    const updatedWithUser: Consultation = {
      ...baseDraft,
      workTopic: extractedCtx.workTopic,
      businessContext: extractedCtx,
    };

    onUpdateConsultation(updatedWithUser);
    setTimeout(scrollToBottom, 80);

    const executeDiscoveryTurn = async () => {
      setIsLoadingAI(true);
      setApiError(null);
      try {
        const res = await sendDiscoveryMessage({
          consultation: updatedWithUser,
          messages: nextMessages,
          documents,
          actingUserId,
        });

        const aiMsg: Message = {
          id: `msg-${Date.now()}-ai`,
          consultationId: consultation.id,
          role: 'assistant',
          content: res.reply,
          createdAt: new Date().toISOString(),
          phase: 'discovery',
          knowledgeReferences: res.knowledgeReferences,
          externalReferences: res.externalReferences,
          videoResources: res.videoResources,
        };

        const updatedAfterDiscovery: Consultation = {
          ...updatedWithUser,
          workTopic: res.updatedContext.workTopic || updatedWithUser.workTopic,
          currentStep: res.readyForUnderstanding
            ? 'step-05-understanding'
            : 'step-04-discovery',
          messages: [...nextMessages, aiMsg],
          businessContext: res.updatedContext,
          consultationStatus: res.readyForUnderstanding
            ? 'Understanding Review'
            : 'Discovery',
          updatedAt: new Date().toISOString(),
        };

        onUpdateConsultation(updatedAfterDiscovery);
        setLastFailedAction(null);
        setTimeout(scrollToBottom, 100);

        const asksForImmediateSolution =
          /(rekomendasi|solusi|analisis|langkah|action plan|apa yang harus saya lakukan|recommend|solution|analyze)/i.test(
            content
          );
        const nextUserCount = nextMessages.filter((m) => m.role === 'user').length;
        if (
          (res.readyForUnderstanding && nextUserCount >= 3) ||
          (asksForImmediateSolution && nextUserCount >= 2)
        ) {
          await handleGenerateInlineAnalysis(updatedAfterDiscovery);
        }
      } catch (err) {
        setApiError(
          err instanceof Error
            ? err.message
            : isEn
              ? 'Failed to process consultation response. Your message is saved.'
              : 'Gagal memproses respons konsultasi. Pesan Anda tetap tersimpan.'
        );
        setLastFailedAction(() => executeDiscoveryTurn);
      } finally {
        setIsLoadingAI(false);
      }
    };

    await executeDiscoveryTurn();
  };

  // Interactive Action Plan Checklist Toggle inside Conversation
  const handleToggleChecklistItem = (dayNumber: number) => {
    if (!consultation.result) return;
    const updatedPlan = consultation.result.actionPlan.map((item) =>
      item.day === dayNumber ? { ...item, completed: !item.completed } : item
    );
    const monitoringDraft: ImplementationMonitoringData = {
      baselineInquiriesWeekly: baselineInquiries,
      currentInquiriesWeekly: currentInquiries,
      baselineTransactionsWeekly: baselineTransactions,
      currentTransactionsWeekly: currentTransactions,
      obstaclesReported: obstaclesText,
      implementationNotes: '',
      lastUpdatedAt: new Date().toISOString(),
    };
    const progressEval = evaluateImplementationProgress(
      monitoringDraft,
      language
    );

    onUpdateConsultation({
      ...consultation,
      result: {
        ...consultation.result,
        actionPlan: updatedPlan,
        implementationMonitoring: {
          ...monitoringDraft,
          implementationNotes: progressEval.summaryText,
        },
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Recalculate Deterministic Business Calculator with User-Verified Inputs
  const handleRecalculateDeterministicAnalysis = () => {
    if (!consultation.result) return;
    const nextAnalysis = buildDeterministicAnalysisForConsultation(
      consultation,
      calcInputValues,
      true
    );

    onUpdateConsultation({
      ...consultation,
      result: {
        ...consultation.result,
        deterministicAnalysis: nextAnalysis,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
  };

  // Save Implementation Monitoring Progress
  const handleSaveImplementationMonitoring = (askAiAdjustment = false) => {
    if (!consultation.result) return;
    const completedCount = consultation.result.actionPlan.filter(
      (a) => a.completed
    ).length;
    const totalCount = consultation.result.actionPlan.length;

    const baseMonitoring: ImplementationMonitoringData = {
      baselineInquiriesWeekly: baselineInquiries,
      currentInquiriesWeekly: currentInquiries,
      baselineTransactionsWeekly: baselineTransactions,
      currentTransactionsWeekly: currentTransactions,
      obstaclesReported: obstaclesText.trim(),
      implementationNotes: '',
      lastUpdatedAt: new Date().toISOString(),
    };

    const progressEval = evaluateImplementationProgress(
      baseMonitoring,
      language
    );

    const nextMonitoring: ImplementationMonitoringData = {
      ...baseMonitoring,
      implementationNotes: progressEval.summaryText,
    };

    const updated: Consultation = {
      ...consultation,
      result: {
        ...consultation.result,
        implementationMonitoring: nextMonitoring,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };
    onUpdateConsultation(updated);

    if (askAiAdjustment) {
      const followUpPrompt = isEn
        ? `Implementation update: Completed ${completedCount}/${totalCount} action steps. Weekly inquiries changed from ${baselineInquiries} -> ${currentInquiries}, and weekly transactions changed from ${baselineTransactions} -> ${currentTransactions}.${obstaclesText ? ` Obstacles encountered: ${obstaclesText}.` : ''} Please evaluate these results and adjust our next steps if needed.`
        : `Pembaruan implementasi: Saya telah menyelesaikan ${completedCount}/${totalCount} langkah rencana tindakan. Pertanyaan masuk mingguan berubah dari ${baselineInquiries} -> ${currentInquiries}, dan transaksi mingguan dari ${baselineTransactions} -> ${currentTransactions}.${obstaclesText ? ` Kendala di lapangan: ${obstaclesText}.` : ''} Mohon evaluasi perkembangan ini dan sesuaikan langkah strategi berikutnya bila diperlukan.`;
      void handleSendUserMessage(followUpPrompt);
    }
  };

  // Save inline Understanding edits
  const handleSaveUnderstanding = () => {
    if (!consultation.result) return;
    const cleanedFacts = draftFactsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    onUpdateConsultation({
      ...consultation,
      businessContext: {
        ...consultation.businessContext,
        mainChallenge:
          draftMainChallenge.trim() ||
          consultation.businessContext.mainChallenge,
        confirmedFacts:
          cleanedFacts.length > 0
            ? cleanedFacts
            : consultation.businessContext.confirmedFacts,
      },
      result: {
        ...consultation.result,
        problemSummary:
          draftSummary.trim() || consultation.result.problemSummary,
        mainProblem:
          draftMainChallenge.trim() || consultation.result.mainProblem,
        updatedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });
    setIsEditingUnderstanding(false);
  };

  // Recommendation helpfulness feedback
  const handleRecommendationFeedback = (
    recId: string,
    feedback: 'helpful' | 'needs-adjustment'
  ) => {
    if (!consultation.result) return;
    const updatedRecs = consultation.result.recommendations.map((rec) =>
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
        ...consultation.result,
        recommendations: updatedRecs,
        updatedAt: new Date().toISOString(),
      },
    });
  };

  // Render Knowledge Base + External References + Video Resources Drawer
  const renderKnowledgeReferencesDrawer = (
    refs: KnowledgeReference[] | undefined,
    externalRefs: ExternalReference[] | undefined,
    videos: VideoResource[] | undefined,
    drawerKey: string
  ) => {
    const validRefs = refs || [];
    const validExt = externalRefs || [];
    const validVideos = videos || [];
    const totalCount =
      validRefs.length + validExt.length + validVideos.length;

    if (totalCount === 0) return null;

    const isOpen = Boolean(expandedRefs[drawerKey]);

    return (
      <div className="mt-4 pt-3 border-t border-subtle">
        <button
          type="button"
          onClick={() => toggleRefs(drawerKey)}
          className="inline-flex items-center gap-2 text-[13px] font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
        >
          <BookOpen className="w-4 h-4" />
          <span>
            {t.referencesButtonPrefix} ({validRefs.length} Knowledge Base
            {validExt.length > 0
              ? ` · ${validExt.length} ${isEn ? 'External' : 'Sumber Eksternal'}`
              : ''}
            {validVideos.length > 0
              ? ` · ${validVideos.length} ${isEn ? 'Videos' : 'Video'}`
              : ''}
            )
          </span>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {isOpen && (
          <div className="mt-3 space-y-4 animate-fade-up">
            {/* Internal Knowledge Base References */}
            {validRefs.length > 0 && (
              <div className="space-y-2.5">
                <p className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary">
                  {t.internalKbHeader}
                </p>
                {validRefs.map((ref) => (
                  <div
                    key={ref.id}
                    className="p-4 rounded-[14px] border border-subtle bg-surface space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-primary">
                        {ref.documentTitle}
                      </span>
                      <span className="font-mono-meta text-[12px] px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle text-secondary">
                        {ref.sectionHeading}
                        {ref.pageNumber !== null
                          ? ` · ${isEn ? 'p.' : 'Hal.'} ${ref.pageNumber}`
                          : ''}
                      </span>
                    </div>
                    {ref.relevanceReason && (
                      <p className="text-[13px] text-secondary">
                        {isEn ? 'Relevance:' : 'Relevansi:'}{' '}
                        {ref.relevanceReason}
                      </p>
                    )}
                    <p className="text-[14px] text-primary leading-relaxed pt-1 border-t border-subtle">
                      {ref.relevantContent}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Verified External References (Curated Official, Google Search Grounding, or URL Context) */}
            {validExt.length > 0 && (
              <div className="space-y-2.5">
                <p className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary">
                  {t.externalRefsHeader}
                </p>
                {validExt.map((ext) => (
                  <div
                    key={ext.id}
                    className="p-4 rounded-[14px] border border-subtle bg-surface-secondary space-y-1.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[14px] font-semibold text-primary">
                        {ext.title}
                      </span>
                      <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                        {ext.sourceType === 'google-search-grounding'
                          ? 'Google Search Grounding'
                          : ext.sourceType === 'url-context'
                            ? 'URL Context'
                            : isEn
                              ? 'Official Reference'
                              : 'Sumber Resmi'}{' '}
                        · {ext.updatedAt || '2026'}
                      </span>
                    </div>
                    <p className="text-[13px] text-secondary">
                      {t.publisherLabel}{' '}
                      <strong className="text-primary">{ext.publisher}</strong>
                    </p>
                    <p className="text-[13px] text-primary leading-relaxed">
                      {ext.relevanceReason}
                    </p>
                    <a
                      href={ext.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary underline underline-offset-4 pt-1"
                    >
                      <span>
                        {t.openSourceLink} ({ext.url})
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {/* External Video Resources with Verified Topic Timestamps */}
            {validVideos.length > 0 && (
              <div className="space-y-2.5">
                <p className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary">
                  {t.videoResourcesHeader}
                </p>
                {validVideos.map((vid) => (
                  <div
                    key={vid.id}
                    className="p-4 rounded-[14px] border border-subtle bg-surface-secondary space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="w-4 h-4 text-primary shrink-0" />
                          <span className="text-[14px] font-semibold text-primary">
                            {vid.title}
                          </span>
                        </div>
                        <p className="text-[12px] text-secondary">
                          {vid.channelOrSource} · {vid.durationLabel}
                        </p>
                        <p className="text-[13px] text-primary">
                          {vid.topicRelevance}
                        </p>
                      </div>
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] border border-subtle bg-surface text-[13px] font-medium text-primary hover:bg-app transition-colors shrink-0"
                      >
                        <span>{t.watchVideoBtn}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {vid.verifiedTimestamps &&
                      vid.verifiedTimestamps.length > 0 && (
                        <div className="pt-2.5 border-t border-subtle space-y-1.5">
                          <p className="font-mono-meta text-[11px] text-secondary flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>
                              {isEn
                                ? 'KEY VIDEO SEGMENTS & TIMESTAMPS'
                                : 'SEGMEN MATERI & TIMESTAMP PENTING'}
                            </span>
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {vid.verifiedTimestamps.map((seg, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-2.5 rounded-[10px] bg-surface border border-subtle text-[12px] space-y-1"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono-meta text-[11px] px-2 py-0.5 rounded bg-surface-secondary border border-subtle text-primary font-semibold">
                                    {seg.time}
                                  </span>
                                  <span className="font-medium text-primary truncate">
                                    {seg.topic}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Render single chat message bubble with rounded visual system (16px)
  const renderMessageBubble = (msg: Message) => {
    const isUser = msg.role === 'user';

    if (isUser) {
      return (
        <div key={msg.id} className="flex justify-end animate-message-in">
          <div className="max-w-[85%] sm:max-w-[78%] px-5 py-4 rounded-[16px] bg-surface-secondary border border-subtle text-primary">
            <div className="flex items-center justify-between gap-4 mb-1.5 font-mono-meta text-[12px] text-secondary">
              <span>{isEn ? 'You' : 'Anda'}</span>
              <span>
                {new Date(msg.createdAt).toLocaleTimeString(
                  isEn ? 'en-US' : 'id-ID',
                  {
                    hour: '2-digit',
                    minute: '2-digit',
                  }
                )}
              </span>
            </div>
            <div className="text-[16px] sm:text-[17px] leading-[1.6] whitespace-pre-line">
              {msg.content}
            </div>
          </div>
        </div>
      );
    }

    return (
      <article
        key={msg.id}
        className="w-full p-6 sm:p-7 rounded-[16px] bg-surface border border-subtle text-primary animate-message-in"
      >
        <div className="flex items-center justify-between gap-4 mb-3 font-mono-meta text-[12px] text-secondary">
          <span className="font-medium text-primary">Noevia</span>
          <span>
            {new Date(msg.createdAt).toLocaleTimeString(
              isEn ? 'en-US' : 'id-ID',
              {
                hour: '2-digit',
                minute: '2-digit',
              }
            )}
          </span>
        </div>

        <div className="text-[17px] sm:text-[18px] leading-[1.65] text-primary whitespace-pre-line">
          {msg.content}
        </div>

        {renderKnowledgeReferencesDrawer(
          msg.knowledgeReferences,
          msg.externalReferences,
          msg.videoResources,
          `msg-ref-${msg.id}`
        )}
      </article>
    );
  };

  const deliverableCatalog = consultation.result
    ? buildDeliverableCatalogForDomain(consultation.workTopic, consultation)
    : [];

  const activeDeliverable =
    deliverableCatalog[selectedDeliverableIndex] ||
    consultation.result?.tailoredDeliverable ||
    (consultation.result
      ? buildTailoredDeliverable(consultation.workTopic, consultation)
      : null);

  const activeConsultingReport = consultation.result
    ? buildProfessionalConsultingReport(consultation, language, actingUserId)
    : null;

  const activeVisualDiagram =
    consultation.result?.visualDiagram ||
    (consultation.result
      ? buildVisualDiagramForDomain(consultation.workTopic, consultation)
      : null);

  const activeProblemMatrix =
    consultation.result?.problemAnalysisMatrix ||
    (consultation.result
      ? buildProblemAnalysisMatrixForDomain(
          consultation.workTopic,
          consultation.businessContext
        )
      : []);

  const activeDeterministicAnalysis: DeterministicBusinessAnalysis | null =
    consultation.result?.deterministicAnalysis ||
    (consultation.result
      ? buildDeterministicAnalysisForConsultation(consultation)
      : null);

  const displayTitle =
    consultation.title === 'Sesi Konsultasi Bisnis Baru' && isEn
      ? t.defaultTitle
      : consultation.title || t.defaultTitle;

  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-3.5rem)] lg:min-h-screen bg-app text-primary animate-fade-in">
      {/* Main Scrollable Conversation Area */}
      <div className="flex-1 w-full max-w-[820px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-10 space-y-6">
        {/* Conversation Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-subtle">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full border border-subtle bg-surface-secondary text-secondary">
                {consultation.workTopic}
              </span>
              {consultation.businessName && (
                <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full border border-subtle bg-surface text-secondary">
                  {consultation.businessName}
                </span>
              )}
            </div>
            <h1 className="text-[22px] sm:text-[26px] font-semibold tracking-tight text-primary">
              {displayTitle}
            </h1>
            <p className="text-[14px] text-secondary">{t.subtitle}</p>
          </div>

          <div className="flex items-center gap-2.5">
            {!hasAnalysisResult && userMessageCount >= 1 && (
              <button
                type="button"
                disabled={isAnalyzing || isLoadingAI}
                onClick={() => handleGenerateInlineAnalysis()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] btn-primary text-[14px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t.analyzingBtn}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t.showAnalysisBtn}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {apiError && (
          <div
            role="alert"
            className="p-4 rounded-[16px] border border-[var(--text-primary)] bg-surface-secondary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-start gap-2.5 text-[14px] text-primary">
              <AlertCircle className="w-4 h-4 shrink-0 mt-1" />
              <span>{apiError}</span>
            </div>
            {lastFailedAction && (
              <button
                type="button"
                onClick={() => lastFailedAction()}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[11px] btn-primary text-[13px] font-medium cursor-pointer shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{t.retryBtn}</span>
              </button>
            )}
          </div>
        )}

        {/* Opening Consultant Message */}
        <article className="p-6 sm:p-7 rounded-[16px] bg-surface border border-subtle space-y-4 animate-fade-up">
          <div className="flex items-center justify-between font-mono-meta text-[12px] text-secondary">
            <span className="font-medium text-primary">Noevia</span>
            <span>{t.consultantRole}</span>
          </div>

          <p className="text-[17px] sm:text-[18px] leading-[1.65] text-primary">
            {t.openingGreeting}
          </p>

          {allMessages.length === 0 && (
            <div className="pt-3 border-t border-subtle space-y-2.5">
              <p className="text-[13px] text-secondary">
                {t.starterPromptIntro}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleSendUserMessage(SWEETBITE_DEMO_PRESET.initialProblem)
                  }
                  className="text-left px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[14px] text-primary transition-colors cursor-pointer"
                >
                  {t.starterPrompt1}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendUserMessage(
                      'Omzet usaha kuliner saya cukup ramai setiap hari, tetapi keuntungan bersih selalu tipis dan saya bingung menghitung HPP serta harga jual yang benar.'
                    )
                  }
                  className="text-left px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[14px] text-primary transition-colors cursor-pointer"
                >
                  {t.starterPrompt2}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSendUserMessage(
                      'Stok bahan baku sering habis mendadak saat pesanan ramai dan kualitas produksi belum konsisten karena belum ada SOP tertulis.'
                    )
                  }
                  className="text-left px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[14px] text-primary transition-colors cursor-pointer"
                >
                  {t.starterPrompt3}
                </button>
              </div>
            </div>
          )}
        </article>

        {/* Discovery Conversation Messages */}
        {discoveryMessages.map((msg) => renderMessageBubble(msg))}

        {/* Natural Confirmation Prompt inside conversation when ready for analysis */}
        {!hasAnalysisResult &&
          userMessageCount >= 2 &&
          !isLoadingAI &&
          !isAnalyzing && (
            <div className="p-5 sm:p-6 rounded-[16px] border border-subtle bg-surface-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-[16px] font-semibold text-primary">
                  {t.contextReadyTitle}
                </p>
                <p className="text-[14px] text-secondary">
                  {t.contextReadySubtitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleGenerateInlineAnalysis()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] btn-primary text-[14px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{t.showAnalysisBtn}</span>
              </button>
            </div>
          )}

        {/* ================================================================= */}
        {/* INLINE AI ANALYSIS, VISUAL EXPLANATION, ACTION PLAN & DELIVERABLES */}
        {/* ================================================================= */}
        {consultation.result && (
          <section
            aria-label={t.analysisHeaderTitle}
            className="rounded-[18px] border border-[var(--text-primary)] bg-surface p-6 sm:p-8 space-y-8 animate-scale-in"
          >
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-subtle pb-5">
              <div>
                <p className="font-mono-meta text-[12px] text-secondary">
                  {t.analysisHeaderBadge}
                </p>
                <h2 className="text-[24px] sm:text-[28px] font-semibold tracking-tight text-primary mt-1">
                  {t.analysisHeaderTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDraftSummary(consultation.result!.problemSummary);
                  setDraftMainChallenge(consultation.result!.mainProblem);
                  setDraftFactsText(
                    (consultation.businessContext.confirmedFacts || []).join(
                      '\n'
                    )
                  );
                  setIsEditingUnderstanding(!isEditingUnderstanding);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[13px] font-medium text-primary transition-colors cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>
                  {isEditingUnderstanding
                    ? t.closeEditBtn
                    : t.editUnderstandingBtn}
                </span>
              </button>
            </div>

            {/* 1. What We Understand */}
            <div className="space-y-4">
              <h3 className="text-[20px] font-semibold text-primary">
                {t.sec1Title}
              </h3>

              {isEditingUnderstanding ? (
                <div className="p-5 rounded-[16px] border border-subtle bg-surface-secondary space-y-4">
                  <div>
                    <label
                      htmlFor="inline-edit-summary"
                      className="block text-[13px] font-medium text-primary mb-1"
                    >
                      {t.editSummaryLabel}
                    </label>
                    <textarea
                      id="inline-edit-summary"
                      rows={3}
                      value={draftSummary}
                      onChange={(e) => setDraftSummary(e.target.value)}
                      className="w-full p-3 rounded-[12px] text-[15px] border border-subtle bg-surface text-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inline-edit-challenge"
                      className="block text-[13px] font-medium text-primary mb-1"
                    >
                      {t.editChallengeLabel}
                    </label>
                    <input
                      id="inline-edit-challenge"
                      type="text"
                      value={draftMainChallenge}
                      onChange={(e) => setDraftMainChallenge(e.target.value)}
                      className="w-full p-3 rounded-[12px] text-[15px] border border-subtle bg-surface text-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="inline-edit-facts"
                      className="block text-[13px] font-medium text-primary mb-1"
                    >
                      {t.editFactsLabel}
                    </label>
                    <textarea
                      id="inline-edit-facts"
                      rows={3}
                      value={draftFactsText}
                      onChange={(e) => setDraftFactsText(e.target.value)}
                      className="w-full p-3 rounded-[12px] text-[14px] border border-subtle bg-surface text-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingUnderstanding(false)}
                      className="px-4 py-2 rounded-[11px] border border-subtle bg-surface text-[13px] text-secondary cursor-pointer"
                    >
                      {t.cancelBtn}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUnderstanding}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[11px] btn-primary text-[13px] font-medium cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{t.saveBtn}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-[16px] sm:text-[17px] text-primary leading-[1.65]">
                  {consultation.result.problemSummary}
                </p>
              )}

              {/* Distinction between Confirmed Facts and Assumptions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="p-4 rounded-[14px] border border-subtle bg-surface-secondary space-y-2">
                  <p className="text-[14px] font-semibold text-primary">
                    {t.confirmedFactsTitle}
                  </p>
                  <ul className="space-y-1.5 text-[15px] text-primary leading-[1.55]">
                    {(consultation.businessContext.confirmedFacts || []).map(
                      (fact, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-secondary">•</span>
                          <span>{fact}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="p-4 rounded-[14px] border border-subtle bg-surface-secondary space-y-2">
                  <p className="text-[14px] font-semibold text-primary">
                    {t.assumptionsTitle}
                  </p>
                  <ul className="space-y-1.5 text-[15px] text-secondary leading-[1.55]">
                    {(
                      consultation.businessContext.assumptionsToVerify ||
                      consultation.result.additionalConsiderations
                    ).map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 2. Main Business Challenge */}
            <div className="space-y-2 border-t border-subtle pt-6">
              <h3 className="text-[20px] font-semibold text-primary">
                {t.sec2Title}
              </h3>
              <div className="p-5 rounded-[14px] border border-subtle bg-surface-secondary">
                <p className="text-[17px] sm:text-[18px] font-medium text-primary leading-[1.55]">
                  {consultation.result.mainProblem}
                </p>
              </div>
            </div>

            {/* 3. Possible Root Causes & Structured Problem-Analysis Matrix */}
            <div className="space-y-5 border-t border-subtle pt-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-[20px] font-semibold text-primary">
                    {t.sec3Title}
                  </h3>
                  <p className="text-[14px] text-secondary mt-0.5">
                    {isEn
                      ? 'Structured root-cause hypotheses, supporting evidence, required verification data, and solution direction.'
                      : 'Pemetaan terstruktur kemungkinan penyebab, bukti saat ini, data yang perlu diverifikasi, risiko, dan arah solusi.'}
                  </p>
                </div>
                <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full border border-subtle bg-surface-secondary text-secondary inline-flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5" />
                  <span>Problem-Analysis Matrix</span>
                </span>
              </div>

              {activeProblemMatrix.length > 0 ? (
                <div
                  data-testid="problem-analysis-matrix"
                  className="overflow-x-auto rounded-[14px] border border-subtle"
                >
                  <table className="w-full text-left border-collapse text-[13px] sm:text-[14px]">
                    <thead>
                      <tr className="bg-surface-secondary border-b border-subtle text-primary font-semibold">
                        <th className="p-3.5 min-w-[180px]">
                          {isEn ? 'Possible Cause' : 'Kemungkinan Penyebab'}
                        </th>
                        <th className="p-3.5 min-w-[170px]">
                          {isEn
                            ? 'Supporting Evidence'
                            : 'Bukti / Indikasi Saat Ini'}
                        </th>
                        <th className="p-3.5 min-w-[170px]">
                          {isEn
                            ? 'Data Needed to Verify'
                            : 'Data untuk Verifikasi'}
                        </th>
                        <th className="p-3.5 min-w-[160px]">
                          {isEn ? 'Risk if Unaddressed' : 'Risiko Jika Dibiarkan'}
                        </th>
                        <th className="p-3.5 min-w-[180px]">
                          {isEn ? 'Solution Direction' : 'Arah Solusi'}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] bg-surface">
                      {activeProblemMatrix.map((row, rIdx) => (
                        <tr key={rIdx} className="align-top">
                          <td className="p-3.5 font-medium text-primary space-y-1.5">
                            <div>{row.possibleCause}</div>
                            <span className="inline-block font-mono-meta text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-subtle text-secondary">
                              {row.verificationStatus}
                            </span>
                          </td>
                          <td className="p-3.5 text-secondary leading-relaxed">
                            {row.supportingEvidence}
                          </td>
                          <td className="p-3.5 text-secondary leading-relaxed">
                            {row.requiredEvidence}
                          </td>
                          <td className="p-3.5 text-secondary leading-relaxed">
                            {row.riskIfUnaddressed}
                          </td>
                          <td className="p-3.5 text-primary font-medium leading-relaxed">
                            {row.solutionDirection}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-subtle">
                  {consultation.result.possibleCauses.map((cause, idx) => (
                    <div key={idx} className="py-4 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[16px] font-semibold text-primary">
                          {idx + 1}. {cause.cause}
                        </span>
                        <span className="font-mono-meta text-[12px] px-3 py-0.5 rounded-full bg-surface-secondary border border-subtle text-secondary">
                          {cause.confidence}
                        </span>
                      </div>
                      <p className="text-[16px] text-secondary leading-[1.6]">
                        {cause.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3B. Deterministic Financial & Operational Calculator (Phase 3.5) */}
            {activeDeterministicAnalysis && (
              <div
                data-testid="deterministic-calculator-panel"
                className="p-5 sm:p-6 rounded-[16px] border border-subtle bg-surface-secondary space-y-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono-meta text-[11px] uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-primary inline-flex items-center gap-1.5">
                        <Calculator className="w-3.5 h-3.5" />
                        <span>
                          {isEn
                            ? 'Deterministic Business Calculator'
                            : 'Kalkulator & Simulasi Numerik Deterministik'}
                        </span>
                      </span>
                      <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full border border-subtle bg-surface text-secondary">
                        {!activeDeterministicAnalysis.isIllustrative
                          ? isEn
                            ? 'Verified User Data'
                            : 'Data Aktual Pengguna'
                          : isEn
                            ? 'Illustrative Baseline (Editable)'
                            : 'Simulasi Awal Ilustratif (Dapat Diedit)'}
                      </span>
                    </div>
                    <h3 className="text-[19px] font-semibold text-primary mt-2">
                      {isEn
                        ? activeDeterministicAnalysis.titleEn
                        : activeDeterministicAnalysis.titleId}
                    </h3>
                  </div>
                </div>

                {/* Editable Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(activeDeterministicAnalysis.inputs).map(
                    ([inpKey, inpVal]) => {
                      const currentVal =
                        calcInputValues[inpKey] !== undefined
                          ? calcInputValues[inpKey]
                          : inpVal;
                      return (
                        <div
                          key={inpKey}
                          className="p-3 rounded-[12px] bg-surface border border-subtle space-y-1"
                        >
                          <label
                            htmlFor={`calc-input-${inpKey}`}
                            className="block text-[12px] text-secondary font-medium"
                          >
                            {inpKey}
                          </label>
                          <input
                            id={`calc-input-${inpKey}`}
                            type="number"
                            value={currentVal}
                            onChange={(e) =>
                              setCalcInputValues((prev) => ({
                                ...prev,
                                [inpKey]: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-full px-2.5 py-1.5 rounded-[8px] border border-subtle bg-surface-secondary text-[14px] font-semibold text-primary focus:outline-none focus:border-[var(--text-primary)]"
                          />
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleRecalculateDeterministicAnalysis()}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] btn-primary text-[13px] font-medium cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    <span>
                      {isEn
                        ? 'Recalculate with My Numbers'
                        : 'Hitung Ulang dengan Angka Usaha Saya'}
                    </span>
                  </button>
                </div>

                {/* Calculated Outputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-subtle">
                  {activeDeterministicAnalysis.computedMetrics.map(
                    (out, oIdx) => (
                      <div
                        key={oIdx}
                        className="p-3.5 rounded-[12px] bg-surface border border-subtle space-y-1"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[13px] text-secondary">
                            {isEn ? out.labelEn : out.labelId}
                          </span>
                          <span className="font-mono-meta text-[15px] font-semibold text-primary">
                            {out.valueFormatted}
                          </span>
                        </div>
                        <p className="font-mono-meta text-[11px] text-secondary">
                          {out.formula}
                        </p>
                        <p className="text-[12px] text-secondary leading-snug">
                          {isEn ? out.explanationEn : out.explanationId}
                        </p>
                      </div>
                    )
                  )}
                </div>

                {/* Explicit Formula & Assumptions */}
                <div className="p-3.5 rounded-[12px] bg-surface border border-subtle text-[12px] text-secondary space-y-1.5">
                  <p className="font-semibold text-primary">
                    {isEn
                      ? 'Methodology & Assumptions:'
                      : 'Metodologi & Asumsi Perhitungan:'}
                  </p>
                  <ul className="space-y-1">
                    {(isEn
                      ? activeDeterministicAnalysis.assumptionsEn
                      : activeDeterministicAnalysis.assumptionsId
                    ).map((assump, aIdx) => (
                      <li key={aIdx}>• {assump}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Contextual Visual Explanation Diagram */}
            {activeVisualDiagram && (
              <div className="space-y-4 border-t border-subtle pt-6">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary">
                      {t.visualFrameworkBadge}
                    </span>
                    <h3 className="text-[20px] font-semibold text-primary mt-0.5">
                      {activeVisualDiagram.title}
                    </h3>
                    <p className="text-[14px] text-secondary">
                      {activeVisualDiagram.subtitle}
                    </p>
                  </div>
                  <Layers className="w-5 h-5 text-secondary shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeVisualDiagram.steps.map((step, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-4 rounded-[14px] border border-subtle bg-surface-secondary flex flex-col justify-between space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[14px] font-semibold text-primary">
                          {step.label}
                        </span>
                        <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-primary shrink-0">
                          {step.valueOrNote}
                        </span>
                      </div>
                      <p className="text-[13px] text-secondary leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. Recommendations */}
            <div className="space-y-4 border-t border-subtle pt-6">
              <h3 className="text-[20px] font-semibold text-primary">
                {t.sec4Title}
              </h3>

              <div className="space-y-4">
                {consultation.result.recommendations.slice(0, 3).map((rec, idx) => (
                  <div
                    key={rec.id}
                    className="p-5 sm:p-6 rounded-[16px] border border-subtle bg-surface-secondary space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <span className="font-mono-meta text-[12px] px-2.5 py-0.5 rounded-full border border-subtle bg-surface text-secondary">
                          {t.priorityPrefix} {rec.priority}
                        </span>
                        <h4 className="text-[18px] sm:text-[20px] font-semibold text-primary mt-1.5">
                          {idx + 1}. {rec.title}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRecommendationFeedback(rec.id, 'helpful')
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[13px] transition-colors cursor-pointer ${
                            rec.helpfulFeedback === 'helpful'
                              ? 'btn-primary border-transparent'
                              : 'border-subtle bg-surface text-secondary hover:text-primary'
                          }`}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>{t.helpfulBtn}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRecommendationFeedback(
                              rec.id,
                              'needs-adjustment'
                            )
                          }
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border text-[13px] transition-colors cursor-pointer ${
                            rec.helpfulFeedback === 'needs-adjustment'
                              ? 'btn-primary border-transparent'
                              : 'border-subtle bg-surface text-secondary hover:text-primary'
                          }`}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>{t.adjustBtn}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[16px] text-primary leading-[1.6]">
                      {rec.description}
                    </p>

                    {rec.whyItFits && (
                      <p className="text-[15px] text-secondary leading-[1.6]">
                        <strong className="text-primary font-medium">
                          {t.whyItFitsLabel}
                        </strong>{' '}
                        {rec.whyItFits}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-2 border-t border-subtle">
                      <p className="text-[14px] font-medium text-primary">
                        {t.executionStepsLabel}
                      </p>
                      <ol className="space-y-1.5 text-[15px] text-primary leading-[1.6]">
                        {rec.steps.map((step, sIdx) => (
                          <li key={sIdx} className="flex items-start gap-2">
                            <span className="font-mono-meta text-[13px] text-secondary mt-0.5">
                              {sIdx + 1}.
                            </span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-subtle text-[14px] text-secondary">
                      <span>
                        <strong className="text-primary font-medium">
                          {t.resourcesLabel}
                        </strong>{' '}
                        {rec.requiredResources}
                      </span>
                      <span>
                        <strong className="text-primary font-medium">
                          {t.expectedOutcomeLabel}
                        </strong>{' '}
                        {rec.expectedOutcome}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. Practical Next Steps — Enriched Interactive Action Plan Checklist */}
            <div className="space-y-4 border-t border-subtle pt-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-[20px] font-semibold text-primary">
                    {t.sec5Title}
                  </h3>
                  <p className="text-[14px] text-secondary mt-0.5">
                    {t.sec5Subtitle}
                  </p>
                </div>
                <span className="font-mono-meta text-[12px] px-3 py-1 rounded-full border border-subtle bg-surface-secondary text-secondary">
                  {
                    consultation.result.actionPlan.filter((a) => a.completed)
                      .length
                  }{' '}
                  / {consultation.result.actionPlan.length} {t.completedSuffix}
                </span>
              </div>

              {strategyUpdatedNotice && (
                <div className="p-3.5 rounded-[12px] border border-[var(--text-primary)] bg-surface-secondary text-[14px] text-primary">
                  ✓ {strategyUpdatedNotice}
                </div>
              )}

              <div className="rounded-[16px] border border-subtle divide-y divide-[var(--border-subtle)] bg-surface overflow-hidden">
                {consultation.result.actionPlan.map((item) => {
                  const priorityBadge =
                    item.priority ||
                    (item.day <= 2
                      ? 'Tinggi'
                      : item.day <= 5
                        ? 'Menengah'
                        : 'Fondasi');
                  const timelineLabel = item.timeline || `Hari ${item.day}`;

                  return (
                    <div
                      key={item.day}
                      onClick={() => handleToggleChecklistItem(item.day)}
                      className="p-4 sm:p-5 flex items-start gap-4 hover:bg-surface-secondary transition-colors cursor-pointer"
                    >
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={Boolean(item.completed)}
                        aria-label={`${timelineLabel}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleChecklistItem(item.day);
                        }}
                        className={`mt-1 w-5 h-5 rounded-[6px] flex items-center justify-center border shrink-0 transition-colors cursor-pointer ${
                          item.completed
                            ? 'btn-primary border-transparent'
                            : 'border-subtle bg-surface text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>

                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`text-[16px] font-semibold leading-snug ${
                              item.completed
                                ? 'line-through text-secondary'
                                : 'text-primary'
                            }`}
                          >
                            {item.action}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle text-primary">
                              {timelineLabel}
                            </span>
                            <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                              {t.priorityPrefix} {priorityBadge}
                            </span>
                          </div>
                        </div>

                        <p className="text-[14px] sm:text-[15px] text-secondary leading-relaxed">
                          {item.objective}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 text-[12px] text-secondary">
                          <div className="px-2.5 py-1.5 rounded-[8px] bg-surface-secondary border border-subtle">
                            <strong className="text-primary">
                              {t.resourcesLabel}
                            </strong>{' '}
                            {item.requiredResources || 'Internal UMKM'}
                          </div>
                          <div className="px-2.5 py-1.5 rounded-[8px] bg-surface-secondary border border-subtle">
                            <strong className="text-primary">
                              {t.expectedOutcomeLabel}
                            </strong>{' '}
                            {item.expectedOutcome || item.objective}
                          </div>
                          <div className="px-2.5 py-1.5 rounded-[8px] bg-surface-secondary border border-subtle">
                            <strong className="text-primary">
                              {t.successIndicatorLabel}
                            </strong>{' '}
                            {item.successMeasurement ||
                              (isEn ? 'Completed on schedule' : 'Terlaksana sesuai jadwal')}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 5B. Implementation Monitoring & Progress Evaluation (Phase 5) */}
            <div
              data-testid="implementation-monitoring-panel"
              className="p-5 sm:p-6 rounded-[16px] border border-subtle bg-surface-secondary space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary inline-flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    <span>
                      {isEn
                        ? 'PHASE 5 · IMPLEMENTATION MONITORING'
                        : 'MONITORING IMPLEMENTASI & EVALUASI INDIKATOR'}
                    </span>
                  </span>
                  <h3 className="text-[19px] font-semibold text-primary mt-1">
                    {isEn
                      ? 'Compare Baseline vs. Current Business Indicators'
                      : 'Perbandingan Indikator Awal vs. Hasil Pelaksanaan'}
                  </h3>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[12px] bg-surface border border-subtle space-y-2.5">
                  <p className="text-[13px] font-semibold text-primary">
                    {isEn
                      ? 'Weekly Customer Inquiries (DM / WhatsApp)'
                      : 'Pertanyaan / Chat Masuk per Minggu'}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-secondary mb-1">
                        {isEn ? 'Baseline (Before)' : 'Kondisi Awal'}
                      </label>
                      <input
                        type="number"
                        value={baselineInquiries}
                        onChange={(e) =>
                          setBaselineInquiries(Number(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-subtle bg-surface-secondary text-[14px] text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-secondary mb-1">
                        {isEn ? 'Current (Now)' : 'Saat Ini'}
                      </label>
                      <input
                        type="number"
                        value={currentInquiries}
                        onChange={(e) =>
                          setCurrentInquiries(Number(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-subtle bg-surface-secondary text-[14px] font-semibold text-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-[12px] bg-surface border border-subtle space-y-2.5">
                  <p className="text-[13px] font-semibold text-primary">
                    {isEn
                      ? 'Weekly New / Total Transactions'
                      : 'Jumlah Transaksi per Minggu'}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-secondary mb-1">
                        {isEn ? 'Baseline (Before)' : 'Kondisi Awal'}
                      </label>
                      <input
                        type="number"
                        value={baselineTransactions}
                        onChange={(e) =>
                          setBaselineTransactions(Number(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-subtle bg-surface-secondary text-[14px] text-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-secondary mb-1">
                        {isEn ? 'Current (Now)' : 'Saat Ini'}
                      </label>
                      <input
                        type="number"
                        value={currentTransactions}
                        onChange={(e) =>
                          setCurrentTransactions(Number(e.target.value) || 0)
                        }
                        className="w-full px-2.5 py-1.5 rounded-[8px] border border-subtle bg-surface-secondary text-[14px] font-semibold text-primary"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-secondary mb-1">
                  {isEn
                    ? 'Obstacles or Field Notes During Execution'
                    : 'Catatan Kendala Lapangan Saat Menjalankan Rencana Tindakan'}
                </label>
                <input
                  type="text"
                  value={obstaclesText}
                  onChange={(e) => setObstaclesText(e.target.value)}
                  placeholder={
                    isEn
                      ? 'e.g., Recording morning kitchen videos conflicted with baking schedule...'
                      : 'Contoh: Waktu rekam video pagi berbenturan dengan jadwal panggangan batch pertama...'
                  }
                  className="w-full px-3 py-2 rounded-[10px] border border-subtle bg-surface text-[14px] text-primary focus:outline-none"
                />
              </div>

              {consultation.result.implementationMonitoring
                ?.implementationNotes && (
                <div className="p-3.5 rounded-[12px] bg-surface border border-subtle text-[13px] text-primary leading-relaxed">
                  {
                    consultation.result.implementationMonitoring
                      .implementationNotes
                  }
                </div>
              )}

              <div className="flex flex-wrap justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => handleSaveImplementationMonitoring(false)}
                  className="px-3.5 py-2 rounded-[10px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-[13px] font-medium text-primary cursor-pointer"
                >
                  {isEn ? 'Update Progress Metrics' : 'Simpan Catatan Progres'}
                </button>
                <button
                  type="button"
                  disabled={isLoadingAI}
                  onClick={() => handleSaveImplementationMonitoring(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] btn-primary text-[13px] font-medium cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {isEn
                      ? 'Evaluate & Adjust Strategy in Chat'
                      : 'Evaluasi Hasil & Sesuaikan Strategi'}
                  </span>
                </button>
              </div>
            </div>

            {/* ============================================================= */}
            {/* BUSINESS SOLUTION & DOCUMENT GENERATOR CARD                   */}
            {/* ============================================================= */}
            <div
              data-testid="solution-download-card"
              className="p-6 sm:p-7 rounded-[16px] border border-[var(--text-primary)] bg-surface-secondary space-y-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-meta text-secondary">
                    <span className="uppercase tracking-wider text-primary font-semibold">
                      {t.solutionReadyBadge}
                    </span>
                    {activeConsultingReport && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>
                          {activeConsultingReport.qualityValidation.passedCount}/
                          {activeConsultingReport.qualityValidation.totalChecks}{' '}
                          {isEn
                            ? 'Quality Checks Verified'
                            : 'Validasi Kualitas Lulus'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {activeConsultingReport.coverPage.documentReferenceCode}
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-[22px] font-semibold text-primary pt-0.5">
                    {t.solutionReadyTitle}
                  </h3>
                  <p className="text-[15px] text-secondary leading-[1.6]">
                    {t.solutionReadySubtitle}
                  </p>
                </div>

                {activeConsultingReport && (
                  <button
                    type="button"
                    data-testid="open-report-preview-btn"
                    onClick={() => setIsReportPreviewOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] border border-[var(--text-primary)] bg-surface hover:bg-app text-[13px] font-semibold text-primary transition-colors cursor-pointer shrink-0"
                  >
                    <FileText className="w-4 h-4" />
                    <span>
                      {isEn
                        ? 'Preview & Validate Full Report'
                        : 'Pratinjau & Validasi Laporan Lengkap'}
                    </span>
                  </button>
                )}
              </div>

              {/* Domain-Specific Practical Business Deliverables Suite Selector */}
              {deliverableCatalog.length > 1 && (
                <div className="space-y-2">
                  <p className="font-mono-meta text-[11px] uppercase tracking-wider text-secondary">
                    {isEn
                      ? `SELECT PRACTICAL DELIVERABLE FOR ${consultation.workTopic} (${deliverableCatalog.length} TEMPLATES AVAILABLE)`
                      : `PILIH DOKUMEN KERJA PRAKTIS SESUAI MASALAH (${deliverableCatalog.length} DOKUMEN TERSEDIA)`}
                  </p>
                  <div
                    role="tablist"
                    aria-label={
                      isEn
                        ? 'Domain business deliverables'
                        : 'Pilihan dokumen kerja bisnis'
                    }
                    className="flex flex-wrap gap-2"
                  >
                    {deliverableCatalog.map((deliv, idx) => (
                      <button
                        key={deliv.id}
                        type="button"
                        role="tab"
                        aria-selected={selectedDeliverableIndex === idx}
                        onClick={() => setSelectedDeliverableIndex(idx)}
                        className={`px-3.5 py-2 rounded-[10px] text-[13px] font-medium border transition-colors cursor-pointer ${
                          selectedDeliverableIndex === idx
                            ? 'btn-primary border-transparent'
                            : 'border-subtle bg-surface text-secondary hover:text-primary'
                        }`}
                      >
                        {idx + 1}. {deliv.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeDeliverable && (
                <div className="p-4 rounded-[14px] border border-subtle bg-surface space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-primary">
                      {t.tailoredDocPrefix} {activeDeliverable.title}
                    </span>
                    <span className="font-mono-meta text-[11px] text-secondary">
                      {t.tailoredBadge}
                    </span>
                  </div>
                  <p className="text-[13px] text-secondary leading-relaxed">
                    {activeDeliverable.reasonSuggested}
                  </p>

                  {activeDeliverable.tableHeaders &&
                    activeDeliverable.tableRows && (
                      <div className="overflow-x-auto rounded-[10px] border border-subtle">
                        <table className="w-full text-left border-collapse text-[12px]">
                          <thead>
                            <tr className="bg-surface-secondary border-b border-subtle text-primary font-semibold">
                              {activeDeliverable.tableHeaders.map((h, hIdx) => (
                                <th key={hIdx} className="p-2.5 min-w-[110px]">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--border-subtle)]">
                            {activeDeliverable.tableRows
                              .slice(0, 3)
                              .map((r, rIdx) => (
                                <tr key={rIdx} className="align-top">
                                  {r.map((c, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className="p-2.5 text-secondary"
                                    >
                                      {c}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                </div>
              )}

              {/* Primary Download Buttons (PDF, XLSX, DOCX, CSV) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={handleDownloadConsultationReport}
                  className="flex flex-col justify-between p-4 rounded-[12px] btn-primary text-left transition-opacity cursor-pointer gap-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <FileText className="w-5 h-5" />
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-[14px] font-semibold leading-snug">
                      {t.downloadReportBtn}
                    </span>
                    <span className="block text-[12px] opacity-80 mt-0.5">
                      {isEn
                        ? '12-Section Advisory Report + 7 Tables (.PDF)'
                        : 'Laporan Konsultasi 12 Bagian + 7 Tabel (.PDF)'}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadActionPlan}
                  className="flex flex-col justify-between p-4 rounded-[12px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-left text-primary transition-colors cursor-pointer gap-3"
                >
                  <div className="flex items-center justify-between w-full">
                    <FileText className="w-5 h-5 text-primary" />
                    <Download className="w-4 h-4 text-secondary" />
                  </div>
                  <div>
                    <span className="block text-[14px] font-semibold leading-snug">
                      {t.downloadActionPlanBtn}
                    </span>
                    <span className="block text-[12px] text-secondary mt-0.5">
                      {t.downloadActionPlanSub}
                    </span>
                  </div>
                </button>

                <div className="flex flex-col justify-between p-4 rounded-[12px] border border-subtle bg-surface text-left text-primary gap-3">
                  <div className="flex items-center justify-between w-full gap-1">
                    <FileSpreadsheet className="w-5 h-5 text-primary shrink-0" />
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadTailoredDoc('PDF', activeDeliverable)
                        }
                        className="px-2 py-1 rounded-[7px] btn-primary text-[11px] font-medium cursor-pointer"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadTailoredDoc('XLSX', activeDeliverable)
                        }
                        className="px-2 py-1 rounded-[7px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[11px] font-medium text-primary cursor-pointer"
                      >
                        XLSX
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadTailoredDoc('DOCX', activeDeliverable)
                        }
                        className="px-2 py-1 rounded-[7px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[11px] font-medium text-primary cursor-pointer"
                      >
                        DOCX
                      </button>
                      {activeDeliverable?.tableHeaders && (
                        <button
                          type="button"
                          onClick={() =>
                            handleDownloadTailoredDoc('CSV', activeDeliverable)
                          }
                          className="px-2 py-1 rounded-[7px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[11px] font-medium text-primary cursor-pointer"
                        >
                          CSV
                        </button>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleDownloadTailoredDoc('PDF', activeDeliverable)
                    }
                    className="text-left cursor-pointer"
                  >
                    <span className="block text-[14px] font-semibold leading-snug hover:underline">
                      {t.downloadTailoredBtn}
                    </span>
                    <span className="block text-[12px] text-secondary mt-0.5 truncate">
                      {activeDeliverable?.title ||
                        (isEn ? 'Business Worksheet' : 'Dokumen Kerja Bisnis')}
                    </span>
                  </button>
                </div>
              </div>

              {downloadFeedback && (
                <div
                  role="status"
                  className="p-3 rounded-[11px] border border-subtle bg-surface text-[13px] font-medium text-primary flex items-center gap-2"
                >
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{downloadFeedback}</span>
                </div>
              )}

              {consultation.generatedDocuments &&
                consultation.generatedDocuments.length > 0 && (
                  <div className="pt-2 border-t border-subtle flex flex-wrap items-center gap-2 text-[12px] text-secondary">
                    <span>{t.sessionDocsLabel}</span>
                    {consultation.generatedDocuments.slice(0, 4).map((doc) => (
                      <span
                        key={doc.id}
                        className="px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-primary font-mono-meta text-[11px]"
                      >
                        {doc.fileName}
                      </span>
                    ))}
                  </div>
                )}

              <p className="text-[13px] text-secondary pt-1">
                {t.continueChatNote}
              </p>
            </div>

            {/* 6. Knowledge Base & External References Drawer */}
            {renderKnowledgeReferencesDrawer(
              consultation.result.knowledgeReferences,
              consultation.result.externalReferences,
              consultation.result.videoResources,
              `analysis-refs-${consultation.id}`
            )}

            {/* Quick Follow-Up Prompts to Continue Discussing in the Same Chat */}
            <div className="pt-4 border-t border-subtle space-y-2.5">
              <p className="text-[14px] text-secondary">{t.followUpIntro}</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={isLoadingAI}
                  onClick={() =>
                    handleSendUserMessage(
                      'Saya tidak mempunyai budget untuk iklan berbayar. Bisakah strategi dan action plan disesuaikan menjadi 100% organik?'
                    )
                  }
                  className="px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[14px] text-primary transition-colors cursor-pointer"
                >
                  {t.followUpChip1}
                </button>
                <button
                  type="button"
                  disabled={isLoadingAI}
                  onClick={() =>
                    handleSendUserMessage(
                      'Bisa jelaskan lebih rinci cara menjalankan langkah Hari 1 sampai Hari 3?'
                    )
                  }
                  className="px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[14px] text-primary transition-colors cursor-pointer"
                >
                  {t.followUpChip2}
                </button>
                <button
                  type="button"
                  disabled={isLoadingAI}
                  onClick={() =>
                    handleSendUserMessage(
                      'Apakah ada alternatif solusi lain yang lebih cepat dicoba minggu ini?'
                    )
                  }
                  className="px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[14px] text-primary transition-colors cursor-pointer"
                >
                  {t.followUpChip3}
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Continuation Messages */}
        {continuationMessages.map((msg) => renderMessageBubble(msg))}

        {/* Loading Indicator */}
        {(isLoadingAI || isAnalyzing) && (
          <div className="p-5 rounded-[16px] border border-subtle bg-surface flex items-center gap-3 text-[15px] text-secondary">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>
              {isAnalyzing ? t.loadingAnalysisText : t.loadingReplyText}
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Fixed-Bottom Chat Composer + URL Context Inspector */}
      <div className="sticky bottom-0 z-20 bg-app border-t border-subtle py-3.5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[820px] mx-auto space-y-2.5">
          {showUrlInspector && (
            <div className="p-3 rounded-[13px] border border-subtle bg-surface-secondary flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-fade-up">
              <div className="flex items-center gap-2 flex-1">
                <Globe className="w-4 h-4 text-secondary shrink-0" />
                <input
                  type="url"
                  value={publicUrlInput}
                  onChange={(e) => setPublicUrlInput(e.target.value)}
                  placeholder={
                    isEn
                      ? 'Paste public store/webpage URL (https://...) to inspect with Gemini URL Context'
                      : 'Tempel URL publik toko/website (https://...) untuk dianalisis dengan URL Context'
                  }
                  className="w-full px-2.5 py-1.5 rounded-[9px] border border-subtle bg-surface text-[13px] text-primary focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowUrlInspector(false)}
                  className="px-3 py-1.5 rounded-[9px] text-[12px] text-secondary hover:text-primary cursor-pointer"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="button"
                  disabled={isInspectingUrl || !publicUrlInput.trim()}
                  onClick={() => void handleInspectPublicUrl()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[9px] btn-primary text-[12px] font-medium cursor-pointer disabled:opacity-40"
                >
                  {isInspectingUrl ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Globe className="w-3.5 h-3.5" />
                  )}
                  <span>{isEn ? 'Inspect URL' : 'Periksa URL'}</span>
                </button>
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendUserMessage();
            }}
          >
            <div className="rounded-[15px] border border-subtle bg-surface p-2 flex items-end gap-2 focus-within:border-[var(--text-primary)] transition-colors">
              <label htmlFor="chat-composer-textarea" className="sr-only">
                {t.composerPlaceholder}
              </label>
              <textarea
                id="chat-composer-textarea"
                rows={2}
                value={composerInput}
                onChange={(e) => setComposerInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void handleSendUserMessage();
                  }
                }}
                placeholder={
                  hasAnalysisResult
                    ? t.composerContinuationPlaceholder
                    : t.composerPlaceholder
                }
                disabled={isLoadingAI || isAnalyzing}
                className="flex-1 px-3 py-2 text-[16px] bg-transparent text-primary placeholder:text-secondary focus:outline-none resize-none leading-[1.5]"
              />
              <button
                type="submit"
                disabled={
                  isLoadingAI ||
                  isAnalyzing ||
                  composerInput.trim().length === 0
                }
                aria-label={t.sendBtn}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[11px] btn-primary text-[15px] font-medium transition-colors cursor-pointer disabled:opacity-40 shrink-0"
              >
                <span>{t.sendBtn}</span>
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 mt-2 px-1 text-[12px] text-secondary">
              <div className="flex items-center gap-3">
                <span>{t.composerHintLeft}</span>
                <button
                  type="button"
                  onClick={() => setShowUrlInspector((prev) => !prev)}
                  className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>
                    {isEn ? 'Inspect Public URL' : 'Periksa URL Publik'}
                  </span>
                </button>
              </div>
              <span className="hidden sm:inline">{t.composerHintRight}</span>
            </div>
          </form>
        </div>
      </div>

      {/* Professional Business Report & Deliverable Inspector Modal */}
      {activeConsultingReport && (
        <ProfessionalReportModal
          isOpen={isReportPreviewOpen}
          onClose={() => setIsReportPreviewOpen(false)}
          report={activeConsultingReport}
          consultation={consultation}
          language={language}
          onDownloadConsultationReport={handleDownloadConsultationReport}
          onDownloadActionPlan={handleDownloadActionPlan}
          onDownloadDeliverable={(fmt, deliv) =>
            handleDownloadTailoredDoc(fmt, deliv)
          }
        />
      )}
    </div>
  );
};
