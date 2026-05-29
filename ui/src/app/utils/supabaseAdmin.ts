import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl) {
  console.warn('Warning: NEXT_PUBLIC_SUPABASE_URL is missing in environment variables');
}

if (!supabaseServiceRoleKey) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables. Falling back to build placeholder.');
}

// Use placeholders at build-time to prevent import failure during next build pre-rendering
export const supabaseAdmin = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseServiceRoleKey || 'placeholder-service-role-key-for-next-build-evaluation', 
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);
