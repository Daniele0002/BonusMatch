import React, { useMemo, useEffect, useState } from "react";
import { Bonus, MatchResult } from "../types";
import BonusCard from "./BonusCard";
import ShareButtons from "./ShareButtons";
import { useAuth } from "../context/AuthContext";

// ═══════════════════════════════════════════════════════════════════════════════
// TIPI E COSTANTI
// ═══════════════════════════════════════════════════════════════════════════════
interface BonusDetailViewProps {
  bonus: Bonus;
  allBonuses: Bonus[];
  allResults: MatchResult[];
  matchInfo?: MatchResult;
  onBack: () => void;
  onSelectBonus: (id: string) => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
}

/** Icone SVG riutilizzabili */
const Icons = {
  back: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />,
  document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  bookmark: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />,
  bell: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
  lightning: <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />,
  check: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  warning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  clock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
  lock: <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />,
  external: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />,
  play: <path d="M8 5v14l11-7z" />,
};

/** Componente SVG base */
const Icon: React.FC<{ d: React.ReactNode; className?: string; fill?: boolean }> = ({ d, className = "h-5 w-5", fill }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill={fill ? "currentColor" : "none"} viewBox={fill ? "0 0 20 20" : "0 0 24 24"} stroke={fill ? undefined : "currentColor"}>{d}</svg>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PREMIUM LOCK - Riutilizzabile per sezioni bloccate
// ═══════════════════════════════════════════════════════════════════════════════
interface PremiumLockProps {
  isPremium: boolean;
  onUpgrade?: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
}

const PremiumLock: React.FC<PremiumLockProps> = ({ isPremium, onUpgrade, label, children, className = "" }) => (
  <section className={`relative overflow-hidden ${!isPremium ? "cursor-pointer" : ""} ${className}`} onClick={!isPremium ? onUpgrade : undefined}>
    <div className={!isPremium ? "blur-md select-none opacity-50" : ""}>{children}</div>
    {!isPremium && (
      <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px]">
        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl flex items-center gap-2">
          <Icon d={Icons.lock} className="h-5 w-5 text-yellow-400" fill />
          <span className="text-xs font-black uppercase tracking-widest">{label}</span>
        </div>
      </div>
    )}
  </section>
);

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
const BonusDetailView: React.FC<BonusDetailViewProps> = ({ bonus, allBonuses, allResults, matchInfo, onBack, onSelectBonus, isPremium = false, onUpgrade }) => {
  const { savedBonusIds, toggleSaveBonus } = useAuth();
  const isSaved = savedBonusIds?.includes(bonus.id) || false;
  const [isFollowed, setIsFollowed] = useState(false);

  // Scroll to top on bonus change
  useEffect(() => { window.scrollTo(0, 0); }, [bonus.id]);

  // Bonus simili calcolati per similarità keywords
  const similarBonuses = useMemo(() => {
    const currentKeywords = [...bonus.titolo.toLowerCase().split(" "), ...bonus.requisiti.flatMap(r => r.toLowerCase().split(" "))];
    return allBonuses
      .filter(b => b.id !== bonus.id)
      .map(b => {
        const targetKeywords = [...b.titolo.toLowerCase().split(" "), ...b.requisiti.flatMap(r => r.toLowerCase().split(" "))];
        const bResult = allResults.find(r => r.bonusId === b.id);
        let score = bResult?.eligible ? 5 : 0;
        score += currentKeywords.filter(word => word.length > 3 && targetKeywords.includes(word)).length;
        return { bonus: b, score, result: bResult };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [bonus, allBonuses, allResults]);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen">
      {/* Backdrop click-away */}
      <div className="fixed inset-0 z-0 cursor-pointer" onClick={onBack} aria-hidden="true" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-8 pb-12 cursor-default" onClick={e => e.stopPropagation()}>
        {/* Back Button */}
        <button onClick={onBack} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-all group shadow-sm">
          <Icon d={Icons.back} className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
          Torna alla lista
        </button>

        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden transition-colors">
          {/* Header Hero */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-900 p-8 md:p-10 text-white relative flex flex-col items-center text-center">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl mb-5 transform -rotate-3">
              <Icon d={Icons.document} className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            
            {/* Status Badge - Ben visibile */}
            <div className="flex flex-col items-center gap-3 mb-5">
              {bonus.status === "attivo" && (
                <div className="flex items-center gap-2 bg-green-500 px-4 py-2 rounded-full shadow-lg border-2 border-green-300 animate-pulse">
                  <span className="h-2.5 w-2.5 rounded-full bg-white animate-ping" />
                  <span className="text-sm font-black uppercase tracking-widest text-white">Attivo Ora</span>
                </div>
              )}
              {bonus.status === "in arrivo" && (
                <div className="flex items-center gap-2 bg-blue-500 px-4 py-2 rounded-full shadow-lg border-2 border-blue-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-black uppercase tracking-widest text-white">Prossimamente</span>
                </div>
              )}
              {bonus.status === "scaduto" && (
                <div className="flex items-center gap-2 bg-red-500 px-4 py-2 rounded-full shadow-lg border-2 border-red-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-sm font-black uppercase tracking-widest text-white">Scaduto</span>
                </div>
              )}
              {bonus.status === "ottenuto" && (
                <div className="flex items-center gap-2 bg-purple-500 px-4 py-2 rounded-full shadow-lg border-2 border-purple-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-black uppercase tracking-widest text-white">Ottenuto</span>
                </div>
              )}
              {bonus.valoreEsimato ? (
                <div className="flex flex-col items-center animate-in zoom-in duration-700">
                  <span className="text-blue-100/80 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Valore del Bonus</span>
                  <span className="text-4xl md:text-5xl font-black tracking-tighter drop-shadow-xl">
                    {bonus.valoreEsimato.toLocaleString("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })}
                  </span>
                </div>
              ) : (
                <span className="text-2xl md:text-3xl font-black text-white/50 tracking-tighter">Importo Variabile</span>
              )}
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black leading-tight mb-3 tracking-tight">{bonus.titolo}</h2>
            <p className="text-blue-100 text-base max-w-2xl font-medium leading-relaxed mb-5">{bonus.descrizione}</p>

            {/* Action Buttons */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-3">
                <button onClick={async () => { if (!isPremium) onUpgrade?.(); else await toggleSaveBonus(bonus.id); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${isSaved ? "bg-white text-blue-600 shadow-lg" : "bg-white/10 text-white hover:bg-white/20 border border-white/20"}`}>
                  <Icon d={Icons.bookmark} className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Salvato" : "Salva"}
                </button>
                <button onClick={() => { if (!isPremium) onUpgrade?.(); else setIsFollowed(!isFollowed); }}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${isFollowed ? "bg-indigo-500 text-white shadow-lg border border-indigo-400" : "bg-white/10 text-white hover:bg-white/20 border border-white/20"}`}>
                  <Icon d={Icons.bell} className={`h-4 w-4 ${isFollowed ? "fill-current" : ""}`} />
                  {isFollowed ? "Seguito" : "Segui"}
                </button>
              </div>
              {isPremium && matchInfo?.eligible && (
                <div className="bg-yellow-400 text-yellow-900 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-md flex items-center gap-1.5 animate-bounce">
                  <Icon d={Icons.lightning} className="h-4 w-4" fill />
                  Alta Probabilità di Ottenimento
                </div>
              )}
              {/* Social Share */}
              <ShareButtons
                title={bonus.titolo}
                description={bonus.descrizione}
                url={`https://bonusmatch.it/bonus/${bonus.titolo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')}/`}
                compact
                className="mt-2"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-10 space-y-10">
            {/* Match Result */}
            {matchInfo && (
              <div className={`border rounded-2xl p-5 flex items-center gap-4 animate-in slide-in-from-left duration-500 ${matchInfo.eligible ? "bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/40" : "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-800/40"}`}>
                <div className={`p-3 rounded-xl shrink-0 ${matchInfo.eligible ? "bg-green-100 dark:bg-green-800/30 text-green-700 dark:text-green-400" : "bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-400"}`}>
                  <Icon d={matchInfo.eligible ? Icons.check : Icons.warning} className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-lg font-bold mb-0.5 ${matchInfo.eligible ? "text-green-800 dark:text-green-300" : "text-red-800 dark:text-red-300"}`}>
                    {matchInfo.eligible ? "Sei idoneo!" : "Non sembri idoneo"}
                  </p>
                  <p className={`text-sm italic ${matchInfo.eligible ? "text-slate-600 dark:text-green-400/80" : "text-slate-600 dark:text-red-400/80"}`}>"{matchInfo.reason}"</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Left Column */}
              <div className="space-y-8">
                {/* Requisiti */}
                <section>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5">
                    <div className="h-0.5 w-8 bg-blue-500" /> Requisiti di Accesso
                  </h4>
                  <ul className="space-y-2.5">
                    {bonus.requisiti.map((r, i) => (
                      <li key={i} className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 text-sm font-medium">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />{r}
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Documenti (Premium) */}
                <PremiumLock isPremium={isPremium} onUpgrade={onUpgrade} label="Sblocca Lista">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5">
                    <div className="h-0.5 w-8 bg-blue-500" /> Documenti Necessari
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {bonus.documenti.map((d, i) => (
                      <span key={i} className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">{d}</span>
                    ))}
                    {!isPremium && <>
                      <span className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">Modulo A1</span>
                      <span className="bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/50">Ricevuta</span>
                    </>}
                  </div>
                </PremiumLock>
              </div>

              {/* Right Column */}
              <div className="space-y-8">
                {/* Tempistiche */}
                <section className="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50 text-center flex flex-col items-center">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Tempistiche Previste</h4>
                  <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-xl text-amber-600 dark:text-amber-400 mb-3 transform rotate-12 inline-block">
                    <Icon d={Icons.clock} className="h-6 w-6" />
                  </div>
                  <span className="text-xl font-black text-slate-800 dark:text-slate-200 tracking-tight">{bonus.tempistica}</span>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Tempo medio di risposta</p>
                </section>

                {/* Come Funziona (Premium) */}
                <PremiumLock isPremium={isPremium} onUpgrade={onUpgrade} label="Contenuto Premium" className="bg-blue-50/30 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/20">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Come Funziona</h4>
                  <div className="space-y-4">
                    {bonus.procedura.map((step, i) => (
                      <div key={i} className="flex gap-2.5">
                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">{i + 1}</div>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-400 leading-snug">{step}</p>
                      </div>
                    ))}
                  </div>
                </PremiumLock>

                {/* CTA */}
                <section>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Azione Necessaria</h4>
                  {bonus.status === "attivo" ? (
                    <a href={bonus.linkPortale} target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2.5 bg-[#FF8235] hover:bg-[#ff924a] text-white px-6 py-3.5 rounded-xl font-bold text-base shadow-lg shadow-orange-500/20 hover:shadow-orange-500/50 transition-all transform hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] group/apply">
                      Fai Domanda Ora
                      <Icon d={Icons.external} className="h-4 w-4 transition-transform group-hover/apply:translate-x-1" />
                    </a>
                  ) : bonus.status === "in arrivo" ? (
                    <div className="w-full">
                      <input type="email" autoComplete="email" placeholder="Inserisci la tua email" className="w-full px-6 py-2.5 mb-2 rounded-xl bg-slate-100 dark:bg-slate-800 border-none outline-none font-bold text-center text-sm" />
                      <button className="w-full py-2.5 bg-[#FF8235] hover:bg-[#ff924a] text-white rounded-xl font-bold text-sm shadow-lg uppercase tracking-widest">Rimani aggiornato</button>
                    </div>
                  ) : null}
                </section>
              </div>
            </div>

            {/* Video Tutorial (Premium) */}
            <section className="pt-10 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-5 text-center">
                {isPremium ? "Video Tutorial di Supporto" : "Video Tutorial (Premium)"}
              </h4>
              <div className={`aspect-video w-full max-w-2xl mx-auto bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-hidden relative group border-2 border-white dark:border-slate-800 shadow-xl ${!isPremium ? "cursor-pointer" : ""}`} onClick={!isPremium ? onUpgrade : undefined}>
                <img src={`https://picsum.photos/seed/${bonus.id}vid/1200/675`} className={`absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000 ${!isPremium ? "blur-lg opacity-40" : "opacity-60 dark:opacity-40"}`} alt="Video preview" />
                <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-slate-900/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  {!isPremium ? (
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-2xl transform group-hover:scale-105 transition-transform flex flex-col items-center">
                      <Icon d={Icons.lock} className="h-8 w-8 text-yellow-400 mb-2" fill />
                      <span className="text-xs font-black uppercase tracking-widest">Sblocca Video Guida</span>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-full shadow-xl transform group-hover:scale-125 transition-transform duration-500">
                      <Icon d={Icons.play} className="h-8 w-8 text-blue-600 dark:text-blue-400" fill />
                    </div>
                  )}
                </div>
                {isPremium && (
                  <div className="absolute bottom-5 left-5 flex items-center gap-2">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-md">3:42 Minuti</span>
                    <span className="bg-blue-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-md">Guida Passo-Passo</span>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Similar Bonuses */}
        {similarBonuses.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="flex flex-col items-center mb-6">
              <div className="h-1 w-16 bg-blue-100 dark:bg-blue-900/50 rounded-full mb-3" />
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 tracking-tight text-center">Potrebbe interessarti anche</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {similarBonuses.map(({ bonus: b, result }) => (
                <BonusCard key={b.id} bonus={b} onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); onSelectBonus(b.id); }} matchReason={result?.eligible ? result.reason : undefined} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BonusDetailView;
