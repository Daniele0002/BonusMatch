import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
const AI_MODEL = 'gemini-2.0-flash';
const AI_TIMEOUT = 15000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bonusmatch.it';

// Limiti giornalieri (stessi di FREE_LIMITS nel frontend)
const FREE_CHAT_LIMIT = 3;
const FREE_ANALYZE_LIMIT = 5;
const GUEST_CHAT_LIMIT = 2; // Ospiti senza account

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// Autenticazione (opzionale per guest)
const authenticate = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
};

// Verifica stato premium dal DB
const checkPremium = async (userId) => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('is_premium, tipo_utente')
      .eq('id', userId)
      .single();
    return data?.is_premium || data?.tipo_utente === 'premium';
  } catch {
    return false;
  }
};

// Rate limiting server-side via Supabase
const checkRateLimit = async (identifier, action, limit) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = `${identifier}_${action}_${today}`;

  try {
    // Cerca il conteggio odierno
    const { data } = await supabase
      .from('rate_limits')
      .select('count')
      .eq('key', key)
      .single();

    const currentCount = data?.count || 0;

    if (currentCount >= limit) {
      return { allowed: false, remaining: 0, limit };
    }

    // Incrementa il conteggio (upsert)
    await supabase
      .from('rate_limits')
      .upsert(
        { key, count: currentCount + 1, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );

    return { allowed: true, remaining: limit - currentCount - 1, limit };
  } catch (err) {
    // Se la tabella non esiste ancora, lascia passare (graceful degradation)
    console.warn('Rate limit check failed (tabella rate_limits potrebbe non esistere):', err.message);
    return { allowed: true, remaining: limit, limit };
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': FRONTEND_URL,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  if (!GEMINI_API_KEY) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'API AI non configurata' }) };
  }

  try {
    const { action, message, profile, results, bonuses } = JSON.parse(event.body || '{}');

    // Autenticazione
    const authUser = await authenticate(event);
    const isPremium = authUser ? await checkPremium(authUser.id) : false;

    // Identificatore per rate limiting: userId per utenti, IP per guest
    const clientIp = event.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                     event.headers['client-ip'] || 
                     'unknown';
    const identifier = authUser ? `user_${authUser.id}` : `ip_${clientIp}`;

    // ═══════════════════════════════════════════════════════════════════════
    // ACTION: chat — Chat con AI
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'chat') {
      if (!message) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Messaggio mancante' }) };
      }

      // Rate limiting (utenti premium = nessun limite)
      if (!isPremium) {
        const limit = authUser ? FREE_CHAT_LIMIT : GUEST_CHAT_LIMIT;
        const rateCheck = await checkRateLimit(identifier, 'chat', limit);
        
        if (!rateCheck.allowed) {
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({ 
              error: 'Limite giornaliero raggiunto',
              message: authUser 
                ? `Hai raggiunto il limite di ${rateCheck.limit} messaggi al giorno. Passa a Premium per chat illimitata!`
                : `Limite di ${rateCheck.limit} messaggi per ospiti raggiunto. Registrati per averne di più!`,
              remaining: 0,
              limit: rateCheck.limit,
            }),
          };
        }
      }

      const isGuest = !profile;
      
      let context = `Sei l'assistente BonusMatch, esperto in bonus italiani.
REGOLE: Rispondi in max 2-3 frasi brevi, in italiano, tono amichevole ma sintetico.`;

      if (isGuest) {
        context += `\nUtente OSPITE senza profilo. Se chiede su bonus, spiega requisiti generali e invitalo a registrarsi.`;
      } else {
        context += `\nProfilo: ${JSON.stringify(profile)}`;
        if (results?.length && bonuses?.length) {
          context += `\nRisultati: ${JSON.stringify(results.map(r => ({ 
            titolo: bonuses.find(b => b.id === r.bonusId)?.titolo, 
            esito: r.eligible ? "Eligibile" : "Non eligibile", 
            motivo: r.reason 
          })))}`;
        }
      }
      if (bonuses?.length) {
        context += `\nBonus disponibili: ${JSON.stringify(bonuses.map(b => ({ titolo: b.titolo, desc: b.descrizione, req: b.requisiti })))}`;
      }

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const aiCall = ai.models.generateContent({
        model: AI_MODEL,
        contents: [{ role: 'user', parts: [{ text: `${context}\n\nDomanda: ${message}` }] }],
      });

      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), AI_TIMEOUT));
      const response = await Promise.race([aiCall, timeout]);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ response: response.text || 'Non ho capito, puoi ripetere?' }),
      };
    }

    // ═══════════════════════════════════════════════════════════════════════
    // ACTION: analyze — Analisi profilo
    // ═══════════════════════════════════════════════════════════════════════
    if (action === 'analyze') {
      if (!profile || !bonuses?.length) {
        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Profilo o bonus mancanti' }) };
      }

      // Rate limiting per l'analisi (utenti premium = nessun limite)
      if (!isPremium) {
        const rateCheck = await checkRateLimit(identifier, 'analyze', FREE_ANALYZE_LIMIT);
        
        if (!rateCheck.allowed) {
          return {
            statusCode: 429,
            headers,
            body: JSON.stringify({ 
              error: 'Limite giornaliero raggiunto',
              message: `Hai raggiunto il limite di ${rateCheck.limit} analisi al giorno. Passa a Premium per analisi illimitate!`,
              remaining: 0,
            }),
          };
        }
      }

      const prompt = `Analizza il profilo utente e determina l'eleggibilità per i seguenti bonus italiani.
      
      REGOLA FONDAMENTALE: Un bonus deve essere marcato come eligible=true A MENO CHE i dati del profilo non contraddicano ESPLICITAMENTE i requisiti.
      Se non ci sono dati nel profilo che escludono l'utente da un bonus, il bonus DEVE essere marcato come eligible=true con reason "Requisiti compatibili".
      Non fare supposizioni: valuta SOLO in base ai dati forniti nel profilo. Se un requisito non è verificabile dai dati del profilo, considera il bonus come eligible.
      
      Profilo: ${JSON.stringify(profile)}
      Bonus disponibili: ${JSON.stringify(bonuses.map(b => ({ id: b.id, titolo: b.titolo, requisiti: b.requisiti })))}
      
      Ritorna un array JSON di oggetti con "bonusId", "eligible" (boolean) e "reason" (breve spiegazione in italiano).`;

      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const aiCall = ai.models.generateContent({
        model: AI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: { 
                bonusId: { type: 'STRING' }, 
                eligible: { type: 'BOOLEAN' }, 
                reason: { type: 'STRING' } 
              },
              required: ['bonusId', 'eligible', 'reason'],
            },
          },
        },
      });

      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), AI_TIMEOUT));
      const response = await Promise.race([aiCall, timeout]);
      const results = JSON.parse(response.text || '[]');

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ results }),
      };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Azione non valida' }) };

  } catch (err) {
    console.error('Gemini AI error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore nel servizio AI' }),
    };
  }
};
