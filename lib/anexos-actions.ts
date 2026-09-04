"use server";

import { revalidatePath } from "next/cache";
import { requireSession, requireAdmin, type SessionInfo } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { registrarAtividade } from "@/lib/atividades";
import type { AnexoEscopo } from "@/lib/database.types";

export interface AnexoState {
  ok?: boolean;
  error?: string;
}

const BUCKET = "anexos";
const FINANCEIRO: AnexoEscopo[] = ["conta_pagar", "conta_receber"];

const PATHS: Record<AnexoEscopo, string> = {
  obra: "/obras",
  licitacao: "/licitacoes",
  documento: "/documentos",
  fornecedor: "/fornecedores",
  conta_pagar: "/financeiro",
  conta_receber: "/financeiro",
};

function isEscopo(v: unknown): v is AnexoEscopo {
  return typeof v === "string" && v in PATHS;
}

async function guard(escopo: AnexoEscopo) {
  return FINANCEIRO.includes(escopo)
    ? await requireAdmin()
    : await requireSession();
}

/** Loga na linha do tempo quando o anexo é de uma licitação. */
async function logSeLicitacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: SessionInfo,
  escopo: AnexoEscopo,
  refId: string,
  descricao: string,
) {
  if (escopo !== "licitacao") return;
  const { data } = await supabase
    .from("licitacoes")
    .select("orgao, objeto")
    .eq("id", refId)
    .maybeSingle();
  await registrarAtividade(supabase, session, {
    licitacaoId: refId,
    label: data ? `${data.orgao} — ${data.objeto}`.slice(0, 120) : "licitação",
    acao: "anexo",
    descricao,
  });
  revalidatePath("/configuracoes/atividades");
}

/** Registra o metadado de um arquivo já enviado ao Storage pelo cliente. */
export async function registerAnexo(formData: FormData): Promise<AnexoState> {
  const escopo = formData.get("escopo");
  if (!isEscopo(escopo)) return { error: "Escopo inválido." };
  const session = await guard(escopo);

  const ref_id = String(formData.get("ref_id") ?? "");
  const nome = String(formData.get("nome") ?? "").trim();
  const caminho = String(formData.get("caminho") ?? "");
  const tamanho = Number(formData.get("tamanho") ?? 0) || 0;
  const tipo = String(formData.get("tipo") ?? "") || null;
  if (!ref_id || !nome || !caminho)
    return { error: "Dados do arquivo incompletos." };

  const supabase = await createClient();
  const { error } = await supabase.from("anexos").insert({
    escopo,
    ref_id,
    nome,
    caminho,
    tamanho,
    tipo,
    criado_por: session.user.id,
  });
  if (error) {
    await supabase.storage.from(BUCKET).remove([caminho]);
    return { error: error.message };
  }
  await logSeLicitacao(
    supabase,
    session,
    escopo,
    ref_id,
    `anexou o arquivo "${nome}"`,
  );
  revalidatePath(PATHS[escopo]);
  return { ok: true };
}

export async function removeAnexo(formData: FormData): Promise<void> {
  const escopo = formData.get("escopo");
  if (!isEscopo(escopo)) return;
  const session = await guard(escopo);

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();

  const { data } = await supabase
    .from("anexos")
    .select("caminho, ref_id, nome")
    .eq("id", id)
    .maybeSingle();
  if (data?.caminho) await supabase.storage.from(BUCKET).remove([data.caminho]);
  await supabase.from("anexos").delete().eq("id", id);
  if (data?.ref_id) {
    await logSeLicitacao(
      supabase,
      session,
      escopo,
      data.ref_id,
      `removeu o arquivo "${data.nome ?? ""}"`,
    );
  }
  revalidatePath(PATHS[escopo]);
}

/** URL assinada de curta duração para baixar um anexo. */
export async function getAnexoUrl(caminho: string): Promise<string | null> {
  await requireSession();
  if (!caminho) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(caminho, 120);
  return error ? null : data.signedUrl;
}
