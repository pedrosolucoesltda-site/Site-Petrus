import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Profile } from "@/lib/database.types";

export interface SessionInfo {
  user: User;
  profile: Profile | null;
  isAdmin: boolean;
}

/** Reads the current user + profile row. Returns null when signed out. */
export async function getSession(): Promise<SessionInfo | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    return {
      user,
      profile: profile ?? null,
      isAdmin: profile?.role === "admin",
    };
  } catch (e) {
    console.error("[auth:getSession]", e);
    return null;
  }
}

/** Use in a Server Component that requires any authenticated user. */
export async function requireSession(): Promise<SessionInfo> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/** Use in the Financeiro module — admin only. */
export async function requireAdmin(): Promise<SessionInfo> {
  const session = await requireSession();
  if (!session.isAdmin) redirect("/painel?erro=acesso-negado");
  return session;
}
