import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile, Bonus, MatchResult } from "../types";

export const analyzeProfileWithAI = async (
  profile: UserProfile,
  bonuses: Bonus[],
): Promise<MatchResult[]> => {
  // Use process.env.API_KEY directly in the initialization as required by guidelines.
  const prompt = `Analizza il profilo utente e determina l'eleggibilità per i seguenti bonus italiani. 
  Profilo: ${JSON.stringify(profile)}
  Bonus disponibili: ${JSON.stringify(bonuses.map((b) => ({ id: b.id, titolo: b.titolo, requisiti: b.requisiti })))}
  
  Ritorna un array JSON di oggetti con "bonusId", "eligible" (boolean) e "reason" (breve spiegazione in italiano).`;

  try {
    // Use VITE_GEMINI_API_KEY
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

    // FALLBACK GRACEFUL: Se manca la chiave, usiamo la logica deterministica senza spaccare tutto
    if (!apiKey || apiKey.includes("INSERT_YOUR")) {
      return calculateDeterministicMatches(profile, bonuses);
    }

    const ai = new GoogleGenAI({ apiKey });

    const aiCall = ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              bonusId: { type: Type.STRING },
              eligible: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ["bonusId", "eligible", "reason"],
          },
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout during AI analysis")), 15000),
    );

    const response = await Promise.race([aiCall, timeoutPromise]);

    return JSON.parse(response.text || "[]");
  } catch (error) {
    // Fallback: Deterministic Logic
    return calculateDeterministicMatches(profile, bonuses);
  }
};

