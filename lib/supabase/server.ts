import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/lib/env";
import type { Database } from "@/lib/database.types";

// `createServerClient` throws on empty strings. When the project isn't
// configured yet we still want the app to boot (screens show a setup notice),
// so fall back to placeholders — any query then simply fails at the network
// layer and callers degrade gracefully.
const URL_OR_PLACEHOLDER = SUPABASE_URL || "http://localhost:54321";
const KEY_OR_PLACEHOLDER = SUPABASE_ANON_KEY || "placeholder-anon-key";

/**
 * Server-side Supabase client, bound to the request cookies so that
 * `auth.uid()` (and therefore RLS) works in Server Components / Route Handlers.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(URL_OR_PLACEHOLDER, KEY_OR_PLACEHOLDER, {
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
          // `setAll` was called from a Server Component — safe to ignore when
          // middleware is refreshing the session.
        }
      },
    },
  });
}

/**
 * Privileged client that bypasses RLS. Server-only. Use sparingly — e.g. an
 * admin creating users. Returns null when the service role key is not set.
 */
export function createAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
