import React from 'react';
import { motion } from 'framer-motion';

interface PremiumGateProps {
  isPremium: boolean;
  onUpgrade: () => void;
  feature: string;
  description?: string;
  children: React.ReactNode;
  // Modalità di visualizzazione: 
  // 'blur' = mostra contenuto sfocato con overlay
  // 'block' = nasconde completamente e mostra card upsell
  // 'limit' = mostra contenuto parziale con messaggio
  mode?: 'blur' | 'block' | 'limit';
  // Per modalità 'limit': quanti elementi mostrare
  visibleCount?: number;
  totalCount?: number;
}

const PremiumGate: React.FC<PremiumGateProps> = ({
  isPremium,
  onUpgrade,
  feature,
  description,
  children,
  mode = 'block',
  visibleCount,
  totalCount,
}) => {
  // Se utente Premium, mostra tutto
  if (isPremium) {
    return <>{children}</>;
  }

  // Modalità BLUR: mostra contenuto sfocato con overlay
  if (mode === 'blur') {
    return (
      <div className="relative">
        <div className="blur-sm pointer-events-none select-none">
          {children}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/80 to-transparent dark:from-slate-900/95 dark:via-slate-900/80 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-200 dark:border-slate-700 max-w-sm text-center"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
              {feature}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {description || 'Questa funzionalità è riservata agli utenti Premium.'}
            </p>
            <button
              onClick={onUpgrade}
              className="w-full py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              Sblocca Premium
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Modalità LIMIT: mostra messaggio di limite raggiunto
  if (mode === 'limit' && visibleCount !== undefined && totalCount !== undefined) {
    const remainingCount = totalCount - visibleCount;
    
    return (
      <>
        {children}
        {remainingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onUpgrade}
            className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 rounded-[2rem] p-8 text-white text-center border-2 border-dashed border-slate-600 cursor-pointer hover:border-yellow-500 transition-all group"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-2xl font-black mb-2">
              +{remainingCount} {feature}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {description || 'Passa a Premium per sbloccare tutti i contenuti.'}
            </p>
            <button className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg">
              Sblocca Ora
            </button>
          </motion.div>
        )}
      </>
    );
  }

  // Modalità BLOCK: card di upsell al posto del contenuto
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-[2.5rem] p-12 text-center border border-slate-200 dark:border-slate-700 shadow-xl"
    >
      <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-3">
        {feature}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8 text-lg">
        {description || 'Questa funzionalità esclusiva è riservata agli utenti Premium.'}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
        <button
          onClick={onUpgrade}
          className="px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black rounded-2xl shadow-xl hover:shadow-2xl transition-all text-sm uppercase tracking-widest"
        >
          Passa a Premium
        </button>
        <span className="text-sm text-slate-400 font-bold">
          Solo 24,99€/anno
        </span>
      </div>

      {/* Feature highlights */}
      <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
          Cosa ottieni con Premium
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Bonus Illimitati', 'Guide Complete', 'Calendario', 'AI Chat Illimitata', 'Export PDF'].map((item) => (
            <span key={item} className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              ✓ {item}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumGate;
