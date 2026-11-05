import { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import {
  BookOpen,
  Compass,
  FolderClock,
  Lock,
  LogIn,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  ShieldAlert,
  Sparkles,
  Sun,
  UserCheck,
  X,
} from 'lucide-react';
import { AppLanguage, Consultation, KnowledgeDocument } from './types';
import { INITIAL_KNOWLEDGE_DOCUMENTS } from './lib/knowledgeBase';
import {
  createNewConsultation,
  createSweetBiteDemoConsultation,
} from './lib/consultationEngine';
import {
  assignConsultationOwner,
  canAccessConsultation,
  filterConsultationsByOwner,
  getScopedConsultationsStorageKey,
} from './lib/multiUserIsolation';
import {
  auth,
  deleteConsultationFromFirestore,
  saveConsultationToFirestore,
  signInWithGooglePopup,
  signOutFirebaseUser,
  subscribeToUserConsultations,
} from './lib/firebase';
import { UI_TEXT } from './lib/learningCenterData';
import { LandingView } from './components/LandingView';
import { ConsultationWorkspace } from './components/ConsultationWorkspace';
import { MyConsultationsView } from './components/MyConsultationsView';
import { KnowledgeBaseView } from './components/KnowledgeBaseView';
import { TipsAndGuidesView } from './components/TipsAndGuidesView';
import { SettingsView, ThemePreference } from './components/SettingsView';
import { AdminToolsView } from './components/AdminToolsView';

type ActiveSection =
  | 'landing'
  | 'workspace'
  | 'history'
  | 'knowledge'
  | 'tips'
  | 'settings'
  | 'admin';

const STORAGE_KEY_KB_DOCS = 'noevia_kb_documents_v2';
const STORAGE_KEY_THEME = 'noevia_theme_preference';
const STORAGE_KEY_LANGUAGE = 'noevia_language_preference';

function loadScopedConsultations(uid: string | null): Consultation[] {
  const storageKey = getScopedConsultationsStorageKey(uid);
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const filtered = filterConsultationsByOwner(parsed, uid);
        if (filtered.length > 0) {
          return filtered;
        }
      }
    }
  } catch {
    // ignore storage errors
  }
  const fresh = assignConsultationOwner(createNewConsultation(), uid);
  const demo = createSweetBiteDemoConsultation();
  return [fresh, demo];
}

