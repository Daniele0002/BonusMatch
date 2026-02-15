import React, { useState } from 'react';
import { redirectToCheckout } from '../../services/stripeService';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, price }) => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      // Passa l'email dell'utente per associare la subscription
      await redirectToCheckout(user?.email);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Errore durante il pagamento');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" 
        onClick={onClose}
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden border border-white/20 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header decoration */}
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 opacity-10 dark:opacity-20 pointer-events-none" />
        
        <div className="relative p-5 pt-6">
            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>

            <div className="flex flex-col items-center text-center mb-5">
                <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center mb-4 transform -rotate-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight mb-1">
                    Sblocca Premium
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-4">
                    Ottieni accesso immediato a tutti i bonus esclusivi e guide dettagliate.
                </p>

                {/* Feature List */}
                <div className="w-full space-y-2 mb-2 text-left">
                    {[
                        'Accesso illimitato a tutti i bonus',
                        'Guide passo-passo per la richiesta',
                        'Notifiche nuovi bonus in anteprima',
                        'Analisi ISEE avanzata'
                    ].map((feature, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                             <div className="h-4 w-4 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                             </div>
                             <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{feature}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10 transform translate-x-1/2 -translate-y-1/2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                
                <div className="relative">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">
                        Abbonamento Annuale
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {price}
                        </span>
                        <span className="text-xs font-bold text-slate-400 dark:text-slate-500">
                            / anno
                        </span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-100 dark:border-red-900/50 flex items-center gap-2 animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                    <button onClick={() => setError(null)} className="ml-auto hover:text-red-800 dark:hover:text-red-200">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                         </svg>
                    </button>
                </div>
            )}

            {/* BETA: Abbonamenti temporaneamente sospesi */}
            <button
                disabled={true}
                className="group relative w-full py-3 bg-slate-400 dark:bg-slate-600 text-white rounded-xl font-bold text-sm uppercase tracking-widest shadow-lg transition-all duration-300 cursor-not-allowed opacity-70"
            >
                <span className="relative flex items-center justify-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    In Arrivo
                </span>
            </button>
            
            <p className="mt-3 text-[10px] text-center text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Beta - Abbonamenti in arrivo a breve!
            </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
