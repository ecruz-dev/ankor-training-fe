// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

// Use environment variables (assuming Vite or similar; for Create React App, prefix with REACT_APP_)
// Make sure to add these to your .env file: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);