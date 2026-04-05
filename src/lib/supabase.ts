import { createBrowserClient as _createBrowserClient, createServerClient as _createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client (singleton).
 * Use in client components for auth, realtime, and RLS-protected queries.
 */
export function createBrowserSupabaseClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Server-side Supabase client (per-request).
 * Use in server components, route handlers, and server actions.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return _createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // setAll can throw in Server Components where the response is
          // already streaming. This is safe to ignore — the cookies will be
          // set by the middleware instead.
        }
      },
    },
  });
}
