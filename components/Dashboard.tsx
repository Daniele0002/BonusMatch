import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, Bonus, MatchResult, BonusCategory } from "../types";
import BonusCard from "./BonusCard";

// Categorie disponibili
const CATEGORIES: BonusCategory[] = ["Studio", "Casa", "Energia", "Famiglia", "Lavoro", "Giovani", "Salute", "Mobilità"];

// ═══════════════════════════════════════════════════════════════════════════════
// TIPI
// ═══════════════════════════════════════════════════════════════════════════════
interface DashboardProps {
  profile: UserProfile;
  bonuses: Bonus[];
  results: MatchResult[];
  isPremium?: boolean;
  onSelectBonus: (id: string) => void;
  onGoToProfile?: () => void;
  onUpgrade?: () => Promise<void>;
}

type FilterType = "all" | "available" | "upcoming" | "expired";

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard: React.FC<DashboardProps> = ({ profile, bonuses, results, isPremium, onSelectBonus, onGoToProfile, onUpgrade }) => {
  const [filter, setFilter] = useState<FilterType>("available");
  const [categoryFilter, setCategoryFilter] = useState<BonusCategory | "Tutte">("Tutte");
  const availableRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // CALCOLI MEMOIZZATI - Consolidati in un unico useMemo per efficienza
  // ─────────────────────────────────────────────────────────────────────────────
  
  /** Motivi generici = dati mancanti, non verificabili -> consideriamo potenzialmente idonei */
  const genericReasons = ["specificato", "non fornito", "nessun", "mancante", "non indicat", "non presente"];
  const isGenericReason = (reason: string) => genericReasons.some(g => reason.toLowerCase().includes(g));
  
  /** Bonus effettivamente eleggibili o con motivo generico (potenzialmente idonei) */
  const eligibleMatches = useMemo(() => 
    results.filter((r) => r.eligible || (r.reason && isGenericReason(r.reason))), 
  [results]);
  
  /** Set per lookup O(1) su bonus eleggibili o potenzialmente idonei */
  const eligibleSet = useMemo(() => new Set(eligibleMatches.map(m => m.bonusId)), [eligibleMatches]);
  
  /** Dati aggregati bonus - "Disponibili" mostra solo eleggibili, altri filtri mostrano tutto */
  const bonusGroups = useMemo(() => ({
    active: bonuses.filter(b => b.status === "attivo" && eligibleSet.has(b.id)), // Solo eleggibili
    upcoming: bonuses.filter(b => b.status === "in arrivo"),
    expired: bonuses.filter(b => b.status === "scaduto"),
  }), [bonuses, eligibleSet]);

  /** Valore totale dei bonus eleggibili */
  const totalValue = useMemo(() => 
    eligibleMatches.reduce((acc, m) => acc + (bonuses.find(b => b.id === m.bonusId)?.valoreEsimato || 0), 0),
  [eligibleMatches, bonuses]);

  /** Percentuale completamento profilo */
  const completionPercentage = useMemo(() => {
    const fields = [profile.eta, profile.residenza, profile.regione, profile.condizione, profile.abitazione, profile.composizione, profile.isee];
    const filled = fields.filter(f => f !== undefined && f !== "" && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  /** Scroll ai bonus e attiva filtro disponibili */
  const handleScrollToBonuses = (e: React.MouseEvent) => {
    e.preventDefault();
    setFilter("available");
    setTimeout(() => availableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  /** Configurazione tabs filtro */
  const tabs: { id: FilterType; label: string; count: number }[] = [
    { id: "available", label: "Disponibili", count: bonusGroups.active.length },
    { id: "upcoming", label: "Prossime", count: bonusGroups.upcoming.length },
    { id: "expired", label: "Scaduti", count: bonusGroups.expired.length },
    { id: "all", label: "Tutti", count: bonuses.length },
  ];

  /** Bonus da mostrare in base al filtro attivo */
  const filteredBonuses = useMemo(() => {
    let result = bonuses;
    
    // Filtro status (solo Premium)
    if (isPremium) {
      const filterMap = { all: bonuses, available: bonusGroups.active, upcoming: bonusGroups.upcoming, expired: bonusGroups.expired };
      result = filterMap[filter];
    }
    
    // Filtro categoria
    if (categoryFilter !== "Tutte") {
      result = result.filter(b => b.categoria === categoryFilter);
    }
    
    return result;
  }, [isPremium, filter, bonuses, bonusGroups, categoryFilter]);

  const isProfileIncomplete = completionPercentage < 100;

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-12">
      {/* HERO & COMPLETION */}
      <div className={`grid grid-cols-1 ${isProfileIncomplete ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-6`}>
        {/* Card Potenziale */}
        <div className="lg:col-span-2 bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-700 dark:to-indigo-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col items-center text-center justify-center min-h-[220px]">
          <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none" />
          <h2 className="text-sm opacity-80 font-bold mb-1 uppercase tracking-widest">Potenziale attivabile</h2>
          <p className="text-4xl font-black mb-3 tracking-tighter">{totalValue.toLocaleString("it-IT")}€</p>
          <button onClick={handleScrollToBonuses} className="bg-white/30 hover:bg-white/40 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold transition-all border border-white/40 shadow-lg">
            <span className="text-base font-black">{eligibleMatches.length}</span> bonus trovati per te ↓
          </button>
          
          {/* Alert profilo incompleto */}
          {isProfileIncomplete && (
            <div className="mt-4 flex items-center gap-2 bg-yellow-400/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-md animate-pulse">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-black text-yellow-900 uppercase tracking-wide">Completa il profilo per dati più accurati</span>
            </div>
          )}
        </div>

        {/* Card Completamento Profilo */}
        {isProfileIncomplete && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-lg flex flex-col items-center text-center justify-center">
            {/* Grafico circolare */}
            <div className="relative h-16 w-16 mb-3">
              <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-slate-100 dark:text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path className="text-blue-600" strokeDasharray={`${completionPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-base text-slate-800 dark:text-white">{completionPercentage}%</div>
            </div>
            <h3 className="text-base font-black mb-1 dark:text-white">Profilo Incompleto</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase mb-3">Aggiungi dati per più bonus</p>
            <button onClick={onGoToProfile} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all">
              Completa Dati
            </button>
          </div>
        )}
      </div>

      {/* TABS & BONUS LIST */}
      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
        {/* Filtri Status */}
        <div className="flex flex-wrap gap-2 mb-4">
          {isPremium ? (
            tabs.map((tab) => (
              <button key={tab.id} onClick={() => setFilter(tab.id)} className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${filter === tab.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "bg-slate-100 text-slate-400 dark:bg-slate-800 hover:bg-slate-200"}`}>
                {tab.label} <span className="ml-1.5 opacity-50">{tab.count}</span>
              </button>
            ))
          ) : (
            <>
              <button className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md">
                Tutti i Bonus <span className="ml-1.5 opacity-50">{bonuses.length}</span>
              </button>
              <button onClick={onUpgrade} className="px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center gap-1.5 hover:shadow-md transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Sblocca Filtri Premium
              </button>
            </>
          )}
        </div>

        {/* Filtri Categoria (Premium) */}
        {isPremium ? (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {["Tutte", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat as BonusCategory | "Tutte")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  categoryFilter === cat
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                    : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        ) : (
          <div className="relative mb-6">
            <div className="flex flex-wrap gap-1.5 opacity-40 blur-[1px] pointer-events-none">
              {["Tutte", ...CATEGORIES].map((cat) => (
                <span key={cat} className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 dark:bg-slate-800 text-slate-500">{cat}</span>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button onClick={onUpgrade} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-md hover:shadow-lg transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Filtra per Categoria
              </button>
            </div>
          </div>
        )}

        {/* Griglia Bonus */}
        <div ref={availableRef} className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={filter} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBonuses.map((b) => {
                const match = results.find((r) => r.bonusId === b.id);
                return (
                  <BonusCard 
                    key={b.id} 
                    bonus={b} 
                    onClick={() => onSelectBonus(b.id)} 
                    matchReason={match?.reason}
                    isEligible={match?.eligible}
                  />
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
