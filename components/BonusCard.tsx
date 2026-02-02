import React from "react";
import { Bonus } from "../types";
import { useAuth } from "../context/AuthContext";

interface BonusCardProps {
  bonus: Bonus;
  onClick: () => void;
  matchReason?: string;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

const BonusCard: React.FC<BonusCardProps> = React.memo(({
  bonus,
  onClick,
  matchReason,
  isPremium,
  onUpgrade,
}) => {
  const { user, isPremium: userIsPremium } = useAuth(); // Assuming useAuth exposes this, actually it exposes user object
  // But wait, the component receives isPremium as prop. I Should use that or context? Prop is safer for now if it comes from parent.
  // Actually, I need useAuth for toggleSaveBonus.
  const { savedBonusIds, toggleSaveBonus } = useAuth();

  const isSaved = savedBonusIds?.includes(bonus.id) || false;
  const [isFollowed, setIsFollowed] = React.useState(false);

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPremium) {
      onUpgrade?.();
    } else {
      await toggleSaveBonus(bonus.id);
    }
  };

  const handleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPremium) {
      onUpgrade?.();
    } else {
      setIsFollowed(!isFollowed);
    }
  };
  const statusColors = {
    attivo:
      "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
    "in arrivo":
      "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
    ottenuto:
      "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400",
    scaduto:
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
  };

  const difficoltaColors = {
    bassa: "text-green-600 dark:text-green-400",
    media: "text-yellow-600 dark:text-yellow-400",
    alta: "text-red-600 dark:text-red-400",
  };

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-700 cursor-pointer transition-all flex flex-col h-full group transform hover:-translate-y-1"
    >
      <div className="w-full flex justify-between items-start mb-4">
        <span
          className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full ${statusColors[bonus.status]}`}
        >
          {bonus.status}
        </span>
        <span className="text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
          {bonus.categoria}
        </span>
      </div>

      <div className="mb-1">
        <span className="text-2xl font-black text-slate-800 dark:text-slate-100">
          {bonus.valoreEsimato}€
        </span>
      </div>

      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 leading-tight text-left">
        {bonus.titolo}
      </h4>
      <p className="text-slate-500 dark:text-slate-400 text-xs mb-4 line-clamp-2 text-left">
        {bonus.descrizione}
      </p>

      {matchReason && (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-[10px] text-blue-700 dark:text-blue-300 italic mb-4 border border-blue-100 dark:border-blue-900/30 w-full text-left relative overflow-hidden">
          <span className="relative z-10 flex items-center gap-1.5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            Perché lo vedi: {matchReason}
          </span>
          {isPremium && (
            <div className="absolute top-0 right-0 bg-blue-200 dark:bg-blue-800 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-bl-xl text-blue-800 dark:text-blue-200">
              Alta Probabilità
            </div>
          )}
        </div>
      )}

      {/* Action Buttons (Premium Only) */}
      {isPremium && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={handleSave}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 group/btn ${
              isSaved
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`}
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
            {isSaved ? "Salvato" : "Salva"}
          </button>
          <button
            onClick={handleFollow}
            className={`flex-1 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 group/btn ${
              isFollowed
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                : "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isFollowed ? "fill-current" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {isFollowed ? "Seguito" : "Segui"}
          </button>
        </div>
      )}

      <div className="mt-auto w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
        <div className="flex items-center gap-1.5">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className={difficoltaColors[bonus.difficolta]}>
            {bonus.difficolta}
          </span>
        </div>
        {bonus.scadenza && (
          <div className="text-[9px]">
            Scade: {new Date(bonus.scadenza).toLocaleDateString("it-IT")}
          </div>
        )}
      </div>
    </div>
  );
});

export default BonusCard;
