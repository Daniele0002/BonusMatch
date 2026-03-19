import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabase client per verificare autenticazione
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Helper function per convertire timestamp in modo sicuro
const safeTimestampToISO = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') return null;
  try {
    return new Date(timestamp * 1000).toISOString();
  } catch {
    return null;
  }
};

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'https://bonusmatch.it',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
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

  const { action, email, subscriptionId } = JSON.parse(event.body || '{}');

  // Verifica che l'utente possa accedere solo ai propri dati
  if (email && email.toLowerCase() !== authUser.email.toLowerCase()) {
    return {
      statusCode: 403,
      headers,
      body: JSON.stringify({ error: 'Non autorizzato ad accedere ai dati di altri utenti' }),
    };
  }

  try {
    switch (action) {
      case 'get-subscription': {
        // Trova il customer per email
        if (!email) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ subscription: null, error: 'Email mancante' }),
          };
        }
        
        const customers = await stripe.customers.list({ email, limit: 1 });
        
        if (customers.data.length === 0) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ subscription: null }),
          };
        }

        const customer = customers.data[0];
        
        // Trova le subscription attive
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: 'active',
          limit: 1,
        });

        if (subscriptions.data.length === 0) {
          // Controlla anche subscription cancellate ma ancora attive fino a fine periodo
          const canceledSubs = await stripe.subscriptions.list({
            customer: customer.id,
            status: 'canceled',
            limit: 1,
          });
          
          if (canceledSubs.data.length > 0) {
            const sub = canceledSubs.data[0];
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                subscription: {
                  id: sub.id,
                  status: sub.status,
                  cancelAtPeriodEnd: sub.cancel_at_period_end,
                  currentPeriodEnd: safeTimestampToISO(sub.current_period_end),
                  canceled: true,
                },
              }),
            };
          }
          
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ subscription: null }),
          };
        }

        const subscription = subscriptions.data[0];
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            subscription: {
              id: subscription.id,
              status: subscription.status,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              currentPeriodEnd: safeTimestampToISO(subscription.current_period_end),
              priceAmount: subscription.items.data[0]?.price?.unit_amount ? subscription.items.data[0].price.unit_amount / 100 : null,
              currency: subscription.items.data[0]?.price?.currency || null,
              interval: subscription.items.data[0]?.price?.recurring?.interval || null,
            },
          }),
        };
      }

      case 'cancel-subscription': {
        // Cancella alla fine del periodo corrente (non subito)
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Abbonamento cancellato. Rimarrà attivo fino alla fine del periodo corrente.',
            currentPeriodEnd: safeTimestampToISO(subscription.current_period_end),
          }),
        };
      }

      case 'reactivate-subscription': {
        // Riattiva un abbonamento cancellato (se ancora nel periodo attivo)
        const subscription = await stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: false,
        });

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Rinnovo automatico riattivato!',
          }),
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Azione non valida' }),
        };
    }
  } catch (error) {
    console.error('Subscription management error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Errore nella gestione dell\'abbonamento' }),
    };
  }
};
