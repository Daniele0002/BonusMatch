import React, { useState, useMemo, useCallback } from "react";
import { Bonus, MatchResult, BonusCategory } from "../types";
import { AnimatePresence, motion, Variants } from "framer-motion";
import BonusCard from "./BonusCard";
import { Feature, hasFeature, FREE_LIMITS } from "../utils/features";

// ═══════════════════════════════════════════════════════════════════════
// TIPI E PROPS
// ═══════════════════════════════════════════════════════════════════════
interface SearchViewProps {
  bonuses: Bonus[];
  results: MatchResult[];
  onSelectBonus: (id: string) => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// COSTANTI - Categorie, Stili comuni, Animazioni
// ═══════════════════════════════════════════════════════════════════════
const CATEGORIES: BonusCategory[] = ["Studio", "Casa", "Energia", "Famiglia", "Lavoro", "Giovani", "Salute", "Mobilità"];

const STYLES = {
  input: "w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all",
  label: "text-[10px] font-bold text-slate-600 dark:text-slate-300 mb-0.5 block",
  sectionTitle: "text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5",
  card: "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm",
  premiumBlur: "opacity-50 blur-[1px] pointer-events-none select-none",
} as const;

const ANIM: Record<string, Variants> = {
  stagger: { hidden: {}, show: { transition: { staggerChildren: 0.1 } } },
  slideIn: { hidden: { opacity: 0, x: -20 }, show: { opacity: 1, x: 0 } },
  fadeScale: { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } },
};

// ═══════════════════════════════════════════════════════════════════════
// ICONE SVG - Percorsi centralizzati
// ═══════════════════════════════════════════════════════════════════════
const Icons = {
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  lock: "M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z",
  chevron: "M19 9l-7 7-7-7",
} as const;

