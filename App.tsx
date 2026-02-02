import React, { useState, useEffect, useCallback, useRef } from "react";
import { UserProfile, Bonus, MatchResult, AppView } from "./types";
import { MOCK_BONUSES } from "./constants";
import {
  analyzeProfileWithAI,
  calculateDeterministicMatches,
} from "./services/geminiService";
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

// Constants
const CACHE_KEY_PREFIX = "bonus_results_";
const GUEST_PROFILE_KEY = "guest_profile_data";
const THEME_KEY = "theme";

// Utility functions
const getStoredTheme = (): "light" | "dark" => {
  if (typeof window === "undefined") return "light";

  const saved = localStorage.getItem(THEME_KEY);
  if (saved === "dark" || saved === "light") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const getCacheKey = (userId: string) => `${CACHE_KEY_PREFIX}${userId}`;

const safeParseJSON = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const safeSetLocalStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    return false;
  }
};

const safeGetLocalStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
};

const safeRemoveLocalStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    // silently fail
  }
};

const App: React.FC = () => {
  // State
  const [history, setHistory] = useState<AppView[]>([{ type: "form" }]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showPaymentSuccessModal, setShowPaymentSuccessModal] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(getStoredTheme);

  // Context
  const { user, updateUser, isLoading, logout } = useAuth();

  // Refs
  const initialLoadDone = useRef(false);
  const currentView = history[historyIndex];

  // Theme Management
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    safeSetLocalStorage(THEME_KEY, theme);
  }, [theme]);

  // Payment Success/Cancel Handler
  const [pendingPremiumUpgrade, setPendingPremiumUpgrade] = useState<boolean>(() => {
    // Controlla se c'è un upgrade pendente salvato
    return localStorage.getItem('pending_premium_upgrade') === 'true';
  });

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      const params = new URLSearchParams(window.location.search);
      const paymentStatus = params.get('payment');
      
      if (paymentStatus === 'success' || pendingPremiumUpgrade) {
        // Se abbiamo un pagamento success, salva il flag
        if (paymentStatus === 'success') {
          localStorage.setItem('pending_premium_upgrade', 'true');
          // Rimuovi i parametri dall'URL
          window.history.replaceState({}, '', window.location.pathname);
        }
        
        // Aspetta che l'auth sia pronto
        if (isLoading) {
          return;
        }
        
        // Aggiorna il database con tipo_utente = premium
        if (user?.id) {
          try {
            // Prova prima con id, poi con email
            let result = await supabase
              .from('profiles')
              .update({ tipo_utente: 'premium', is_premium: true })
              .eq('id', user.id)
              .select();
            
            // Se non ha trovato righe, prova con email
            if (!result.data || result.data.length === 0) {
              result = await supabase
                .from('profiles')
                .update({ tipo_utente: 'premium', is_premium: true })
                .eq('email', user.email)
                .select();
            }
            
            if (!result.error && result.data && result.data.length > 0) {
              // Rimuovi il flag pendente
              localStorage.removeItem('pending_premium_upgrade');
              setPendingPremiumUpgrade(false);
              // Aggiorna lo stato locale dell'utente
              if (updateUser && user) {
                updateUser({ ...user, isPremium: true });
              }
            }
          } catch (err) {
            console.error('Errore aggiornamento premium:', err);
          }
          
          // Mostra il modal di successo solo se siamo appena tornati dal pagamento
          if (paymentStatus === 'success' || pendingPremiumUpgrade) {
            setShowPaymentSuccessModal(true);
            localStorage.removeItem('pending_premium_upgrade');
            setPendingPremiumUpgrade(false);
          }
        } else {
          console.log('User ID not available yet, waiting...');
        }
      } else if (paymentStatus === 'cancel') {
        // Pagamento annullato
        window.history.replaceState({}, '', window.location.pathname);
      }
    };
    
    handlePaymentSuccess();
  }, [user?.id, updateUser, isLoading, pendingPremiumUpgrade]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  // Session Restoration
  useEffect(() => {
    const restoreSession = async () => {
      // Early exit conditions
      if (isLoading || !user || initialLoadDone.current) return;

      // Mostra la dashboard anche se il profilo non è completo
      if (!user.profile) {
        initialLoadDone.current = true;
        setHistory([
          {
            type: "dashboard",
            profile: undefined,
            results: [],
          },
        ]);
        setHistoryIndex(0);
        return;
      }

      initialLoadDone.current = true;

      let resultsToUse: MatchResult[] = [];
      const cacheKey = getCacheKey(user.id);

      // Try 1: Local Cache
      const cachedResults = safeGetLocalStorage(cacheKey);
      if (cachedResults) {
        resultsToUse = safeParseJSON<MatchResult[]>(cachedResults, []);
      }

      // Try 2: Deterministic Calculation (if cache empty)
      if (resultsToUse.length === 0) {
        try {
          resultsToUse = calculateDeterministicMatches(
            user.profile,
            MOCK_BONUSES,
          );

          if (resultsToUse.length > 0) {
            safeSetLocalStorage(cacheKey, JSON.stringify(resultsToUse));
          }
        } catch (e) {
          // silently fail
        }
      }

      // Update state and exit if we have results
      if (resultsToUse.length > 0) {
        setHistory([
          {
            type: "dashboard",
            profile: user.profile,
            results: resultsToUse,
          },
        ]);
        setHistoryIndex(0);
        return;
      }

      // Fallback: AI Analysis
      setIsAnalyzing(true);
      try {
        const freshResults = await analyzeProfileWithAI(
          user.profile,
          MOCK_BONUSES,
        );

        safeSetLocalStorage(cacheKey, JSON.stringify(freshResults));

        setHistory([
          {
            type: "dashboard",
            profile: user.profile,
            results: freshResults,
          },
        ]);
        setHistoryIndex(0);
      } catch (error) {
        // In caso di errore critico, mostra comunque una dashboard vuota
        setHistory([
          {
            type: "dashboard",
            profile: user.profile,
            results: [],
          },
        ]);
        setHistoryIndex(0);
      } finally {
        setIsAnalyzing(false);
      }
    };

    restoreSession();

    if (!user) {
      initialLoadDone.current = false;
    }
  }, [user, isLoading]);



  // Navigation Handlers
  const navigateTo = useCallback(
    (newView: AppView) => {
      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        return [...newHistory, newView];
      });
      setHistoryIndex((prev) => prev + 1);
      window.scrollTo(0, 0);
    },
    [historyIndex],
  );

  const handleShowPremium = useCallback(() => {
    if (!user) {
      navigateTo({ type: "login" });
      return;
    }
    setShowPaymentModal(true);
  }, [user, navigateTo]);

  const goBack = useCallback(() => {
    setHistoryIndex((prev) => {
      const newIndex = prev - 1;
      // Previeni indici negativi
      return newIndex < 0 ? 0 : newIndex;
    });
    window.scrollTo(0, 0);
  }, []);

  // Profile Submission Handler
  const handleProfileSubmit = useCallback(
    async (profile: UserProfile) => {
      setIsAnalyzing(true);
      initialLoadDone.current = true;

      let matchResults: MatchResult[] = [];

      try {
        matchResults = await analyzeProfileWithAI(profile, MOCK_BONUSES);
      } catch (e) {
        // Fallback a calcolo deterministico se AI fallisce
        try {
          matchResults = calculateDeterministicMatches(profile, MOCK_BONUSES);
        } catch (fallbackError) {
          matchResults = [];
        }
      } finally {
        setIsAnalyzing(false);
      }

      // Save to database if user is logged in
      if (user?.email && user?.id) {
        try {
          await updateUser({ profile, results: matchResults });

          // Update cache
          safeSetLocalStorage(
            getCacheKey(user.id),
            JSON.stringify(matchResults),
          );
        } catch (e) {
          // silently fail
        }
      } else {
        // Guest mode: save to localStorage
        safeSetLocalStorage(GUEST_PROFILE_KEY, JSON.stringify(profile));
      }

      navigateTo({ type: "dashboard", profile, results: matchResults });
    },
    [user, updateUser, navigateTo],
  );

  // Tab Change Handler
  const handleTabChange = useCallback(
    (tab: "dashboard" | "search" | "settings" | "calendar" | "documents") => {
      // Feature gating for premium tabs
      if ((tab === "calendar" || tab === "documents") && !user?.isPremium) {
        handleShowPremium();
        return;
      }

      if ("profile" in currentView && "results" in currentView) {
        navigateTo({
          type: tab,
          profile: currentView.profile,
          results: currentView.results,
        } as AppView);
      } else {
        setHistory([{ type: "form" }]);
        setHistoryIndex(0);
      }
    },
    [currentView, user?.isPremium, navigateTo, handleShowPremium],
  );

  // Logo Click Handler
  const handleLogoClick = useCallback(() => {
    if ("profile" in currentView && "results" in currentView) {
      navigateTo({
        type: "dashboard",
        profile: currentView.profile,
        results: currentView.results,
      });
    } else {
      setHistory([{ type: "form" }]);
      setHistoryIndex(0);
    }
  }, [currentView, navigateTo]);

  // Logout Handler
  const handleLogout = useCallback(async () => {
    await logout();
    safeRemoveLocalStorage(GUEST_PROFILE_KEY);

    // Pulisci anche la cache dei risultati se esiste
    if (user?.id) {
      safeRemoveLocalStorage(getCacheKey(user.id));
    }

    // Reset completo dello stato
    initialLoadDone.current = false;
    setHistoryIndex(0);
    setHistory([{ type: "form" }]);
  }, [logout, user?.id]);

  // Bonus Selection Handler
  const handleSelectBonus = useCallback(
    (id: string) => {
      if (!("profile" in currentView) || !("results" in currentView)) return;

      const prevView = currentView.type === "search" ? "search" : "dashboard";

      navigateTo({
        type: "detail",
        bonusId: id,
        profile: currentView.profile,
        results: currentView.results,
        prevView,
      });
    },
    [currentView, navigateTo],
  );

  // Footer Navigation Handler
  const handleFooterNavigate = useCallback(
    (section: "dashboard" | "search" | "settings" | "saved") => {
      if (section === "saved") {
        if ("profile" in currentView && "results" in currentView) {
          navigateTo({
            type: "saved",
            profile: currentView.profile,
            results: currentView.results,
          });
        } else {
          setHistory([{ type: "form" }]);
          setHistoryIndex(0);
        }
      } else {
        handleTabChange(section);
      }
    },
    [currentView, handleTabChange, navigateTo],
  );

  // Active Tab Calculation
  const activeTabForHeader = (() => {
    const { type } = currentView;

    if (
      ["dashboard", "search", "settings", "calendar", "documents"].includes(
        type,
      )
    ) {
      return type as typeof activeTabForHeader;
    }

    if (type === "detail" && "prevView" in currentView) {
      return currentView.prevView === "search" ? "search" : "dashboard";
    }

    return undefined;
  })();



  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        price="9.99€"
      />
      
      <PaymentSuccessModal
        isOpen={showPaymentSuccessModal}
        onClose={() => setShowPaymentSuccessModal(false)}
      />

      {/* Premium Banner - Barra fissa in alto */}
      {user?.isPremium !== true && (
        <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 text-yellow-950 py-1.5 px-3">
          <div className="container mx-auto max-w-screen-2xl flex items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3.5 w-3.5 shrink-0"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 2l2.5 7h7.5l-6 4.5 2.5 7-6-4.5-6 4.5 2.5-7-6-4.5h7.5z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-[10px] sm:text-xs font-bold">
                <span className="hidden sm:inline">Passa a Premium per risultati migliori e bonus esclusivi</span>
                <span className="sm:hidden">Sblocca Premium!</span>
              </span>
            </div>
            <button
              onClick={handleShowPremium}
              className="px-2.5 py-1 bg-yellow-950 text-yellow-400 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:bg-yellow-900 transition-colors shadow-md shrink-0"
            >
              Scopri
            </button>
          </div>
        </div>
      )}

      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        activeTab={activeTabForHeader}
        onTabChange={handleTabChange}
        onLogoClick={handleLogoClick}
        onLogin={() => navigateTo({ type: "login" })}
        onLogout={handleLogout}
        onShowPremium={handleShowPremium}
      />

      <main className="flex-grow container mx-auto px-4 py-8 xl:py-6 max-w-screen-2xl">
        {/* Guest Banner */}
        {currentView.type === "dashboard" && !user && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-blue-600 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-blue-500/20"
          >
            <span className="text-sm font-bold">
              Stai usando Bonus Match come ospite. Registrati per salvare i tuoi
              risultati!
            </span>
            <button
              onClick={() => navigateTo({ type: "register" })}
              className="px-4 py-2 bg-white text-blue-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-colors"
            >
              Registrati ora
            </button>
          </motion.div>
        )}

        {/* Analyzing State */}
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative mb-12">
              <div className="animate-ping absolute inset-0 rounded-full bg-blue-500 opacity-20" />
              <div className="animate-spin rounded-full h-28 w-28 border-t-4 border-blue-600 border-r-transparent border-l-transparent border-b-4 relative" />
            </div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tighter mb-4 text-center">
              Analisi in corso...
            </h3>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* Form View */}
            {currentView.type === "form" && (
              <PageTransition key="form" className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <motion.h2
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 1 },
                      visible: {
                        opacity: 1,
                        transition: {
                          delay: 0.2,
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                    className="text-5xl md:text-6xl font-black text-slate-800 dark:text-white mb-8 tracking-tighter leading-none"
                  >
                    {"I tuoi Bonus.".split("").map((char, index) => (
                      <motion.span
                        key={`part1-${index}`}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              type: "spring",
                              damping: 12,
                              stiffness: 200,
                            },
                          },
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                    <br />
                    {"Semplificati.".split("").map((char, index) => (
                      <motion.span
                        key={`part2-${index}`}
                        className="text-blue-600 inline-block"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: {
                            opacity: 1,
                            y: 0,
                            transition: {
                              type: "spring",
                              damping: 12,
                              stiffness: 200,
                            },
                          },
                        }}
                      >
                        {char}
                      </motion.span>
                    ))}
                  </motion.h2>
                </div>
                <ProfileForm onSubmit={handleProfileSubmit} />
              </PageTransition>
            )}

            {/* Dashboard View */}
            {currentView.type === "dashboard" && "profile" in currentView && (
              <PageTransition key="dashboard">
                <Dashboard
                  profile={currentView.profile}
                  bonuses={MOCK_BONUSES}
                  results={currentView.results}
                  isPremium={user?.isPremium}
                  onSelectBonus={handleSelectBonus}
                  onGoToProfile={() => handleTabChange("settings")}
                  onUpgrade={handleShowPremium}
                />
              </PageTransition>
            )}

            {/* Search View */}
            {currentView.type === "search" && "profile" in currentView && (
              <PageTransition key="search">
                <SearchView
                  bonuses={MOCK_BONUSES}
                  results={currentView.results}
                  isPremium={user?.isPremium}
                  onUpgrade={handleShowPremium}
                  onSelectBonus={handleSelectBonus}
                />
              </PageTransition>
            )}

            {/* Saved Bonuses View */}
            {currentView.type === "saved" && "profile" in currentView && (
              <PageTransition key="saved">
                <SavedBonusesView
                  bonuses={MOCK_BONUSES}
                  results={currentView.results}
                  onSelectBonus={handleSelectBonus}
                  onUpgrade={handleShowPremium}
                />
              </PageTransition>
            )}

            {/* Calendar View */}
            {currentView.type === "calendar" && (
              <PageTransition key="calendar">
                <div className="max-w-4xl mx-auto py-10 text-center">
                  <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 shadow-2xl border border-slate-100 dark:border-slate-800">
                    <div className="h-20 w-20 bg-blue-100 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-600 dark:text-blue-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-4xl font-black mb-4 dark:text-white">
                      Il tuo Calendario
                    </h2>
                    <p className="text-slate-500 text-lg max-w-lg mx-auto mb-8">
                      Area riservata Premium attiva. Qui troverai le scadenze
                      personalizzate per i tuoi bonus.
                    </p>
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-sm">
                        Nessuna scadenza imminente
                      </span>
                    </div>
                  </div>
                </div>
              </PageTransition>
            )}

            {/* Documents View */}
            {currentView.type === "documents" && (
              <PageTransition key="documents">
                <div className="max-w-4xl mx-auto py-10 text-center">
                  <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-16 shadow-2xl border border-slate-100 dark:border-slate-800">
                    <div className="h-20 w-20 bg-purple-100 dark:bg-purple-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 text-purple-600 dark:text-purple-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-10 w-10"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-4xl font-black mb-4 dark:text-white">
                      Document Vault
                    </h2>
                    <p className="text-slate-500 text-lg max-w-lg mx-auto mb-8">
                      Carica e organizza i documenti per le tue richieste.
                      Spazio sicuro cifrato incluso nel tuo piano Premium.
                    </p>
                    <button className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all">
                      Carica Documento
                    </button>
                  </div>
                </div>
              </PageTransition>
            )}

            {/* Settings View */}
            {currentView.type === "settings" && "profile" in currentView && (
              <PageTransition key="settings" className="max-w-3xl mx-auto">
                <ProfileForm
                  initialData={currentView.profile}
                  onSubmit={handleProfileSubmit}
                  buttonLabel="Aggiorna e Ricalcola"
                  mode="update"
                  isPremium={user?.isPremium}
                  onUpgrade={handleShowPremium}
                />
              </PageTransition>
            )}

            {/* Detail View */}
            {currentView.type === "detail" && (
              <PageTransition key={`detail-${currentView.bonusId}`}>
                <BonusDetailView
                  bonus={
                    MOCK_BONUSES.find((b) => b.id === currentView.bonusId)!
                  }
                  allBonuses={MOCK_BONUSES}
                  allResults={currentView.results}
                  matchInfo={currentView.results.find(
                    (r) => r.bonusId === currentView.bonusId,
                  )}
                  onBack={goBack}
                  onSelectBonus={(id) =>
                    navigateTo({
                      type: "detail",
                      bonusId: id,
                      profile: currentView.profile,
                      results: currentView.results,
                      prevView: currentView.prevView,
                    })
                  }
                  isPremium={user?.isPremium}
                  onUpgrade={handleShowPremium}
                />
              </PageTransition>
            )}

            {/* Login View */}
            {currentView.type === "login" && (
              <PageTransition
                key="login"
                className="flex items-center justify-center min-h-[60vh]"
              >
                <LoginForm
                  onSuccess={() => {}}
                  onRegisterClick={() => navigateTo({ type: "register" })}
                  onForgotPasswordClick={() =>
                    navigateTo({ type: "forgot-password" })
                  }
                  onCancel={goBack}
                />
              </PageTransition>
            )}

            {/* Forgot Password View */}
            {currentView.type === "forgot-password" && (
              <PageTransition
                key="forgot-password"
                className="flex items-center justify-center min-h-[60vh]"
              >
                <ForgotPasswordForm
                  onCancel={goBack}
                  onLoginClick={() => navigateTo({ type: "login" })}
                />
              </PageTransition>
            )}

            {/* Register View */}
            {currentView.type === "register" && (
              <PageTransition
                key="register"
                className="flex items-center justify-center min-h-[60vh]"
              >
                <RegisterForm
                  onSuccess={() => {
                    setHistoryIndex(0);
                    setHistory([{ type: "post-register" }]);
                  }}
                  onLoginClick={() => navigateTo({ type: "login" })}
                  onCancel={goBack}
                />
              </PageTransition>
            )}

            {/* Post Registration View */}
            {currentView.type === "post-register" && (
              <PageTransition key="post-register">
                <PostRegistrationForm onComplete={handleProfileSubmit} />
              </PageTransition>
            )}
          </AnimatePresence>
        )}
      </main>

      <Footer onNavigate={handleFooterNavigate} />

      <AIChatWidget
        profile={user?.profile}
        results={user?.results}
        bonuses={MOCK_BONUSES}
        isPremium={user?.isPremium}
        onUpgrade={handleShowPremium}
      />
    </div>
  );
};

export default App;
