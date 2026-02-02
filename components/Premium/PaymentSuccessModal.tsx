import React from 'react';

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-white/20 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Confetti/Celebrazione background */}
        <div className="absolute top-0 left-0 right-0 h-28 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 opacity-20 pointer-events-none" />
        
        <div className="relative p-5 pt-8 text-center">
          
          {/* Success Icon */}
          <div className="mx-auto h-16 w-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full shadow-xl shadow-green-500/40 flex items-center justify-center mb-5 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            🎉 Benvenuto in Premium!
          </h2>
          
          <p className="text-slate-600 dark:text-slate-400 mb-5 text-sm">
            Il tuo pagamento è stato completato con successo. Ora hai accesso a tutte le funzionalità esclusive!
          </p>

          {/* Features unlocked */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 mb-5 border border-green-200 dark:border-green-800">
            <p className="text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest mb-2.5">
              Funzionalità Sbloccate
            </p>
            <div className="space-y-1.5">
              {[
                '✅ Accesso illimitato a tutti i bonus',
                '✅ Guide passo-passo dettagliate',
                '✅ Notifiche nuovi bonus in anteprima',
                '✅ Analisi ISEE avanzata',
                '✅ Supporto prioritario'
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg shadow-green-500/30 transition-all duration-300"
          >
            Inizia ad Esplorare
          </button>

          <p className="mt-3 text-[10px] text-slate-400 dark:text-slate-500">
            Riceverai una email di conferma a breve.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
