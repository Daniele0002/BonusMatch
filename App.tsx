import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { UserProfile, MatchResult, AppView } from "./types";
import { MOCK_BONUSES } from "./constants";
import { analyzeProfileWithAI, calculateDeterministicMatches } from "./services/geminiService";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProfileForm from "./components/ProfileForm";
import Dashboard from "./components/Dashboard";
import BonusDetailView from "./components/BonusDetailView";
import SearchView from "./components/SearchView";
import LoginForm from "./components/Auth/LoginForm";
import RegisterForm from "./components/Auth/RegisterForm";
import PostRegistrationForm from "./components/Auth/PostRegistrationForm";
import ForgotPasswordForm from "./components/Auth/ForgotPasswordForm";
import PaymentModal from "./components/Premium/PaymentModal";
import PaymentSuccessModal from "./components/Premium/PaymentSuccessModal";
import { useAuth } from "./context/AuthContext";
import { supabase } from "./lib/supabaseClient";
import { AnimatePresence, motion } from "framer-motion";
import PageTransition from "./components/PageTransition";
import AIChatWidget from "./components/Chat/AIChatWidget";
import SavedBonusesView from "./components/SavedBonusesView";
import FamilyModeView from "./components/FamilyModeView";
import LandingPage from "./components/LandingPage";

// ═══════════════════════════════════════════════════════════════════════════════
// COSTANTI - Chiavi per localStorage e configurazioni globali
// ═══════════════════════════════════════════════════════════════════════════════
const CACHE_KEY_PREFIX = "bonus_results_";
const GUEST_PROFILE_KEY = "guest_profile_data";
const THEME_KEY = "theme";
const PENDING_PREMIUM_KEY = "pending_premium_upgrade";

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY - Funzioni helper per localStorage con gestione errori sicura
// ═══════════════════════════════════════════════════════════════════════════════

/** Recupera il tema salvato o usa le preferenze di sistema */
const getStoredTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem(THEME_KEY);
  return saved === "dark" || saved === "light" 
    ? saved 
    : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

/** Genera chiave cache per i risultati utente */
const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

/** Parse JSON sicuro con fallback */
const safeParseJSON = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
};

/** Wrapper sicuri per localStorage (gestiscono quota exceeded e errori) */
const storage = {
  set: (key: string, value: string) => { try { localStorage.setItem(key, value); return true; } catch { return false; } },
  get: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } },
  remove: (key: string) => { try { localStorage.removeItem(key); } catch { /* silently fail */ } }
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTI HELPER - Elementi UI riutilizzabili per ridurre duplicazione
// ═══════════════════════════════════════════════════════════════════════════════

/** Animazione lettera per lettera del titolo */
const AnimatedText: React.FC<{ text: string; className?: string; keyPrefix: string }> = ({ text, className = "", keyPrefix }) => (
  <>
    {text.split("").map((char, i) => (
      <motion.span
        key={`${keyPrefix}-${i}`}
        className={className}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 200 } },
        }}
      >
        {char}
      </motion.span>
    ))}
  </>
);

