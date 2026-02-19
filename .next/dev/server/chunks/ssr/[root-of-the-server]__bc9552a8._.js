module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/lib/supabaseClient.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-ssr] (ecmascript) <locals>");
const __TURBOPACK__import$2e$meta__ = {
    get url () {
        return `file://${__turbopack_context__.P("lib/supabaseClient.ts")}`;
    }
};
;
// Supporto per Vite e Next.js
const supabaseUrl = typeof process !== 'undefined' && ("TURBOPACK compile-time value", "https://kzrffhhmaeivbldgwgyi.supabase.co") || ("TURBOPACK compile-time value", "object") !== 'undefined' && __TURBOPACK__import$2e$meta__.env?.VITE_SUPABASE_URL || "https://kzrffhhmaeivbldgwgyi.supabase.co";
const supabaseAnonKey = typeof process !== 'undefined' && ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6cmZmaGhtYWVpdmJsZGd3Z3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3MTM5MDEsImV4cCI6MjA4NDI4OTkwMX0.U23_H_VGgmjAFPKMVFkBaOjr5OEhPHf379DFHnstDJg") || ("TURBOPACK compile-time value", "object") !== 'undefined' && __TURBOPACK__import$2e$meta__.env?.VITE_SUPABASE_ANON_KEY || "sb_publishable_Gr62Kd5_qHeLlYjdbUEF8g_tqxtJwed";
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey);
}),
"[project]/utils/features.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FREE_LIMITS",
    ()=>FREE_LIMITS,
    "Feature",
    ()=>Feature,
    "canUseFeature",
    ()=>canUseFeature,
    "getAIChatLimit",
    ()=>getAIChatLimit,
    "getRemainingUsage",
    ()=>getRemainingUsage,
    "getSavedBonusLimit",
    ()=>getSavedBonusLimit,
    "getSearchResultLimit",
    ()=>getSearchResultLimit,
    "getUsage",
    ()=>getUsage,
    "getVisibleBonusLimit",
    ()=>getVisibleBonusLimit,
    "hasFeature",
    ()=>hasFeature,
    "incrementUsage",
    ()=>incrementUsage
]);
var Feature = /*#__PURE__*/ function(Feature) {
    Feature["UNLIMITED_BONUSES"] = "unlimited_bonuses";
    Feature["FULL_GUIDE"] = "full_guide";
    Feature["CALENDAR"] = "calendar";
    Feature["DOCUMENTS"] = "documents";
    Feature["FAMILY_MODE"] = "family_mode";
    Feature["ADVANCED_FILTERS"] = "advanced_filters";
    Feature["UNLIMITED_SEARCH_RESULTS"] = "unlimited_search_results";
    Feature["PRO_SORTING"] = "pro_sorting";
    Feature["UNLIMITED_AI_CHAT"] = "unlimited_ai_chat";
    Feature["EXPORT_PDF"] = "export_pdf";
    Feature["NOTIFICATIONS"] = "notifications";
    Feature["UNLIMITED_SAVED_BONUSES"] = "unlimited_saved_bonuses";
    return Feature;
}({});
/** Feature disponibili agli utenti Free (nessuna per ora) */ const FREE_FEATURES = new Set([]);
const FREE_LIMITS = {
    maxBonusesVisible: 3,
    maxSearchResults: 5,
    maxAIChatPerDay: 3,
    maxSavedBonuses: 5
};
const USAGE_PREFIX = 'usage_';
const today = ()=>new Date().toISOString().split('T')[0];
const getUsage = (feature)=>{
    try {
        const stored = localStorage.getItem(`${USAGE_PREFIX}${feature}`);
        if (stored) {
            const record = JSON.parse(stored);
            if (record.date === today()) return record;
        }
    } catch  {}
    return {
        count: 0,
        date: today()
    };
};
const incrementUsage = (feature)=>{
    const newRecord = {
        count: getUsage(feature).count + 1,
        date: today()
    };
    try {
        localStorage.setItem(`${USAGE_PREFIX}${feature}`, JSON.stringify(newRecord));
    } catch  {}
    return newRecord.count;
};
const getRemainingUsage = (feature, limit)=>Math.max(0, limit - getUsage(feature).count);
const canUseFeature = (feature, limit)=>getRemainingUsage(feature, limit) > 0;
const hasFeature = (user, feature)=>{
    if (!user) return false;
    if (user.isPremium) return true;
    return FREE_FEATURES.has(feature);
};
const getVisibleBonusLimit = (isPremium)=>isPremium ? Infinity : FREE_LIMITS.maxBonusesVisible;
const getSearchResultLimit = (isPremium)=>isPremium ? Infinity : FREE_LIMITS.maxSearchResults;
const getAIChatLimit = (isPremium)=>isPremium ? Infinity : FREE_LIMITS.maxAIChatPerDay;
const getSavedBonusLimit = (isPremium)=>isPremium ? Infinity : FREE_LIMITS.maxSavedBonuses;
}),
"[project]/context/AuthContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabaseClient.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$features$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/utils/features.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(null);
const AuthProvider = ({ children })=>{
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [savedBonusIds, setSavedBonusIds] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    // --- 1. FUNZIONE RECUPERO PROFILO (Ottimizzata) ---
    const fetchUserProfile = async (userId, email)=>{
        // Prima controlla se c'è una cache locale valida
        const cachedProfile = localStorage.getItem(`user_profile_${userId}`);
        let cachedUser = null;
        if (cachedProfile) {
            try {
                cachedUser = JSON.parse(cachedProfile);
            } catch  {
            // Cache corrotta, ignora
            }
        }
        // Dati base di fallback (usa cache se disponibile per isPremium)
        const baseUser = {
            id: userId,
            email: email,
            firstName: cachedUser?.firstName || email.split("@")[0],
            lastName: cachedUser?.lastName || "Utente",
            createdAt: cachedUser?.createdAt || new Date().toISOString(),
            isPremium: cachedUser?.isPremium || false,
            profile: cachedUser?.profile
        };
        try {
            // Timeout di 8 secondi per evitare blocchi infiniti
            const timeoutPromise = new Promise((_, reject)=>setTimeout(()=>reject(new Error("Timeout")), 8000));
            const fetchPromise = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("profiles").select("*").eq("id", userId).single();
            const result = await Promise.race([
                fetchPromise,
                timeoutPromise
            ]);
            if (!result || 'error' in result === false) {
                return baseUser;
            }
            const { data, error } = result;
            // Se il profilo non esiste (comune subito dopo il signup), restituiamo dati base
            if (error || !data) {
                return baseUser;
            }
            // Mappatura dati DB -> Stato React
            const profile = {
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
                speseSostenute: data.spese || ""
            };
            return {
                id: userId,
                email: email,
                firstName: data.nome || email.split("@")[0],
                lastName: data.cognome || "Utente",
                createdAt: data.creato_il || new Date().toISOString(),
                isPremium: data.is_premium || data.tipo_utente === "premium",
                profile: data.condizione ? profile : undefined
            };
        } catch (err) {
            // In caso di timeout/errore, usa la cache se disponibile (mantiene isPremium!)
            if (cachedUser) {
                return cachedUser;
            }
            return baseUser;
        }
    };
    const fetchSavedBonuses = async (userId)=>{
        try {
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("saved_bonuses").select("bonus_id").eq("user_id", userId);
            if (data) setSavedBonusIds(data.map((item)=>item.bonus_id));
        } catch (e) {
        // silently fail
        }
    };
    // --- 2. GESTIONE SESSIONE ---
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Flag per evitare race conditions
        let isMounted = true;
        const initializeAuth = async ()=>{
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
                        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then(({ data: { session }, error })=>{
                            if (error || !session) {
                                // Sessione non valida, pulisci tutto
                                localStorage.removeItem('cached_user_id');
                                localStorage.removeItem(`user_profile_${cachedUserId}`);
                                if (isMounted) {
                                    setUser(null);
                                }
                            } else {
                                // Sessione valida, aggiorna profilo in background
                                fetchUserProfile(session.user.id, session.user.email).then((fullUser)=>{
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
                    } catch  {
                        // Cache corrotta, continua con il flusso normale
                        localStorage.removeItem('cached_user_id');
                        localStorage.removeItem(`user_profile_${cachedUserId}`);
                    }
                }
            }
            // STEP 2: Nessuna cache valida, usa Supabase
            try {
                const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                if (error) {
                    if (isMounted) {
                        setUser(null);
                        setIsLoading(false);
                    }
                    return;
                }
                if (session?.user && isMounted) {
                    const fullUser = await fetchUserProfile(session.user.id, session.user.email);
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
        const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange(async (event, session)=>{
            // Ignora l'evento INITIAL_SESSION perché già gestito da getSession
            if (event === 'INITIAL_SESSION') {
                return;
            }
            if (session?.user && isMounted) {
                const fullUser = await fetchUserProfile(session.user.id, session.user.email);
                if (isMounted) {
                    setUser(fullUser);
                    fetchSavedBonuses(session.user.id);
                }
            } else if (isMounted) {
                setUser(null);
                setSavedBonusIds([]);
            }
        });
        return ()=>{
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);
    // --- 3. AZIONI AUTH ---
    const login = async (email, password)=>{
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
            email: email.trim(),
            password: password.trim()
        });
        if (error) return {
            success: false,
            error: error.message
        };
        // Imposta l'utente immediatamente dopo il login riuscito
        if (data.user) {
            const fullUser = await fetchUserProfile(data.user.id, data.user.email);
            setUser(fullUser);
            // Salva in cache
            localStorage.setItem('cached_user_id', data.user.id);
            localStorage.setItem(`user_profile_${data.user.id}`, JSON.stringify(fullUser));
            fetchSavedBonuses(data.user.id);
        }
        return {
            success: true
        };
    };
    const register = async (email, password)=>{
        const cleanEmail = email.trim().toLowerCase();
        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
            email: cleanEmail,
            password: password
        });
        if (error) return {
            success: false,
            error: error.message
        };
        // Se la registrazione ha successo, impostiamo un utente base per attivare l'onboarding
        if (data.user) {
            setUser({
                id: data.user.id,
                email: cleanEmail,
                firstName: cleanEmail.split("@")[0],
                lastName: "Utente",
                createdAt: new Date().toISOString(),
                isPremium: false
            });
            return {
                success: true,
                data
            };
        }
        return {
            success: false,
            error: "Registrazione completata, effettua il login."
        };
    };
    const logout = async ()=>{
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
        __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut().catch(()=>{
        // Ignora errori di signOut, l'utente è già disconnesso localmente
        });
    };
    const toggleSaveBonus = async (bonusId)=>{
        if (!user) return;
        const isSaved = savedBonusIds.includes(bonusId);
        // Controlla limite per utenti free quando salva (non quando rimuove)
        if (!isSaved && !user.isPremium && savedBonusIds.length >= __TURBOPACK__imported__module__$5b$project$5d2f$utils$2f$features$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["FREE_LIMITS"].maxSavedBonuses) {
            // Limite raggiunto per utenti free
            console.warn('Limite bonus salvati raggiunto per utenti free');
            return;
        }
        setSavedBonusIds((prev)=>isSaved ? prev.filter((id)=>id !== bonusId) : [
                ...prev,
                bonusId
            ]);
        if (isSaved) {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("saved_bonuses").delete().eq("user_id", user.id).eq("bonus_id", bonusId);
        } else {
            await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("saved_bonuses").insert({
                user_id: user.id,
                bonus_id: bonusId
            });
        }
    };
    const updateUser = (data)=>{
        setUser((prev)=>{
            if (!prev) return null;
            const updated = {
                ...prev,
                ...data
            };
            // Salva nella cache locale per caricamenti futuri veloci
            localStorage.setItem(`user_profile_${prev.id}`, JSON.stringify(updated));
            return updated;
        });
    };
    const resetPassword = async (email)=>{
        const cleanEmail = email.trim().toLowerCase();
        const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabaseClient$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: window.location.origin + "/reset-password"
        });
        if (error) return {
            success: false,
            error: error.message
        };
        return {
            success: true
        };
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            isLoading,
            isAuthenticated: !!user,
            login,
            register,
            logout,
            updateUser,
            savedBonusIds,
            toggleSaveBonus,
            resetPassword
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/context/AuthContext.tsx",
        lineNumber: 390,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
const useAuth = ()=>{
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
};
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/dynamic-access-async-storage.external.js [external] (next/dist/server/app-render/dynamic-access-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/dynamic-access-async-storage.external.js", () => require("next/dist/server/app-render/dynamic-access-async-storage.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__bc9552a8._.js.map