export const calculateDeterministicMatches = (
  profile: UserProfile,
  bonuses: Bonus[],
): MatchResult[] => {
  return bonuses.map((bonus) => {
    let eligible = true;
    let reasons: string[] = [];

    // --- Global Checks ---

    // 1. Age Global Constraints
    if (bonus.titolo.includes("Under 31") && profile.eta >= 31) {
      eligible = false;
      reasons.push("Età superiore ai 31 anni");
    }
    if (
      (bonus.titolo.includes("Carta Giovani") ||
        bonus.titolo.includes("Patente")) &&
      (profile.eta < 18 || profile.eta > 35)
    ) {
      eligible = false;
      reasons.push("Età non compresa tra 18 e 35 anni");
    }

    // 2. Children Constraints
    const isFamilyBonus =
      bonus.categoria === "Famiglia" ||
      ["nido", "mamma", "figl", "bebè", "cicogna", "nati"].some((k) =>
        bonus.titolo.toLowerCase().includes(k),
      );

    const hasChildren =
      (profile.numeroFigli && profile.numeroFigli > 0) ||
      profile.figli === "si" ||
      profile.composizione === "coppia_con_figli" ||
      profile.composizione === "genitore_single";

    if (isFamilyBonus && !hasChildren) {
      // Exception: Assegno di Inclusione might apply to over 60 or disabled without children
      if (!bonus.titolo.includes("Inclusione")) {
        eligible = false;
        reasons.push("Richiede figli a carico");
      }
    }

    // --- Strict ISEE Checks ---
    if (profile.isee !== undefined && profile.isee > 0) {
      // Bonus Sociale (Luce/Gas): Limits 9350€ (or 20k with 4+ kids)
      if (
        bonus.titolo.includes("Sociale") ||
        bonus.titolo.includes("disagio")
      ) {
        const limit = (profile.numeroFigli || 0) >= 4 ? 20000 : 9530;
        if (profile.isee > limit) {
          eligible = false;
          reasons.push(
            `ISEE superiore al limite di ${limit.toLocaleString()}€`,
          );
        }
      }

      // Assegno di Inclusione: Limit 9360€
      if (bonus.titolo.includes("Inclusione") && profile.isee > 9360) {
        eligible = false;
        reasons.push("ISEE superiore a 9.360€");
      }

      // Carta Acquisti: Limit ~8000€
      if (bonus.titolo.includes("Carta acquisti") && profile.isee > 8052.75) {
        eligible = false;
        reasons.push("ISEE superiore al limite per Carta Acquisti");
      }

      // Carta Dedicata a te: Limit 15000€
      if (bonus.titolo.includes("Dedicata a te") && profile.isee > 15000) {
        eligible = false;
        reasons.push("ISEE superiore a 15.000€");
      }

      // Bonus Psicologo: Limit 50000€
      if (bonus.titolo.includes("Psicologo") && profile.isee > 50000) {
        eligible = false;
        reasons.push("ISEE superiore a 50.000€");
      }

      // Supporto Formazione Lavoro: Limit 6000€
      if (
        bonus.titolo.includes("Supporto per la Formazione") &&
        profile.isee > 6000
      ) {
        eligible = false;
        reasons.push("ISEE superiore a 6.000€");
      }

      // Bonus Libri / Scuola: Often regional but typically around 15-30k. We'll be conservative or check specific mocked value if in Constants
      // Using 20k as a safe generic threshold if "ISEE basso" is mentioned, otherwise reading from implicit knowledge.
      // For "Bonus libri scolastici" mock says < 30.000
      if (bonus.titolo.includes("libri") && profile.isee > 30000) {
        eligible = false;
        reasons.push("ISEE superiore a 30.000€");
      }

      // Bonus Affitto Under 31: Limit 15493.71€
      if (
        bonus.titolo.includes("Affitto Under 31") &&
        profile.isee > 15493.71
      ) {
        eligible = false;
        reasons.push("ISEE superiore a 15.493,71€");
      }

      // Bonus Vista: Limit 10000€
      if (bonus.titolo.includes("Vista") && profile.isee > 10000) {
        eligible = false;
        reasons.push("ISEE superiore a 10.000€");
      }

      // Bonus Trasporti: Limit 20000€
      if (bonus.titolo.includes("Trasporti") && profile.isee > 20000) {
        eligible = false;
        reasons.push("ISEE superiore a 20.000€");
      }

      // Bonus Scuole Paritarie: Limit 30000€
      if (bonus.titolo.includes("paritarie") && profile.isee > 30000) {
        eligible = false;
        reasons.push("ISEE superiore a 30.000€");
      }

      // General "Requisito ISEE" check if we missed specific one but know it requires low income
      // If description says "ISEE basso" and user has > 25k, likely incompatible
      if (
        bonus.descrizione.toLowerCase().includes("isee basso") &&
        profile.isee > 25000 &&
        eligible
      ) {
        // Only flag if not already caught by specific rules
        eligible = false;
        reasons.push("ISEE probabilmente troppo alto per questo bonus");
      }
    }

    // --- Other Specific Checks ---

    // Bonus Asilo Nido (Children < 3) - We only have ranges '0-3'
    if (bonus.titolo.includes("Nido") && hasChildren) {
      const hasYoungChildren = profile.fasceEtaFigli?.includes("0-3");
      if (!hasYoungChildren) {
        eligible = false;
        reasons.push("Richiede figli sotto i 3 anni");
      }
    }

    // Supporto Formazione Lavoro (SFL) - Age mismatch
    if (bonus.titolo.includes("Supporto per la Formazione")) {
      if (profile.eta < 18 || profile.eta > 59) {
        eligible = false;
        reasons.push("Età non compatibile (18-59)");
      }
    }

    // Bonus Lavoratori Fragili or Lavoro related
    if (bonus.categoria === "Lavoro") {
      // 1. Check for specific exclusions
      const isSFL = bonus.titolo.includes("Supporto"); // SFL handled above
      if (!isSFL) {
        // If title explicitly mentions "Lavoratori" or "Lavoratore"
        if (bonus.titolo.toLowerCase().includes("lavorator")) {
          if (profile.condizione !== "lavoratore") {
            eligible = false;
            reasons.push("Richiede essere lavoratore");
          }
        }
        // If user is NOT a worker, and it's a generic work bonus (that is not Patente/SFL)
        else if (
          profile.condizione !== "lavoratore" &&
          !bonus.titolo.includes("Patente")
        ) {
          // This logic assumes most "Lavoro" bonuses need you to be a worker unless stated otherwise (like Patente might be for unemployed)
          // But let's be careful not to exclude too aggressively.
          // We'll trust the specific check above for now.
        }
      }
    }

    // Nuovo Bonus Mamme: 2+ children, Worker
    if (bonus.titolo.includes("Mamme")) {
      if (profile.condizione !== "lavoratore") {
        eligible = false;
        reasons.push("Richiede essere lavoratrice");
      }
      if ((profile.numeroFigli || 0) < 2) {
        eligible = false;
        reasons.push("Richiede almeno 2 figli");
      }
    }

    // Bonus Mobili / Condizionatori / Verde / Acqua -> Casa Properties
    const houseBonus = ["Mobili", "Condizionatori", "Verde", "Acqua"].some(
      (k) => bonus.titolo.includes(k),
    );
    if (houseBonus && profile.abitazione === "genitori") {
      eligible = false;
      reasons.push("Richiede unità immobiliare (non con genitori)");
    }

    return {
      bonusId: bonus.id,
      eligible: eligible,
      reason: eligible
        ? "Requisiti compatibili"
        : reasons[0] || "Requisiti non soddisfatti",
    };
  });
};