/** Pagina placeholder per funzionalità Premium (Calendar/Documents) */
const PremiumFeaturePage: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  emptyText?: string;
  buttonText?: string;
  colorClass: string;
}> = ({ icon, title, description, emptyText, buttonText, colorClass }) => (
  <div className="max-w-4xl mx-auto py-10 text-center">
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 shadow-2xl border border-slate-100 dark:border-slate-800">
      <div className={`h-20 w-20 ${colorClass} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
        {icon}
      </div>
      <h2 className="text-4xl font-black mb-4 dark:text-white">{title}</h2>
      <p className="text-slate-500 text-lg max-w-lg mx-auto mb-8">{description}</p>
      {emptyText && (
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">{emptyText}</span>
        </div>
      )}
      {buttonText && (
        <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">
          {buttonText}
        </button>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE APP
// ═══════════════════════════════════════════════════════════════════════════════
const App: React.FC = () => {
  // ─────────────────────────────────────────────────────────────────────────────
  // STATE & CONTEXT - Gestione stato applicazione
  // ─────────────────────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<AppView[]>([{ type: "form" }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getStoredTheme);
  const [pendingPremiumUpgrade, setPendingPremiumUpgrade] = useState(() => storage.get(PENDING_PREMIUM_KEY) === "true");
  const [isProcessingPayment, setIsProcessingPayment] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('payment') === 'success' || !!params.get('session_id');
  });

  const { user, updateUser, isLoading, logout } = useAuth();
  const initialLoadDone = useRef(false);
  const currentView = history[historyIndex];

  // Helper memoizzato per verificare se la view ha profile e results
  const viewHasData = useMemo(() => "profile" in currentView && "results" in currentView, [currentView]);
  const viewData = viewHasData ? currentView as AppView & { profile: UserProfile; results: MatchResult[] } : null;

  // ─────────────────────────────────────────────────────────────────────────────
  // EFFETTI - Gestione side effects (tema, pagamenti, sessione)
  // ─────────────────────────────────────────────────────────────────────────────
  
  /** Applica il tema al documento e salva preferenza */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    storage.set(THEME_KEY, theme);
  }, [theme]);

  /** Gestisce il ritorno dal pagamento Stripe e aggiorna stato premium */
  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get("payment");
      const sessionId = params.get("session_id");
      const isPending = paymentStatus === "success" || pendingPremiumUpgrade;
      
      // Gestione pagamento annullato
      if (paymentStatus === "cancel") {
        window.history.replaceState({}, "", window.location.pathname);
        setIsProcessingPayment(false);
        return;
      }
      
      if (!isPending) {
        setIsProcessingPayment(false);
        return;
      }
      
      // Aspetta che l'utente sia caricato
      if (isLoading) return;
      
      // Se abbiamo una session_id E un utente, verifica lato server
      if (sessionId && user) {
        try {
          const response = await fetch('/.netlify/functions/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          
          const result = await response.json();
          console.log('Verify payment result:', result);
          
          if (result.success) {
            // Pulisci URL
            window.history.replaceState({}, "", window.location.pathname);
            // Aggiorna cache locale con isPremium = true
            const updatedUser = { ...user, isPremium: true };
            localStorage.setItem(`user_profile_${user.id}`, JSON.stringify(updatedUser));
            updateUser?.(updatedUser);
            
            // Naviga alla dashboard con i dati utente
            if (updatedUser.profile) {
              const results = calculateDeterministicMatches(updatedUser.profile, MOCK_BONUSES);
              setHistory([{ type: "dashboard", profile: updatedUser.profile, results }]);
              setHistoryIndex(0);
              initialLoadDone.current = true;
            } else {
              setHistory([{ type: "dashboard", profile: undefined as any, results: [] }]);
              setHistoryIndex(0);
            }
            
            // Mostra modal successo
            setShowPaymentSuccessModal(true);
            storage.remove(PENDING_PREMIUM_KEY);
            setPendingPremiumUpgrade(false);
            setIsProcessingPayment(false);
            return;
          }
        } catch (err) {
          console.error("Errore verifica pagamento:", err);
        }
      }
      
      // Salva flag e pulisci URL se nuovo pagamento (fallback senza sessionId)
      if (paymentStatus === "success" && !sessionId) {
        storage.set(PENDING_PREMIUM_KEY, "true");
        window.history.replaceState({}, "", window.location.pathname);
      }
      
      if (!user?.id) {
        // Utente non ancora caricato, aspetta
        return;
      }
      
      // Fallback: Aggiorna database Supabase con stato premium dal client
      try {
        let result = await supabase.from("profiles").update({ tipo_utente: "premium", is_premium: true }).eq("id", user.id).select();
        // Fallback: prova con email se id non trova righe
        if (!result.data?.length) {
          result = await supabase.from("profiles").update({ tipo_utente: "premium", is_premium: true }).eq("email", user.email).select();
        }
        if (!result.error && result.data?.length) {
          storage.remove(PENDING_PREMIUM_KEY);
          setPendingPremiumUpgrade(false);
          const updatedUser = { ...user, isPremium: true };
          localStorage.setItem(`user_profile_${user.id}`, JSON.stringify(updatedUser));
          updateUser?.(updatedUser);
          // Naviga alla dashboard
          if (updatedUser.profile) {
            const results = calculateDeterministicMatches(updatedUser.profile, MOCK_BONUSES);
            setHistory([{ type: "dashboard", profile: updatedUser.profile, results }]);
            setHistoryIndex(0);
            initialLoadDone.current = true;
          }
        }
      } catch (err) {
        console.error("Errore aggiornamento premium:", err);
      }
      
      // Mostra modal successo
      setShowPaymentSuccessModal(true);
      storage.remove(PENDING_PREMIUM_KEY);
      setPendingPremiumUpgrade(false);
      setIsProcessingPayment(false);
    };
    
    handlePaymentSuccess();
  }, [user, updateUser, isLoading, pendingPremiumUpgrade]);

  const toggleTheme = useCallback(() => setTheme((prev) => (prev === "light" ? "dark" : "light")), []);

  /** Ripristina la sessione utente al caricamento (cache → calcolo → AI) */
  useEffect(() => {
    const restoreSession = async () => {
      if (isLoading || !user || initialLoadDone.current) return;

      // Utente senza profilo: mostra dashboard vuota
      if (!user.profile) {
        initialLoadDone.current = true;
        setHistory([{ type: "dashboard", profile: undefined, results: [] }]);
        setHistoryIndex(0);
        return;
      }

      initialLoadDone.current = true;
      const cacheKey = getCacheKey(user.id);
      let results: MatchResult[] = [];

      // Strategia a cascata: Cache → Deterministico → AI
      const cached = storage.get(cacheKey);
      if (cached) results = safeParseJSON<MatchResult[]>(cached, []);

      if (!results.length) {
        try {
          results = calculateDeterministicMatches(user.profile, MOCK_BONUSES);
          if (results.length) storage.set(cacheKey, JSON.stringify(results));
        } catch { /* fallback to AI */ }
      }

      if (results.length) {
        setHistory([{ type: "dashboard", profile: user.profile, results }]);
        setHistoryIndex(0);
        return;
      }

      // Ultima risorsa: analisi AI
      setIsAnalyzing(true);
      try {
        results = await analyzeProfileWithAI(user.profile, MOCK_BONUSES);
        storage.set(cacheKey, JSON.stringify(results));
      } catch { results = []; }
      setIsAnalyzing(false);
      
      setHistory([{ type: "dashboard", profile: user.profile, results }]);
      setHistoryIndex(0);
    };

    restoreSession();
    if (!user) initialLoadDone.current = false;
  }, [user, isLoading]);

  // ─────────────────────────────────────────────────────────────────────────────
  // NAVIGATION HANDLERS - Funzioni per navigazione tra viste
  // ─────────────────────────────────────────────────────────────────────────────

  /** Resetta la history alla vista iniziale (form) */
  const resetToForm = useCallback(() => {
    setHistory([{ type: "form" }]);
    setHistoryIndex(0);
  }, []);

  /** Naviga a una nuova vista aggiungendola alla history */
  const navigateTo = useCallback((newView: AppView) => {
    setHistory((prev) => [...prev.slice(0, historyIndex + 1), newView]);
    setHistoryIndex((prev) => prev + 1);
    window.scrollTo(0, 0);
  }, [historyIndex]);

  /** Mostra modal premium o redirect a login se non autenticato */
  const handleShowPremium = useCallback(() => {
    user ? setShowPaymentModal(true) : navigateTo({ type: "login" });
  }, [user, navigateTo]);

  /** Torna alla vista precedente nella history */
  const goBack = useCallback(() => {
    setHistoryIndex((prev) => Math.max(0, prev - 1));
    window.scrollTo(0, 0);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────────
  // BUSINESS LOGIC HANDLERS - Gestione profilo, bonus, autenticazione
  // ─────────────────────────────────────────────────────────────────────────────

  /** Invia profilo, calcola match (AI/deterministico) e salva risultati */
  const handleProfileSubmit = useCallback(async (profile: UserProfile) => {
    setIsAnalyzing(true);
    initialLoadDone.current = true;

    // Calcola risultati con fallback: AI → Deterministico → Vuoto
    let results: MatchResult[] = [];
    try {
      results = await analyzeProfileWithAI(profile, MOCK_BONUSES);
    } catch {
      try { results = calculateDeterministicMatches(profile, MOCK_BONUSES); } catch { /* empty results */ }
    }
    setIsAnalyzing(false);

    // Salva: DB per utenti autenticati, localStorage per guest
    if (user?.email && user?.id) {
      try {
        await updateUser({ profile, results });
        storage.set(getCacheKey(user.id), JSON.stringify(results));
      } catch { /* silently fail */ }
    } else {
      storage.set(GUEST_PROFILE_KEY, JSON.stringify(profile));
    }

    navigateTo({ type: "dashboard", profile, results });
  }, [user, updateUser, navigateTo]);

  /** Cambia tab con controllo accesso premium */
  const handleTabChange = useCallback((tab: "dashboard" | "search" | "settings" | "calendar" | "documents" | "family") => {
    // Gate per funzionalità premium (family, calendar, documents)
    if ((tab === "calendar" || tab === "documents" || tab === "family") && !user?.isPremium) {
      handleShowPremium();
      return;
    }

    if (viewData) {
      navigateTo({ type: tab, profile: viewData.profile, results: viewData.results } as AppView);
    } else {
      resetToForm();
    }
  }, [viewData, user?.isPremium, navigateTo, handleShowPremium, resetToForm]);

  /** Click sul logo: torna alla dashboard se ha dati, altrimenti al form */
  const handleLogoClick = useCallback(() => {
    if (viewData) {
      navigateTo({ type: "dashboard", profile: viewData.profile, results: viewData.results });
    } else {
      resetToForm();
    }
  }, [viewData, navigateTo, resetToForm]);

  /** Logout: pulisce sessione, cache e resetta stato */
  const handleLogout = useCallback(async () => {
    await logout();
    storage.remove(GUEST_PROFILE_KEY);
    if (user?.id) storage.remove(getCacheKey(user.id));
    initialLoadDone.current = false;
    resetToForm();
  }, [logout, user?.id, resetToForm]);

  /** Seleziona un bonus per vedere i dettagli */
  const handleSelectBonus = useCallback((id: string) => {
    if (!viewData) return;
    const prevView = currentView.type === "search" ? "search" : "dashboard";
    navigateTo({ type: "detail", bonusId: id, profile: viewData.profile, results: viewData.results, prevView });
  }, [currentView.type, viewData, navigateTo]);

  /** Gestisce navigazione dal footer */
  const handleFooterNavigate = useCallback((section: "dashboard" | "search" | "settings" | "saved") => {
    if (section === "saved") {
      viewData 
        ? navigateTo({ type: "saved", profile: viewData.profile, results: viewData.results })
        : resetToForm();
    } else {
      handleTabChange(section);
    }
  }, [viewData, handleTabChange, navigateTo, resetToForm]);

  // ─────────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES - Valori derivati dallo stato
  // ─────────────────────────────────────────────────────────────────────────────

  /** Calcola tab attiva per l'header basandosi sulla vista corrente */
  const activeTabForHeader = useMemo(() => {
    const { type } = currentView;
    const validTabs = ["dashboard", "search", "settings", "calendar", "documents", "family"];
    if (validTabs.includes(type)) return type as "dashboard" | "search" | "settings" | "calendar" | "documents" | "family";
    if (type === "detail" && "prevView" in currentView) return currentView.prevView === "search" ? "search" : "dashboard";
    return undefined;
  }, [currentView]);



  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER - Interfaccia utente
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      {/* Modals */}
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} price="24,99€" />
      <PaymentSuccessModal isOpen={showPaymentSuccessModal} onClose={() => setShowPaymentSuccessModal(false)} />

      {/* Banner Premium - Visibile solo per utenti non premium */}
      {!user?.isPremium && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-yellow-950 py-1.5 px-3">
          <div className="container mx-auto max-w-screen-2xl flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 2l2.5 7h7.5l-6 4.5 2.5 7-6-4.5-6 4.5 2.5-7-6-4.5h7.5z" clipRule="evenodd" />
              </svg>
              <span className="text-[10px] sm:text-xs font-bold">
                <span className="hidden sm:inline">Passa a Premium per risultati migliori e bonus esclusivi</span>
                <span className="sm:hidden">Sblocca Premium!</span>
              </span>
            </div>
            <button onClick={handleShowPremium} className="px-2.5 py-1 bg-yellow-950 text-yellow-400 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:bg-yellow-900 transition-colors shadow-md shrink-0">
              Scopri
            </button>
          </div>
        </div>
      )}

      <Header theme={theme} onToggleTheme={toggleTheme} activeTab={activeTabForHeader} onTabChange={handleTabChange} onLogoClick={handleLogoClick} onLogin={() => navigateTo({ type: "login" })} onLogout={handleLogout} onShowPremium={handleShowPremium} />

      <main className="flex-grow container mx-auto px-4 py-8 xl:py-6 max-w-screen-2xl">
        {/* Banner Guest - Invita alla registrazione */}
        {currentView.type === "dashboard" && !user && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-4 bg-blue-600 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-blue-500/20">
            <span className="text-sm font-bold">Stai usando Bonus Match come ospite. Registrati per salvare i tuoi risultati!</span>
            <button onClick={() => navigateTo({ type: "register" })} className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors">
              Registrati ora
            </button>
          </motion.div>
        )}

        {/* Stato di caricamento durante analisi AI o elaborazione pagamento */}
        {isAnalyzing || isProcessingPayment ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-12">
              <div className="animate-ping absolute inset-0 rounded-full bg-blue-500 opacity-20" />
              <div className="animate-spin rounded-full h-28 w-28 border-t-4 border-blue-600 border-r-transparent border-l-transparent border-b-4 relative" />
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter mb-4 text-center">
              {isProcessingPayment ? "Elaborazione pagamento..." : "Analisi in corso..."}
            </h3>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Vista Landing - Form + sezioni informative */}
            {currentView.type === "form" && (
              <PageTransition key="form">
                <LandingPage onSubmit={handleProfileSubmit} onShowPremium={handleShowPremium} />
              </PageTransition>
            )}

            {/* Vista Dashboard - Risultati e bonus compatibili */}
            {currentView.type === "dashboard" && viewData && (
              <PageTransition key="dashboard">
                <Dashboard profile={viewData.profile} bonuses={MOCK_BONUSES} results={viewData.results} isPremium={user?.isPremium} onSelectBonus={handleSelectBonus} onGoToProfile={() => handleTabChange("settings")} onUpgrade={handleShowPremium} />
              </PageTransition>
            )}

            {/* Vista Ricerca - Esplora tutti i bonus */}
            {currentView.type === "search" && viewData && (
              <PageTransition key="search">
                <SearchView bonuses={MOCK_BONUSES} results={viewData.results} isPremium={user?.isPremium} onUpgrade={handleShowPremium} onSelectBonus={handleSelectBonus} />
              </PageTransition>
            )}

            {/* Vista Salvati - Bonus preferiti dell'utente */}
            {currentView.type === "saved" && viewData && (
              <PageTransition key="saved">
                <SavedBonusesView bonuses={MOCK_BONUSES} results={viewData.results} onSelectBonus={handleSelectBonus} onUpgrade={handleShowPremium} />
              </PageTransition>
            )}

            {/* Vista Family Mode - Bonus per nucleo familiare */}
            {currentView.type === "family" && viewData && (
              <PageTransition key="family">
                <FamilyModeView profile={viewData.profile} bonuses={MOCK_BONUSES} results={viewData.results} isPremium={user?.isPremium} onUpgrade={handleShowPremium} onSelectBonus={handleSelectBonus} />
              </PageTransition>
            )}

            {/* Vista Calendario - Funzionalità Premium */}
            {currentView.type === "calendar" && (
              <PageTransition key="calendar">
                <PremiumFeaturePage
                  colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
                  title="Il tuo Calendario"
                  description="Area riservata Premium attiva. Qui troverai le scadenze personalizzate per i tuoi bonus."
                  emptyText="Nessuna scadenza imminente"
                />
              </PageTransition>
            )}

            {/* Vista Documenti - Funzionalità Premium */}
            {currentView.type === "documents" && (
              <PageTransition key="documents">
                <PremiumFeaturePage
                  colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                  title="Document Vault"
                  description="Carica e organizza i documenti per le tue richieste. Spazio sicuro cifrato incluso nel tuo piano Premium."
                  buttonText="Carica Documento"
                />
              </PageTransition>
            )}

            {/* Vista Impostazioni - Modifica profilo */}
            {currentView.type === "settings" && viewData && (
              <PageTransition key="settings" className="max-w-3xl mx-auto">
                <ProfileForm initialData={viewData.profile} onSubmit={handleProfileSubmit} buttonLabel="Aggiorna e Ricalcola" mode="update" isPremium={user?.isPremium} onUpgrade={handleShowPremium} />
              </PageTransition>
            )}

            {/* Vista Dettaglio - Informazioni complete bonus */}
            {currentView.type === "detail" && (
              <PageTransition key={`detail-${currentView.bonusId}`}>
                <BonusDetailView
                  bonus={MOCK_BONUSES.find((b) => b.id === currentView.bonusId)!}
                  allBonuses={MOCK_BONUSES}
                  allResults={currentView.results}
                  matchInfo={currentView.results.find((r) => r.bonusId === currentView.bonusId)}
                  onBack={goBack}
                  onSelectBonus={(id) => navigateTo({ type: "detail", bonusId: id, profile: currentView.profile, results: currentView.results, prevView: currentView.prevView })}
                  isPremium={user?.isPremium}
                  onUpgrade={handleShowPremium}
                />
              </PageTransition>
            )}

            {/* Vista Login */}
            {currentView.type === "login" && (
              <PageTransition key="login" className="flex items-center justify-center min-h-[60vh]">
                <LoginForm onSuccess={() => {}} onRegisterClick={() => navigateTo({ type: "register" })} onForgotPasswordClick={() => navigateTo({ type: "forgot-password" })} onCancel={goBack} />
              </PageTransition>
            )}

            {/* Vista Recupero Password */}
            {currentView.type === "forgot-password" && (
              <PageTransition key="forgot-password" className="flex items-center justify-center min-h-[60vh]">
                <ForgotPasswordForm onCancel={goBack} onLoginClick={() => navigateTo({ type: "login" })} />
              </PageTransition>
            )}

            {/* Vista Registrazione */}
            {currentView.type === "register" && (
              <PageTransition key="register" className="flex items-center justify-center min-h-[60vh]">
                <RegisterForm onSuccess={() => { setHistoryIndex(0); setHistory([{ type: "post-register" }]); }} onLoginClick={() => navigateTo({ type: "login" })} onCancel={goBack} />
              </PageTransition>
            )}

            {/* Vista Post-Registrazione - Completamento profilo */}
            {currentView.type === "post-register" && (
              <PageTransition key="post-register">
                <PostRegistrationForm onComplete={handleProfileSubmit} />
              </PageTransition>
            )}
          </AnimatePresence>
        )}
      </main>

      <Footer onNavigate={handleFooterNavigate} />
      <AIChatWidget profile={user?.profile} results={user?.results} bonuses={MOCK_BONUSES} isPremium={user?.isPremium} onUpgrade={handleShowPremium} />
    </div>
  );
};

export default App;
