import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  FolderOpen,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { AppLanguage, Consultation } from '../types';
import { UI_TEXT } from '../lib/learningCenterData';

interface MyConsultationsViewProps {
  consultations: Consultation[];
  activeConsultationId: string;
  onSelectConsultation: (consultationId: string) => void;
  onDeleteConsultation: (consultationId: string) => void;
  onClearConsultationHistory: () => void;
  onStartNewConsultation: () => void;
  onLoadSweetBiteDemo: () => void;
  language?: AppLanguage;
}

export const MyConsultationsView: React.FC<MyConsultationsViewProps> = ({
  consultations,
  activeConsultationId,
  onSelectConsultation,
  onDeleteConsultation,
  onClearConsultationHistory,
  onStartNewConsultation,
  onLoadSweetBiteDemo,
  language = 'id',
}) => {
  const isEn = language === 'en';
  const t = UI_TEXT[language].history;
  const tNav = UI_TEXT[language].nav;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [confirmClearModalOpen, setConfirmClearModalOpen] = useState(false);

  const categories = Array.from(
    new Set(consultations.map((c) => c.businessCategory))
  );

  const filteredConsultations = consultations.filter((c) => {
    const matchesSearch =
      !searchQuery.trim() ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.initialProblem.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.businessContext.mainChallenge
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'ALL' || c.businessCategory === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-[860px] mx-auto px-6 lg:px-8 py-8 lg:py-12 space-y-8 bg-app text-primary animate-fade-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-subtle pb-6">
        <div>
          <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-primary">
            {t.title}
          </h1>
          <p className="text-[16px] text-secondary mt-1.5 leading-[1.6]">
            {t.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {consultations.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirmClearModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-[11px] border border-subtle bg-surface hover:bg-surface-secondary text-[14px] font-medium text-secondary hover:text-primary transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>{t.clearHistoryBtn}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onStartNewConsultation}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-[11px] btn-primary text-[15px] font-medium transition-colors whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{tNav.newConsultation}</span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog for Clearing User Consultation History Only (Section 5.B) */}
      {confirmClearModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-history-dialog-title"
          className="p-6 rounded-[18px] border border-[var(--text-primary)] bg-surface space-y-4 animate-scale-in"
        >
          <div className="flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2
                id="clear-history-dialog-title"
                className="text-[18px] font-semibold text-primary"
              >
                {t.clearConfirmTitle}
              </h2>
              <p className="text-[15px] text-secondary leading-[1.6]">
                {t.clearConfirmBody}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <button
              type="button"
              onClick={() => setConfirmClearModalOpen(false)}
              className="px-4 py-2.5 rounded-[11px] border border-subtle bg-surface-secondary text-[14px] font-medium text-primary cursor-pointer"
            >
              {UI_TEXT[language].workspace.cancelBtn}
            </button>
            <button
              type="button"
              onClick={() => {
                onClearConsultationHistory();
                setConfirmClearModalOpen(false);
              }}
              className="px-5 py-2.5 rounded-[11px] btn-primary text-[14px] font-medium cursor-pointer"
            >
              {t.clearConfirmAction}
            </button>
          </div>
        </div>
      )}

      {/* Search & Category Filter */}
      {consultations.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-secondary absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              aria-label={t.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-11 pr-4 py-3 rounded-[15px] text-[15px] border border-subtle bg-surface text-primary placeholder:text-secondary focus:border-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <select
            aria-label={t.allCategories}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-3 rounded-[15px] text-[15px] border border-subtle bg-surface text-primary focus:border-[var(--text-primary)] focus:outline-none"
          >
            <option value="ALL">
              {t.allCategories} ({consultations.length})
            </option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Consultation List or Empty State */}
      {filteredConsultations.length === 0 ? (
        <div className="rounded-[18px] border border-subtle bg-surface p-10 text-center space-y-4">
          <FolderOpen className="w-8 h-8 text-secondary mx-auto" />
          <div className="space-y-1.5">
            <h2 className="text-[21px] font-semibold text-primary">
              {t.emptyTitle}
            </h2>
            <p className="text-[15px] text-secondary max-w-md mx-auto leading-relaxed">
              {t.emptySubtitle}
            </p>
          </div>
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onStartNewConsultation}
              className="px-5 py-2.5 rounded-[11px] btn-primary text-[14px] font-medium cursor-pointer"
            >
              {t.startNewBtn}
            </button>
            <button
              type="button"
              onClick={onLoadSweetBiteDemo}
              className="px-5 py-2.5 rounded-[11px] border border-subtle bg-surface-secondary text-primary text-[14px] font-medium cursor-pointer"
            >
              {t.sampleBtn}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredConsultations.map((item) => {
            const isActive = item.id === activeConsultationId;
            const mainProblem =
              item.result?.mainProblem ||
              item.businessContext.mainChallenge ||
              item.initialProblem ||
              (isEn ? 'No problem description yet' : 'Belum ada deskripsi masalah');
            const docCount = item.generatedDocuments?.length || 0;

            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 rounded-[16px] border hover-lift animate-fade-up ${
                  isActive
                    ? 'border-[var(--text-primary)] bg-surface-secondary'
                    : 'border-subtle bg-surface hover:bg-surface-secondary'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono-meta text-[12px] text-secondary mb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-surface-secondary border border-subtle text-primary font-medium">
                      {item.workTopic}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                      {isEn && item.businessCategory === 'Belum Dikategorikan'
                        ? 'Uncategorized'
                        : item.businessCategory}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-secondary">
                      {item.result ? t.statusReady : t.statusActive}
                    </span>
                    {docCount > 0 && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface border border-subtle text-primary">
                        <FileText className="w-3 h-3" />
                        <span>
                          {docCount} {t.docsDownloadedSuffix}
                        </span>
                      </span>
                    )}
                  </div>
                  <span>
                    {new Date(item.updatedAt).toLocaleDateString(
                      isEn ? 'en-US' : 'id-ID'
                    )}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <h2 className="text-[19px] font-semibold text-primary">
                      {isEn && item.title === 'Sesi Konsultasi Bisnis Baru'
                        ? 'New Business Consultation'
                        : item.title}
                    </h2>
                    <p className="text-[15px] text-secondary line-clamp-2 leading-[1.6]">
                      {mainProblem}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onSelectConsultation(item.id)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[11px] btn-primary text-[14px] font-medium transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>{t.openChatBtn}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteConsultation(item.id)}
                      aria-label={`${isEn ? 'Delete' : 'Hapus'} ${item.title}`}
                      className="p-2.5 rounded-[11px] border border-subtle bg-surface text-secondary hover:text-primary transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