export const chatWithAI = async (
  message: string,
  profile?: UserProfile,
  results?: MatchResult[],
  bonuses: Bonus[] = [],
): Promise<string> => {
  const isGuest = !profile;

  let context = `
    Sei l'assistente virtuale di BonusMatch, esperto in bonus e agevolazioni italiane.
    REGOLE IMPORTANTI:
    - Rispondi SEMPRE in massimo 2-3 frasi brevi
    - Vai dritto al punto, niente giri di parole
    - Usa l'italiano, tono amichevole ma sintetico
    - Se servono dettagli, chiedi se l'utente vuole approfondire
  `;

  if (isGuest) {
    context += `
    L'utente è un OSPITE e non ha ancora compilato il profilo.
    Non hai informazioni su di lui (età, ISEE, figli, ecc.).
    Se ti chiede se ha diritto a un bonus, spiegagli i requisiti generali e invitalo a registrarsi o compilare il profilo su BonusMatch per una verifica precisa.
    `;
  } else {
    context += `
    L'utente è LOGGATO.
    Profilo utente: ${JSON.stringify(profile)}
    `;

    if (results && results.length > 0) {
      context += `
      I risultati della verifica automatica per lui sono:
      ${JSON.stringify(
        results.map((r) => {
          const b = bonuses.find((bon) => bon.id === r.bonusId);
          return {
            titolo: b?.titolo,
            esito: r.eligible ? "Eligibile" : "Non eligibile",
            motivo: r.reason,
          };
        }),
      )}
      `;
    } else {
      context += `
      L'utente non ha ancora dei risultati calcolati (o lista vuota).
      Rispondi basandoti sui dati del profilo che hai a disposizione rispetto ai requisiti standard dei bonus.
      `;
    }
  }

  context += `
    Se ti chiedono bonus specifici, ecco la lista di quelli disponibili nella piattaforma (usa questa come riferimento di verità sui requisiti):
    ${JSON.stringify(bonuses.map((b) => ({ titolo: b.titolo, desc: b.descrizione, req: b.requisiti })))}
  `;

  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;

    if (!apiKey || apiKey.length < 10) {
      // Simuliamo una risposta per non rompere l'esperienza se la chiave manca
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return "Ciao! Sembra che il mio 'cervello' (API Key) non sia configurato correttemente. Per favore avvisa l'amministratore di aggiungere la VITE_GEMINI_API_KEY nel file .env.";
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    // Construct a full prompt since we are doing single-turn for simplified usage here,
    // or we could expand the function to take history.
    const fullPrompt = `${context}\n\nDomanda Utente: ${message}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
    });

    return response.text || "Non ho capito, puoi ripetere?";
  } catch (error) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return "Scusa, in questo momento non riesco a connettermi al cervello di BonusMatch. Riprova tra poco!";
  }
};
