"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/env";
import type { Database } from "@/lib/database.types";

/** Browser-side Supabase client (uses the public anon key + RLS). */
export function createClient() {
  return createBrowserClient<Database>(
    SUPABASE_URL || "http://localhost:54321",
    SUPABASE_ANON_KEY || "placeholder-anon-key",
  );
}
