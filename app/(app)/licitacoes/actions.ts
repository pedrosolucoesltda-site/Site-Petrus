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

/* ---------------- arquivos (Storage) ---------------- */

const BUCKET = "licitacao-arquivos";

/** Registra o metadado de um arquivo já enviado ao Storage pelo cliente. */
export async function registerArquivo(formData: FormData): Promise<ActionState> {
  const session = await requireSession();
  const licitacao_id = String(formData.get("licitacao_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const caminho = String(formData.get("caminho") ?? "");
  const tamanho = Number(formData.get("tamanho") ?? 0) || 0;
  const tipo = String(formData.get("tipo") ?? "") || null;
  if (!licitacao_id || !nome || !caminho) return { error: "Dados do arquivo incompletos." };

  const supabase = await createClient();
  const { error } = await supabase.from("licitacao_arquivos").insert({
    licitacao_id,
    nome,
    caminho,
    tamanho,
    tipo,
    criado_por: session.user.id,
  });
  if (error) {
    // desfaz o upload órfão
    await supabase.storage.from(BUCKET).remove([caminho]);
    return { error: error.message };
  }
  revalidatePath("/licitacoes");
  return { ok: true };
}

export async function removeArquivo(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();

  const { data } = await supabase
    .from("licitacao_arquivos")
    .select("caminho")
    .eq("id", id)
    .maybeSingle();
  if (data?.caminho) {
    await supabase.storage.from(BUCKET).remove([data.caminho]);
  }
  await supabase.from("licitacao_arquivos").delete().eq("id", id);
  revalidatePath("/licitacoes");
}

/** URL assinada de curta duração para baixar um anexo. */
export async function getArquivoUrl(caminho: string): Promise<string | null> {
  await requireSession();
  if (!caminho) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, 120);
  if (error) return null;
  return data.signedUrl;
}
