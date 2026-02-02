import React from 'react';
import { motion } from 'framer-motion';

interface UsageLimitBannerProps {
  remaining: number;
  limit: number;
  feature: string;
  onUpgrade: () => void;
}

const UsageLimitBanner: React.FC<UsageLimitBannerProps> = ({
  remaining,
  limit,
  feature,
  onUpgrade,
}) => {
  const percentage = (remaining / limit) * 100;
  const isLow = remaining <= 1;
  const isEmpty = remaining === 0;

  if (isEmpty) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-4 rounded-2xl shadow-lg mb-4"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-bold text-sm">Limite giornaliero raggiunto</p>
              <p className="text-xs opacity-80">
                Hai usato tutte le {limit} {feature} gratuite di oggi
              </p>
            </div>
          </div>
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-white text-red-600 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg hover:bg-red-50 transition-colors shrink-0"
          >
            Sblocca
          </button>
        </div>
      </motion.div>
    );
  }

  if (isLow) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 p-3 rounded-xl shadow-md mb-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-bold">
              Solo {remaining} {feature} rimanenti oggi
            </span>
          </div>
          <button
            onClick={onUpgrade}
            className="text-xs font-black underline hover:no-underline"
          >
            Passa a Premium →
          </button>
        </div>
      </motion.div>
    );
  }

  // Mostra barra progresso discreta
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
        <span className="font-medium">{remaining}/{limit} {feature} disponibili</span>
        {!isEmpty && (
          <button onClick={onUpgrade} className="text-blue-500 font-bold hover:underline">
            Illimitate con Premium
          </button>
        )}
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full rounded-full transition-colors ${
            isLow ? 'bg-yellow-400' : 'bg-blue-500'
          }`}
        />
      </div>
    </div>
  );
};

export default UsageLimitBanner;
