import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Moon, Send, Sun } from 'lucide-react';
import { AppLanguage } from '../types';
import { UI_TEXT } from '../lib/learningCenterData';
import { MAX_MESSAGE_LENGTH } from '../lib/securityHardening';

interface LandingViewProps {
  onStartConsultation: (initialMessage?: string) => void;
  onOpenExistingWorkspace: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  onStartConsultation,
  onOpenExistingWorkspace,
  isDark,
  onToggleTheme,
  language,
  onChangeLanguage,
}) => {
  const [quickMessage, setQuickMessage] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const t = UI_TEXT[language];
  const isEn = language === 'en';

  const triggerTransitionToConsultation = (messageToSend?: string) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setInputError(null);
    setTimeout(() => {
      onStartConsultation(messageToSend);
    }, 180);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTransitioning) return;

    const trimmed = quickMessage.trim();
    if (!trimmed) {
      setInputError(
        isEn
          ? 'Please enter a brief description of your business challenge, or click Start Consultation below.'
          : 'Masukkan deskripsi singkat tantangan usaha Anda terlebih dahulu, atau klik tombol Mulai Konsultasi di bawah.'
      );
      return;
    }

    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setInputError(
        isEn
          ? `Message exceeds maximum length (${MAX_MESSAGE_LENGTH} characters).`
          : `Pesan melebihi batas panjang maksimum (${MAX_MESSAGE_LENGTH} karakter).`
      );
      return;
    }

    triggerTransitionToConsultation(trimmed);
  };

  const handlePrimaryCtaClick = () => {
    if (isTransitioning) return;
    const trimmed = quickMessage.trim();
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setInputError(
        isEn
          ? `Message exceeds maximum length (${MAX_MESSAGE_LENGTH} characters).`
          : `Pesan melebihi batas panjang maksimum (${MAX_MESSAGE_LENGTH} karakter).`
      );
      return;
    }
    triggerTransitionToConsultation(trimmed || undefined);
  };

  return (
    <div
      className={`min-h-screen bg-app text-primary flex flex-col justify-between selection:bg-[var(--accent-bg)] selection:text-[var(--accent-text)] transition-all duration-200 ease-out ${
        isTransitioning ? 'opacity-0 translate-y-1.5' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Minimal Header — Top-left NOEVIA logo, Top-right Consultation access & Theme toggle */}
      <header className="w-full max-w-[1040px] mx-auto px-6 sm:px-10 h-20 flex items-center justify-between animate-fade-in">
        <span className="text-[18px] font-semibold tracking-[-0.03em] text-primary">
          NOEVIA
        </span>

        <div className="flex items-center gap-4">
          <button
            type="button"
            disabled={isTransitioning}
            onClick={onOpenExistingWorkspace}
            className="text-[14px] text-secondary hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          >
            {t.nav.openWorkspace}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? t.nav.switchToLight : t.nav.switchToDark}
            className="p-2.5 rounded-[11px] border border-subtle bg-surface text-primary hover:bg-surface-secondary transition-colors cursor-pointer"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Center-Aligned Horizontally & Vertically Minimalist Hero (No duplicate NOEVIA label above headline) */}
      <main className="flex-1 flex items-center justify-center px-6 sm:px-10 py-14">
        <div className="w-full max-w-[700px] mx-auto text-center space-y-10">
          <div className="space-y-5 flex flex-col items-center animate-fade-up">
            <h1 className="text-[34px] sm:text-[42px] font-semibold tracking-[-0.03em] leading-[1.16] text-primary max-w-[640px]">
              {t.home.headline}
            </h1>
            <p className="text-[17px] sm:text-[18px] text-secondary leading-[1.65] max-w-[580px] mx-auto">
              {t.home.subheadline}
            </p>
          </div>

          {/* Immediate Message Composer (15px radius) + Primary CTA (11px radius) */}
          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4 max-w-[640px] mx-auto animate-fade-up anim-delay-1"
          >
            <div className="rounded-[15px] border border-subtle bg-surface p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 focus-within:border-[var(--text-primary)] transition-all duration-200 shadow-xs">
              <label htmlFor="home-quick-input" className="sr-only">
                {t.home.inputPlaceholder}
              </label>
              <input
                id="home-quick-input"
                type="text"
                maxLength={MAX_MESSAGE_LENGTH}
                disabled={isTransitioning}
                value={quickMessage}
                onChange={(e) => {
                  setQuickMessage(e.target.value);
                  if (inputError) setInputError(null);
                }}
                placeholder={t.home.inputPlaceholder}
                className="flex-1 px-4 py-3 text-[16px] bg-transparent text-primary placeholder:text-secondary focus:outline-none text-center sm:text-left disabled:opacity-60"
              />
              {quickMessage.trim().length > 0 && (
                <button
                  type="submit"
                  disabled={isTransitioning}
                  aria-label={t.home.sendButton}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-[11px] btn-primary text-[15px] font-medium transition-colors cursor-pointer shrink-0 animate-scale-in disabled:opacity-50"
                >
                  <span>{t.home.sendButton}</span>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>

            {inputError && (
              <div
                role="alert"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-[11px] border border-subtle bg-surface-secondary text-[13px] text-primary animate-fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{inputError}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4 pt-2 animate-fade-up anim-delay-2">
              <button
                type="button"
                disabled={isTransitioning}
                onClick={handlePrimaryCtaClick}
                className="group inline-flex items-center gap-3 px-7 py-3.5 rounded-[11px] btn-primary text-[15px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <span>{t.home.primaryCta}</span>
                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </button>
            </div>
          </form>
        </div>
      </main>

      {/* Bottom Area — Contains ONLY the subtle rounded segmented language selector (ID | EN) in bottom-right */}
      <footer className="w-full max-w-[1040px] mx-auto px-6 sm:px-10 py-8 flex items-center justify-end animate-fade-in anim-delay-2">
        <div
          role="group"
          aria-label={t.settings.languageTitle}
          className="inline-flex items-center p-1 rounded-[11px] border border-subtle bg-surface text-[13px]"
        >
          <button
            type="button"
            onClick={() => onChangeLanguage('id')}
            aria-pressed={language === 'id'}
            className={`px-3 py-1 rounded-[8px] font-medium transition-colors cursor-pointer ${
              language === 'id'
                ? 'btn-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            ID
          </button>
          <span
            aria-hidden="true"
            className="text-secondary/40 px-1 select-none"
          >
            |
          </span>
          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            aria-pressed={language === 'en'}
            className={`px-3 py-1 rounded-[8px] font-medium transition-colors cursor-pointer ${
              language === 'en'
                ? 'btn-primary'
                : 'text-secondary hover:text-primary'
            }`}
          >
            EN
          </button>
        </div>
      </footer>
    </div>
  );
};