export default function App() {
  // Detect separated internal Admin / Developer mode via URL (?admin=1 or /admin)
  const [isAdminMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return (
      window.location.pathname === '/admin' || params.get('admin') === '1'
    );
  });

  // Firebase Auth User State (Multi-User Isolation Phase 1)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const actingUserId = currentUser?.uid || null;

  // Language system (Default: Bahasa Indonesia 'id', Alternative: English 'en')
  const [language, setLanguage] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANGUAGE);
      if (saved === 'id' || saved === 'en') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'id';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANGUAGE, language);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = UI_TEXT[language];

  // Theme system (Light / Dark / System)
  const [themePreference, setThemePreference] = useState<ThemePreference>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        return saved;
      }
    } catch {
      // ignore storage errors
    }
    return 'system';
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      // ignore
    }
    return (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_THEME, themePreference);
    } catch {
      // ignore
    }

    const computeDark = () => {
      if (themePreference === 'dark') return true;
      if (themePreference === 'light') return false;
      return (
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    };

    const nextDark = computeDark();
    setIsDark(nextDark);

    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', nextDark);
    }

    if (
      themePreference === 'system' &&
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function'
    ) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (e: MediaQueryListEvent) => {
        setIsDark(e.matches);
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [themePreference]);

  const handleToggleThemeQuick = () => {
    setThemePreference(isDark ? 'light' : 'dark');
  };

  // Initialize Shared Read-Only Knowledge Base documents
  const [documents, setDocuments] = useState<KnowledgeDocument[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_KB_DOCS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
    return INITIAL_KNOWLEDGE_DOCUMENTS;
  });

  // Initialize Scoped Consultations list per user account (or isolated guest session)
  const [consultations, setConsultations] = useState<Consultation[]>(() =>
    loadScopedConsultations(null)
  );

  const [activeConsultationId, setActiveConsultationId] = useState<string>(() => {
    return consultations[0]?.id || '';
  });

  // Listen to Firebase Auth state & subscribe to private Firestore consultations
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      const uid = user?.uid || null;

      // Load scoped consultations for this specific user (isolating Account A vs Account B)
      const localScoped = loadScopedConsultations(uid);
      setConsultations(localScoped);
      setActiveConsultationId(localScoped[0]?.id || '');

      if (unsubscribeFirestore) {
        unsubscribeFirestore();
        unsubscribeFirestore = null;
      }

      if (user) {
        unsubscribeFirestore = subscribeToUserConsultations(
          user,
          (remoteSummaries) => {
            if (remoteSummaries.length > 0) {
              setConsultations((prev) => {
                const existingById = new Map(prev.map((c) => [c.id, c]));
                const merged: Consultation[] = remoteSummaries.map((rem) => {
                  const found = existingById.get(rem.id);
                  if (found) return found;
                  const hydrated = createNewConsultation({
                    businessName: rem.businessName,
                    businessCategory: rem.businessCategory,
                  });
                  return assignConsultationOwner(
                    {
                      ...hydrated,
                      id: rem.id,
                      title: rem.title,
                      initialProblem: rem.initialProblem,
                    },
                    user.uid
                  );
                });
                const demo = createSweetBiteDemoConsultation();
                return [
                  ...merged,
                  ...(merged.some((c) => c.id === 'cons-sweetbite-demo')
                    ? []
                    : [demo]),
                ];
              });
            }
          }
        );
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, []);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGooglePopup();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : language === 'id'
            ? 'Gagal masuk dengan Google.'
            : 'Failed to sign in with Google.'
      );
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    try {
      await signOutFirebaseUser();
    } catch (err) {
      setAuthError(
        err instanceof Error
          ? err.message
          : language === 'id'
            ? 'Gagal keluar akun.'
            : 'Failed to sign out.'
      );
    }
  };

  const [initialPendingMessage, setInitialPendingMessage] = useState<
    string | null
  >(null);

  // Support ?admin=1 / /admin or ?autostart=1
  const [activeSection, setActiveSection] = useState<ActiveSection>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (
        window.location.pathname === '/admin' ||
        params.get('admin') === '1'
      ) {
        return 'admin';
      }
      if (params.get('autostart') === '1') {
        return 'workspace';
      }
    }
    return 'landing';
  });

  // Desktop collapsible sidebar & mobile drawer state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [targetGuideId, setTargetGuideId] = useState<string | null>(null);
  const [targetArticleId, setTargetArticleId] = useState<string | null>(null);

  // Persist consultations to user-scoped storage key and KB documents to shared KB key
  useEffect(() => {
    try {
      const storageKey = getScopedConsultationsStorageKey(actingUserId);
      const ownedOnly = filterConsultationsByOwner(consultations, actingUserId);
      localStorage.setItem(storageKey, JSON.stringify(ownedOnly));
    } catch {
      // ignore
    }
  }, [consultations, actingUserId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_KB_DOCS, JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents]);

  const visibleConsultations = filterConsultationsByOwner(
    consultations,
    actingUserId
  );

  const activeConsultation =
    visibleConsultations.find((c) => c.id === activeConsultationId) ||
    visibleConsultations[0];

  // Start a new consultation (optionally with an initial message from home or tips)
  const handleStartNewConsultation = (starterMessage?: string) => {
    const emptyExisting = visibleConsultations.find(
      (c) =>
        c.messages.length === 0 &&
        !c.result &&
        c.id !== 'cons-sweetbite-demo'
    );

    if (emptyExisting) {
      setActiveConsultationId(emptyExisting.id);
    } else {
      const fresh = assignConsultationOwner(
        createNewConsultation(),
        actingUserId
      );
      setConsultations((prev) => [fresh, ...prev]);
      setActiveConsultationId(fresh.id);
      if (currentUser) {
        void saveConsultationToFirestore(fresh, currentUser);
      }
    }

    if (starterMessage && starterMessage.trim()) {
      setInitialPendingMessage(starterMessage.trim());
    } else {
      setInitialPendingMessage(null);
    }

    setActiveSection('workspace');
    setMobileMenuOpen(false);
  };

  // Open SweetBite Bakery illustrative consultation inside the chat interface
  const handleOpenSweetBiteDemo = () => {
    const existingDemo = visibleConsultations.find(
      (c) =>
        c.id === 'cons-sweetbite-demo' || c.businessName === 'SweetBite Bakery'
    );
    if (existingDemo) {
      setActiveConsultationId(existingDemo.id);
    } else {
      const demo = createSweetBiteDemoConsultation();
      setConsultations((prev) => [demo, ...prev]);
      setActiveConsultationId(demo.id);
    }
    setActiveSection('workspace');
    setMobileMenuOpen(false);
  };

  const handleUpdateConsultation = (updated: Consultation) => {
    if (!canAccessConsultation(updated, actingUserId)) {
      return;
    }
    const ownedUpdated =
      updated.id === 'cons-sweetbite-demo'
        ? updated
        : assignConsultationOwner(updated, actingUserId);

    setConsultations((prev) =>
      prev.map((item) => (item.id === ownedUpdated.id ? ownedUpdated : item))
    );

    if (currentUser && ownedUpdated.id !== 'cons-sweetbite-demo') {
      void saveConsultationToFirestore(ownedUpdated, currentUser);
    }
  };

  const handleSelectConsultation = (id: string) => {
    const target = visibleConsultations.find((c) => c.id === id);
    if (!target || !canAccessConsultation(target, actingUserId)) return;
    setActiveConsultationId(target.id);
    setActiveSection('workspace');
    setMobileMenuOpen(false);
  };

  const handleDeleteConsultation = (id: string) => {
    const target = visibleConsultations.find((c) => c.id === id);
    if (target && !canAccessConsultation(target, actingUserId)) return;

    setConsultations((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      if (remaining.length === 0) {
        const fresh = assignConsultationOwner(
          createNewConsultation(),
          actingUserId
        );
        setActiveConsultationId(fresh.id);
        return [fresh];
      }
      if (id === activeConsultationId) {
        setActiveConsultationId(remaining[0].id);
      }
      return remaining;
    });

    if (currentUser && id !== 'cons-sweetbite-demo') {
      void deleteConsultationFromFirestore(id, currentUser);
    }
  };

  // Separated Action A: Restore Demo Data (SweetBite Bakery) without deleting user consultations or KB
  const handleRestoreDemoConsultation = () => {
    const demo = createSweetBiteDemoConsultation();
    setConsultations((prev) => {
      const withoutDemo = prev.filter(
        (c) =>
          c.id !== 'cons-sweetbite-demo' &&
          c.businessName !== 'SweetBite Bakery'
      );
      return [demo, ...withoutDemo];
    });
  };

  // Separated Action B: Clear Consultation History ONLY (never touches Knowledge Base catalog)
  const handleClearConsultationHistoryOnly = () => {
    const fresh = assignConsultationOwner(
      createNewConsultation(),
      actingUserId
    );
    setConsultations([fresh]);
    setActiveConsultationId(fresh.id);
  };

  // Separated Action C: Knowledge Base handlers (only accessible in Admin Tools)
  const handleAddDocument = (doc: KnowledgeDocument) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const handleUpdateDocumentStatus = (
    docId: string,
    status: KnowledgeDocument['processingStatus']
  ) => {
    setDocuments((prev) =>
      prev.map((d) =>
        d.id === docId
          ? {
              ...d,
              processingStatus: status,
              updatedAt: new Date().toISOString(),
            }
          : d
      )
    );
  };

  const handleDeleteDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleResetDefaultDocuments = () => {
    setDocuments(INITIAL_KNOWLEDGE_DOCUMENTS);
  };

  const recentConsultations = visibleConsultations.filter(
    (c) => c.id !== 'cons-sweetbite-demo'
  );

  // Render Minimalist Home Screen
  if (activeSection === 'landing') {
    return (
      <LandingView
        onStartConsultation={(msg) => handleStartNewConsultation(msg)}
        onOpenExistingWorkspace={() => setActiveSection('workspace')}
        isDark={isDark}
        onToggleTheme={handleToggleThemeQuick}
        language={language}
        onChangeLanguage={setLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-app text-primary flex flex-col lg:flex-row selection:bg-[var(--accent-bg)] selection:text-[var(--accent-text)]">
      {/* Desktop Collapsible Sidebar */}
      <aside
        aria-label={language === 'id' ? 'Sidebar Navigasi' : 'Navigation Sidebar'}
        className={`hidden lg:flex flex-col justify-between border-r border-subtle bg-surface-secondary shrink-0 sticky top-0 h-screen transition-all duration-200 ease-out ${
          sidebarCollapsed ? 'lg:w-16' : 'lg:w-72'
        }`}
      >
        <div className="p-4 flex flex-col h-full overflow-hidden">
          {/* Sidebar Top Brand & Collapse Button */}
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-subtle">
            {!sidebarCollapsed && (
              <button
                type="button"
                onClick={() => setActiveSection('landing')}
                className="text-[18px] font-semibold tracking-[-0.03em] text-primary cursor-pointer"
              >
                NOEVIA
              </button>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={
                sidebarCollapsed ? t.nav.openSidebar : t.nav.collapseSidebar
              }
              className="p-2 rounded-[10px] text-secondary hover:text-primary transition-colors cursor-pointer mx-auto lg:mx-0"
            >
              {sidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4" />
              ) : (
                <PanelLeftClose className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* 1. + Konsultasi Baru */}
          <div className="mb-4">
            <button
              type="button"
              onClick={() => handleStartNewConsultation()}
              title={t.nav.newConsultation}
              className={`w-full flex items-center justify-center gap-2.5 py-3 rounded-[11px] btn-primary text-[15px] font-medium transition-colors cursor-pointer ${
                sidebarCollapsed ? 'px-2' : 'px-4'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && <span>{t.nav.newConsultation}</span>}
            </button>
          </div>

          {/* Main Navigation Items */}
          <nav
            aria-label={language === 'id' ? 'Menu Utama' : 'Main Menu'}
            className="space-y-1 text-[15px]"
          >
            {/* 2. Riwayat Konsultasi */}
            <button
              type="button"
              onClick={() => setActiveSection('history')}
              title={t.nav.history}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors cursor-pointer ${
                activeSection === 'history'
                  ? 'bg-surface text-primary font-medium border border-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              <FolderClock className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">{t.nav.history}</span>
              )}
            </button>

            {/* 3. Pusat Pengetahuan Bisnis */}
            <button
              type="button"
              onClick={() => setActiveSection('knowledge')}
              title={t.nav.knowledgeCenter}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors cursor-pointer ${
                activeSection === 'knowledge'
                  ? 'bg-surface text-primary font-medium border border-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">{t.nav.knowledgeCenter}</span>
              )}
            </button>

            {/* 4. Tips, Panduan & FAQ */}
            <button
              type="button"
              onClick={() => setActiveSection('tips')}
              title={t.nav.tipsAndFaq}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors cursor-pointer ${
                activeSection === 'tips'
                  ? 'bg-surface text-primary font-medium border border-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">{t.nav.tipsAndFaq}</span>
              )}
            </button>

            {/* 5. Settings */}
            <button
              type="button"
              onClick={() => setActiveSection('settings')}
              title={t.nav.settings}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors cursor-pointer ${
                activeSection === 'settings'
                  ? 'bg-surface text-primary font-medium border border-subtle'
                  : 'text-secondary hover:text-primary hover:bg-surface'
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              {!sidebarCollapsed && (
                <span className="flex-1 truncate">{t.nav.settings}</span>
              )}
            </button>

            {/* Separated Internal Admin / Developer Tools (visible only when ?admin=1 or /admin) */}
            {(isAdminMode || activeSection === 'admin') && (
              <button
                type="button"
                onClick={() => setActiveSection('admin')}
                title={t.nav.adminTools}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-left transition-colors cursor-pointer ${
                  activeSection === 'admin'
                    ? 'bg-surface text-primary font-medium border border-subtle'
                    : 'text-secondary hover:text-primary hover:bg-surface'
                }`}
              >
                <ShieldAlert className="w-4 h-4 shrink-0" />
                {!sidebarCollapsed && (
                  <span className="flex-1 truncate">{t.nav.adminTools}</span>
                )}
              </button>
            )}
          </nav>

          {/* Recent Consultation History below main navigation */}
          {!sidebarCollapsed && (
            <div className="mt-5 pt-4 border-t border-subtle flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <p className="px-3 text-[12px] font-medium text-secondary mb-2">
                  {t.nav.recentConversations}
                </p>
                <div className="space-y-1">
                  {recentConsultations.slice(0, 5).map((item) => {
                    const isSelected =
                      item.id === activeConsultation?.id &&
                      activeSection === 'workspace';
                    const displayTitle =
                      item.title === 'Sesi Konsultasi Bisnis Baru' &&
                      language === 'en'
                        ? 'New Business Consultation'
                        : item.title;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectConsultation(item.id)}
                        className={`w-full text-left px-3 py-2 rounded-[10px] text-[14px] transition-colors cursor-pointer truncate ${
                          isSelected
                            ? 'bg-surface text-primary font-medium border border-subtle'
                            : 'text-secondary hover:text-primary hover:bg-surface'
                        }`}
                      >
                        {displayTitle}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Optional Example Area (SweetBite Bakery) */}
              <div className="pt-3 border-t border-subtle">
                <p className="px-3 text-[12px] font-medium text-secondary mb-1.5">
                  {t.nav.sampleConsultation}
                </p>
                <button
                  type="button"
                  onClick={handleOpenSweetBiteDemo}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-left text-[14px] transition-colors cursor-pointer ${
                    activeConsultation?.id === 'cons-sweetbite-demo' &&
                    activeSection === 'workspace'
                      ? 'bg-surface text-primary font-medium border border-subtle'
                      : 'text-secondary hover:text-primary hover:bg-surface'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">SweetBite Bakery</span>
                </button>
              </div>

              {/* Multi-User Account & Private Isolation Panel (Phase 1) */}
              <div className="pt-3 border-t border-subtle">
                {currentUser ? (
                  <div className="p-3 rounded-[12px] bg-surface border border-subtle space-y-2">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[12px] font-semibold text-primary truncate">
                          {currentUser.displayName || currentUser.email}
                        </p>
                        <p className="text-[11px] text-secondary truncate">
                          {language === 'id'
                            ? 'Akun Privat Terisolasi (Cloud)'
                            : 'Private Isolated Account'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleSignOut()}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-subtle bg-surface-secondary hover:border-[var(--text-primary)] text-[12px] text-primary cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{language === 'id' ? 'Keluar' : 'Sign Out'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-[12px] bg-surface border border-subtle space-y-2">
                    <div className="flex items-start gap-2 text-[11px] text-secondary leading-snug">
                      <Lock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>
                        {language === 'id'
                          ? 'Mode Tamu: Riwayat disimpan sementara di perangkat ini. Masuk untuk sinkronisasi akun privat.'
                          : 'Guest Mode: History is stored locally on this device. Sign in for private cloud sync.'}
                      </span>
                    </div>
                    {authReady && (
                      <button
                        type="button"
                        onClick={() => void handleGoogleSignIn()}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[8px] btn-primary text-[12px] font-medium cursor-pointer"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        <span>
                          {language === 'id'
                            ? 'Masuk dengan Google'
                            : 'Sign in with Google'}
                        </span>
                      </button>
                    )}
                    {authError && (
                      <p className="text-[11px] text-secondary">{authError}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sidebar Bottom Language (ID | EN) & Theme Controls */}
          <div className="pt-4 mt-auto border-t border-subtle flex items-center justify-between gap-2">
            {!sidebarCollapsed && (
              <div
                role="group"
                aria-label={
                  language === 'id' ? 'Pilih Bahasa' : 'Select Language'
                }
                className="inline-flex items-center p-1 rounded-[11px] border border-subtle bg-surface"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('id')}
                  aria-pressed={language === 'id'}
                  className={`px-2.5 py-1 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
                    language === 'id'
                      ? 'btn-primary'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  ID
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  aria-pressed={language === 'en'}
                  className={`px-2.5 py-1 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
                    language === 'en'
                      ? 'btn-primary'
                      : 'text-secondary hover:text-primary'
                  }`}
                >
                  EN
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleToggleThemeQuick}
              aria-label={isDark ? t.nav.switchToLight : t.nav.switchToDark}
              className="p-2 rounded-[10px] border border-subtle bg-surface text-primary hover:bg-app transition-colors cursor-pointer mx-auto lg:mx-0"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Bar & Drawer (< 1024px) */}
      <header className="lg:hidden border-b border-subtle bg-surface sticky top-0 z-30">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              aria-label={t.nav.openMobileMenu}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-[10px] border border-subtle bg-surface-secondary text-primary cursor-pointer"
            >
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSection('landing')}
              className="text-[16px] font-semibold tracking-tight text-primary cursor-pointer"
            >
              NOEVIA
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div
              role="group"
              aria-label={
                language === 'id' ? 'Pilih Bahasa' : 'Select Language'
              }
              className="inline-flex items-center p-0.5 rounded-[10px] border border-subtle bg-surface-secondary"
            >
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2 py-1 rounded-[7px] text-[11px] font-medium cursor-pointer ${
                  language === 'id' ? 'btn-primary' : 'text-secondary'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-[7px] text-[11px] font-medium cursor-pointer ${
                  language === 'en' ? 'btn-primary' : 'text-secondary'
                }`}
              >
                EN
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleThemeQuick}
              aria-label={isDark ? t.nav.switchToLight : t.nav.switchToDark}
              className="p-2 rounded-[10px] border border-subtle bg-surface-secondary text-primary cursor-pointer"
            >
              {isDark ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => handleStartNewConsultation()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[11px] btn-primary text-[13px] font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t.nav.newConsultation}</span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label={language === 'id' ? 'Navigasi Mobile' : 'Mobile Navigation'}
            className="border-t border-subtle bg-surface-secondary px-4 py-4 space-y-4 text-[15px] animate-fade-up"
          >
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => handleStartNewConsultation()}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] btn-primary text-left font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t.nav.newConsultation}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('history');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-left text-primary hover:bg-surface cursor-pointer"
              >
                <FolderClock className="w-4 h-4" />
                <span>{t.nav.history}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('knowledge');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-left text-primary hover:bg-surface cursor-pointer"
              >
                <BookOpen className="w-4 h-4" />
                <span>{t.nav.knowledgeCenter}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('tips');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-left text-primary hover:bg-surface cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>{t.nav.tipsAndFaq}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSection('settings');
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-left text-primary hover:bg-surface cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                <span>{t.nav.settings}</span>
              </button>
              {(isAdminMode || activeSection === 'admin') && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveSection('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[11px] text-left text-primary hover:bg-surface cursor-pointer"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>{t.nav.adminTools}</span>
                </button>
              )}
            </div>

            {/* Mobile Recent Consultations */}
            <div className="pt-3 border-t border-subtle space-y-1">
              <p className="px-3 text-[12px] text-secondary">
                {t.nav.recentConversations}
              </p>
              {recentConsultations.slice(0, 4).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectConsultation(item.id)}
                  className="block w-full text-left px-3 py-2 rounded-[10px] text-[14px] text-secondary hover:text-primary truncate cursor-pointer"
                >
                  {item.title === 'Sesi Konsultasi Bisnis Baru' &&
                  language === 'en'
                    ? 'New Business Consultation'
                    : item.title}
                </button>
              ))}
              <button
                type="button"
                onClick={handleOpenSweetBiteDemo}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-[10px] text-left text-[14px] text-secondary hover:text-primary cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {language === 'id'
                    ? 'Contoh: SweetBite Bakery'
                    : 'Sample: SweetBite Bakery'}
                </span>
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col bg-app">
        {activeSection === 'workspace' && activeConsultation && (
          <ConsultationWorkspace
            key={activeConsultation.id}
            consultation={activeConsultation}
            documents={documents}
            onUpdateConsultation={handleUpdateConsultation}
            initialPendingMessage={initialPendingMessage}
            onClearPendingMessage={() => setInitialPendingMessage(null)}
            language={language}
            actingUserId={actingUserId}
          />
        )}

        {activeSection === 'history' && (
          <MyConsultationsView
            consultations={visibleConsultations}
            activeConsultationId={activeConsultation?.id || ''}
            onSelectConsultation={handleSelectConsultation}
            onDeleteConsultation={handleDeleteConsultation}
            onClearConsultationHistory={handleClearConsultationHistoryOnly}
            onStartNewConsultation={() => handleStartNewConsultation()}
            onLoadSweetBiteDemo={handleOpenSweetBiteDemo}
            language={language}
          />
        )}

        {activeSection === 'knowledge' && (
          <KnowledgeBaseView
            onStartConsultation={(prompt) => handleStartNewConsultation(prompt)}
            onOpenGuide={(guideId) => {
              setTargetGuideId(guideId);
              setActiveSection('tips');
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            initialArticleId={targetArticleId}
            onClearInitialArticleId={() => setTargetArticleId(null)}
            documents={documents}
            language={language}
          />
        )}

        {activeSection === 'tips' && (
          <TipsAndGuidesView
            onStartNewConsultation={(prompt) =>
              handleStartNewConsultation(prompt)
            }
            onOpenSweetBiteDemo={handleOpenSweetBiteDemo}
            initialGuideId={targetGuideId}
            onClearInitialGuideId={() => setTargetGuideId(null)}
            onOpenArticle={(articleId) => {
              setTargetArticleId(articleId);
              setActiveSection('knowledge');
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
            language={language}
          />
        )}

        {activeSection === 'settings' && (
          <SettingsView
            themePreference={themePreference}
            onChangeThemePreference={setThemePreference}
            language={language}
            onChangeLanguage={setLanguage}
          />
        )}

        {activeSection === 'admin' && (
          <AdminToolsView
            documents={documents}
            consultationCount={visibleConsultations.length}
            onAddDocument={handleAddDocument}
            onUpdateDocumentStatus={handleUpdateDocumentStatus}
            onDeleteDocument={handleDeleteDocument}
            onResetDefaultDocuments={handleResetDefaultDocuments}
            onRestoreDemoConsultation={handleRestoreDemoConsultation}
            onClearConsultationHistoryOnly={handleClearConsultationHistoryOnly}
            onExitAdminMode={() => setActiveSection('workspace')}
            language={language}
          />
        )}
      </main>
    </div>
  );
}
