import React, { useState, useCallback } from "react";
import { Bonus } from "../types";
import { useAuth } from "../context/AuthContext";

// ═══════════════════════════════════════════════════════════════════════
// TIPI E PROPS
// ═══════════════════════════════════════════════════════════════════════
interface BonusCardProps {
  bonus: Bonus;
  onClick: () => void;
  matchReason?: string;
  isEligible?: boolean; // true = idoneo, false = non idoneo, undefined = non calcolato
  isPremium?: boolean;
  onUpgrade?: () => void;
}

// ═══════════════════════════════════════════════════════════════════════
// COSTANTI - Colori per status e difficoltà
// ═══════════════════════════════════════════════════════════════════════
const STATUS_COLORS: Record<string, string> = {
  attivo: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400",
  "in arrivo": "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400",
  ottenuto: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400",
  scaduto: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  bassa: "text-green-600 dark:text-green-400",
  media: "text-yellow-600 dark:text-yellow-400",
  alta: "text-red-600 dark:text-red-400",
};

// ═══════════════════════════════════════════════════════════════════════
// ICONE SVG
// ═══════════════════════════════════════════════════════════════════════
const Icons = {
  bookmark: "M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
  check: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
  info: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z",
} as const;

const Icon: React.FC<{ d: string; className?: string; filled?: boolean }> = ({ d, className = "h-4 w-4", filled }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox={filled ? "0 0 20 20" : "0 0 24 24"} fill={filled ? "currentColor" : "none"} stroke={filled ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    {filled ? <path fillRule="evenodd" d={d} clipRule="evenodd" /> : <path d={d} />}
  </svg>
);

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PULSANTE AZIONE
// ═══════════════════════════════════════════════════════════════════════
const ActionButton: React.FC<{
  active: boolean;
  onClick: (e: React.MouseEvent) => void;
  icon: string;
  label: string;
  activeLabel: string;
  activeColor: string;
}> = ({ active, onClick, icon, label, activeLabel, activeColor }) => (
  <button
    onClick={onClick}
    className={`flex-1 py-2 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 ${
      active
        ? `${activeColor} text-white shadow-lg`
        : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
    }`}
  >
    <Icon d={icon} className={`h-4 w-4 ${active ? "fill-current" : ""}`} />
    {active ? activeLabel : label}
  </button>
);

// ═══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════
const BonusCard: React.FC<BonusCardProps> = React.memo(({ bonus, onClick, matchReason, isEligible, isPremium, onUpgrade }) => {
  const { savedBonusIds, toggleSaveBonus } = useAuth();
  const [isFollowed, setIsFollowed] = useState(false);
  
  const isSaved = savedBonusIds?.includes(bonus.id) || false;

  // Handler con gating premium
  const handlePremiumAction = useCallback((action: () => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    isPremium ? action() : onUpgrade?.();
  }, [isPremium, onUpgrade]);

  const handleSave = handlePremiumAction(() => toggleSaveBonus(bonus.id));
  const handleFollow = handlePremiumAction(() => setIsFollowed(!isFollowed));

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-400 dark:hover:border-blue-700 cursor-pointer transition-all flex flex-col h-full group transform hover:-translate-y-1"
    >
      {/* Header: Status, Categoria e Urgenza */}
      <div className="w-full flex justify-between items-start mb-4">
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full ${STATUS_COLORS[bonus.status]}`}>
            {bonus.status}
          </span>
          {/* Badge urgenza scadenza */}
          {(() => {
            if (!bonus.scadenza) return null;
            const now = new Date(); now.setHours(0,0,0,0);
            const target = new Date(bonus.scadenza); target.setHours(0,0,0,0);
            const daysLeft = Math.ceil((target.getTime() - now.getTime()) / (1000*60*60*24));
            if (daysLeft <= 0 || daysLeft > 60) return null;
            const colorClass = daysLeft <= 7 
              ? "bg-red-500 text-white animate-pulse" 
              : daysLeft <= 30 
                ? "bg-orange-500 text-white" 
                : "bg-yellow-400 text-yellow-900";
            return (
              <span className={`text-[8px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${colorClass}`}>
                {daysLeft}gg
              </span>
            );
          })()}
        </div>
        <span className="text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
          {bonus.categoria}
        </span>
      </div>

      {/* Valore */}
      <div className="mb-1">
        <span className="text-2xl font-black bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          {bonus.valoreEsimato ? `${bonus.valoreEsimato.toLocaleString("it-IT")}€` : "Variabile"}
        </span>
      </div>

      {/* Titolo e Descrizione */}
      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2 leading-tight text-left">
        {bonus.titolo}
      </h4>
      <p className="text-slate-600 dark:text-slate-300 text-xs mb-4 line-clamp-2 text-left">
        {bonus.descrizione}
      </p>

      {/* Eligibility Box - Verde se idoneo, Rosso solo se non idoneo per motivo specifico */}
      {(() => {
        // Motivi generici = dati mancanti nel profilo, non possiamo verificare -> mostra come potenzialmente idoneo
        const genericReasons = ["specificato", "non fornito", "nessun", "mancante", "non indicat", "non presente"];
        const isGenericReason = matchReason && genericReasons.some(g => matchReason.toLowerCase().includes(g));
        
        // Se idoneo -> verde
        if (isEligible === true && matchReason) {
          return (
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl mb-4 border border-green-200 dark:border-green-800 w-full text-left">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-bold text-green-700 dark:text-green-300">{matchReason}</span>
              </div>
            </div>
          );
        }
        
        // Se non idoneo ma motivo generico -> giallo (da verificare)
        if (isEligible === false && matchReason && isGenericReason) {
          return (
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl mb-4 border border-amber-200 dark:border-amber-800 w-full text-left">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Da verificare</span>
              </div>
            </div>
          );
        }
        
        // Se non idoneo con motivo specifico -> rosso
        if (isEligible === false && matchReason && !isGenericReason) {
          return (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl mb-4 border border-red-200 dark:border-red-800 w-full text-left">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-[11px] font-bold text-red-700 dark:text-red-300">Non idoneo: {matchReason}</span>
              </div>
            </div>
          );
        }
        
        return null;
      })()}

      {/* Pulsanti azione (solo Premium) */}
      {isPremium && (
        <div className="flex gap-2 mb-4">
          <ActionButton active={isSaved} onClick={handleSave} icon={Icons.bookmark} label="Salva" activeLabel="Salvato" activeColor="bg-blue-600 shadow-blue-500/30" />
          <ActionButton active={isFollowed} onClick={handleFollow} icon={Icons.bell} label="Segui" activeLabel="Seguito" activeColor="bg-indigo-600 shadow-indigo-500/30" />
        </div>
      )}

      {/* Footer: Difficoltà e Scadenza */}
      <div className="mt-auto w-full pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Icon d={Icons.check} className="h-3.5 w-3.5" />
          <span className={DIFFICULTY_COLORS[bonus.difficolta]}>{bonus.difficolta}</span>
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
