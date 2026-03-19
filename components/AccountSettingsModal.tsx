import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

interface SubscriptionInfo {
  id: string;
  status: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
  priceAmount?: number;
  currency?: string;
  interval?: string;
  canceled?: boolean;
}

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AccountSettingsModal: React.FC<AccountSettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  
  // Stati locali per il form
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Stati per gestione abbonamento
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription'>('profile');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [subscriptionAction, setSubscriptionAction] = useState(false);

  // Helper per formattare date in modo sicuro
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Data non disponibile';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data non disponibile';
      return date.toLocaleDateString('it-IT', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return 'Data non disponibile';
    }
  };

  // Helper per calcolare percentuale countdown
  const getCountdownPercentage = (dateString: string | null | undefined): number => {
    if (!dateString) return 0;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 0;
      return Math.max(0, Math.min(100, 
        (date.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000) * 100
      ));
    } catch {
      return 0;
    }
  };

  // Carica info abbonamento quando si apre la tab
  useEffect(() => {
    if (isOpen && activeTab === 'subscription' && user?.email) {
      loadSubscription();
    }
  }, [isOpen, activeTab, user?.email]);

  // Helper per ottenere il token JWT
  const getAuthToken = async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch {
      return null;
    }
  };

  const loadSubscription = async () => {
    setLoadingSubscription(true);
    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('Token di autenticazione non disponibile');
        return;
      }
      const response = await fetch('/.netlify/functions/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'get-subscription', email: user?.email }),
      });
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Errore caricamento abbonamento:', err);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!subscription?.id) return;
    
    setSubscriptionAction(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const response = await fetch('/.netlify/functions/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'cancel-subscription', subscriptionId: subscription.id, email: user?.email }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        loadSubscription();
      } else {
        setMessage({ type: 'error', text: data.error || 'Errore' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Errore durante la cancellazione' });
    } finally {
      setSubscriptionAction(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!subscription?.id) return;
    
    setSubscriptionAction(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const response = await fetch('/.netlify/functions/manage-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ action: 'reactivate-subscription', subscriptionId: subscription.id, email: user?.email }),
      });
      const data = await response.json();
      if (data.success) {
        setMessage({ type: 'success', text: data.message });
        loadSubscription();
      } else {
        setMessage({ type: 'error', text: data.error || 'Errore' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Errore durante la riattivazione' });
    } finally {
      setSubscriptionAction(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    // Validazione Password
    if (password && password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Le password non coincidono.' });
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Aggiornamento dati su Supabase Auth (Email e/o Password)
      const authUpdates: any = {};
      if (email !== user?.email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

      // 2. Aggiornamento tabella 'profiles' (Nome e Cognome)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          nome: firstName, 
          cognome: lastName 
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      // 3. Aggiornamento stato globale nel contesto
      updateUser({ 
        firstName, 
        lastName, 
        email 
      });

      setMessage({ type: 'success', text: 'Profilo aggiornato con successo!' });
      
      // Reset campi password
      setPassword('');
      setConfirmPassword('');
      
      // Chiusura automatica dopo successo
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Errore durante l\'aggiornamento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-slate-800"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">Impostazioni Account</h2>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">Gestisci il tuo account</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${
              activeTab === 'profile' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-600'
            }`}
          >
            👤 Profilo
          </button>
          {user?.isPremium && (
            <button
              onClick={() => setActiveTab('subscription')}
              className={`flex-1 py-4 text-sm font-bold uppercase tracking-widest transition-all ${
                activeTab === 'subscription' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-600'
              }`}
            >
              💳 Abbonamento
            </button>
          )}
        </div>

        {activeTab === 'profile' ? (
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {message && (
            <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-600 border border-green-100' 
                : 'bg-red-50 text-red-600 border border-red-100'
            }`}>
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Nome</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Cognome</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all"
              required
            />
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cambia Password</h3>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium italic">Lascia vuoto per non modificare</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-500 rounded-2xl outline-none text-slate-800 dark:text-white font-bold transition-all"
                placeholder="Nuova password"
                minLength={6}
              />
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl focus:border-blue-500 outline-none text-slate-800 dark:text-white font-bold transition-all ${
                  password && confirmPassword && password !== confirmPassword 
                    ? 'border-red-400' 
                    : 'border-transparent'
                }`}
                placeholder="Conferma password"
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Salvataggio...' : 'Salva Modifiche'}
            </button>
          </div>
        </form>
        ) : (
          /* TAB ABBONAMENTO */
          <div className="p-8 space-y-6">
            {message && (
              <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top-2 ${
                message.type === 'success' 
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800'
              }`}>
                {message.type === 'success' ? '✅' : '❌'} {message.text}
              </div>
            )}

            {loadingSubscription ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              </div>
            ) : subscription ? (
              <div className="space-y-6">
                {/* Banner Annullamento */}
                {subscription.cancelAtPeriodEnd && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-[2px]"
                  >
                    <div className="relative bg-white dark:bg-slate-900 rounded-[22px] p-5">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 h-14 w-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-black text-lg text-slate-800 dark:text-white mb-1">
                            Abbonamento in scadenza
                          </h4>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Il rinnovo automatico è stato disattivato. Perderai l'accesso alle funzionalità Premium il{' '}
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                              {formatDate(subscription.currentPeriodEnd)}
                            </span>
                          </p>
                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Puoi riattivare in qualsiasi momento prima della scadenza
                          </div>
                        </div>
                      </div>
                      {/* Countdown bar */}
                      <div className="mt-4 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: '100%' }}
                          className="h-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 rounded-full"
                          style={{ width: `${getCountdownPercentage(subscription.currentPeriodEnd)}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Status Card */}
                <div className={`p-6 rounded-3xl border-2 ${
                  subscription.cancelAtPeriodEnd 
                    ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700' 
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                        subscription.cancelAtPeriodEnd 
                          ? 'bg-slate-400' 
                          : 'bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg shadow-green-500/30'
                      }`}>
                        {subscription.cancelAtPeriodEnd ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-slate-800 dark:text-white">
                          Piano Premium
                        </h3>
                        <p className={`text-sm font-bold ${
                          subscription.cancelAtPeriodEnd 
                            ? 'text-slate-500' 
                            : 'text-green-600 dark:text-green-400'
                        }`}>
                          {subscription.cancelAtPeriodEnd 
                            ? '⏳ In scadenza' 
                            : '✓ Attivo'}
                        </p>
                      </div>
                    </div>
                    {subscription.priceAmount && (
                      <div className="text-right">
                        <p className={`text-2xl font-black ${
                          subscription.cancelAtPeriodEnd 
                            ? 'text-slate-400 line-through' 
                            : 'text-slate-800 dark:text-white'
                        }`}>
                          €{subscription.priceAmount}
                        </p>
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                          /{subscription.interval === 'year' ? 'anno' : 'mese'}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {!subscription.cancelAtPeriodEnd && (
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        <span className="font-bold">Prossimo rinnovo:</span>{' '}
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="pt-4">
                  {subscription.cancelAtPeriodEnd ? (
                    <button
                      onClick={handleReactivateSubscription}
                      disabled={subscriptionAction}
                      className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-green-500/20 transition-all disabled:opacity-50"
                    >
                      {subscriptionAction ? 'Riattivazione...' : '🔄 Riattiva Rinnovo Automatico'}
                    </button>
                  ) : (
                    <button
                      onClick={handleCancelSubscription}
                      disabled={subscriptionAction}
                      className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 font-bold text-sm transition-all disabled:opacity-50 border-2 border-transparent hover:border-red-200 dark:hover:border-red-800"
                    >
                      {subscriptionAction ? 'Elaborazione...' : 'Disattiva Rinnovo Automatico'}
                    </button>
                  )}
                </div>

                <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                  {subscription.cancelAtPeriodEnd 
                    ? 'Puoi riattivare il rinnovo in qualsiasi momento prima della scadenza.'
                    : 'L\'abbonamento rimarrà attivo fino alla fine del periodo corrente.'}
                </p>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <p className="text-slate-600 dark:text-slate-300 font-bold">Nessun abbonamento attivo trovato</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Se hai appena effettuato il pagamento, riprova tra qualche minuto.
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AccountSettingsModal;