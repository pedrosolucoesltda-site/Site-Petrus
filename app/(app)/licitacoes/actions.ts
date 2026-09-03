"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { LicitacaoFase, LicitacaoResultado } from "@/lib/database.types";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

const FASES: LicitacaoFase[] = [
  "em_analise",
  "documentacao",
  "enviado",
  "resultado",
];

function parseValor(raw: FormDataEntryValue | null): number {
  const s = String(raw ?? "")
    .replace(/[R$\s.]/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function fieldsFromForm(formData: FormData) {
  const fase = String(formData.get("fase") ?? "em_analise") as LicitacaoFase;
  const rawResultado = String(formData.get("resultado") ?? "");
  return {
    orgao: String(formData.get("orgao") ?? "").trim(),
    objeto: String(formData.get("objeto") ?? "").trim(),
    valor_estimado: parseValor(formData.get("valor_estimado")),
    prazo_envio: String(formData.get("prazo_envio") ?? "") || null,
    fase: FASES.includes(fase) ? fase : "em_analise",
    resultado:
      fase === "resultado" && (rawResultado === "vencedor" || rawResultado === "perdido")
        ? (rawResultado as LicitacaoResultado)
        : null,
  };
}

export async function createLicitacao(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const f = fieldsFromForm(formData);
  if (!f.orgao || !f.objeto) return { error: "Órgão e objeto são obrigatórios." };

  const supabase = await createClient();
  const { error } = await supabase.from("licitacoes").insert(f);
  if (error) return { error: error.message };

  revalidatePath("/licitacoes");
  return { ok: true };
}

export async function updateLicitacao(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Edital não identificado." };
  const f = fieldsFromForm(formData);
  if (!f.orgao || !f.objeto) return { error: "Órgão e objeto são obrigatórios." };

  const supabase = await createClient();
  const { error } = await supabase.from("licitacoes").update(f).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/licitacoes");
  return { ok: true };
}

/** Movimento rápido no funil (arrastar entre colunas). */
export async function moveLicitacaoFase(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const fase = String(formData.get("fase") ?? "") as LicitacaoFase;
  if (!id || !FASES.includes(fase)) return;

  const supabase = await createClient();
  await supabase
    .from("licitacoes")
    .update({ fase, resultado: fase === "resultado" ? undefined : null })
    .eq("id", id);
  revalidatePath("/licitacoes");
}

export async function deleteLicitacao(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("licitacoes").delete().eq("id", id);
  revalidatePath("/licitacoes");
}

/* ---------------- checklist ---------------- */

export async function addChecklistItem(formData: FormData): Promise<void> {
  await requireSession();
  const licitacao_id = String(formData.get("licitacao_id") ?? "");
  const documento_exigido = String(formData.get("documento_exigido") ?? "").trim();
  if (!licitacao_id || !documento_exigido) return;
  const supabase = await createClient();
  await supabase
    .from("licitacao_checklist")
    .insert({ licitacao_id, documento_exigido, entregue: false });
  revalidatePath("/licitacoes");
}

export async function toggleChecklistItem(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const entregue = String(formData.get("entregue") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("licitacao_checklist").update({ entregue }).eq("id", id);
  revalidatePath("/licitacoes");
}

export async function removeChecklistItem(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("licitacao_checklist").delete().eq("id", id);
  revalidatePath("/licitacoes");
}
