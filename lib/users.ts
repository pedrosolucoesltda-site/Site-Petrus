import { createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export interface ManagedUser {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  last_sign_in_at: string | null;
  confirmed: boolean;
}

/**
 * Lista todos os usuários combinando `auth.users` (e-mail, último acesso) com
 * `public.profiles` (nome, papel). Server-only — usa a service role key.
 */
export async function listManagedUsers(): Promise<ManagedUser[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const [{ data: authData, error: authErr }, { data: profiles, error: profErr }] =
    await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
      admin.from("profiles").select("id, full_name, role, created_at"),
    ]);

  if (authErr) console.error("[users:listUsers]", authErr);
  if (profErr) console.error("[users:profiles]", profErr);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, p]),
  );

  return (authData?.users ?? [])
    .map((u): ManagedUser => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email ?? null,
        full_name: p?.full_name ?? null,
        role: (p?.role as UserRole) ?? "user",
        created_at: p?.created_at ?? u.created_at,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed: Boolean(u.email_confirmed_at),
      };
    })
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}
