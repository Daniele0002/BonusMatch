import React from "react";
import { Bonus, MatchResult } from "../types";
import BonusCard from "./BonusCard";
import { useAuth } from "../context/AuthContext";

interface SavedBonusesViewProps {
  bonuses: Bonus[];
  results: MatchResult[];
  onSelectBonus: (id: string) => void;
  onUpgrade?: () => void;
}

const SavedBonusesView: React.FC<SavedBonusesViewProps> = ({
  bonuses,
  results,
  onSelectBonus,
  onUpgrade,
}) => {
  const { savedBonusIds, user } = useAuth();
  const isPremium = user?.isPremium;

  const savedList = React.useMemo(() => {
    return bonuses.filter((b) => savedBonusIds?.includes(b.id));
  }, [bonuses, savedBonusIds]);

  if (!savedBonusIds || savedBonusIds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-10 text-center animate-in fade-in zoom-in duration-500">
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
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </div>
          <h2 className="text-4xl font-black mb-4 dark:text-white">
            Nessun Bonus Salvato
          </h2>
          <p className="text-slate-500 text-lg max-w-lg mx-auto mb-8">
            Salva i bonus che ti interessano per ritrovarli qui.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="flex items-center gap-4 mb-8 px-4">
        <h2 className="text-3xl font-black text-slate-800 dark:text-white">
          I tuoi Bonus Salvati
        </h2>
        <span className="bg-blue-100 text-blue-800 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest">
          {savedList.length}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savedList.map((bonus) => {
          const result = results.find((r) => r.bonusId === bonus.id);
          return (
            <BonusCard
              key={bonus.id}
              bonus={bonus}
              onClick={() => onSelectBonus(bonus.id)}
              matchReason={result?.eligible ? result.reason : undefined}
              isPremium={isPremium}
              onUpgrade={onUpgrade}
            />
          );
        })}
      </div>
    </div>
  );
};

export default SavedBonusesView;
