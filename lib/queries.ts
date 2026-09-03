import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { daysUntil } from "@/lib/format";
import type {
  ContaPagar,
  ContaReceber,
  Documento,
  Fornecedor,
  FornecedorCompra,
  Licitacao,
  LicitacaoChecklist,
  Obra,
} from "@/lib/database.types";

/* Small helper: run a select, log + return [] on error so pages degrade gracefully. */
async function safe<T>(
  run: () => PromiseLike<{ data: T[] | null; error: unknown }>,
  label: string,
): Promise<T[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const { data, error } = await run();
    if (error) {
      console.error(`[queries:${label}]`, error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error(`[queries:${label}]`, e);
    return [];
  }
}

/* ------------------------------------------------------------------ Obras */

export async function getObras(): Promise<Obra[]> {
  const supabase = await createClient();
  return safe<Obra>(
    () =>
      supabase.from("obras").select("*").order("data_entrega_prevista", {
        ascending: true,
        nullsFirst: false,
      }),
    "obras",
  );
}

export function obraProgressTone(o: Obra) {
  if (o.status === "atrasada") return "risk" as const;
  if (o.status === "atencao") return "alert" as const;
  return "positive" as const;
}

export function custoVariacaoPct(o: Obra): number {
  if (!o.orcamento) return 0;
  return ((o.custo_realizado - o.orcamento) / o.orcamento) * 100;
}

/* ------------------------------------------------------------------ Licitações */

export interface LicitacaoComChecklist extends Licitacao {
  checklist: LicitacaoChecklist[];
  docsEntregues: number;
  docsTotal: number;
}

export async function getLicitacoes(): Promise<LicitacaoComChecklist[]> {
  const supabase = await createClient();
  const [lics, checks] = await Promise.all([
    safe<Licitacao>(
      () =>
        supabase
          .from("licitacoes")
          .select("*")
          .order("prazo_envio", { ascending: true, nullsFirst: false }),
      "licitacoes",
    ),
    safe<LicitacaoChecklist>(
      () => supabase.from("licitacao_checklist").select("*"),
      "licitacao_checklist",
    ),
  ]);

  return lics.map((l) => {
    const checklist = checks.filter((c) => c.licitacao_id === l.id);
    return {
      ...l,
      checklist,
      docsEntregues: checklist.filter((c) => c.entregue).length,
      docsTotal: checklist.length,
    };
  });
}

/* ------------------------------------------------------------------ Financeiro */

export interface FinanceiroData {
  contasPagar: ContaPagar[];
  contasReceber: ContaReceber[];
  fluxo: { mes: string; entradas: number; saidas: number }[];
  obras: Obra[];
}

export async function getFinanceiro(): Promise<FinanceiroData> {
  const supabase = await createClient();
  const [contasPagar, contasReceber, fluxo, obras] = await Promise.all([
    safe<ContaPagar>(
      () =>
        supabase
          .from("contas_pagar")
          .select("*")
          .order("vencimento", { ascending: true }),
      "contas_pagar",
    ),
    safe<ContaReceber>(
      () =>
        supabase
          .from("contas_receber")
          .select("*")
          .order("vencimento", { ascending: true }),
      "contas_receber",
    ),
    safe<{ mes: string; entradas: number; saidas: number }>(
      () =>
        supabase
          .from("fluxo_caixa_mensal")
          .select("mes, entradas, saidas")
          .order("mes", { ascending: true }),
      "fluxo_caixa_mensal",
    ),
    getObras(),
  ]);

  return { contasPagar, contasReceber, fluxo, obras };
}

export function saldoEmCaixa(fluxo: { entradas: number; saidas: number }[]) {
  return fluxo.reduce((acc, f) => acc + f.entradas - f.saidas, 0);
}

export function saldoDeltaPct(fluxo: { entradas: number; saidas: number }[]) {
  if (fluxo.length < 2) return 0;
  const last = fluxo[fluxo.length - 1];
  const prev = fluxo[fluxo.length - 2];
  const lastNet = last.entradas - last.saidas;
  const prevNet = prev.entradas - prev.saidas;
  if (!prevNet) return 0;
  return ((lastNet - prevNet) / Math.abs(prevNet)) * 100;
}

export function somaJanela(
  contas: { valor: number; vencimento: string; status: string }[],
  dias: number,
) {
  return contas
    .filter((c) => c.status !== "pago")
    .filter((c) => {
      const d = daysUntil(c.vencimento);
      return d !== null && d <= dias;
    })
    .reduce((acc, c) => acc + c.valor, 0);
}

/* ------------------------------------------------------------------ Documentos */

export type DocumentoStatus = "valido" | "vencendo" | "vencido";

export interface DocumentoComStatus extends Documento {
  computedStatus: DocumentoStatus;
  obraNome: string | null;
  licitacaoObjeto: string | null;
}

export function documentoStatus(dataValidade: string | null): DocumentoStatus {
  if (!dataValidade) return "valido";
  const d = daysUntil(dataValidade);
  if (d === null) return "valido";
  if (d < 0) return "vencido";
  if (d < 30) return "vencendo";
  return "valido";
}

export async function getDocumentos(): Promise<DocumentoComStatus[]> {
  const supabase = await createClient();
  const [docs, obras, lics] = await Promise.all([
    safe<Documento>(
      () =>
        supabase
          .from("documentos")
          .select("*")
          .order("data_validade", { ascending: true, nullsFirst: false }),
      "documentos",
    ),
    getObras(),
    safe<Licitacao>(
      () => supabase.from("licitacoes").select("id, objeto"),
      "licitacoes-min",
    ),
  ]);

  const obraMap = new Map(obras.map((o) => [o.id, o.nome]));
  const licMap = new Map(lics.map((l) => [l.id, l.objeto]));

  return docs.map((d) => ({
    ...d,
    computedStatus: documentoStatus(d.data_validade),
    obraNome: d.obra_id ? (obraMap.get(d.obra_id) ?? null) : null,
    licitacaoObjeto: d.licitacao_id ? (licMap.get(d.licitacao_id) ?? null) : null,
  }));
}

/* ------------------------------------------------------------------ Fornecedores */

export interface FornecedorComResumo extends Fornecedor {
  totalComprado: number;
  ultimaCompra: string | null;
  obrasVinculadas: string[];
}

export async function getFornecedores(): Promise<FornecedorComResumo[]> {
  const supabase = await createClient();
  const [forns, compras, obras] = await Promise.all([
    safe<Fornecedor>(
      () => supabase.from("fornecedores").select("*").order("nome"),
      "fornecedores",
    ),
    safe<FornecedorCompra>(
      () => supabase.from("fornecedor_compras").select("*"),
      "fornecedor_compras",
    ),
    getObras(),
  ]);

  const obraMap = new Map(obras.map((o) => [o.id, o.nome]));

  return forns.map((f) => {
    const cs = compras.filter((c) => c.fornecedor_id === f.id);
    const obrasVinculadas = [
      ...new Set(
        cs
          .map((c) => (c.obra_id ? obraMap.get(c.obra_id) : null))
          .filter((n): n is string => Boolean(n)),
      ),
    ];
    const ultimaCompra =
      cs.length > 0
        ? cs.map((c) => c.data).sort().at(-1) ?? null
        : null;
    return {
      ...f,
      totalComprado: cs.reduce((acc, c) => acc + c.valor, 0),
      ultimaCompra,
      obrasVinculadas,
    };
  });
}

/* ------------------------------------------------------------------ Painel geral */

export async function getPainel() {
  const [obras, licitacoes, fin] = await Promise.all([
    getObras(),
    getLicitacoes(),
    getFinanceiro(),
  ]);

  const obrasAndamento = obras.filter((o) => o.progresso_pct < 100);
  const obrasCriticas = obras.filter(
    (o) => o.status === "atencao" || o.status === "atrasada",
  );
  const licitacoesAbertas = licitacoes.filter((l) => l.fase !== "resultado");
  const licitacoesUrgentes = licitacoesAbertas.filter((l) => {
    const d = daysUntil(l.prazo_envio);
    return d !== null && d >= 0 && d <= 3;
  });
  const editaisEmAnalise = licitacoes.filter((l) => l.fase === "em_analise");
  const obrasConcluidas = obras.filter((o) => o.progresso_pct >= 100);
  const licitacoesVencedoras = licitacoes.filter(
    (l) => l.resultado === "vencedor",
  );

  const proximoPrazo =
    licitacoesAbertas
      .filter((l) => l.prazo_envio)
      .map((l) => l.prazo_envio as string)
      .sort()
      .at(0) ?? null;

  return {
    obras,
    obrasAndamento,
    obrasConcluidas,
    obrasCriticas,
    licitacoesAbertas,
    licitacoesUrgentes,
    licitacoesVencedoras,
    editaisEmAnalise,
    proximoPrazo,
    saldo: saldoEmCaixa(fin.fluxo),
    saldoDelta: saldoDeltaPct(fin.fluxo),
    temFinanceiro: fin.fluxo.length > 0,
  };
}
