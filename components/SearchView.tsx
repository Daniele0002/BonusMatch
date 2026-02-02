import React, { useState } from "react";
import { Bonus, MatchResult, BonusCategory } from "../types";
import { AnimatePresence, motion } from "framer-motion";
import BonusCard from "./BonusCard";
import { Feature, hasFeature, FREE_LIMITS } from "../utils/features";

interface SearchViewProps {
  bonuses: Bonus[];
  results: MatchResult[];
  onSelectBonus: (id: string) => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const CATEGORIES: BonusCategory[] = [
  "Studio",
  "Casa",
  "Energia",
  "Famiglia",
  "Lavoro",
  "Giovani",
  "Salute",
  "Mobilità",
];

const SearchView: React.FC<SearchViewProps> = ({
  bonuses,
  results,
  onSelectBonus,
  isPremium,
  onUpgrade,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    BonusCategory | "Tutte"
  >("Tutte");

  // Advanced filters state (mock inputs effectively, but UI will interact)
  const [onlyEligible, setOnlyEligible] = useState(false);
  const [minVal, setMinVal] = useState("");

  // 1. Filtering Logic
  let filteredBonuses = bonuses.filter((b) => {
    const matchesSearch =
      b.titolo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.descrizione.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Tutte" || b.categoria === selectedCategory;

    // Advanced filtering
    let matchesAdvanced = true;
    if (isPremium) {
      // Only Eligible
      if (onlyEligible) {
        const isEligible = results.find((r) => r.bonusId === b.id)?.eligible;
        if (!isEligible) matchesAdvanced = false;
      }

      // Min Value
      if (minVal && !isNaN(Number(minVal))) {
        if (b.valoreEsimato < Number(minVal)) matchesAdvanced = false;
      }

      // Deadline (Mock implementation for "Entro X giorni")
      // As we don't have real dates in mock bonuses for all, we skip strict check or assume mock data has parsable dates
      // This is a placeholder for real logic
    }

    return matchesSearch && matchesCategory && matchesAdvanced;
  });

  // 2. Sorting Logic (Pro Sorting)
  // For free users, default relevance (by ID/mock). For PRO, we could sort by value/deadline.
  // Here we just keep default for transparency, but PRO users would have controls.

  // 3. Feature Gating: Result Limiting
  // If Free: Limit to FREE_LIMITS.maxSearchResults.
  // If Pro: Unlimited.
  const hasUnlimitedResults = hasFeature(
    { isPremium } as any,
    Feature.UNLIMITED_SEARCH_RESULTS,
  );
  const totalResults = filteredBonuses.length;
  const displayLimit = hasUnlimitedResults ? totalResults : FREE_LIMITS.maxSearchResults;
  const displayedBonuses = filteredBonuses.slice(0, displayLimit);
  const remainingCount = Math.max(0, totalResults - displayLimit);

  // Helper for feature-gated click
  const handleProAction = (feature: Feature, action: () => void) => {
    if (hasFeature({ isPremium } as any, feature)) {
      action();
    } else {
      onUpgrade?.();
    }
  };

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
    >
      <div className="flex flex-col lg:flex-row gap-5 items-start">
        {/* SIDEBAR FILTRI */}
        <motion.div
          variants={{
            hidden: { opacity: 0, x: -20 },
            show: { opacity: 1, x: 0 },
          }}
          className="w-full lg:w-72 shrink-0 space-y-4">
          {/* Mobile Search Input (visible on mobile, hidden on desktop if desired, but keeping it simple) */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Cerca bonus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-sm text-sm font-medium"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filters Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* Basic Filters */}
            <div>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                Categoria
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {["Tutte", ...CATEGORIES].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat as any)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Filters (Gated) */}
            <div className="relative">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest flex items-center gap-1.5">
                  Filtri Avanzati
                  {!isPremium && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-2.5 w-2.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </h3>
                {isPremium && (
                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded uppercase font-bold">
                    Premium
                  </span>
                )}
              </div>

              <div
                className={`space-y-3 ${!isPremium ? "opacity-50 blur-[1px] pointer-events-none select-none" : ""}`}
                aria-hidden={!isPremium}
              >
                {/* Toggle Solo Idonei */}
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setOnlyEligible(!onlyEligible)}
                >
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Solo Idonei
                  </span>
                  <div
                    className={`w-8 h-5 rounded-full p-0.5 transition-colors ${onlyEligible ? "bg-indigo-600" : "bg-slate-200 dark:bg-slate-700"}`}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full transition-transform ${onlyEligible ? "translate-x-3" : ""}`}
                    ></div>
                  </div>
                </div>

                {/* Min Value Input */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 mb-0.5 block">
                    Valore Minimo (€)
                  </span>
                  <input
                    type="number"
                    placeholder="es. 500"
                    value={minVal}
                    onChange={(e) => setMinVal(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  />
                </div>

                {/* Deadline Filter */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 mb-0.5 block">
                    Scadenza
                  </span>
                  <select className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                    <option>Qualsiasi</option>
                    <option>Entro 7 giorni</option>
                    <option>Entro 30 giorni</option>
                  </select>
                </div>
              </div>

              {/* Overlay for Free Users */}
              {!isPremium && (
                <div
                  className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer group"
                  onClick={() => onUpgrade?.()}
                >
                  <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-indigo-100 dark:border-indigo-900/30 text-center transform group-hover:scale-105 transition-transform">
                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide mb-1.5">
                      Filtri Premium
                    </p>
                    <button className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-md shadow-indigo-500/30">
                      Sblocca Ora
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* MAIN CONTENT RESULTS */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Risultati{" "}
              <span className="text-slate-400 ml-1.5 text-sm font-bold">
                {totalResults}
              </span>
            </h2>
            {/* Sort Dropdown (Mock/Pro) */}
            <div
              className="relative group cursor-pointer"
              onClick={() => handleProAction(Feature.PRO_SORTING, () => {})}
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors">
                <span>Ordina per: Rilevanza</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {/* Tooltip if free */}
              {!isPremium && (
                <div className="absolute right-0 top-full mt-1.5 w-40 bg-slate-800 text-white text-[10px] p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center">
                  Ordina per Valore o Scadenza con Premium
                </div>
              )}
            </div>
          </div>

          <motion.div layout className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {displayedBonuses.map((b) => (
                <motion.div
                  key={b.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <BonusCard
                    bonus={b}
                    onClick={() => onSelectBonus(b.id)}
                    matchReason={
                      results.find((r) => r.bonusId === b.id)?.eligible
                        ? results.find((r) => r.bonusId === b.id)?.reason
                        : undefined
                    }
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Unlock More Card (Visible if limited) */}
          {!hasUnlimitedResults && remainingCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-900 dark:to-slate-900 rounded-2xl p-5 text-center text-white relative overflow-hidden cursor-pointer group shadow-xl"
              onClick={() => onUpgrade?.()}
            >
              <div className="absolute top-0 right-0 p-5 opacity-10 transform translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-32 w-32"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              <div className="relative z-10 max-w-lg mx-auto">
                <div className="inline-flex items-center gap-1.5 bg-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest mb-3 border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse"></span>
                  Altri {remainingCount} bonus disponibili
                </div>
                <h3 className="text-xl font-bold tracking-tight mb-2">
                  Non perderti nulla.
                </h3>
                <p className="text-slate-300 text-sm mb-5 leading-relaxed">
                  Stai vedendo solo un'anteprima limitata. Sblocca Premium per
                  accedere alla lista completa di tutti i bonus compatibili con
                  il tuo profilo.
                </p>
                <button className="bg-white text-slate-900 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg hover:shadow-xl hover:-translate-y-0.5 transform duration-200">
                  Sblocca Tutto Ora
                </button>
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredBonuses.length === 0 && (
            <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
              <div className="h-14 w-14 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <p className="text-slate-400 font-bold text-sm">
                Nessun bonus trovato con questi filtri.
              </p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("Tutte");
                }}
                className="text-blue-500 font-bold text-xs mt-1.5 hover:underline"
              >
                Resetta filtri
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SearchView;
