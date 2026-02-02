import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, Bonus, MatchResult } from "../types";
import BonusCard from "./BonusCard";

interface DashboardProps {
  profile: UserProfile;
  bonuses: Bonus[];
  results: MatchResult[];
  isPremium?: boolean;
  onSelectBonus: (id: string) => void;
  onGoToProfile?: () => void;
  onUpgrade?: () => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({
  profile,
  bonuses,
  results,
  isPremium,
  onSelectBonus,
  onGoToProfile,
  onUpgrade,
}) => {
  // Per utenti free, forza sempre il filtro 'all'
  const [filter, setFilter] = useState<
    "all" | "available" | "upcoming" | "expired"
  >("all");
  const availableRef = useRef<HTMLDivElement>(null);

  // --- LOGICA DI CALCOLO (MEMOIZZATA) ---
  const eligibleMatches = React.useMemo(
    () => results.filter((r) => r.eligible),
    [results],
  );

  const totalValue = React.useMemo(
    () =>
      eligibleMatches.reduce((acc, curr) => {
        const b = bonuses.find((bon) => bon.id === curr.bonusId);
        return acc + (b?.valoreEsimato || 0);
      }, 0),
    [eligibleMatches, bonuses],
  );

  const activeBonuses = React.useMemo(
    () =>
      bonuses.filter(
        (b) =>
          eligibleMatches.some((m) => m.bonusId === b.id) &&
          b.status === "attivo",
      ),
    [bonuses, eligibleMatches],
  );

  const upcomingBonuses = React.useMemo(
    () =>
      bonuses.filter(
        (b) =>
          eligibleMatches.some((m) => m.bonusId === b.id) &&
          b.status === "in arrivo",
      ),
    [bonuses, eligibleMatches],
  );

  const lostBonuses = React.useMemo(
    () =>
      bonuses.filter(
        (b) =>
          b.status === "scaduto" &&
          eligibleMatches.some((m) => m.bonusId === b.id),
      ),
    [bonuses, eligibleMatches],
  );

  // Calcolo Risparmio Famiglia specifico
  const familyBonuses = React.useMemo(
    () => bonuses.filter((b) => b.categoria?.toLowerCase() === "famiglia"),
    [bonuses],
  );
  const familyValue = React.useMemo(
    () =>
      eligibleMatches
        .filter((m) => familyBonuses.some((b) => b.id === m.bonusId))
        .reduce((acc, curr) => {
          const b = bonuses.find((bon) => bon.id === curr.bonusId);
          return acc + (b?.valoreEsimato || 0);
        }, 0),
    [eligibleMatches, familyBonuses, bonuses],
  );

  const hasChildren = React.useMemo(
    () =>
      (profile.numeroFigli ?? 0) > 0 ||
      profile.composizione === "coppia_con_figli" ||
      profile.composizione === "genitore_single",
    [profile.numeroFigli, profile.composizione],
  );

  // Scadenze Urgenti (ordinate per data)
  const upcomingDeadlines = React.useMemo(
    () =>
      bonuses
        .filter(
          (b) =>
            b.scadenza &&
            b.status !== "scaduto" &&
            eligibleMatches.some((m) => m.bonusId === b.id),
        )
        .sort(
          (a, b) =>
            new Date(a.scadenza!).getTime() - new Date(b.scadenza!).getTime(),
        )
        .slice(0, 3),
    [bonuses, eligibleMatches],
  );

  // Percentuale completamento profilo
  const completionPercentage = React.useMemo(() => {
    const fields = [
      profile.eta,
      profile.residenza,
      profile.regione,
      profile.condizione,
      profile.abitazione,
      profile.composizione,
      profile.isee,
    ];
    const filled = fields.filter(
      (f) => f !== undefined && f !== "" && f !== 0,
    ).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const handleScrollToBonuses = (e: React.MouseEvent) => {
    e.preventDefault();
    setFilter("available");
    setTimeout(() => {
      availableRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 100);
  };

  const tabs = [
    { id: "available", label: "Disponibili", count: activeBonuses.length },
    { id: "upcoming", label: "Prossime", count: upcomingBonuses.length },
    { id: "expired", label: "Scaduti", count: lostBonuses.length },
    { id: "all", label: "Tutti", count: bonuses.length },
  ] as const;

  return (
    <div className="space-y-6 pb-12">
      {/* SEZIONE 1: HERO & COMPLETION */}
      <div
        className={`grid grid-cols-1 ${completionPercentage < 100 ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}
      >
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[220px]">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none"></div>
          <h2 className="text-sm opacity-80 font-bold mb-1 uppercase tracking-widest">
            Potenziale attivabile
          </h2>
          <p className="text-4xl font-black mb-3 tracking-tighter">
            {totalValue.toLocaleString("it-IT")}€
          </p>
          <button
            onClick={handleScrollToBonuses}
            className="bg-white/30 hover:bg-white/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/40 shadow-lg"
          >
            <span className="text-base font-black">{eligibleMatches.length}</span> bonus trovati per te ↓
          </button>
          
          {/* Alert completamento profilo */}
          {completionPercentage < 100 && (
            <div className="mt-4 flex items-center gap-2 bg-yellow-400/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md animate-pulse">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-yellow-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span className="text-xs font-black text-yellow-900 uppercase tracking-wide">
                Completa il profilo per dati più accurati
              </span>
            </div>
          )}
        </div>

        {completionPercentage < 100 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-lg flex flex-col items-center text-center justify-center">
            <div className="relative h-16 w-16 mb-3">
              <svg
                className="h-full w-full transform -rotate-90"
                viewBox="0 0 36 36"
              >
                <path
                  className="text-slate-100 dark:text-slate-800"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="text-blue-600"
                  strokeDasharray={`${completionPercentage}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-base text-slate-800 dark:text-white">
                {completionPercentage}%
              </div>
            </div>
            <h3 className="text-base font-black mb-1 dark:text-white">
              Profilo Incompleto
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">
              Aggiungi dati per più bonus
            </p>
            <button
              onClick={onGoToProfile}
              className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
            >
              Completa Dati
            </button>
          </div>
        )}
      </div>

      {/* SEZIONE 4: TABS & BONUS LIST */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-wrap gap-2 mb-6">
          {isPremium ? (
            // Premium: mostra tutti i filtri
            tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${filter === tab.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "bg-slate-100 text-slate-400 dark:bg-slate-800 hover:bg-slate-200"}`}
              >
                {tab.label} <span className="ml-1.5 opacity-50">{tab.count}</span>
              </button>
            ))
          ) : (
            // Free: solo tab 'Tutti' + indicatore filtri bloccati
            <>
              <button
                className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              >
                Tutti i Bonus <span className="ml-1.5 opacity-50">{bonuses.length}</span>
              </button>
              <button
                onClick={onUpgrade}
                className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center gap-1.5 hover:shadow-md transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Sblocca Filtri Premium
              </button>
            </>
          )}
        </div>

        <div ref={availableRef} className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {(() => {
                // Per utenti free, forza sempre 'all' e mostra tutti
                const allFilteredBonuses = !isPremium 
                  ? bonuses  // Free: mostra tutti i bonus senza filtro
                  : filter === "all"
                    ? bonuses
                    : filter === "available"
                      ? activeBonuses
                      : filter === "upcoming"
                        ? upcomingBonuses
                        : lostBonuses;
                // Nessun limite, mostra tutti
                return allFilteredBonuses;
              })().map((b) => (
                <BonusCard
                  key={b.id}
                  bonus={b}
                  onClick={() => onSelectBonus(b.id)}
                  matchReason={results.find((r) => r.bonusId === b.id)?.reason}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
