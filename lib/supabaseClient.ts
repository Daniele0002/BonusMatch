import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://kzrffhhmaeivbldgwgyi.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_Gr62Kd5_qHeLlYjdbUEF8g_tqxtJwed";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
