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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Errore creazione sessione');
  }

  const { url } = await response.json();

  // 2. Redirect to Stripe Hosted Page
  if (url) {
    window.location.href = url;
  } else {
    throw new Error("URL di checkout non ricevuto");
  }
};
