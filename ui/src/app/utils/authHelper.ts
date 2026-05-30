// Shared authentication helper — extracts the repeated JWT verification pattern
// used by every billing route into a single reusable function

import { createClient, User } from '@supabase/supabase-js';

/**
 * Verifies a Supabase JWT access token and returns the authenticated user.
 * Throws an error with status code if authentication fails.
 * Every billing API route calls this instead of duplicating auth code.
 */
export async function authenticateRequest(token: string | undefined | null): Promise<User> {
  if (!token) {
    const err = new Error('Missing active user session token.');
    (err as any).status = 401;
    throw err;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    const err = new Error('Unauthorized session or expired token.');
    (err as any).status = 401;
    throw err;
  }

  return user;
}
