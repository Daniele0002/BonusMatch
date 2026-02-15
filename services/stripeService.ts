/// <reference types="vite/client" />
import { loadStripe, Stripe } from '@stripe/stripe-js';

// Initialize a singleton Promise for the Stripe object
let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    stripePromise = loadStripe(key || '');
  }
  return stripePromise;
};

// Production-Ready Frontend Code
export const redirectToCheckout = async (email?: string) => {
  // 1. Call Backend to create session (Netlify Functions)
  const response = await fetch('/.netlify/functions/checkout', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }), 
  });

  // Parse JSON safely
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error('Errore di comunicazione con il server. Riprova più tardi.');
  }

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Errore creazione sessione');
  }

  // 2. Redirect to Stripe Hosted Page
  if (data.url) {
    window.location.href = data.url;
  } else {
    throw new Error("URL di checkout non ricevuto");
  }
};
