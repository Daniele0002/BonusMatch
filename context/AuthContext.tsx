'use client';

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, UserProfile } from "../types";
import { supabase } from "../lib/supabaseClient";
import { FREE_LIMITS } from "../utils/features";

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; data?: any }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  savedBonusIds: string[];
  toggleSaveBonus: (bonusId: string) => Promise<void>;
  resetPassword: (
    email: string,
  ) => Promise<{ success: boolean; error?: string }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savedBonusIds, setSavedBonusIds] = useState<string[]>([]);

  // --- 1. FUNZIONE RECUPERO PROFILO (Ottimizzata) ---
  const fetchUserProfile = async (userId: string, email: string): Promise<User> => {
    // Prima controlla se c'è una cache locale valida
    const cachedProfile = localStorage.getItem(`user_profile_${userId}`);
    let cachedUser: User | null = null;
    
    if (cachedProfile) {
      try {
        cachedUser = JSON.parse(cachedProfile);
      } catch {
        // Cache corrotta, ignora
      }
    }

    // Dati base di fallback (usa cache se disponibile per isPremium)
    const baseUser: User = {
      id: userId,
      email: email,
      firstName: cachedUser?.firstName || email.split("@")[0],
      lastName: cachedUser?.lastName || "Utente",
      createdAt: cachedUser?.createdAt || new Date().toISOString(),
      isPremium: cachedUser?.isPremium || false, // Mantiene premium dalla cache!
      profile: cachedUser?.profile,
    };

    try {
      // Timeout di 8 secondi per evitare blocchi infiniti
      const timeoutPromise = new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 8000)
      );

      const fetchPromise = supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      const result = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!result || 'error' in result === false) {
        return baseUser;
      }

      const { data, error } = result;

      // Se il profilo non esiste (comune subito dopo il signup), restituiamo dati base
      if (error || !data) {
        return baseUser;
      }

      // Mappatura dati DB -> Stato React
      const profile: UserProfile = {
        email: data.email || email,
        nome: data.nome || "",
        cognome: data.cognome || "",
        password: data.password || "",
        eta: data.eta || 0,
        residenza: data.residenza || "",
        regione: data.regione || "",
        componentiNucleo: data.componenti_nucleo || 1,
        isee: data.isee || 0,
        condizione: data.condizione || "",
        tipoStudente: data.tipo_studente || "",
        tipoContratto: data.tipo_contratto || "",
        abitazione: data.abitazione || "",
        numeroFigli: data.numero_figli || 0,
        fasceEtaFigli: data.fasce_eta_figli || [],
        composizione: data.composizione || "",
        iban: data.iban || "",
        statoCivile: data.stato_civile || "",
        cittadinanza: data.cittadinanza || "Italiana",
        patrimonioImmobiliare: data.patrimonio || 0,
        targaAuto: data.targa || "",
        speseSostenute: data.spese || "",
      };

      return {
        id: userId,
        email: email,
        firstName: data.nome || email.split("@")[0],
        lastName: data.cognome || "Utente",
        createdAt: data.creato_il || new Date().toISOString(),
        isPremium: data.is_premium || data.tipo_utente === "premium",
        profile: data.condizione ? profile : undefined,
      } as User;
    } catch (err) {
      // In caso di timeout/errore, usa la cache se disponibile (mantiene isPremium!)
      if (cachedUser) {
        return cachedUser;
      }
      return baseUser;
    }
  };

  const fetchSavedBonuses = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("saved_bonuses")
        .select("bonus_id")
        .eq("user_id", userId);
      if (data) setSavedBonusIds(data.map((item: any) => item.bonus_id));
    } catch (e) {
      // silently fail
    }
  };

  // --- 2. GESTIONE SESSIONE ---
  useEffect(() => {
    // Flag per evitare race conditions
    let isMounted = true;

    const initializeAuth = async () => {
      // Controlla se torniamo da un pagamento Stripe
      const urlParams = new URLSearchParams(window.location.search);
      const fromStripeSuccess = urlParams.get('payment') === 'success' || urlParams.get('session_id');
      
      // STEP 1: Cerca prima nella cache locale (istantaneo)
      const cachedUserId = localStorage.getItem('cached_user_id');
      if (cachedUserId) {
        const cachedProfile = localStorage.getItem(`user_profile_${cachedUserId}`);
        if (cachedProfile) {
          try {
            const cached = JSON.parse(cachedProfile);
            // Se torniamo da Stripe, forza isPremium = true nella cache
            if (fromStripeSuccess) {
              cached.isPremium = true;
              localStorage.setItem(`user_profile_${cachedUserId}`, JSON.stringify(cached));
            }
            if (isMounted) {
              setUser(cached);
              setIsLoading(false);
            }
            
            // Verifica sessione in background (non blocca l'UI)
            supabase.auth.getSession().then(({ data: { session }, error }) => {
              if (error || !session) {
                // Sessione non valida, pulisci tutto
                localStorage.removeItem('cached_user_id');
                localStorage.removeItem(`user_profile_${cachedUserId}`);
                if (isMounted) {
                  setUser(null);
                }
              } else {
                // Sessione valida, aggiorna profilo in background
                fetchUserProfile(session.user.id, session.user.email!).then((fullUser) => {
                  if (isMounted && fullUser) {
                    // Se torniamo da Stripe, mantieni isPremium = true
                    if (fromStripeSuccess) {
                      fullUser.isPremium = true;
                    }
                    setUser(fullUser);
                    localStorage.setItem(`user_profile_${session.user.id}`, JSON.stringify(fullUser));
                  }
                });
                fetchSavedBonuses(session.user.id);
              }
            });
            return;
          } catch {
            // Cache corrotta, continua con il flusso normale
            localStorage.removeItem('cached_user_id');
            localStorage.removeItem(`user_profile_${cachedUserId}`);
          }
        }
      }

      // STEP 2: Nessuna cache valida, usa Supabase
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (isMounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (session?.user && isMounted) {
          const fullUser = await fetchUserProfile(session.user.id, session.user.email!);
          // Se torniamo da Stripe, forza isPremium = true
          if (fromStripeSuccess) {
            fullUser.isPremium = true;
          }
          if (isMounted) {
            setUser(fullUser);
            // Salva in cache per caricamenti futuri istantanei
            localStorage.setItem('cached_user_id', session.user.id);
            localStorage.setItem(`user_profile_${session.user.id}`, JSON.stringify(fullUser));
            setIsLoading(false);
          }
          fetchSavedBonuses(session.user.id);
        } else if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    // Inizializza l'autenticazione
    initializeAuth();

    // Ascolta i cambiamenti di stato auth (login/logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignora l'evento INITIAL_SESSION perché già gestito da getSession
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (session?.user && isMounted) {
        const fullUser = await fetchUserProfile(
          session.user.id,
          session.user.email!,
        );
        if (isMounted) {
          setUser(fullUser);
          fetchSavedBonuses(session.user.id);
        }
      } else if (isMounted) {
        setUser(null);
        setSavedBonusIds([]);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // --- 3. AZIONI AUTH ---
  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    if (error) return { success: false, error: error.message };
    
    // Imposta l'utente immediatamente dopo il login riuscito
    if (data.user) {
      const fullUser = await fetchUserProfile(data.user.id, data.user.email!);
      setUser(fullUser);
      // Salva in cache
      localStorage.setItem('cached_user_id', data.user.id);
      localStorage.setItem(`user_profile_${data.user.id}`, JSON.stringify(fullUser));
      fetchSavedBonuses(data.user.id);
    }
    
    return { success: true };
  };

  const register = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: password,
    });

    if (error) return { success: false, error: error.message };

    // Se la registrazione ha successo, impostiamo un utente base per attivare l'onboarding
    if (data.user) {
      setUser({
        id: data.user.id,
        email: cleanEmail,
        firstName: cleanEmail.split("@")[0],
        lastName: "Utente",
        createdAt: new Date().toISOString(),
        isPremium: false,
      });
      return { success: true, data };
    }
    return {
      success: false,
      error: "Registrazione completata, effettua il login.",
    };
  };

  const logout = async () => {
    // PRIMA: Resetta lo stato immediatamente (UI istantanea)
    const userId = user?.id;
    setUser(null);
    setSavedBonusIds([]);
    
    // POI: Pulisce cache e fa signOut in background (non blocca l'UI)
    if (userId) {
      localStorage.removeItem(`user_profile_${userId}`);
      localStorage.removeItem('cached_user_id');
    }
    
    // SignOut asincrono in background
    supabase.auth.signOut().catch(() => {
      // Ignora errori di signOut, l'utente è già disconnesso localmente
    });
  };

  const toggleSaveBonus = async (bonusId: string) => {
    if (!user) return;
    const isSaved = savedBonusIds.includes(bonusId);
    
    // Controlla limite per utenti free quando salva (non quando rimuove)
    if (!isSaved && !user.isPremium && savedBonusIds.length >= FREE_LIMITS.maxSavedBonuses) {
      // Limite raggiunto per utenti free
      console.warn('Limite bonus salvati raggiunto per utenti free');
      return;
    }
    
    setSavedBonusIds((prev) =>
      isSaved ? prev.filter((id) => id !== bonusId) : [...prev, bonusId],
    );

    if (isSaved) {
      await supabase
        .from("saved_bonuses")
        .delete()
        .eq("user_id", user.id)
        .eq("bonus_id", bonusId);
    } else {
      await supabase
        .from("saved_bonuses")
        .insert({ user_id: user.id, bonus_id: bonusId });
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      // Salva nella cache locale per caricamenti futuri veloci
      localStorage.setItem(`user_profile_${prev.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const resetPassword = async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: window.location.origin + "/reset-password", // Or navigate to a specific view
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
        savedBonusIds,
        toggleSaveBonus,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
