import React, { useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserProfile, Bonus, MatchResult, BonusCategory } from "../types";
import BonusCard from "./BonusCard";

// Categorie disponibili con icone
const CATEGORIES: { name: BonusCategory; icon: string }[] = [
  { name: "Studio", icon: "🎓" },
  { name: "Casa", icon: "🏠" },
  { name: "Energia", icon: "⚡" },
  { name: "Famiglia", icon: "👨‍👩‍👧‍👦" },
  { name: "Lavoro", icon: "💼" },
  { name: "Giovani", icon: "🧑‍💻" },
  { name: "Salute", icon: "🏥" },
  { name: "Mobilità", icon: "🚌" },
];

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
// UTILITY
// ═══════════════════════════════════════════════════════════════════════════════

/** Calcola giorni rimanenti fino a una data */
const daysUntil = (dateStr: string): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

/** Formato compatto per valori grandi */
const formatValue = (val: number): string => {
  if (val >= 10000) return `${(val / 1000).toFixed(1).replace(".0", "")}k`;
  return val.toLocaleString("it-IT");
};

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════════
const Dashboard: React.FC<DashboardProps> = ({ profile, bonuses, results, isPremium, onSelectBonus, onGoToProfile, onUpgrade }) => {
  const [filter, setFilter] = useState<FilterType>("available");
  const [categoryFilter, setCategoryFilter] = useState<BonusCategory | "Tutte">("Tutte");
  const availableRef = useRef<HTMLDivElement>(null);

  // ─────────────────────────────────────────────────────────────────────────────
  // CALCOLI MEMOIZZATI
  // ─────────────────────────────────────────────────────────────────────────────
  
  const genericReasons = ["specificato", "non fornito", "nessun", "mancante", "non indicat", "non presente"];
  const isGenericReason = (reason: string) => genericReasons.some(g => reason.toLowerCase().includes(g));
  
  const eligibleMatches = useMemo(() => 
    results.filter((r) => r.eligible || (r.reason && isGenericReason(r.reason))), 
  [results]);
  
  const eligibleSet = useMemo(() => new Set(eligibleMatches.map(m => m.bonusId)), [eligibleMatches]);
  
  const bonusGroups = useMemo(() => ({
    active: bonuses.filter(b => b.status === "attivo" && eligibleSet.has(b.id)),
    upcoming: bonuses.filter(b => b.status === "in arrivo"),
    expired: bonuses.filter(b => b.status === "scaduto"),
  }), [bonuses, eligibleSet]);

  const totalValue = useMemo(() => 
    eligibleMatches.reduce((acc, m) => acc + (bonuses.find(b => b.id === m.bonusId)?.valoreEsimato || 0), 0),
  [eligibleMatches, bonuses]);

  const completionPercentage = useMemo(() => {
    const fields = [profile.eta, profile.residenza, profile.regione, profile.condizione, profile.abitazione, profile.composizione, profile.isee];
    const filled = fields.filter(f => f !== undefined && f !== "" && f !== 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  /** Bonus con scadenza imminente (entro 60 giorni) - solo tra eleggibili */
  const urgentBonuses = useMemo(() => {
    return bonuses
      .filter(b => b.scadenza && eligibleSet.has(b.id) && b.status === "attivo")
      .map(b => ({ ...b, daysLeft: daysUntil(b.scadenza!) }))
      .filter(b => b.daysLeft > 0 && b.daysLeft <= 60)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3);
  }, [bonuses, eligibleSet]);

  /** Top 3 bonus per valore (solo eleggibili con valore) */
  const topBonuses = useMemo(() => {
    return bonuses
      .filter(b => eligibleSet.has(b.id) && b.valoreEsimato && b.valoreEsimato > 0 && b.status === "attivo")
      .sort((a, b) => (b.valoreEsimato || 0) - (a.valoreEsimato || 0))
      .slice(0, 3);
  }, [bonuses, eligibleSet]);

  /** Conteggio per categoria (solo eleggibili attivi) */
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    bonuses.filter(b => eligibleSet.has(b.id) && b.status === "attivo").forEach(b => {
      counts[b.categoria] = (counts[b.categoria] || 0) + 1;
    });
    return counts;
  }, [bonuses, eligibleSet]);

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

  /** Bonus da mostrare in base al filtro attivo, con ordinamento intelligente */
  const filteredBonuses = useMemo(() => {
    let result = bonuses;
    
    if (isPremium) {
      const filterMap = { all: bonuses, available: bonusGroups.active, upcoming: bonusGroups.upcoming, expired: bonusGroups.expired };
      result = filterMap[filter];
    }
    
    if (categoryFilter !== "Tutte") {
      result = result.filter(b => b.categoria === categoryFilter);
    }
    
    // Ordinamento: eleggibili prima, poi per valore decrescente
    return [...result].sort((a, b) => {
      const aEligible = eligibleSet.has(a.id) ? 1 : 0;
      const bEligible = eligibleSet.has(b.id) ? 1 : 0;
      if (aEligible !== bEligible) return bEligible - aEligible;
      return (b.valoreEsimato || 0) - (a.valoreEsimato || 0);
    });
  }, [isPremium, filter, bonuses, bonusGroups, categoryFilter, eligibleSet]);

  const isProfileIncomplete = completionPercentage < 100;

  // Animazioni
  const kpiVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
      opacity: 1, y: 0, scale: 1,
      transition: { delay: i * 0.1, type: "spring" as const, stiffness: 200, damping: 20 }
    }),
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 200, damping: 20 } },
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-12">

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SEZIONE 1: KPI CARDS                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className={`grid grid-cols-2 ${isProfileIncomplete ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-4`}>
        
        {/* KPI 1: Potenziale Totale */}
        <motion.div
          custom={0} variants={kpiVariants} initial="hidden" animate="visible"
          className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700 dark:from-emerald-600 dark:via-teal-700 dark:to-cyan-900 rounded-2xl p-6 text-white shadow-xl shadow-emerald-500/25 dark:shadow-emerald-900/30 relative overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-emerald-500/40 transition-all hover:scale-[1.02]"
          onClick={handleScrollToBonuses}
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-2xl blur-xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-lg shadow-inner">💰</div>
              <span className="text-[10px] uppercase tracking-[0.2em] font-black opacity-90">Potenziale attivabile</span>
            </div>
            <p className="text-5xl font-black tracking-tight leading-none mb-2 drop-shadow-sm">{formatValue(totalValue)}€</p>
            <p className="text-sm opacity-90 font-semibold">Valore stimato dei bonus a cui hai diritto</p>
          </div>
        </motion.div>

        {/* KPI 2: Bonus Trovati */}
        <motion.div
          custom={1} variants={kpiVariants} initial="hidden" animate="visible"
          className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-lg hover:shadow-xl transition-all cursor-pointer hover:border-blue-300 dark:hover:border-blue-700"
          onClick={handleScrollToBonuses}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-lg">🎯</div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 dark:text-slate-400">Bonus trovati</span>
          </div>
          <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">{eligibleMatches.length}</p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              ✓ {results.filter(r => r.eligible).length} idonei
            </span>
            <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              ? {eligibleMatches.length - results.filter(r => r.eligible).length} da verificare
            </span>
          </div>
        </motion.div>

        {/* KPI 3: Scadenze Imminenti */}
        <motion.div
          custom={2} variants={kpiVariants} initial="hidden" animate="visible"
          className={`rounded-2xl p-5 border shadow-lg hover:shadow-xl transition-all ${
            urgentBonuses.length > 0 
              ? "bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-300 dark:border-orange-700 shadow-orange-200/50 dark:shadow-orange-900/20" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg ${
              urgentBonuses.length > 0 
                ? "bg-orange-200 dark:bg-orange-900/50" 
                : "bg-slate-100 dark:bg-slate-800"
            }`}>⏰</div>
            <span className="text-[10px] uppercase tracking-[0.2em] font-black text-slate-500 dark:text-slate-400">Scadenze</span>
          </div>
          <p className={`text-4xl font-black tracking-tight leading-none mb-2 ${
            urgentBonuses.length > 0 
              ? "text-orange-700 dark:text-orange-300" 
              : "text-slate-300 dark:text-slate-600"
          }`}>{urgentBonuses.length}</p>
          <p className={`text-[10px] font-black mt-1 ${
            urgentBonuses.length > 0 
              ? "text-orange-600 dark:text-orange-400"
              : "text-slate-400 dark:text-slate-500"
          }`}>
            {urgentBonuses.length > 0 
              ? `⚠ Bonus in scadenza entro 60gg`
              : "Nessuna scadenza imminente"
            }
          </p>
        </motion.div>

        {/* KPI 4: Completamento Profilo (solo se incompleto) */}
        {isProfileIncomplete && (
          <motion.div
            custom={3} variants={kpiVariants} initial="hidden" animate="visible"
            className="bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-700 dark:from-violet-600 dark:via-purple-700 dark:to-fuchsia-900 rounded-2xl p-5 shadow-xl shadow-purple-500/20 dark:shadow-purple-900/30 cursor-pointer hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:scale-[1.02] relative overflow-hidden"
            onClick={onGoToProfile}
          >
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/5 rounded-full blur-xl" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center text-lg shadow-inner">📊</div>
                <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/90">Profilo</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14 shrink-0">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                    <path className="text-white/20" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" />
                    <path className="text-white" strokeDasharray={`${completionPercentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-black text-sm text-white drop-shadow-sm">{completionPercentage}%</div>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white leading-tight mb-1">Profilo incompleto</p>
                  <p className="text-[10px] font-semibold text-white/80 leading-snug">Aggiungi dati per sbloccare più bonus</p>
                </div>
              </div>
              <button className="mt-3 w-full py-2 bg-white/25 hover:bg-white/35 backdrop-blur-sm text-white rounded-xl font-black text-[10px] uppercase tracking-[0.15em] transition-all border border-white/30 shadow-lg">
                Completa Profilo →
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SEZIONE 2: BONUS IN SCADENZA (urgency)                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {urgentBonuses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-red-500/15 dark:bg-red-400/15 flex items-center justify-center text-sm">🔥</div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white">In Scadenza</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-red-300 to-transparent dark:from-red-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {urgentBonuses.map((bonus, i) => (
              <motion.div
                key={bonus.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                onClick={() => onSelectBonus(bonus.id)}
                className={`relative bg-white dark:bg-slate-900 rounded-2xl p-4 border cursor-pointer hover:-translate-y-1 transition-all hover:shadow-xl group ${
                  bonus.daysLeft <= 7 
                    ? "border-red-300 dark:border-red-800 shadow-md shadow-red-100 dark:shadow-red-900/20" 
                    : "border-orange-200 dark:border-orange-800 shadow-md shadow-orange-100 dark:shadow-orange-900/20"
                }`}
              >
                {/* Badge urgenza */}
                <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                  bonus.daysLeft <= 7 
                    ? "bg-red-500 text-white animate-pulse" 
                    : bonus.daysLeft <= 30 
                      ? "bg-orange-500 text-white" 
                      : "bg-yellow-400 text-yellow-900"
                }`}>
                  {bonus.daysLeft <= 7 ? `${bonus.daysLeft}gg!` : `${bonus.daysLeft}gg`}
                </div>
                
                <div className="pr-16">
                  <span className="text-[9px] uppercase font-black tracking-widest text-slate-400 dark:text-slate-500">{bonus.categoria}</span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{bonus.titolo}</h4>
                  {bonus.valoreEsimato && (
                    <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{bonus.valoreEsimato.toLocaleString("it-IT")}€</p>
                  )}
                </div>
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      bonus.daysLeft <= 7 ? "bg-red-500" : bonus.daysLeft <= 30 ? "bg-orange-400" : "bg-yellow-400"
                    }`}
                    style={{ width: `${Math.max(5, 100 - (bonus.daysLeft / 60) * 100)}%` }}
                  />
                </div>
                <p className="text-[9px] font-bold text-slate-400 mt-1">
                  Scade il {new Date(bonus.scadenza!).toLocaleDateString("it-IT")}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SEZIONE 3: TOP BONUS PER VALORE                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {topBonuses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-7 h-7 rounded-lg bg-purple-500/15 dark:bg-purple-400/15 flex items-center justify-center text-sm">🏆</div>
            <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white">Bonus di Maggior Valore</h3>
            <div className="h-px flex-1 bg-gradient-to-r from-purple-300 to-transparent dark:from-purple-700" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topBonuses.map((bonus, i) => {
              const match = results.find(r => r.bonusId === bonus.id);
              return (
                <motion.div
                  key={bonus.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1 }}
                  onClick={() => onSelectBonus(bonus.id)}
                  className={`relative bg-gradient-to-br rounded-2xl p-5 cursor-pointer hover:-translate-y-1 transition-all hover:shadow-2xl group overflow-hidden ${
                    i === 0 
                      ? "from-purple-500/15 via-indigo-500/10 to-blue-500/10 dark:from-purple-500/25 dark:via-indigo-500/15 dark:to-blue-500/15 border-2 border-purple-300 dark:border-purple-700 shadow-lg shadow-purple-200/50 dark:shadow-purple-900/30" 
                      : "from-slate-50 to-white dark:from-slate-800/60 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-md"
                  }`}
                >
                  {/* Medaglia */}
                  <div className="absolute top-3 right-3 text-2xl opacity-80">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                  </div>
                  <div className="pr-10">
                    <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-0.5 rounded-full ${
                      i === 0 
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400" 
                        : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                    }`}>{bonus.categoria}</span>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-2 leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{bonus.titolo}</h4>
                    <p className={`text-2xl font-black mt-2 ${
                      i === 0 ? "text-purple-700 dark:text-purple-300" : "text-slate-900 dark:text-white"
                    }`}>{bonus.valoreEsimato?.toLocaleString("it-IT")}€</p>
                    {match?.eligible && (
                      <div className="flex items-center gap-1 mt-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Idoneo</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SEZIONE 4: CATEGORIE                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-blue-500/15 dark:bg-blue-400/15 flex items-center justify-center text-sm">📂</div>
          <h3 className="text-sm font-black uppercase tracking-[0.15em] text-slate-900 dark:text-white">Per Categoria</h3>
          <div className="h-px flex-1 bg-gradient-to-r from-blue-200 to-transparent dark:from-blue-800" />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter("Tutte")}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              categoryFilter === "Tutte"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
            }`}
          >
            Tutte
            <span className="opacity-60">{bonusGroups.active.length}</span>
          </button>
          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat.name] || 0;
            if (count === 0) return null;
            return (
              <button
                key={cat.name}
                onClick={() => setCategoryFilter(cat.name)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  categoryFilter === cat.name
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                <span className="text-sm">{cat.icon}</span>
                {cat.name}
                <span className="opacity-60">{count}</span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* SEZIONE 5: TABS & LISTA BONUS                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        {/* Filtri Status */}
        <div className="flex flex-wrap gap-2 mb-5">
          {isPremium ? (
            tabs.map((tab) => (
              <button key={tab.id} onClick={() => setFilter(tab.id)} className={`px-4 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${filter === tab.id ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"}`}>
                {tab.label} <span className="ml-1.5 opacity-70">{tab.count}</span>
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

        {/* Griglia Bonus */}
        <div ref={availableRef} className="min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${filter}-${categoryFilter}`}
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {filteredBonuses.map((b) => {
                const match = results.find((r) => r.bonusId === b.id);
                return (
                  <motion.div key={b.id} variants={staggerItem}>
                    <BonusCard 
                      key={b.id} 
                      bonus={b} 
                      onClick={() => onSelectBonus(b.id)} 
                      matchReason={match?.reason}
                      isEligible={match?.eligible}
                    />
                  </motion.div>
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
