"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  LicitacaoModalidade,
  LicitacaoResultado,
  LicitacaoStatus,
} from "@/lib/database.types";

export interface ActionState {
  ok?: boolean;
  error?: string;
}

const STATUSES: LicitacaoStatus[] = [
  "aberta",
  "em_proposta",
  "aguardando_julgamento",
  "selecao_fornecedores",
  "resultado",
];
const MODALIDADES: LicitacaoModalidade[] = [
  "concorrencia_eletronica",
  "concorrencia_presencial",
  "pregao_eletronico",
  "pregao_presencial",
  "dispensa_eletronica",
  "tomada_de_precos",
  "credenciamento",
  "outras",
];

function parseValor(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").replace(/[R$\s.]/g, "").replace(",", ".");
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function fieldsFromForm(formData: FormData) {
  const modalidade = String(
    formData.get("modalidade") ?? "outras",
  ) as LicitacaoModalidade;
  const status = String(formData.get("status") ?? "aberta") as LicitacaoStatus;
  const rawResultado = String(formData.get("resultado") ?? "");
  const rawClass = String(formData.get("classificacao") ?? "").trim();
  const dataDisputa = String(formData.get("data_disputa") ?? "");

  return {
    orgao: String(formData.get("orgao") ?? "").trim(),
    objeto: String(formData.get("objeto") ?? "").trim(),
    processo: String(formData.get("processo") ?? "").trim() || null,
    modalidade: MODALIDADES.includes(modalidade) ? modalidade : "outras",
    modalidade_numero:
      String(formData.get("modalidade_numero") ?? "").trim() || null,
    uf: String(formData.get("uf") ?? "").trim().toUpperCase().slice(0, 2) || null,
    valor_estimado: parseValor(formData.get("valor_estimado")) ?? 0,
    valor_proposta: parseValor(formData.get("valor_proposta")),
    classificacao: rawClass && Number(rawClass) >= 1 ? Number(rawClass) : null,
    data_disputa: dataDisputa ? new Date(dataDisputa).toISOString() : null,
    status: STATUSES.includes(status) ? status : "aberta",
    resultado:
      status === "resultado" &&
      (rawResultado === "vencedor" || rawResultado === "perdido")
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
  revalidatePath("/painel");
  return { ok: true };
}

export async function updateLicitacao(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Licitação não identificada." };
  const f = fieldsFromForm(formData);
  if (!f.orgao || !f.objeto) return { error: "Órgão e objeto são obrigatórios." };

  const supabase = await createClient();
  const { error } = await supabase.from("licitacoes").update(f).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/licitacoes");
  revalidatePath("/painel");
  return { ok: true };
}

/** Mudança rápida de status a partir da tabela. */
export async function setLicitacaoStatus(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LicitacaoStatus;
  if (!id || !STATUSES.includes(status)) return;
  const supabase = await createClient();
  await supabase
    .from("licitacoes")
    .update({ status, resultado: status === "resultado" ? undefined : null })
    .eq("id", id);
  revalidatePath("/licitacoes");
  revalidatePath("/painel");
}

export async function deleteLicitacao(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("licitacoes").delete().eq("id", id);
  revalidatePath("/licitacoes");
  revalidatePath("/painel");
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
