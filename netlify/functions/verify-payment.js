import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'https://bonusmatch.it',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  // --- AUTENTICAZIONE: verifica JWT Supabase ---
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token di autenticazione mancante' }),
    };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !authUser) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Token non valido o scaduto' }),
    };
  }

  try {
    const { sessionId } = JSON.parse(event.body || '{}');

    if (!sessionId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Session ID mancante' }),
      };
    }

    // Recupera la sessione di checkout da Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Sessione non trovata' }),
      };
    }

    // Verifica che il pagamento sia completato
    if (session.payment_status !== 'paid') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Pagamento non completato', status: session.payment_status }),
      };
    }

    const email = session.customer_email;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email cliente non trovata nella sessione' }),
      };
    }

    // Aggiorna l'utente a premium nel database
    const { data, error } = await supabase
      .from('profiles')
      .update({ is_premium: true, tipo_utente: 'premium' })
      .eq('email', email)
      .select();

    if (error) {
      console.error('Errore aggiornamento DB:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Errore aggiornamento database', details: error.message }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        success: true, 
        email,
        updated: data?.length > 0,
        message: 'Utente aggiornato a Premium'
      }),
    };
  } catch (error) {
    console.error('Verify payment error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore nella verifica del pagamento' }),
    };
  }
};
