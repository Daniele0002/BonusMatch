import { User } from '../types';

// ═══════════════════════════════════════════════════════════════════════════════
// FEATURE FLAGS - Gestione Free vs Premium
// ═══════════════════════════════════════════════════════════════════════════════

export enum Feature {
  UNLIMITED_BONUSES = 'unlimited_bonuses',
  FULL_GUIDE = 'full_guide',
  CALENDAR = 'calendar',
  DOCUMENTS = 'documents',
  FAMILY_MODE = 'family_mode',
  ADVANCED_FILTERS = 'advanced_filters',
  UNLIMITED_SEARCH_RESULTS = 'unlimited_search_results',
  PRO_SORTING = 'pro_sorting',
  UNLIMITED_AI_CHAT = 'unlimited_ai_chat',
  EXPORT_PDF = 'export_pdf',
  NOTIFICATIONS = 'notifications',
  UNLIMITED_SAVED_BONUSES = 'unlimited_saved_bonuses',
}

/** Feature disponibili agli utenti Free (nessuna per ora) */
const FREE_FEATURES = new Set<Feature>([]);

// ═══════════════════════════════════════════════════════════════════════════════
// LIMITI PIANO FREE
// ═══════════════════════════════════════════════════════════════════════════════

export const FREE_LIMITS = {
  maxBonusesVisible: 3,
  maxSearchResults: 5,
  maxAIChatPerDay: 3,
  maxSavedBonuses: 5,
} as const;

// ═══════════════════════════════════════════════════════════════════════════════
// TRACKING UTILIZZO (limiti giornalieri)
// ═══════════════════════════════════════════════════════════════════════════════

interface UsageRecord { count: number; date: string; }
const USAGE_PREFIX = 'usage_';
const today = () => new Date().toISOString().split('T')[0];

/** Legge utilizzo corrente, resetta se nuovo giorno */
export const getUsage = (feature: string): UsageRecord => {
  try {
    const stored = localStorage.getItem(`${USAGE_PREFIX}${feature}`);
    if (stored) {
      const record: UsageRecord = JSON.parse(stored);
      if (record.date === today()) return record;
    }
  } catch { /* silent fail */ }
  return { count: 0, date: today() };
};

/** Incrementa utilizzo e restituisce nuovo conteggio */
export const incrementUsage = (feature: string): number => {
  const newRecord = { count: getUsage(feature).count + 1, date: today() };
  try { localStorage.setItem(`${USAGE_PREFIX}${feature}`, JSON.stringify(newRecord)); } catch { /* silent */ }
  return newRecord.count;
};

/** Utilizzi rimanenti */
export const getRemainingUsage = (feature: string, limit: number): number => 
  Math.max(0, limit - getUsage(feature).count);

/** Può ancora usare la feature? */
export const canUseFeature = (feature: string, limit: number): boolean => 
  getRemainingUsage(feature, limit) > 0;

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLO ACCESSO FEATURE
// ═══════════════════════════════════════════════════════════════════════════════

/** Verifica se l'utente ha accesso a una feature */
export const hasFeature = (user: User | null | undefined, feature: Feature): boolean => {
  if (!user) return false;
  if (user.isPremium) return true;
  return FREE_FEATURES.has(feature);
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER LIMITI DINAMICI
// ═══════════════════════════════════════════════════════════════════════════════

export const getVisibleBonusLimit = (isPremium: boolean): number => isPremium ? Infinity : FREE_LIMITS.maxBonusesVisible;
export const getSearchResultLimit = (isPremium: boolean): number => isPremium ? Infinity : FREE_LIMITS.maxSearchResults;
export const getAIChatLimit = (isPremium: boolean): number => isPremium ? Infinity : FREE_LIMITS.maxAIChatPerDay;
export const getSavedBonusLimit = (isPremium: boolean): number => isPremium ? Infinity : FREE_LIMITS.maxSavedBonuses;
