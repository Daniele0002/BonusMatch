
import { User } from '../types';

// ============================================
// FEATURE FLAGS - Gestione Free vs Premium
// ============================================

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

// ============================================
// LIMITI PIANO FREE
// ============================================

export const FREE_LIMITS = {
  maxBonusesVisible: 3,       // Max bonus visibili in dashboard
  maxSearchResults: 5,        // Max risultati ricerca
  maxAIChatPerDay: 3,         // Max messaggi AI chat al giorno
  maxSavedBonuses: 5,         // Max bonus salvati
};

// ============================================
// TRACKING UTILIZZO (per limiti giornalieri)
// ============================================

interface UsageRecord {
  count: number;
  date: string;
}

const USAGE_KEY_PREFIX = 'usage_';

const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const getUsage = (feature: string): UsageRecord => {
  try {
    const key = `${USAGE_KEY_PREFIX}${feature}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const record: UsageRecord = JSON.parse(stored);
      // Reset se è un nuovo giorno
      if (record.date !== getTodayString()) {
        return { count: 0, date: getTodayString() };
      }
      return record;
    }
  } catch {
    // silently fail
  }
  return { count: 0, date: getTodayString() };
};

export const incrementUsage = (feature: string): number => {
  const current = getUsage(feature);
  const newRecord: UsageRecord = {
    count: current.count + 1,
    date: getTodayString(),
  };
  try {
    localStorage.setItem(`${USAGE_KEY_PREFIX}${feature}`, JSON.stringify(newRecord));
  } catch {
    // silently fail
  }
  return newRecord.count;
};

export const getRemainingUsage = (feature: string, limit: number): number => {
  const current = getUsage(feature);
  return Math.max(0, limit - current.count);
};

export const canUseFeature = (feature: string, limit: number): boolean => {
  return getRemainingUsage(feature, limit) > 0;
};

// ============================================
// CONTROLLO ACCESSO FEATURE
// ============================================

export const hasFeature = (user: User | null | undefined, feature: Feature): boolean => {
  // Guest o utente non loggato
  if (!user) return false;
  
  // Premium users have access to everything
  if (user.isPremium) return true;

  // Free tier restrictions
  switch (feature) {
    case Feature.UNLIMITED_BONUSES:
      return false; // Free users get limited dashboard
    case Feature.FULL_GUIDE:
      return false; // Free users don't see full guide
    case Feature.CALENDAR:
      return false; // Calendar is pro
    case Feature.DOCUMENTS:
      return false; // Documents is pro
    case Feature.FAMILY_MODE:
      return false; // Family mode is pro
    case Feature.ADVANCED_FILTERS:
      return false; // Advanced filters are pro
    case Feature.UNLIMITED_SEARCH_RESULTS:
      return false; // Unlimited results are pro
    case Feature.PRO_SORTING:
      return false; // Pro sorting is pro
    case Feature.UNLIMITED_AI_CHAT:
      return false; // Unlimited AI chat is pro
    case Feature.EXPORT_PDF:
      return false; // PDF export is pro
    case Feature.NOTIFICATIONS:
      return false; // Notifications are pro
    case Feature.UNLIMITED_SAVED_BONUSES:
      return false; // Unlimited saved bonuses is pro
    default:
      return false;
  }
};

// ============================================
// HELPER PER CALCOLO LIMITI DINAMICI
// ============================================

export const getVisibleBonusLimit = (isPremium: boolean): number => {
  return isPremium ? Infinity : FREE_LIMITS.maxBonusesVisible;
};

export const getSearchResultLimit = (isPremium: boolean): number => {
  return isPremium ? Infinity : FREE_LIMITS.maxSearchResults;
};

export const getAIChatLimit = (isPremium: boolean): number => {
  return isPremium ? Infinity : FREE_LIMITS.maxAIChatPerDay;
};

export const getSavedBonusLimit = (isPremium: boolean): number => {
  return isPremium ? Infinity : FREE_LIMITS.maxSavedBonuses;
};
