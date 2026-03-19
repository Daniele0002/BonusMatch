import { UserProfile, Bonus, MatchResult } from "../types";
import { supabase } from "../lib/supabaseClient";

// ═══════════════════════════════════════════════════════════════════════════════
// COSTANTI E CONFIGURAZIONE
// ═══════════════════════════════════════════════════════════════════════════════

/** Soglie ISEE per bonus specifici - centralizzate per manutenibilità */
const ISEE_LIMITS: Record<string, number | ((figli: number) => number)> = {
  "Sociale|disagio": (figli) => figli >= 4 ? 20000 : 9530,
  "Inclusione": 9360,
  "Carta acquisti": 8052.75,
  "Dedicata a te": 15000,
  "Psicologo": 50000,
  "Supporto per la Formazione": 6000,
  "libri": 30000,
  "Affitto Under 31": 15493.71,
  "Vista": 10000,
  "Trasporti": 20000,
  "paritarie": 30000,
};

/** Keywords per bonus familiari */
const FAMILY_KEYWORDS = ["nido", "mamma", "figl", "bebè", "cicogna", "nati"];

/** Helper per ottenere il token JWT Supabase */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANALISI PROFILO CON AI (Via server-side proxy)
// ═══════════════════════════════════════════════════════════════════════════════

export const analyzeProfileWithAI = async (profile: UserProfile, bonuses: Bonus[]): Promise<MatchResult[]> => {
  try {
    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/gemini-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: 'analyze',
        profile,
        bonuses: bonuses.map(b => ({ id: b.id, titolo: b.titolo, requisiti: b.requisiti })),
      }),
    });

    if (!response.ok) {
      // Se rate-limited (429), il server ha bloccato per limite giornaliero
      if (response.status === 429) {
        console.warn('Rate limit raggiunto per analisi AI');
      }
      return calculateDeterministicMatches(profile, bonuses);
    }

    const data = await response.json();
    return data.results || calculateDeterministicMatches(profile, bonuses);
  } catch {
    return calculateDeterministicMatches(profile, bonuses);
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// CALCOLO DETERMINISTICO (Fallback)
// ═══════════════════════════════════════════════════════════════════════════════

export const calculateDeterministicMatches = (profile: UserProfile, bonuses: Bonus[]): MatchResult[] => {
  const hasChildren = (profile.numeroFigli ?? 0) > 0 || profile.figli === "si" || 
    profile.composizione === "coppia_con_figli" || profile.composizione === "genitore_single";

  return bonuses.map(bonus => {
    let eligible = true;
    const reasons: string[] = [];
    const title = bonus.titolo.toLowerCase();
    const { eta, isee = 0, numeroFigli = 0, condizione, abitazione, fasceEtaFigli } = profile;

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK ETÀ
    // ─────────────────────────────────────────────────────────────────────────
    if (bonus.titolo.includes("Under 31") && eta >= 31) { eligible = false; reasons.push("Età superiore ai 31 anni"); }
    if ((bonus.titolo.includes("Carta Giovani") || bonus.titolo.includes("Patente")) && (eta < 18 || eta > 35)) {
      eligible = false; reasons.push("Età non compresa tra 18 e 35 anni");
    }
    if (bonus.titolo.includes("Supporto per la Formazione") && (eta < 18 || eta > 59)) {
      eligible = false; reasons.push("Età non compatibile (18-59)");
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK FIGLI
    // ─────────────────────────────────────────────────────────────────────────
    const isFamilyBonus = bonus.categoria === "Famiglia" || FAMILY_KEYWORDS.some(k => title.includes(k));
    if (isFamilyBonus && !hasChildren && !bonus.titolo.includes("Inclusione")) {
      eligible = false; reasons.push("Richiede figli a carico");
    }
    if (bonus.titolo.includes("Nido") && hasChildren && !fasceEtaFigli?.includes("0-3")) {
      eligible = false; reasons.push("Richiede figli sotto i 3 anni");
    }
    if (bonus.titolo.includes("Mamme")) {
      if (condizione !== "lavoratore") { eligible = false; reasons.push("Richiede essere lavoratrice"); }
      if (numeroFigli < 2) { eligible = false; reasons.push("Richiede almeno 2 figli"); }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK ISEE
    // ─────────────────────────────────────────────────────────────────────────
    if (isee > 0) {
      for (const [pattern, limitOrFn] of Object.entries(ISEE_LIMITS)) {
        const regex = new RegExp(pattern, "i");
        if (regex.test(bonus.titolo)) {
          const limit = typeof limitOrFn === "function" ? limitOrFn(numeroFigli) : limitOrFn;
          if (isee > limit) {
            eligible = false;
            reasons.push(`ISEE superiore al limite di ${limit.toLocaleString("it-IT")}€`);
          }
          break;
        }
      }
      // Check generico per "ISEE basso"
      if (eligible && bonus.descrizione.toLowerCase().includes("isee basso") && isee > 25000) {
        eligible = false; reasons.push("ISEE probabilmente troppo alto per questo bonus");
      }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CHECK LAVORO E CASA
    // ─────────────────────────────────────────────────────────────────────────
    if (bonus.categoria === "Lavoro" && title.includes("lavorator") && condizione !== "lavoratore") {
      eligible = false; reasons.push("Richiede essere lavoratore");
    }
    if (["Mobili", "Condizionatori", "Verde", "Acqua"].some(k => bonus.titolo.includes(k)) && abitazione === "genitori") {
      eligible = false; reasons.push("Richiede unità immobiliare propria");
    }

    return { bonusId: bonus.id, eligible, reason: eligible ? "Requisiti compatibili" : reasons[0] || "Requisiti non soddisfatti" };
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT CON AI (Via server-side proxy)
// ═══════════════════════════════════════════════════════════════════════════════

export const chatWithAI = async (message: string, profile?: UserProfile, results?: MatchResult[], bonuses: Bonus[] = []): Promise<string> => {
  try {
    const token = await getAuthToken();
    const response = await fetch('/.netlify/functions/gemini-ai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        action: 'chat',
        message,
        profile,
        results,
        bonuses: bonuses.map(b => ({ id: b.id, titolo: b.titolo, descrizione: b.descrizione, requisiti: b.requisiti })),
      }),
    });

    if (!response.ok) {
      // Se rate-limited (429), mostra il messaggio dal server
      if (response.status === 429) {
        const errorData = await response.json();
        return errorData.message || "⚠️ Hai raggiunto il limite giornaliero di messaggi. Passa a Premium per chat illimitata!";
      }
      return "Scusa, non riesco a connettermi ora. Riprova tra poco!";
    }

    const data = await response.json();
    return data.response || "Non ho capito, puoi ripetere?";
  } catch {
    return "Scusa, non riesco a connettermi ora. Riprova tra poco!";
  }
};
