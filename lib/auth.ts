import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, isDemoMode } from "@/lib/env";
import type { Profile } from "@/lib/database.types";

/** Sessão fictícia usada no modo demonstração (sem login, papel de admin). */
const DEMO_SESSION: SessionInfo = {
  user: { id: "demo-user", email: "demo@petrus.local" } as User,
  profile: {
    id: "demo-user",
    full_name: "Visitante (demo)",
    role: "admin",
    created_at: new Date().toISOString(),
  },
  isAdmin: true,
};

export interface SessionInfo {
  user: User;
  profile: Profile | null;
  isAdmin: boolean;
}

/** Reads the current user + profile row. Returns null when signed out. */
export async function getSession(): Promise<SessionInfo | null> {
  if (isDemoMode) return DEMO_SESSION;
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

/**
 * Nível de garantia da autenticação (AAL).
 * - "aal2"  → passou pelo segundo fator (2FA)
 * - "aal1"  → só e-mail/senha; precisa completar o 2FA
 * `hasFactor` diz se o usuário já cadastrou um app autenticador verificado.
 */
export async function getAAL(): Promise<{
  level: "aal1" | "aal2";
  hasFactor: boolean;
}> {
  if (isDemoMode || !isSupabaseConfigured)
    return { level: "aal2", hasFactor: true };
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    return {
      level: data?.currentLevel === "aal2" ? "aal2" : "aal1",
      hasFactor: data?.nextLevel === "aal2",
    };
  } catch (e) {
    console.error("[auth:getAAL]", e);
    // fail-open: um erro transitório no endpoint de MFA não deve travar o acesso
    return { level: "aal2", hasFactor: true };
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
