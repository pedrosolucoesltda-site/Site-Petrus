"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/database.types";

export interface ActionState {
  ok?: string;
  error?: string;
}

function isRole(v: unknown): v is UserRole {
  return v === "admin" || v === "user";
}

/** Cria um usuário já confirmado (sem depender de e-mail/SMTP). */
export async function createUserAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY não configurada." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const role = formData.get("role");

  if (!email || !email.includes("@")) return { error: "E-mail inválido." };
  if (password.length < 8)
    return { error: "A senha precisa ter ao menos 8 caracteres." };
  if (!isRole(role)) return { error: "Papel inválido." };

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName || email },
  });

  if (error || !data.user) {
    return { error: error?.message ?? "Falha ao criar usuário." };
  }

  // O trigger handle_new_user já criou o profile; ajusta nome + papel.
  const { error: profErr } = await admin
    .from("profiles")
    .upsert(
      { id: data.user.id, full_name: fullName || email, role },
      { onConflict: "id" },
    );
  if (profErr) return { error: `Usuário criado, mas falhou ao definir o papel: ${profErr.message}` };

  revalidatePath("/usuarios");
  return { ok: `Usuário ${email} criado.` };
}

export async function setRoleAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return;

  const userId = String(formData.get("user_id") ?? "");
  const role = formData.get("role");
  if (!userId || !isRole(role)) return;
  if (userId === session.user.id) return; // não rebaixa a si mesmo

  await admin.from("profiles").update({ role }).eq("id", userId);
  revalidatePath("/usuarios");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return;

  const userId = String(formData.get("user_id") ?? "");
  if (!userId || userId === session.user.id) return; // não exclui a si mesmo

  await admin.auth.admin.deleteUser(userId);
  revalidatePath("/usuarios");
}

/** Remove o 2FA de um usuário (ex.: perdeu o celular). No próximo login ele
 *  cadastra um novo app autenticador. */
export async function reset2FAAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const admin = createAdminClient();
  if (!admin) return;

  const userId = String(formData.get("user_id") ?? "");
  if (!userId) return;

  const { data } = await admin.auth.admin.mfa.listFactors({ userId });
  for (const f of data?.factors ?? []) {
    await admin.auth.admin.mfa.deleteFactor({ userId, id: f.id });
  }
  revalidatePath("/usuarios");
}
