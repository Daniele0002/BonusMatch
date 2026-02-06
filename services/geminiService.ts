import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Bonus, MatchResult } from "../types";

// ═══════════════════════════════════════════════════════════════════════════════
// COSTANTI E CONFIGURAZIONE
// ═══════════════════════════════════════════════════════════════════════════════

const AI_MODEL = "gemini-2.0-flash";
const AI_TIMEOUT = 15000;

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

/** Helper per ottenere API key */
const getApiKey = (): string | null => {
  const key = import.meta.env.VITE_GEMINI_API_KEY as string;
  return key && !key.includes("INSERT_YOUR") && key.length >= 10 ? key : null;
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANALISI PROFILO CON AI
// ═══════════════════════════════════════════════════════════════════════════════

export const analyzeProfileWithAI = async (profile: UserProfile, bonuses: Bonus[]): Promise<MatchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return calculateDeterministicMatches(profile, bonuses);

  const prompt = `Analizza il profilo utente e determina l'eleggibilità per i seguenti bonus italiani. 
  Profilo: ${JSON.stringify(profile)}
  Bonus disponibili: ${JSON.stringify(bonuses.map(b => ({ id: b.id, titolo: b.titolo, requisiti: b.requisiti })))}
  
  Ritorna un array JSON di oggetti con "bonusId", "eligible" (boolean) e "reason" (breve spiegazione in italiano).`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const aiCall = ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: { bonusId: { type: Type.STRING }, eligible: { type: Type.BOOLEAN }, reason: { type: Type.STRING } },
            required: ["bonusId", "eligible", "reason"],
          },
        },
      },
    });

    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), AI_TIMEOUT));
    const response = await Promise.race([aiCall, timeout]);
    return JSON.parse(response.text || "[]");
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
// CHAT CON AI
// ═══════════════════════════════════════════════════════════════════════════════

export const chatWithAI = async (message: string, profile?: UserProfile, results?: MatchResult[], bonuses: Bonus[] = []): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 1000));
    return "Ciao! Sembra che il mio 'cervello' (API Key) non sia configurato. Per favore avvisa l'amministratore di aggiungere VITE_GEMINI_API_KEY nel file .env.";
  }

  const isGuest = !profile;
  
  // Costruzione context compatto
  let context = `Sei l'assistente BonusMatch, esperto in bonus italiani.
REGOLE: Rispondi in max 2-3 frasi brevi, in italiano, tono amichevole ma sintetico.`;

  if (isGuest) {
    context += `\nUtente OSPITE senza profilo. Se chiede su bonus, spiega requisiti generali e invitalo a registrarsi.`;
  } else {
    context += `\nProfilo: ${JSON.stringify(profile)}`;
    if (results?.length) {
      context += `\nRisultati: ${JSON.stringify(results.map(r => ({ titolo: bonuses.find(b => b.id === r.bonusId)?.titolo, esito: r.eligible ? "Eligibile" : "Non eligibile", motivo: r.reason })))}`;
    }
  }
  context += `\nBonus disponibili: ${JSON.stringify(bonuses.map(b => ({ titolo: b.titolo, desc: b.descrizione, req: b.requisiti })))}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: `${context}\n\nDomanda: ${message}` }] }],
    });
    return response.text || "Non ho capito, puoi ripetere?";
  } catch {
    await new Promise(r => setTimeout(r, 1000));
    return "Scusa, non riesco a connettermi ora. Riprova tra poco!";
  }
};
