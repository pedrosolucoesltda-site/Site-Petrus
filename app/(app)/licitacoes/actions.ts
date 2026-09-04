"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { registrarAtividade } from "@/lib/atividades";
import { STATUS_LABEL } from "@/lib/licitacoes";
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

const labelDe = (orgao: string, objeto: string) =>
  `${orgao} — ${objeto}`.slice(0, 120);

export async function createLicitacao(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const f = fieldsFromForm(formData);
  if (!f.orgao || !f.objeto) return { error: "Órgão e objeto são obrigatórios." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("licitacoes")
    .insert(f)
    .select("id")
    .single();
  if (error) return { error: error.message };

  await registrarAtividade(supabase, session, {
    licitacaoId: data?.id ?? null,
    label: labelDe(f.orgao, f.objeto),
    acao: "criou",
    descricao: `cadastrou a licitação (${STATUS_LABEL[f.status]})`,
  });

  revalidatePath("/licitacoes");
  revalidatePath("/painel");
  revalidatePath("/configuracoes/atividades");
  return { ok: true };
}

export async function updateLicitacao(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Licitação não identificada." };
  const f = fieldsFromForm(formData);
  if (!f.orgao || !f.objeto) return { error: "Órgão e objeto são obrigatórios." };

  const supabase = await createClient();
  const { data: antes } = await supabase
    .from("licitacoes")
    .select("status, resultado")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("licitacoes").update(f).eq("id", id);
  if (error) return { error: error.message };

  const label = labelDe(f.orgao, f.objeto);
  if (antes && antes.status !== f.status) {
    await registrarAtividade(supabase, session, {
      licitacaoId: id,
      label,
      acao: "moveu",
      descricao: `mudou o status de "${STATUS_LABEL[antes.status as LicitacaoStatus]}" para "${STATUS_LABEL[f.status]}"`,
    });
  } else if (
    f.status === "resultado" &&
    f.resultado &&
    antes?.resultado !== f.resultado
  ) {
    await registrarAtividade(supabase, session, {
      licitacaoId: id,
      label,
      acao: "resultado",
      descricao: `registrou o resultado: ${f.resultado === "vencedor" ? "VENCEDOR" : "perdido"}`,
    });
  } else {
    await registrarAtividade(supabase, session, {
      licitacaoId: id,
      label,
      acao: "editou",
      descricao: "editou os dados da licitação",
    });
  }

  revalidatePath("/licitacoes");
  revalidatePath("/painel");
  revalidatePath("/configuracoes/atividades");
  return { ok: true };
}

/** Mudança rápida de status a partir da tabela. */
export async function setLicitacaoStatus(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LicitacaoStatus;
  if (!id || !STATUSES.includes(status)) return;

  const supabase = await createClient();
  const { data: lic } = await supabase
    .from("licitacoes")
    .select("orgao, objeto, status")
    .eq("id", id)
    .maybeSingle();

  await supabase
    .from("licitacoes")
    .update({ status, resultado: status === "resultado" ? undefined : null })
    .eq("id", id);

  if (lic) {
    await registrarAtividade(supabase, session, {
      licitacaoId: id,
      label: labelDe(lic.orgao, lic.objeto),
      acao: "moveu",
      descricao: `mudou o status de "${STATUS_LABEL[lic.status as LicitacaoStatus]}" para "${STATUS_LABEL[status]}"`,
    });
  }
  revalidatePath("/licitacoes");
  revalidatePath("/painel");
  revalidatePath("/configuracoes/atividades");
}

export async function deleteLicitacao(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = await createClient();
  const { data: lic } = await supabase
    .from("licitacoes")
    .select("orgao, objeto")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("licitacoes").delete().eq("id", id);

  await registrarAtividade(supabase, session, {
    licitacaoId: null,
    label: lic ? labelDe(lic.orgao, lic.objeto) : "licitação removida",
    acao: "excluiu",
    descricao: "excluiu a licitação",
  });
  revalidatePath("/licitacoes");
  revalidatePath("/painel");
  revalidatePath("/configuracoes/atividades");
}

/* ---------------- checklist ---------------- */

async function labelLicitacao(
  supabase: Awaited<ReturnType<typeof createClient>>,
  licitacaoId: string,
): Promise<string> {
  const { data } = await supabase
    .from("licitacoes")
    .select("orgao, objeto")
    .eq("id", licitacaoId)
    .maybeSingle();
  return data ? labelDe(data.orgao, data.objeto) : "licitação";
}

export async function addChecklistItem(formData: FormData): Promise<void> {
  const session = await requireSession();
  const licitacao_id = String(formData.get("licitacao_id") ?? "");
  const documento_exigido = String(formData.get("documento_exigido") ?? "").trim();
  if (!licitacao_id || !documento_exigido) return;
  const supabase = await createClient();
  await supabase
    .from("licitacao_checklist")
    .insert({ licitacao_id, documento_exigido, entregue: false });

  await registrarAtividade(supabase, session, {
    licitacaoId: licitacao_id,
    label: await labelLicitacao(supabase, licitacao_id),
    acao: "checklist",
    descricao: `adicionou "${documento_exigido}" ao checklist`,
  });
  revalidatePath("/licitacoes");
  revalidatePath("/configuracoes/atividades");
}

export async function toggleChecklistItem(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  const entregue = String(formData.get("entregue") ?? "") === "true";
  if (!id) return;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("licitacao_checklist")
    .select("documento_exigido, licitacao_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("licitacao_checklist").update({ entregue }).eq("id", id);

  if (item) {
    await registrarAtividade(supabase, session, {
      licitacaoId: item.licitacao_id,
      label: await labelLicitacao(supabase, item.licitacao_id),
      acao: "checklist",
      descricao: `${entregue ? "marcou" : "desmarcou"} "${item.documento_exigido}" no checklist`,
    });
  }
  revalidatePath("/licitacoes");
  revalidatePath("/configuracoes/atividades");
}

export async function removeChecklistItem(formData: FormData): Promise<void> {
  const session = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("licitacao_checklist")
    .select("documento_exigido, licitacao_id")
    .eq("id", id)
    .maybeSingle();

  await supabase.from("licitacao_checklist").delete().eq("id", id);

  if (item) {
    await registrarAtividade(supabase, session, {
      licitacaoId: item.licitacao_id,
      label: await labelLicitacao(supabase, item.licitacao_id),
      acao: "checklist",
      descricao: `removeu "${item.documento_exigido}" do checklist`,
    });
  }
  revalidatePath("/licitacoes");
  revalidatePath("/configuracoes/atividades");
}
