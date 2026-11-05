import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  HelpCircle,
  MessageSquare,
  Search,
  Sparkles,
} from 'lucide-react';
import { AppLanguage } from '../types';
import {
  ACTIONABLE_GUIDES,
  ActionableGuide,
  FAQ_ITEMS,
  LEARNING_ARTICLES,
  UI_TEXT,
} from '../lib/learningCenterData';

interface TipsAndGuidesViewProps {
  onStartNewConsultation: (starterPrompt?: string) => void;
  onOpenSweetBiteDemo: () => void;
  initialGuideId?: string | null;
  onClearInitialGuideId?: () => void;
  onOpenArticle?: (articleId: string) => void;
  language?: AppLanguage;
}

const GUIDE_TO_ARTICLE_MAP: Record<string, string> = {
  'guide-first-customer': 'art-memulai-01',
  'guide-instagram-content': 'art-marketing-01',
  'guide-pricing-hpp': 'art-keuangan-01',
  'guide-inventory-stock': 'art-operasional-01',
  'guide-repeat-order': 'art-pelanggan-01',
  'guide-growth-low-budget': 'art-pengembangan-01',
};

export const TipsAndGuidesView: React.FC<TipsAndGuidesViewProps> = ({
  onStartNewConsultation,
  onOpenSweetBiteDemo,
  initialGuideId,
  onClearInitialGuideId,
  onOpenArticle,
  language = 'id',
}) => {
  const isEn = language === 'en';
  const t = UI_TEXT[language].tips;

  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(
    initialGuideId || ACTIONABLE_GUIDES[0]?.id || null
  );
  const [faqSearch, setFaqSearch] = useState('');
  const [faqTopicFilter, setFaqTopicFilter] = useState<string>('ALL');
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({
    'faq-01': true,
    'faq-02': true,
  });

  useEffect(() => {
    if (initialGuideId) {
      setSelectedGuideId(initialGuideId);
      onClearInitialGuideId?.();
      setTimeout(() => {
        const el = document.getElementById('section-tips-guide-detail');
        if (el && typeof el.scrollIntoView === 'function') {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 60);
    }
  }, [initialGuideId, onClearInitialGuideId]);

  const faqTopics = Array.from(
    new Set(FAQ_ITEMS.map((item) => (isEn ? item.topicEn : item.topic)))
  );

  const filteredFaqs = FAQ_ITEMS.filter((item) => {
    const itemTopic = isEn ? item.topicEn : item.topic;
    const matchesTopic =
      faqTopicFilter === 'ALL' ||
      itemTopic === faqTopicFilter ||
      item.topic === faqTopicFilter ||
      item.topicEn === faqTopicFilter;
    const q = faqSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      item.question.toLowerCase().includes(q) ||
      item.questionEn.toLowerCase().includes(q) ||
      item.shortAnswer.toLowerCase().includes(q) ||
      item.shortAnswerEn.toLowerCase().includes(q) ||
      itemTopic.toLowerCase().includes(q);
    return matchesTopic && matchesSearch;
  });

  const activeGuide: ActionableGuide | undefined =
    ACTIONABLE_GUIDES.find((g) => g.id === selectedGuideId) ||
    ACTIONABLE_GUIDES[0];

  const pairedArticleId = activeGuide
    ? GUIDE_TO_ARTICLE_MAP[activeGuide.id]
    : undefined;
  const pairedArticle = pairedArticleId
    ? LEARNING_ARTICLES.find((a) => a.id === pairedArticleId)
    : undefined;

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleJumpToGuide = (guideId: string) => {
    setSelectedGuideId(guideId);
    const el = document.getElementById('section-tips-guide-detail');
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="max-w-[920px] mx-auto px-6 lg:px-8 py-8 lg:py-12 space-y-12 bg-app text-primary animate-fade-up">
      {/* Page Header */}
      <div className="border-b border-subtle pb-6 space-y-2">
        <span className="font-mono-meta text-[12px] px-3 py-1 rounded-full border border-subtle bg-surface-secondary text-secondary inline-block">
          {t.badge}
        </span>
        <h1 className="text-[28px] sm:text-[34px] font-semibold tracking-tight text-primary">
          {t.title}
        </h1>
        <p className="text-[16px] text-secondary leading-[1.6] max-w-2xl">
          {t.subtitle}
        </p>
      </div>

      {/* =================================================================== */}
      {/* SECTION A: TIPS & PANDUAN PRAKTIS UMKM (Bilingual ID / EN)          */}
      {/* =================================================================== */}
      <section
        id="section-tips-panduan"
        className="space-y-6 animate-fade-up anim-delay-1"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <h2 className="text-[22px] sm:text-[24px] font-semibold text-primary">
              {t.secATitle}
            </h2>
            <p className="text-[15px] text-secondary mt-0.5">{t.secASub}</p>
          </div>
          <span className="font-mono-meta text-[12px] text-secondary">
            {ACTIONABLE_GUIDES.length} {t.guidesCountSuffix}
          </span>
        </div>

        {/* 6 Guide Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {ACTIONABLE_GUIDES.map((guide) => {
            const isSelected = guide.id === activeGuide?.id;
            const gCategory = isEn ? guide.categoryEn : guide.category;
            const gTime = isEn ? guide.readingTimeEn : guide.readingTime;
            const gTitle = isEn ? guide.titleEn : guide.title;
            return (
              <button
                key={guide.id}
                type="button"
                onClick={() => setSelectedGuideId(guide.id)}
                className={`p-4 rounded-[16px] border text-left hover-lift flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'border-[var(--text-primary)] bg-surface-secondary'
                    : 'border-subtle bg-surface hover:border-[var(--text-primary)]'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-[11px] font-medium text-primary">
                      {gCategory}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono-meta text-[11px] text-secondary">
                      <Clock className="w-3 h-3" />
                      <span>{gTime}</span>
                    </span>
                  </div>
                  <h3 className="text-[16px] font-semibold text-primary leading-snug">
                    {gTitle}
                  </h3>
                </div>

                <span className="inline-flex items-center gap-1 text-[13px] font-medium text-primary">
                  <span>{isSelected ? t.currentlyOpen : t.openGuide}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </button>
            );
          })}
        </div>

        {/* Detailed Selected Guide View */}
        {activeGuide && (
          <div
            id="section-tips-guide-detail"
            className="rounded-[18px] border border-[var(--text-primary)] bg-surface p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-subtle pb-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-0.5 rounded-full bg-surface-secondary border border-subtle text-[12px] font-medium text-primary">
                    {isEn ? activeGuide.categoryEn : activeGuide.category}
                  </span>
                  <span className="font-mono-meta text-[12px] text-secondary">
                    {t.readTimePrefix}{' '}
                    {isEn ? activeGuide.readingTimeEn : activeGuide.readingTime}
                  </span>
                </div>
                <h3 className="text-[22px] sm:text-[26px] font-semibold text-primary">
                  {isEn ? activeGuide.titleEn : activeGuide.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartNewConsultation(
                    isEn
                      ? activeGuide.consultationPromptEn
                      : activeGuide.consultationPrompt
                  )
                }
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[11px] btn-primary text-[14px] font-medium cursor-pointer shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{t.discussWithNoeviaBtn}</span>
              </button>
            </div>

            {/* 1. Clear Explanation */}
            <div className="space-y-2">
              <h4 className="text-[17px] font-semibold text-primary">
                {t.mainExplanation}
              </h4>
              <p className="text-[16px] text-primary leading-[1.65]">
                {isEn ? activeGuide.explanationEn : activeGuide.explanation}
              </p>
            </div>

            {/* 2. Practical Steps */}
            <div className="space-y-3 pt-2 border-t border-subtle">
              <h4 className="text-[17px] font-semibold text-primary">
                {t.practicalSteps}
              </h4>
              <ol className="space-y-2.5">
                {(isEn
                  ? activeGuide.practicalStepsEn
                  : activeGuide.practicalSteps
                ).map((step, idx) => (
                  <li
                    key={idx}
                    className="p-3.5 rounded-[12px] border border-subtle bg-surface-secondary flex items-start gap-3 text-[15px] text-primary leading-[1.6]"
                  >
                    <span className="font-mono-meta text-[12px] font-semibold px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-primary shrink-0">
                      {idx + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* 3. Simple Example & 4. Common Mistakes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-5 rounded-[14px] border border-subtle bg-surface-secondary space-y-2">
                <h4 className="text-[15px] font-semibold text-primary">
                  {t.simpleExample}
                </h4>
                <p className="text-[14px] text-primary leading-[1.6]">
                  {isEn
                    ? activeGuide.simpleExampleEn
                    : activeGuide.simpleExample}
                </p>
              </div>

              <div className="p-5 rounded-[14px] border border-subtle bg-surface-secondary space-y-2">
                <h4 className="text-[15px] font-semibold text-primary">
                  {t.commonMistakes}
                </h4>
                <ul className="space-y-1.5 text-[14px] text-secondary leading-[1.55]">
                  {(isEn
                    ? activeGuide.commonMistakesEn
                    : activeGuide.commonMistakes
                  ).map((m, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-primary font-semibold">•</span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Paired Full Knowledge Center Article Card */}
            {pairedArticle && onOpenArticle && (
              <div className="p-4 rounded-[14px] border border-subtle bg-surface-secondary flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-mono-meta text-[11px] text-secondary block">
                    {isEn
                      ? 'Related Deep-Dive Knowledge Center Article'
                      : 'Artikel Mendalam Terkait di Pusat Pengetahuan Bisnis'}
                  </span>
                  <span className="text-[14px] font-semibold text-primary">
                    {isEn ? pairedArticle.titleEn : pairedArticle.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenArticle(pairedArticle.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] border border-subtle bg-surface hover:border-[var(--text-primary)] text-[13px] font-medium text-primary cursor-pointer"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>
                    {isEn ? 'Read Full Article' : 'Baca Artikel Lengkap'}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 5. Related Topics (Interactive Links) & 6. CTA */}
            <div className="pt-4 border-t border-subtle flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] text-secondary">
                  {t.relatedTopicsLabel}
                </span>
                {(isEn
                  ? activeGuide.relatedTopicsEn
                  : activeGuide.relatedTopics
                ).map((topic, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      if (pairedArticle && onOpenArticle) {
                        onOpenArticle(pairedArticle.id);
                      } else {
                        onStartNewConsultation(
                          isEn
                            ? `I want to learn more and apply "${topic}" (${activeGuide.titleEn}) to my business.`
                            : `Saya ingin mendalami dan menerapkan topik "${topic}" (${activeGuide.title}) pada usaha saya.`
                        );
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-secondary border border-subtle hover:border-[var(--text-primary)] hover:bg-surface text-[12px] font-medium text-primary transition-colors cursor-pointer"
                    title={
                      isEn
                        ? `Explore topic: ${topic}`
                        : `Pelajari topik: ${topic}`
                    }
                  >
                    <span>{topic}</span>
                    <ArrowUpRight className="w-3 h-3 text-secondary" />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() =>
                  onStartNewConsultation(
                    isEn
                      ? activeGuide.consultationPromptEn
                      : activeGuide.consultationPrompt
                  )
                }
                className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary hover:underline underline-offset-4 cursor-pointer"
              >
                <span>{t.applyWithNoeviaLink}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* =================================================================== */}
      {/* SECTION B: PERTANYAAN UMUM / FAQ (Bilingual ID / EN)                */}
      {/* =================================================================== */}
      <section className="space-y-6 pt-6 border-t border-subtle">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            <h2 className="text-[22px] sm:text-[24px] font-semibold text-primary">
              {t.secBTitle}
            </h2>
          </div>
          <p className="text-[15px] text-secondary">{t.secBSub}</p>
        </div>

        {/* FAQ Search & Topic Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label={t.faqSearchPlaceholder}
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder={t.faqSearchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-[15px] text-[15px] border border-subtle bg-surface text-primary placeholder:text-secondary focus:border-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFaqTopicFilter('ALL')}
              className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                faqTopicFilter === 'ALL'
                  ? 'btn-primary'
                  : 'border border-subtle bg-surface text-secondary hover:text-primary'
              }`}
            >
              {t.allTopics} ({FAQ_ITEMS.length})
            </button>
            {faqTopics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setFaqTopicFilter(topic)}
                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
                  faqTopicFilter === topic
                    ? 'btn-primary'
                    : 'border border-subtle bg-surface text-secondary hover:text-primary'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Conversational Accordion Interface */}
        <div className="space-y-3">
          {filteredFaqs.map((faq) => {
            const isExpanded = Boolean(expandedFaqIds[faq.id]);
            const fTopic = isEn ? faq.topicEn : faq.topic;
            const fQuestion = isEn ? faq.questionEn : faq.question;
            const fShort = isEn ? faq.shortAnswerEn : faq.shortAnswer;
            const fDetails = isEn
              ? faq.detailedExplanationEn
              : faq.detailedExplanation;
            const fGuideTitle = isEn
              ? faq.relatedGuideTitleEn
              : faq.relatedGuideTitle;
            const fPrompt = isEn
              ? faq.consultationPromptEn
              : faq.consultationPrompt;

            return (
              <div
                key={faq.id}
                className="rounded-[16px] border border-subtle bg-surface overflow-hidden"
              >
                <button
                  type="button"
                  aria-expanded={isExpanded}
                  onClick={() => toggleFaq(faq.id)}
                  className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 hover:bg-surface-secondary transition-colors cursor-pointer"
                >
                  <div className="space-y-1.5">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle font-mono-meta text-[11px] text-secondary inline-block">
                      {fTopic}
                    </span>
                    <h3 className="text-[17px] sm:text-[18px] font-semibold text-primary leading-snug">
                      &ldquo;{fQuestion}&rdquo;
                    </h3>
                  </div>
                  <span className="p-2 rounded-full bg-surface-secondary border border-subtle text-primary shrink-0 mt-1">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {isExpanded && (
                  <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-subtle space-y-4 bg-surface">
                    <div className="p-4 rounded-[12px] bg-surface-secondary border border-subtle">
                      <p className="text-[15px] font-medium text-primary leading-[1.6]">
                        {fShort}
                      </p>
                    </div>

                    <ul className="space-y-2 text-[15px] text-secondary leading-[1.6]">
                      {fDetails.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2.5">
                          <span className="text-primary font-semibold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-3 border-t border-subtle flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleJumpToGuide(faq.relatedGuideId)}
                        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-secondary hover:text-primary underline underline-offset-4 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>
                          {t.relatedGuidePrefix} {fGuideTitle}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onStartNewConsultation(fPrompt)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-[11px] btn-primary text-[13px] font-medium cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{t.consultIssueBtn}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Sample Consultation Banner (SweetBite Bakery) */}
      <div className="p-6 sm:p-7 rounded-[18px] border border-subtle bg-surface-secondary space-y-4">
        <div className="flex items-center gap-2 font-mono-meta text-[12px] text-secondary">
          <Sparkles className="w-4 h-4 text-primary" />
          <span>{t.sampleBannerBadge}</span>
        </div>
        <h2 className="text-[21px] font-semibold text-primary">
          {t.sampleBannerTitle}
        </h2>
        <p className="text-[15px] text-secondary leading-[1.6]">
          {t.sampleBannerDesc}
        </p>
        <div className="pt-1 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onOpenSweetBiteDemo}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] btn-primary text-[14px] font-medium cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{t.openSampleBtn}</span>
          </button>
          <button
            type="button"
            onClick={() => onStartNewConsultation()}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] border border-subtle bg-surface text-primary text-[14px] font-medium cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>{t.startMyConsultationBtn}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
