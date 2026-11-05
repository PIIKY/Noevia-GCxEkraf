import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  FileText,
  MessageSquare,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { AppLanguage, KnowledgeDocument, KnowledgeSection } from '../types';
import { INITIAL_KNOWLEDGE_DOCUMENTS } from '../lib/knowledgeBase';
import {
  ACTIONABLE_GUIDES,
  LEARNING_ARTICLES,
  LEARNING_CATEGORIES,
  LearningArticle,
  LearningCategorySlug,
  UI_TEXT,
} from '../lib/learningCenterData';

interface KnowledgeBaseViewProps {
  onStartConsultation?: (prompt: string) => void;
  onOpenGuide?: (guideId: string) => void;
  initialArticleId?: string | null;
  onClearInitialArticleId?: () => void;
  documents?: KnowledgeDocument[];
  language?: AppLanguage;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  onStartConsultation,
  onOpenGuide,
  initialArticleId,
  onClearInitialArticleId,
  documents = INITIAL_KNOWLEDGE_DOCUMENTS,
  language = 'id',
}) => {
  const isEn = language === 'en';
  const t = UI_TEXT[language].learning;

  // Learning Center states
  const [selectedCategory, setSelectedCategory] = useState<
    LearningCategorySlug | 'ALL'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(
    initialArticleId || null
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [expandedSourceKeys, setExpandedSourceKeys] = useState<
    Record<string, boolean>
  >({});
  const [modalKbDocId, setModalKbDocId] = useState<string | null>(null);
  const [modalHighlightPage, setModalHighlightPage] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (initialArticleId) {
      setActiveArticleId(initialArticleId);
      onClearInitialArticleId?.();
    }
  }, [initialArticleId, onClearInitialArticleId]);

  const kbDocs =
    documents && documents.length > 0 ? documents : INITIAL_KNOWLEDGE_DOCUMENTS;

  const findKbDocumentAndSection = (
    docId: string,
    sectionLabel: string,
    page: number
  ): { doc?: KnowledgeDocument; section?: KnowledgeSection } => {
    const doc =
      kbDocs.find((d) => d.id.toLowerCase() === docId.toLowerCase()) ||
      INITIAL_KNOWLEDGE_DOCUMENTS.find(
        (d) => d.id.toLowerCase() === docId.toLowerCase()
      );
    if (!doc) return {};

    const secNumMatch = sectionLabel.match(/Section\s*0?(\d+)/i);
    const secPrefix = secNumMatch
      ? `section 0${secNumMatch[1]}`.toLowerCase()
      : '';

    const section =
      doc.sections.find((s) => s.pageNumber === page) ||
      (secPrefix
        ? doc.sections.find((s) =>
            s.sectionHeading.toLowerCase().includes(secPrefix)
          )
        : undefined) ||
      doc.sections.find(
        (s) =>
          s.sectionHeading.toLowerCase() === sectionLabel.toLowerCase() ||
          sectionLabel
            .toLowerCase()
            .includes(s.sectionHeading.toLowerCase().slice(0, 18))
      ) ||
      doc.sections[0];

    return { doc, section };
  };

  const toggleSourceReference = (key: string) => {
    setExpandedSourceKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const openFullKbModal = (docId: string, page?: number) => {
    setModalKbDocId(docId);
    setModalHighlightPage(page ?? null);
  };

  const activeModalDoc = modalKbDocId
    ? kbDocs.find((d) => d.id.toLowerCase() === modalKbDocId.toLowerCase()) ||
      INITIAL_KNOWLEDGE_DOCUMENTS.find(
        (d) => d.id.toLowerCase() === modalKbDocId.toLowerCase()
      )
    : undefined;

  const filteredArticles = LEARNING_ARTICLES.filter((art) => {
    const matchesCategory =
      selectedCategory === 'ALL' || art.categorySlug === selectedCategory;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      art.title.toLowerCase().includes(q) ||
      art.titleEn.toLowerCase().includes(q) ||
      art.summary.toLowerCase().includes(q) ||
      art.summaryEn.toLowerCase().includes(q) ||
      art.categoryLabel.toLowerCase().includes(q) ||
      art.categoryLabelEn.toLowerCase().includes(q) ||
      art.explanation.toLowerCase().includes(q) ||
      art.explanationEn.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const featuredArticles = LEARNING_ARTICLES.filter((a) => a.isFeatured);
  const activeArticle: LearningArticle | undefined = LEARNING_ARTICLES.find(
    (a) => a.id === activeArticleId
  );

  const toggleChecklist = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleResourceNavigation = (targetIdOrUrl: string) => {
    if (targetIdOrUrl.startsWith('guide-')) {
      if (onOpenGuide) {
        onOpenGuide(targetIdOrUrl);
      }
      return;
    }
    if (targetIdOrUrl.startsWith('art-')) {
      setActiveArticleId(targetIdOrUrl);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const renderKbModal = () => {
    if (!activeModalDoc) return null;
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${activeModalDoc.id} — ${activeModalDoc.documentName}`}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-up"
        onClick={() => setModalKbDocId(null)}
      >
        <div
          className="w-full max-w-2xl max-h-[85vh] rounded-[18px] border border-subtle bg-surface text-primary shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-5 sm:p-6 border-b border-subtle flex items-start justify-between gap-4 bg-surface-secondary">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono-meta text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-primary">
                  {activeModalDoc.id}
                </span>
                <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                  {activeModalDoc.fileType} • {activeModalDoc.category}
                </span>
              </div>
              <h3 className="text-[19px] sm:text-[21px] font-semibold text-primary">
                {activeModalDoc.documentName}
              </h3>
              <p className="text-[13px] text-secondary">
                {activeModalDoc.source}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setModalKbDocId(null)}
              className="p-2 rounded-[10px] border border-subtle bg-surface text-secondary hover:text-primary cursor-pointer shrink-0"
              aria-label={isEn ? 'Close document viewer' : 'Tutup dokumen'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
            <p className="text-[14px] text-secondary leading-[1.6]">
              {activeModalDoc.description}
            </p>

            <div className="space-y-3">
              {activeModalDoc.sections.map((sec) => {
                const isHighlighted =
                  modalHighlightPage !== null &&
                  sec.pageNumber === modalHighlightPage;
                return (
                  <div
                    key={sec.sectionId}
                    className={`p-4 sm:p-5 rounded-[14px] border space-y-2.5 transition-colors ${
                      isHighlighted
                        ? 'border-[var(--text-primary)] bg-surface-secondary'
                        : 'border-subtle bg-surface'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="text-[15px] font-semibold text-primary">
                        {sec.sectionHeading}
                      </h4>
                      <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle text-secondary">
                        {t.pageLabel} {sec.pageNumber}
                      </span>
                    </div>
                    <p className="text-[14px] text-primary leading-[1.65]">
                      {sec.content}
                    </p>
                    {sec.keywords && sec.keywords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {sec.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="font-mono-meta text-[11px] px-2 py-0.5 rounded-md bg-surface border border-subtle text-secondary"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-4 sm:p-5 border-t border-subtle bg-surface-secondary flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono-meta text-[11px] text-secondary">
              {activeModalDoc.storagePath}
            </span>
            <div className="flex items-center gap-2.5">
              {onStartConsultation && (
                <button
                  type="button"
                  onClick={() => {
                    const docTitle = activeModalDoc.documentName;
                    const docId = activeModalDoc.id;
                    setModalKbDocId(null);
                    onStartConsultation(
                      isEn
                        ? `I just read module [${docId}] ${docTitle}. Help me apply its recommendations directly to my business.`
                        : `Saya baru membaca modul [${docId}] ${docTitle}. Bantu saya menerapkan panduan dari modul ini pada usaha saya.`
                    );
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] btn-primary text-[13px] font-medium cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>
                    {isEn
                      ? 'Discuss Module in Consultation'
                      : 'Konsultasikan Modul Ini'}
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalKbDocId(null)}
                className="px-4 py-2 rounded-[10px] border border-subtle bg-surface text-[13px] font-medium text-primary hover:bg-app cursor-pointer"
              >
                {isEn ? 'Close' : 'Tutup'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // =========================================================================
  // FULL 9-SECTION EDUCATIONAL ARTICLE READER VIEW (Bilingual ID / EN)
  // =========================================================================
  if (activeArticle) {
    const title = isEn ? activeArticle.titleEn : activeArticle.title;
    const summary = isEn ? activeArticle.summaryEn : activeArticle.summary;
    const categoryLabel = isEn
      ? activeArticle.categoryLabelEn
      : activeArticle.categoryLabel;
    const readingTime = isEn
      ? activeArticle.readingTimeEn
      : activeArticle.readingTime;
    const difficulty = isEn
      ? activeArticle.difficultyEn
      : activeArticle.difficulty;
    const introduction = isEn
      ? activeArticle.introductionEn
      : activeArticle.introduction;
    const whyItMatters = isEn
      ? activeArticle.whyItMattersEn
      : activeArticle.whyItMatters;
    const explanation = isEn
      ? activeArticle.explanationEn
      : activeArticle.explanation;
    const steps = isEn ? activeArticle.stepByStepEn : activeArticle.stepByStep;
    const mistakes = isEn
      ? activeArticle.commonMistakesEn
      : activeArticle.commonMistakes;
    const checklist = isEn
      ? activeArticle.actionChecklistEn
      : activeArticle.actionChecklist;
    const prompt = isEn
      ? activeArticle.consultationPromptEn
      : activeArticle.consultationPrompt;

    return (
      <div className="max-w-[840px] mx-auto px-6 lg:px-8 py-8 lg:py-12 space-y-8 bg-app text-primary animate-fade-up">
        {renderKbModal()}

        {/* Back button */}
        <button
          type="button"
          onClick={() => setActiveArticleId(null)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[11px] border border-subtle bg-surface hover:bg-surface-secondary text-[14px] font-medium text-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.backToCenterBtn}</span>
        </button>

        {/* Article Header */}
        <article className="rounded-[18px] border border-subtle bg-surface p-6 sm:p-9 space-y-8 animate-scale-in">
          <header className="space-y-4 border-b border-subtle pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-surface-secondary border border-subtle text-[12px] font-medium text-primary">
                {categoryLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-secondary border border-subtle text-[12px] text-secondary">
                <Clock className="w-3.5 h-3.5" />
                <span>{readingTime}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-surface-secondary border border-subtle text-[12px] text-secondary">
                {t.levelPrefix} {difficulty}
              </span>
            </div>

            <h1 className="text-[26px] sm:text-[32px] font-semibold tracking-tight text-primary leading-[1.2]">
              {title}
            </h1>
            <p className="text-[17px] text-secondary leading-[1.65]">
              {summary}
            </p>
          </header>

          {/* 1. Problem or Topic Introduction */}
          <section className="space-y-2">
            <h2 className="text-[19px] font-semibold text-primary">
              {t.sec1}
            </h2>
            <p className="text-[16px] text-primary leading-[1.7]">
              {introduction}
            </p>
          </section>

          {/* 2. Why It Matters */}
          <section className="space-y-2 pt-4 border-t border-subtle">
            <h2 className="text-[19px] font-semibold text-primary">
              {t.sec2}
            </h2>
            <p className="text-[16px] text-primary leading-[1.7]">
              {whyItMatters}
            </p>
          </section>

          {/* 3. Explanation */}
          <section className="space-y-2 pt-4 border-t border-subtle">
            <h2 className="text-[19px] font-semibold text-primary">
              {t.sec3}
            </h2>
            <p className="text-[16px] text-primary leading-[1.7]">
              {explanation}
            </p>
          </section>

          {/* 4. Practical UMKM Example */}
          <section className="p-5 sm:p-6 rounded-[16px] border border-subtle bg-surface-secondary space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[18px] font-semibold text-primary">
                {t.sec4}
              </h2>
              <span className="font-mono-meta text-[12px] px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                {t.caseStudyLabel} {activeArticle.umkmExample.businessName}
              </span>
            </div>
            <div className="space-y-2 text-[15px] leading-[1.6]">
              <p>
                <strong className="text-primary">{t.initialSituation}</strong>{' '}
                <span className="text-secondary">
                  {isEn
                    ? activeArticle.umkmExample.situationEn
                    : activeArticle.umkmExample.situation}
                </span>
              </p>
              <p>
                <strong className="text-primary">{t.solutionApplied}</strong>{' '}
                <span className="text-primary">
                  {isEn
                    ? activeArticle.umkmExample.solutionAppliedEn
                    : activeArticle.umkmExample.solutionApplied}
                </span>
              </p>
              <p>
                <strong className="text-primary">{t.measurableOutcome}</strong>{' '}
                <span className="text-primary font-medium">
                  {isEn
                    ? activeArticle.umkmExample.outcomeEn
                    : activeArticle.umkmExample.outcome}
                </span>
              </p>
            </div>
          </section>

          {/* 5. Step-by-Step Application */}
          <section className="space-y-3 pt-4 border-t border-subtle">
            <h2 className="text-[19px] font-semibold text-primary">
              {t.sec5}
            </h2>
            <ol className="space-y-2.5">
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  className="p-4 rounded-[14px] border border-subtle bg-surface-secondary flex items-start gap-3 text-[15px] text-primary leading-[1.6]"
                >
                  <span className="font-mono-meta text-[13px] font-semibold px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-primary shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          {/* 6. Common Mistakes */}
          <section className="space-y-3 pt-4 border-t border-subtle">
            <h2 className="text-[19px] font-semibold text-primary">
              {t.sec6}
            </h2>
            <ul className="space-y-2">
              {mistakes.map((mistake, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-[15px] text-secondary leading-[1.6]"
                >
                  <span className="text-primary font-semibold">•</span>
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 7. Interactive Action Checklist */}
          <section className="space-y-3 pt-4 border-t border-subtle">
            <h2 className="text-[19px] font-semibold text-primary">
              {t.sec7}
            </h2>
            <div className="rounded-[16px] border border-subtle divide-y divide-[var(--border-subtle)] overflow-hidden">
              {checklist.map((item, idx) => {
                const key = `${activeArticle.id}-check-${idx}`;
                const isDone = Boolean(checkedItems[key]);
                return (
                  <div
                    key={key}
                    onClick={() => toggleChecklist(key)}
                    className="p-4 flex items-start gap-3.5 bg-surface hover:bg-surface-secondary transition-colors cursor-pointer"
                  >
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isDone}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChecklist(key);
                      }}
                      className={`mt-0.5 w-5 h-5 rounded-[6px] border flex items-center justify-center shrink-0 cursor-pointer ${
                        isDone
                          ? 'btn-primary border-transparent'
                          : 'border-subtle bg-surface text-transparent'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <span
                      className={`text-[15px] leading-[1.55] ${
                        isDone ? 'line-through text-secondary' : 'text-primary'
                      }`}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 8. Related Resources (Interactive Links to Guides, Articles, and Official Portals) */}
          <section className="space-y-3 pt-4 border-t border-subtle">
            <h2 className="text-[19px] font-semibold text-primary">
              {t.sec8}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeArticle.relatedResources.map((res, idx) => {
                const isUrl = res.targetIdOrUrl.startsWith('http');
                const isGuide = res.targetIdOrUrl.startsWith('guide-');
                const resTitle = isEn ? res.titleEn : res.title;
                const resType = isEn ? res.typeEn : res.type;
                const matchedGuide = isGuide
                  ? ACTIONABLE_GUIDES.find((g) => g.id === res.targetIdOrUrl)
                  : undefined;

                if (isUrl) {
                  let hostname = '';
                  try {
                    hostname = new URL(res.targetIdOrUrl).hostname.replace(
                      /^www\./,
                      ''
                    );
                  } catch {
                    hostname = res.targetIdOrUrl;
                  }
                  return (
                    <a
                      key={idx}
                      href={res.targetIdOrUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group p-4 rounded-[14px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] hover:bg-surface transition-all flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-meta text-[11px] text-secondary">
                            {resType}
                          </span>
                          {hostname && (
                            <span className="font-mono-meta text-[11px] px-2 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                              {hostname}
                            </span>
                          )}
                        </div>
                        <span className="text-[14px] font-semibold text-primary group-hover:underline underline-offset-4 block">
                          {resTitle}
                        </span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-subtle bg-surface text-[12px] font-medium text-primary group-hover:border-[var(--text-primary)] shrink-0">
                        <span>{isEn ? 'Visit' : 'Buka'}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </span>
                    </a>
                  );
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleResourceNavigation(res.targetIdOrUrl)}
                    className="group p-4 rounded-[14px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] hover:bg-surface transition-all flex items-center justify-between gap-3 text-left w-full cursor-pointer"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono-meta text-[11px] text-secondary">
                          {resType}
                        </span>
                        {matchedGuide && (
                          <span className="font-mono-meta text-[11px] px-2 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                            {isEn
                              ? matchedGuide.readingTimeEn
                              : matchedGuide.readingTime}
                          </span>
                        )}
                      </div>
                      <span className="text-[14px] font-semibold text-primary group-hover:underline underline-offset-4 block">
                        {resTitle}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] border border-subtle bg-surface text-[12px] font-medium text-primary group-hover:border-[var(--text-primary)] shrink-0">
                      <span>
                        {isGuide
                          ? isEn
                            ? 'Open Guide'
                            : 'Buka Panduan'
                          : isEn
                            ? 'Read'
                            : 'Baca'}
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 9. Source References (Interactive Traceable Links to KB-01..KB-06) */}
          <section className="space-y-3 pt-4 border-t border-subtle">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[19px] font-semibold text-primary">
                {t.sec9}
              </h2>
              <span className="font-mono-meta text-[11px] text-secondary">
                {isEn
                  ? 'Click any reference to read the Knowledge Base excerpt'
                  : 'Klik referensi untuk membaca kutipan modul Knowledge Base'}
              </span>
            </div>
            <div className="space-y-2.5">
              {activeArticle.sourceReferences.map((src, idx) => {
                const refKey = `${activeArticle.id}-src-${idx}`;
                const isExpanded = Boolean(expandedSourceKeys[refKey]);
                const { doc: kbDoc, section: kbSection } =
                  findKbDocumentAndSection(src.docId, src.section, src.page);

                return (
                  <div
                    key={refKey}
                    className={`rounded-[14px] border transition-colors overflow-hidden ${
                      isExpanded
                        ? 'border-[var(--text-primary)] bg-surface'
                        : 'border-subtle bg-surface-secondary hover:border-[var(--text-primary)]'
                    }`}
                  >
                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => toggleSourceReference(refKey)}
                      className="w-full p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 text-left font-mono-meta text-[12px] cursor-pointer"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="text-primary font-medium leading-[1.5]">
                          [{src.docId}] {src.docTitle} — {src.section}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                          {t.pageLabel} {src.page}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] border border-subtle bg-surface text-primary font-sans text-[12px] font-medium">
                          <span>
                            {isExpanded
                              ? isEn
                                ? 'Hide Excerpt'
                                : 'Tutup Kutipan'
                              : isEn
                                ? 'Read Excerpt'
                                : 'Baca Kutipan'}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 pt-3 border-t border-subtle bg-surface space-y-3 animate-fade-up">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-secondary">
                          <span>
                            <strong className="text-primary">
                              {kbDoc?.documentName || src.docTitle}
                            </strong>{' '}
                            • {kbDoc?.source || 'Noevia UMKM Knowledge Repository'}
                          </span>
                          <span className="font-mono-meta text-[11px]">
                            {kbSection?.sectionId || src.docId} • {t.pageLabel}{' '}
                            {src.page}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-[12px] border border-subtle bg-surface-secondary text-[14px] text-primary leading-[1.65]">
                          {kbSection?.content ||
                            kbDoc?.description ||
                            (isEn
                              ? 'Verified reference from Noevia UMKM Knowledge Repository.'
                              : 'Referensi terverifikasi dari repositori Knowledge Base UMKM Noevia.')}
                        </div>

                        {kbSection?.keywords && kbSection.keywords.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {kbSection.keywords.map((kw, kIdx) => (
                              <span
                                key={kIdx}
                                className="font-mono-meta text-[11px] px-2 py-0.5 rounded-md bg-surface-secondary border border-subtle text-secondary"
                              >
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => openFullKbModal(src.docId, src.page)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[12px] font-medium text-primary cursor-pointer"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>
                              {isEn
                                ? `Open Full Module [${src.docId}]`
                                : `Buka Modul Lengkap [${src.docId}]`}
                            </span>
                          </button>

                          {onStartConsultation && (
                            <button
                              type="button"
                              onClick={() =>
                                onStartConsultation(
                                  isEn
                                    ? `Based on reference [${src.docId}] ${src.section} (Page ${src.page}), help me apply this step-by-step to my business.`
                                    : `Berdasarkan referensi [${src.docId}] ${src.section} (Halaman ${src.page}), bantu saya menerapkan langkah ini pada bisnis saya.`
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[9px] btn-primary text-[12px] font-medium cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>
                                {isEn
                                  ? 'Discuss This Reference'
                                  : 'Diskusikan Referensi Ini'}
                              </span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* CTA to Discuss This Topic with Noevia */}
          {onStartConsultation && (
            <div className="p-6 rounded-[16px] border border-[var(--text-primary)] bg-surface-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-[18px] font-semibold text-primary">
                  {t.applyCtaTitle}
                </h3>
                <p className="text-[14px] text-secondary">{t.applyCtaSub}</p>
              </div>
              <button
                type="button"
                onClick={() => onStartConsultation(prompt)}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] btn-primary text-[14px] font-medium shrink-0 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.applyCtaBtn}</span>
              </button>
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-[920px] mx-auto px-6 lg:px-8 py-8 lg:py-12 space-y-10 bg-app text-primary animate-fade-up">
      {renderKbModal()}

      {/* Header: Pusat Pengetahuan Bisnis / Business Learning Center */}
      <div className="border-b border-subtle pb-6 space-y-2 max-w-2xl">
        <span className="font-mono-meta text-[12px] px-3 py-1 rounded-full border border-subtle bg-surface-secondary text-secondary inline-block">
          {t.badge}
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-primary">
          {t.title}
        </h1>
        <p className="text-[16px] text-secondary leading-[1.6]">
          {t.subtitle}
        </p>
      </div>

      {/* User-Facing Business Learning Center */}
      <div className="space-y-10">
        {/* Search Bar + Category Filter Pills */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3.5 rounded-[15px] text-[15px] border border-subtle bg-surface text-primary placeholder:text-secondary focus:border-[var(--text-primary)] focus:outline-none"
            />
          </div>

          {/* 6 Category Pills (rounded-full) */}
          <div
            role="tablist"
            aria-label={t.title}
            className="flex flex-wrap items-center gap-2"
          >
            <button
              type="button"
              role="tab"
              aria-selected={selectedCategory === 'ALL'}
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                selectedCategory === 'ALL'
                  ? 'btn-primary'
                  : 'border border-subtle bg-surface text-secondary hover:text-primary'
              }`}
            >
              {t.allTopics} ({LEARNING_ARTICLES.length})
            </button>
            {LEARNING_CATEGORIES.map((cat) => (
              <button
                key={cat.slug}
                type="button"
                role="tab"
                aria-selected={selectedCategory === cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'btn-primary'
                    : 'border border-subtle bg-surface text-secondary hover:text-primary'
                }`}
              >
                {isEn ? cat.labelEn : cat.labelId}
              </button>
            ))}
          </div>
        </div>

        {/* 6 Category Overview Cards when viewing ALL without search */}
        {selectedCategory === 'ALL' && !searchQuery.trim() && (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[20px] font-semibold text-primary">
                {t.domainsHeading}
              </h2>
              <span className="text-[13px] text-secondary">{t.domainsSub}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {LEARNING_CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => setSelectedCategory(cat.slug)}
                  className="p-5 rounded-[16px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-left transition-colors flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <span className="font-mono-meta text-[11px] px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle text-secondary">
                      {cat.workTopic}
                    </span>
                    <h3 className="text-[17px] font-semibold text-primary pt-1">
                      {isEn ? cat.labelEn : cat.labelId}
                    </h3>
                    <p className="text-[14px] text-secondary leading-[1.55]">
                      {isEn ? cat.descriptionEn : cat.descriptionId}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary">
                    <span>{t.viewMaterial}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Featured Articles Banner when viewing ALL */}
        {selectedCategory === 'ALL' && !searchQuery.trim() && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-[20px] font-semibold text-primary">
                {t.featuredHeading}
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredArticles.map((art) => (
                <div
                  key={art.id}
                  onClick={() => setActiveArticleId(art.id)}
                  className="p-5 rounded-[16px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] transition-colors flex flex-col justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-[11px] font-medium text-primary">
                        {isEn ? art.categoryLabelEn : art.categoryLabel}
                      </span>
                      <span className="font-mono-meta text-[11px] text-secondary">
                        {isEn ? art.readingTimeEn : art.readingTime}
                      </span>
                    </div>
                    <h3 className="text-[17px] font-semibold text-primary leading-snug">
                      {isEn ? art.titleEn : art.title}
                    </h3>
                    <p className="text-[14px] text-secondary leading-[1.55] line-clamp-3">
                      {isEn ? art.summaryEn : art.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-subtle flex items-center justify-between text-[13px]">
                    <span className="text-secondary">
                      {t.levelPrefix} {isEn ? art.difficultyEn : art.difficulty}
                    </span>
                    <span className="font-medium text-primary inline-flex items-center gap-1">
                      <span>{t.readGuide}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Full Curated Articles List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-semibold text-primary">
              {selectedCategory === 'ALL'
                ? t.allArticlesHeading
                : `${t.categoryArticlesPrefix} ${
                    isEn
                      ? LEARNING_CATEGORIES.find(
                          (c) => c.slug === selectedCategory
                        )?.labelEn || ''
                      : LEARNING_CATEGORIES.find(
                          (c) => c.slug === selectedCategory
                        )?.labelId || ''
                  }`}
            </h2>
            <span className="font-mono-meta text-[12px] text-secondary">
              {filteredArticles.length} {t.articlesAvailableSuffix}
            </span>
          </div>

          <div className="space-y-4">
            {filteredArticles.map((art) => (
              <div
                key={art.id}
                className="p-6 rounded-[16px] border border-subtle bg-surface hover:border-[var(--text-primary)] transition-colors space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-0.5 rounded-full bg-surface-secondary border border-subtle text-[12px] font-medium text-primary">
                      {isEn ? art.categoryLabelEn : art.categoryLabel}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle text-[12px] text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>{isEn ? art.readingTimeEn : art.readingTime}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle text-[12px] text-secondary">
                      {isEn ? art.difficultyEn : art.difficulty}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 font-mono-meta text-[11px] text-secondary">
                    <span>{isEn ? 'Source:' : 'Sumber:'}</span>
                    {Array.from(
                      new Set(art.sourceReferences.map((s) => s.docId))
                    ).map((docId) => (
                      <button
                        key={docId}
                        type="button"
                        onClick={() => openFullKbModal(docId)}
                        className="px-2 py-0.5 rounded-md border border-subtle bg-surface-secondary text-primary hover:border-[var(--text-primary)] underline underline-offset-2 cursor-pointer"
                      >
                        {docId}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3
                    onClick={() => setActiveArticleId(art.id)}
                    className="text-[20px] font-semibold text-primary hover:underline underline-offset-4 cursor-pointer"
                  >
                    {isEn ? art.titleEn : art.title}
                  </h3>
                  <p className="text-[15px] text-secondary leading-[1.6]">
                    {isEn ? art.summaryEn : art.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-subtle flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[13px] text-secondary">
                    {t.caseStudyLabel}{' '}
                    <strong className="text-primary">
                      {art.umkmExample.businessName}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2.5">
                    {onStartConsultation && (
                      <button
                        type="button"
                        onClick={() =>
                          onStartConsultation(
                            isEn
                              ? art.consultationPromptEn
                              : art.consultationPrompt
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[13px] font-medium text-primary cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.discussInChatBtn}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveArticleId(art.id)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[11px] btn-primary text-[13px] font-medium cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>{t.readMoreBtn}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
