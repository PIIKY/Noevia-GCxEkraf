import React from 'react';
import { Globe, Monitor, Moon, ShieldCheck, Sun } from 'lucide-react';
import { AppLanguage } from '../types';
import { UI_TEXT } from '../lib/learningCenterData';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsViewProps {
  themePreference: ThemePreference;
  onChangeThemePreference: (pref: ThemePreference) => void;
  language: AppLanguage;
  onChangeLanguage: (lang: AppLanguage) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  themePreference,
  onChangeThemePreference,
  language,
  onChangeLanguage,
}) => {
  const t = UI_TEXT[language].settings;
  const isEn = language === 'en';

  return (
    <div className="max-w-[780px] mx-auto px-6 lg:px-8 py-8 lg:py-12 space-y-8 bg-app text-primary animate-fade-up">
      {/* Header */}
      <div className="border-b border-subtle pb-6 space-y-2">
        <h1 className="text-[28px] sm:text-[32px] font-semibold tracking-tight text-primary">
          {t.title}
        </h1>
        <p className="text-[16px] text-secondary leading-[1.6]">
          {t.subtitle}
        </p>
      </div>

      {/* A. Theme Appearance ("Tampilan Tema" / "Theme Appearance") */}
      <section className="p-6 sm:p-7 rounded-[16px] border border-subtle bg-surface space-y-5 animate-fade-up anim-delay-1">
        <div>
          <h2 className="text-[20px] font-semibold text-primary">
            {t.themeTitle}
          </h2>
          <p className="text-[15px] text-secondary mt-1">
            {t.themeSubtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <button
            type="button"
            onClick={() => onChangeThemePreference('light')}
            aria-pressed={themePreference === 'light'}
            className={`p-4 rounded-[14px] border text-left flex items-center gap-3.5 hover-lift cursor-pointer ${
              themePreference === 'light'
                ? 'border-[var(--text-primary)] bg-surface-secondary font-semibold text-primary'
                : 'border-subtle bg-surface text-secondary hover:text-primary'
            }`}
          >
            <Sun className="w-5 h-5 shrink-0" />
            <div>
              <span className="block text-[15px] text-primary">
                {t.lightMode}
              </span>
              <span className="block text-[12px] text-secondary font-normal">
                {t.lightModeSub}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangeThemePreference('dark')}
            aria-pressed={themePreference === 'dark'}
            className={`p-4 rounded-[14px] border text-left flex items-center gap-3.5 hover-lift cursor-pointer ${
              themePreference === 'dark'
                ? 'border-[var(--text-primary)] bg-surface-secondary font-semibold text-primary'
                : 'border-subtle bg-surface text-secondary hover:text-primary'
            }`}
          >
            <Moon className="w-5 h-5 shrink-0" />
            <div>
              <span className="block text-[15px] text-primary">
                {t.darkMode}
              </span>
              <span className="block text-[12px] text-secondary font-normal">
                {t.darkModeSub}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onChangeThemePreference('system')}
            aria-pressed={themePreference === 'system'}
            className={`p-4 rounded-[14px] border text-left flex items-center gap-3.5 hover-lift cursor-pointer ${
              themePreference === 'system'
                ? 'border-[var(--text-primary)] bg-surface-secondary font-semibold text-primary'
                : 'border-subtle bg-surface text-secondary hover:text-primary'
            }`}
          >
            <Monitor className="w-5 h-5 shrink-0" />
            <div>
              <span className="block text-[15px] text-primary">
                {t.systemDefault}
              </span>
              <span className="block text-[12px] text-secondary font-normal">
                {t.systemDefaultSub}
              </span>
            </div>
          </button>
        </div>
      </section>

      {/* B. Interface Language ("Bahasa Antarmuka" / "Interface Language") */}
      <section className="p-6 sm:p-7 rounded-[16px] border border-subtle bg-surface space-y-5 animate-fade-up anim-delay-2">
        <div className="flex items-start gap-3">
          <Globe className="w-5 h-5 text-primary shrink-0 mt-1" />
          <div>
            <h2 className="text-[20px] font-semibold text-primary">
              {t.languageTitle}
            </h2>
            <p className="text-[15px] text-secondary mt-1 leading-[1.6]">
              {t.languageSubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <button
            type="button"
            onClick={() => onChangeLanguage('id')}
            aria-pressed={language === 'id'}
            className={`p-4 rounded-[14px] border text-left hover-lift cursor-pointer ${
              language === 'id'
                ? 'border-[var(--text-primary)] bg-surface-secondary font-semibold text-primary'
                : 'border-subtle bg-surface text-secondary hover:text-primary'
            }`}
          >
            <span className="block text-[15px] text-primary">
              {t.langIdLabel}
            </span>
            <span className="block text-[12px] text-secondary font-normal mt-0.5">
              {t.langIdSub}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onChangeLanguage('en')}
            aria-pressed={language === 'en'}
            className={`p-4 rounded-[14px] border text-left hover-lift cursor-pointer ${
              language === 'en'
                ? 'border-[var(--text-primary)] bg-surface-secondary font-semibold text-primary'
                : 'border-subtle bg-surface text-secondary hover:text-primary'
            }`}
          >
            <span className="block text-[15px] text-primary">
              {t.langEnLabel}
            </span>
            <span className="block text-[12px] text-secondary font-normal mt-0.5">
              {t.langEnSub}
            </span>
          </button>
        </div>
      </section>

      {/* C. Privacy & Data Protection ("Privasi & Keamanan Data" / "Data Privacy & Security") */}
      <section className="p-6 sm:p-7 rounded-[16px] border border-subtle bg-surface space-y-3.5 animate-fade-up anim-delay-2">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-1" />
          <div className="space-y-1.5">
            <h2 className="text-[20px] font-semibold text-primary">
              {isEn ? 'Data Privacy & Isolation' : 'Privasi & Isolasi Data'}
            </h2>
            <p className="text-[14px] text-secondary leading-[1.6]">
              {isEn
                ? 'Your consultation transcripts, business profile, and generated reports (PDF, DOCX, XLSX, CSV) are strictly isolated to your account or local browser session. Other users cannot view, search, or download your consultations.'
                : 'Percakapan konsultasi, profil usaha, serta dokumen laporan yang dihasilkan (PDF, DOCX, XLSX, CSV) terisolasi sepenuhnya pada akun Anda atau sesi peramban lokal ini. Pengguna lain tidak dapat melihat, mencari, ataupun mengunduh data konsultasi Anda.'}
            </p>
            <p className="text-[13px] text-secondary leading-[1.6]">
              {isEn
                ? 'You can permanently delete any consultation session at any time from the My Consultations page without affecting the shared Business Learning Center.'
                : 'Anda dapat menghapus sesi konsultasi kapan saja melalui menu Konsultasi Saya tanpa memengaruhi materi bersama di Pusat Pengetahuan Bisnis.'}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
