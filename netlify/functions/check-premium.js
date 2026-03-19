import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://bonusmatch.it';

// Helper per autenticazione
const authenticate = async (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
};

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

  // Autenticazione richiesta
  const authUser = await authenticate(event);
  if (!authUser) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Non autorizzato' }) };
  }

  try {
    // Verifica stato premium dal database (fonte di verità)
    const { data, error } = await supabase
      .from('profiles')
      .select('is_premium, tipo_utente')
      .eq('id', authUser.id)
      .single();

    if (error) {
      // Fallback: prova con email
      const { data: emailData, error: emailError } = await supabase
        .from('profiles')
        .select('is_premium, tipo_utente')
        .eq('email', authUser.email)
        .single();

      if (emailError || !emailData) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ isPremium: false, verified: false }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          isPremium: emailData.is_premium || emailData.tipo_utente === 'premium',
          verified: true,
        }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        isPremium: data.is_premium || data.tipo_utente === 'premium',
        verified: true,
      }),
    };
  } catch (err) {
    console.error('Check premium error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore nella verifica dello stato premium' }),
    };
  }
};
