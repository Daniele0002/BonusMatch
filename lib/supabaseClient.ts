import { createClient } from "@supabase/supabase-js";

// Supporto per Vite e Next.js
const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  "";
  
const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase URL o Anon Key non configurate. Verifica le variabili d'ambiente.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
