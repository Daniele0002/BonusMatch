import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Supabase con service role key per operazioni server-side
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export const handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': process.env.FRONTEND_URL || 'https://bonusmatch.it',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method not allowed' };
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;

  try {
    // Verifica la firma del webhook
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${err.message}` }),
    };
  }

  // Gestisci gli eventi
  switch (stripeEvent.type) {
    case 'checkout.session.completed': {
      const session = stripeEvent.data.object;
      console.log('Payment successful:', session.id);
      
      // Attiva premium per l'utente
      if (session.customer_email) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: true, tipo_utente: 'premium' })
          .eq('email', session.customer_email);
        
        if (error) {
          console.error('Error updating user to premium:', error);
        } else {
          console.log('User upgraded to premium:', session.customer_email);
        }
      }
      break;
    }
    
    case 'customer.subscription.deleted': {
      // L'abbonamento è stato cancellato/scaduto
      const subscription = stripeEvent.data.object;
      console.log('Subscription deleted:', subscription.id);
      
      // Recupera l'email del customer
      const customer = await stripe.customers.retrieve(subscription.customer);
      if (customer && customer.email) {
        const { error } = await supabase
          .from('profiles')
          .update({ is_premium: false, tipo_utente: 'base' })
          .eq('email', customer.email);
        
        if (error) {
          console.error('Error downgrading user:', error);
        } else {
          console.log('User downgraded to base:', customer.email);
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      // Abbonamento aggiornato (es. riattivato o modificato)
      const subscription = stripeEvent.data.object;
      console.log('Subscription updated:', subscription.id, 'Status:', subscription.status);
      
      // Se l'abbonamento è tornato attivo
      if (subscription.status === 'active' && !subscription.cancel_at_period_end) {
        const customer = await stripe.customers.retrieve(subscription.customer);
        if (customer && customer.email) {
          const { error } = await supabase
            .from('profiles')
            .update({ is_premium: true, tipo_utente: 'premium' })
            .eq('email', customer.email);
          
          if (error) {
            console.error('Error reactivating premium:', error);
          } else {
            console.log('User premium reactivated:', customer.email);
          }
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      // Pagamento rinnovo fallito
      const invoice = stripeEvent.data.object;
      console.log('Invoice payment failed:', invoice.id);
      
      // Dopo più tentativi falliti, Stripe cancellerà l'abbonamento
      // che triggerà customer.subscription.deleted
      break;
    }
    
    case 'payment_intent.succeeded': {
      const paymentIntent = stripeEvent.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = stripeEvent.data.object;
      console.log('Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ received: true }),
  };
};