// Componente Icon riutilizzabile
const Icon: React.FC<{ d: string; className?: string; filled?: boolean }> = ({ d, className = "h-4 w-4", filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={filled ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
    {filled ? <path fillRule="evenodd" d={d} clipRule="evenodd" /> : <path d={d} />}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTI RIUTILIZZABILI
// ═══════════════════════════════════════════════════════════════════════

/** Toggle switch stilizzato */
const Toggle: React.FC<{ active: boolean; onClick: () => void; label: string }> = ({ active, onClick, label }) => (
  <div className="flex items-center justify-between cursor-pointer" onClick={onClick}>
    <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
    <div className={`w-8 h-5 rounded-full p-0.5 transition-colors ${active ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}>
      <div className={`w-4 h-4 bg-white rounded-full transition-transform ${active ? "translate-x-3" : ""}`} />
    </div>
  </div>
);

/** Overlay Premium per bloccare sezioni free */
const PremiumOverlay: React.FC<{ onUpgrade?: () => void }> = ({ onUpgrade }) => (
  <div className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group" onClick={() => onUpgrade?.()}>
    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/30 text-center transform group-hover:scale-105 transition-transform">
      <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5">Filtri Premium</p>
      <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md shadow-indigo-500/30">Sblocca Ora</button>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════
const SearchView: React.FC<SearchViewProps> = ({ bonuses, results, onSelectBonus, isPremium, onUpgrade }) => {
  // Stati filtro
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<BonusCategory | "Tutte">("Tutte");
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [minVal, setMinVal] = useState("");

  // Mappa risultati per lookup O(1)
  const resultsMap = useMemo(() => new Map(results.map(r => [r.bonusId, r])), [results]);

  // Filtraggio memoizzato
  const filteredBonuses = useMemo(() => {
    const minValue = minVal ? Number(minVal) : 0;
    
    return bonuses.filter(b => {
      // Ricerca testo
      const term = searchTerm.toLowerCase();
      if (term && !b.titolo.toLowerCase().includes(term) && !b.descrizione.toLowerCase().includes(term)) return false;
      
      // Categoria
      if (selectedCategory !== "Tutte" && b.categoria !== selectedCategory) return false;
      
      // Filtri avanzati (solo Premium)
      if (isPremium) {
        if (onlyEligible && !resultsMap.get(b.id)?.eligible) return false;
        if (minValue && b.valoreEsimato < minValue) return false;
      }
      
      return true;
    });
  }, [bonuses, searchTerm, selectedCategory, isPremium, onlyEligible, minVal, resultsMap]);

  // Limitazione risultati per utenti Free
  const hasUnlimitedResults = hasFeature({ isPremium } as any, Feature.UNLIMITED_SEARCH_RESULTS);
  const totalResults = filteredBonuses.length;
  const displayLimit = hasUnlimitedResults ? totalResults : FREE_LIMITS.maxSearchResults;
  const displayedBonuses = filteredBonuses.slice(0, displayLimit);
  const remainingCount = Math.max(0, totalResults - displayLimit);

  // Handler reset filtri
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedCategory("Tutte");
  }, []);

  return (
    <motion.div className="space-y-5" initial="hidden" animate="show" variants={ANIM.stagger}>
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        
        {/* ═══ SIDEBAR FILTRI ═══ */}
        <motion.div variants={ANIM.slideIn} className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Barra ricerca */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Cerca bonus..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm font-medium"
            />
            <Icon d={Icons.search} className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>

          {/* Pannello filtri */}
          <div className={`${STYLES.card} p-4 space-y-5`}>
            {/* Filtro categoria */}
            <div>
              <h3 className={STYLES.sectionTitle}>Categoria</h3>
              <div className="flex flex-wrap gap-1.5">
                {["Tutte", ...CATEGORIES].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as BonusCategory | "Tutte")}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtri avanzati (Premium) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  Filtri Avanzati
                  {!isPremium && <Icon d={Icons.lock} className="h-2.5 w-2.5" filled />}
                </h3>
                {isPremium && (
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded uppercase font-bold">Premium</span>
                )}
              </div>

              <div className={`space-y-3 ${!isPremium ? STYLES.premiumBlur : ""}`} aria-hidden={!isPremium}>
                <Toggle active={onlyEligible} onClick={() => setOnlyEligible(!onlyEligible)} label="Solo Idonei" />
                
                <div>
                  <span className={STYLES.label}>Valore Minimo (€)</span>
                  <input type="number" placeholder="es. 500" value={minVal} onChange={e => setMinVal(e.target.value)} className={STYLES.input} />
                </div>
                
                <div>
                  <span className={STYLES.label}>Scadenza</span>
                  <select className={STYLES.input}>
                    <option>Qualsiasi</option>
                    <option>Entro 7 giorni</option>
                    <option>Entro 30 giorni</option>
                  </select>
                </div>
              </div>

              {!isPremium && <PremiumOverlay onUpgrade={onUpgrade} />}
            </div>
          </div>
        </motion.div>

        {/* ═══ RISULTATI ═══ */}
        <div className="flex-1 space-y-4">
          {/* Header risultati */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Risultati <span className="text-slate-500 ml-1.5 text-sm font-bold">{totalResults}</span>
            </h2>
            
            {/* Dropdown ordinamento (mock) */}
            <div className="relative group cursor-pointer" onClick={() => !isPremium && onUpgrade?.()}>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors">
                <span>Ordina per: Rilevanza</span>
                <Icon d={Icons.chevron} className="h-3 w-3" />
              </div>
              {!isPremium && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-800 text-white text-[10px] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                  Ordina per Valore o Scadenza con Premium
                </div>
              )}
            </div>
          </div>

          {/* Griglia bonus */}
          <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {displayedBonuses.map(b => {
                const match = resultsMap.get(b.id);
                return (
                  <motion.div key={b.id} layout initial="hidden" animate="show" exit="hidden" variants={ANIM.fadeScale}>
                    <BonusCard bonus={b} onClick={() => onSelectBonus(b.id)} matchReason={match?.eligible ? match.reason : undefined} />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>

          {/* Card sblocco (se limitato) */}
          {!hasUnlimitedResults && remainingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-slate-900 rounded-2xl p-5 text-center text-white relative overflow-hidden cursor-pointer group shadow-xl"
              onClick={() => onUpgrade?.()}
            >
              {/* Icona decorativa */}
              <div className="absolute top-0 right-0 p-5 opacity-10 transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-700">
                <Icon d={Icons.lock} className="h-32 w-32" filled />
              </div>

              <div className="relative z-10 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  Altri {remainingCount} bonus disponibili
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2">Non perderti nulla.</h3>
                <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                  Stai vedendo solo un'anteprima limitata. Sblocca Premium per accedere alla lista completa di tutti i bonus compatibili con il tuo profilo.
                </p>
                <button className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200">
                  Sblocca Tutto Ora
                </button>
              </div>
            </motion.div>
          )}

          {/* Stato vuoto */}
          {filteredBonuses.length === 0 && (
            <div className={`text-center py-16 ${STYLES.card} border-dashed`}>
              <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <Icon d={Icons.search} className="h-6 w-6" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Nessun bonus trovato con questi filtri.</p>
              <button onClick={resetFilters} className="text-blue-500 font-bold text-xs mt-1.5 hover:underline">Resetta filtri</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchView;
