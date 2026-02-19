import { createClient } from "@supabase/supabase-js";

// Supporto per Vite e Next.js
const supabaseUrl =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_URL) ||
  "https://kzrffhhmaeivbldgwgyi.supabase.co";
  
const supabaseAnonKey =
  (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) ||
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) ||
  "sb_publishable_Gr62Kd5_qHeLlYjdbUEF8g_tqxtJwed";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
