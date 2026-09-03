"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ObraStatus } from "@/lib/database.types";

export interface ObraActionState {
  ok?: boolean;
  error?: string;
}

const STATUS: ObraStatus[] = ["em_dia", "atencao", "atrasada"];

function num(raw: FormDataEntryValue | null): number {
  const s = String(raw ?? "")
    .replace(/[R$\s.]/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function fields(formData: FormData) {
  const status = String(formData.get("status") ?? "em_dia") as ObraStatus;
  const prog = Math.round(num(formData.get("progresso_pct")));
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    cidade_uf: String(formData.get("cidade_uf") ?? "").trim(),
    status: STATUS.includes(status) ? status : "em_dia",
    progresso_pct: Math.max(0, Math.min(100, prog)),
    responsavel: String(formData.get("responsavel") ?? "").trim() || null,
    data_entrega_prevista:
      String(formData.get("data_entrega_prevista") ?? "") || null,
    orcamento: num(formData.get("orcamento")),
    custo_realizado: num(formData.get("custo_realizado")),
  };
}

export async function createObra(
  _prev: ObraActionState,
  formData: FormData,
): Promise<ObraActionState> {
  await requireSession();
  const f = fields(formData);
  if (!f.nome) return { error: "O nome da obra é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("obras").insert(f);
  if (error) return { error: error.message };
  revalidatePath("/obras");
  revalidatePath("/painel");
  return { ok: true };
}

export async function updateObra(
  _prev: ObraActionState,
  formData: FormData,
): Promise<ObraActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Obra não identificada." };
  const f = fields(formData);
  if (!f.nome) return { error: "O nome da obra é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("obras").update(f).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/obras");
  revalidatePath("/painel");
  return { ok: true };
}

export async function deleteObra(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("obras").delete().eq("id", id);
  revalidatePath("/obras");
  revalidatePath("/painel");
}
