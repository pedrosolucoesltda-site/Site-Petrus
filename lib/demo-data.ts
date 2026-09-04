/**
 * Dados de demonstração em memória — espelham supabase/seed.sql.
 * Usados quando o Supabase ainda não está configurado (modo demonstração),
 * para que o site rode com todas as telas populadas sem back-end.
 */

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

/** ISO date (YYYY-MM-DD) deslocada em `days` a partir de hoje. */
function d(days: number): string {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Primeiro dia do mês, deslocado em `months`. */
function monthStart(months: number): string {
  const dt = new Date();
  dt.setDate(1);
  dt.setMonth(dt.getMonth() + months);
  return dt.toISOString().slice(0, 10);
}

const nowIso = new Date().toISOString();

/* ------------------------------------------------------------------ Obras */

const O = (n: number) => `a0000000-0000-4000-8000-00000000000${n}`;

export const obras: Obra[] = [
  {
    id: O(1),
    nome: "Residencial Bosque Verde",
    cidade_uf: "Niterói, RJ",
    status: "em_dia",
    progresso_pct: 72,
    responsavel: "Lucas Cardoso",
    data_entrega_prevista: d(120),
    orcamento: 4_100_000,
    custo_realizado: 2_831_000,
    created_at: nowIso,
  },
  {
    id: O(2),
    nome: "Galpão Industrial Zona Oeste",
    cidade_uf: "Rio de Janeiro, RJ",
    status: "atencao",
    progresso_pct: 41,
    responsavel: "Marina Rocha",
    data_entrega_prevista: d(210),
    orcamento: 2_600_000,
    custo_realizado: 1_107_000,
    created_at: nowIso,
  },
  {
    id: O(3),
    nome: "Reforma Sede Administrativa",
    cidade_uf: "Duque de Caxias, RJ",
    status: "em_dia",
    progresso_pct: 88,
    responsavel: "Paulo Siqueira",
    data_entrega_prevista: d(55),
    orcamento: 890_000,
    custo_realizado: 766_000,
    created_at: nowIso,
  },
  {
    id: O(4),
    nome: "Condomínio Vista do Mar",
    cidade_uf: "São Gonçalo, RJ",
    status: "em_dia",
    progresso_pct: 19,
    responsavel: "Lucas Cardoso",
    data_entrega_prevista: d(300),
    orcamento: 5_400_000,
    custo_realizado: 1_018_000,
    created_at: nowIso,
  },
  {
    id: O(5),
    nome: "Escola Municipal Jardim das Flores",
    cidade_uf: "Itaboraí, RJ",
    status: "atrasada",
    progresso_pct: 34,
    responsavel: "Marina Rocha",
    data_entrega_prevista: d(25),
    orcamento: 1_900_000,
    custo_realizado: 694_000,
    created_at: nowIso,
  },
  {
    id: O(6),
    nome: "Ampliação CEDAE — ETE Alegria",
    cidade_uf: "Rio de Janeiro, RJ",
    status: "em_dia",
    progresso_pct: 56,
    responsavel: "Paulo Siqueira",
    data_entrega_prevista: d(165),
    orcamento: 3_200_000,
    custo_realizado: 1_765_000,
    created_at: nowIso,
  },
];

/* ------------------------------------------------------------------ Licitações */

const L = (n: number) => `b0000000-0000-4000-8000-00000000000${n}`;

function lic(
  n: number,
  o: Omit<Licitacao, "id" | "created_at" | "prazo_envio" | "data_disputa"> & {
    dias: number;
  },
): Licitacao {
  const { dias, ...rest } = o;
  const date = d(dias);
  return {
    ...rest,
    id: L(n),
    prazo_envio: date,
    data_disputa: `${date}T09:00:00`,
    created_at: nowIso,
  };
}

export const licitacoes: Licitacao[] = [
  lic(1, {
    orgao: "Prefeitura de Niterói",
    objeto: "Pavimentação — Bairro Fonseca",
    processo: "PMN 024/2026",
    modalidade: "concorrencia_eletronica",
    modalidade_numero: "Concorrência Eletrônica 024/2026",
    uf: "RJ",
    valor_estimado: 3_200_000,
    valor_proposta: null,
    classificacao: null,
    status: "aberta",
    resultado: null,
    dias: 3,
  }),
  lic(2, {
    orgao: "DER-RJ",
    objeto: "Recuperação de via — RJ-104",
    processo: "DER 104/2026",
    modalidade: "concorrencia_eletronica",
    modalidade_numero: "Concorrência Eletrônica 104/2026",
    uf: "RJ",
    valor_estimado: 5_800_000,
    valor_proposta: 4_640_000,
    classificacao: null,
    status: "em_proposta",
    resultado: null,
    dias: 11,
  }),
  lic(3, {
    orgao: "Governo do Estado",
    objeto: "Reforma escolar — Zona Norte",
    processo: "GOV 1003/2026",
    modalidade: "concorrencia_presencial",
    modalidade_numero: "Concorrência Presencial 1.003/2026",
    uf: "RJ",
    valor_estimado: 2_100_000,
    valor_proposta: null,
    classificacao: null,
    status: "aberta",
    resultado: null,
    dias: 19,
  }),
  lic(4, {
    orgao: "Prefeitura de São Gonçalo",
    objeto: "Drenagem — Centro",
    processo: "PMSG 011/2026",
    modalidade: "concorrencia_eletronica",
    modalidade_numero: "Concorrência Eletrônica 011/2026",
    uf: "RJ",
    valor_estimado: 4_000_000,
    valor_proposta: 3_720_000,
    classificacao: null,
    status: "selecao_fornecedores",
    resultado: null,
    dias: 8,
  }),
  lic(5, {
    orgao: "CEDAE",
    objeto: "Manutenção de rede — Zona Sul",
    processo: "CEDAE 037/2026",
    modalidade: "pregao_eletronico",
    modalidade_numero: "Pregão Eletrônico 037/2026",
    uf: "RJ",
    valor_estimado: 1_600_000,
    valor_proposta: 1_488_000,
    classificacao: 2,
    status: "aguardando_julgamento",
    resultado: null,
    dias: -1,
  }),
  lic(6, {
    orgao: "Prefeitura de Itaboraí",
    objeto: "Construção de creche municipal",
    processo: "PMI 002/2026",
    modalidade: "concorrencia_eletronica",
    modalidade_numero: "Concorrência Eletrônica 002/2026",
    uf: "RJ",
    valor_estimado: 2_900_000,
    valor_proposta: 2_712_000,
    classificacao: 1,
    status: "resultado",
    resultado: "vencedor",
    dias: -10,
  }),
];

const DOCS_HABILITACAO = [
  "Certidão Negativa de Débitos Federais",
  "Certidão FGTS (CRF)",
  "Certidão Trabalhista (CNDT)",
  "Atestado de Capacidade Técnica",
  "Balanço Patrimonial",
  "Contrato Social",
  "ART de responsável técnico",
  "Registro no CREA",
  "Seguro-garantia",
  "Declaração de idoneidade",
];

/** Gera um checklist com `total` documentos, `entregues` marcados. */
function checklist(
  licId: string,
  total: number,
  entregues: number,
): LicitacaoChecklist[] {
  return Array.from({ length: total }, (_, i) => ({
    id: `${licId}-chk-${i}`,
    licitacao_id: licId,
    documento_exigido: DOCS_HABILITACAO[i % DOCS_HABILITACAO.length],
    entregue: i < entregues,
  }));
}

export const licitacaoChecklist: LicitacaoChecklist[] = [
  ...checklist(L(1), 5, 1),
  ...checklist(L(2), 5, 2),
  ...checklist(L(3), 5, 1),
  ...checklist(L(4), 10, 7),
  ...checklist(L(5), 10, 10),
];

/* ------------------------------------------------------------------ Financeiro */

export const contasPagar: ContaPagar[] = [
  {
    id: "cp-1",
    fornecedor: "Concreteira Rio Sul",
    descricao: "Concreto usinado — Bosque Verde",
    valor: 42_300,
    vencimento: d(-2),
    status: "vencido",
    created_at: nowIso,
  },
  {
    id: "cp-2",
    fornecedor: "Folha de pagamento",
    descricao: "Equipe de obras — competência do mês",
    valor: 118_000,
    vencimento: d(4),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cp-3",
    fornecedor: "Equipa Locação",
    descricao: "Aluguel de equipamentos — Zona Oeste",
    valor: 26_900,
    vencimento: d(9),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cp-4",
    fornecedor: "Aço Fluminense",
    descricao: "Vergalhões e telas — Reforma Sede",
    valor: 31_500,
    vencimento: d(16),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cp-5",
    fornecedor: "Energia — concessionária",
    descricao: "Consumo canteiro de obras",
    valor: 8_700,
    vencimento: d(21),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cp-6",
    fornecedor: "Mão de Obra Fluminense",
    descricao: "Empreitada de alvenaria — Bosque Verde",
    valor: 64_000,
    vencimento: d(-20),
    status: "pago",
    created_at: nowIso,
  },
];

export const contasReceber: ContaReceber[] = [
  {
    id: "cr-1",
    obra_id: O(1),
    descricao: "Medição 7 — Residencial Bosque Verde",
    valor: 185_000,
    vencimento: d(6),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cr-2",
    obra_id: O(3),
    descricao: "Medição final — Reforma Sede Administrativa",
    valor: 96_000,
    vencimento: d(12),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cr-3",
    obra_id: O(6),
    descricao: "Medição 4 — Ampliação CEDAE",
    valor: 142_000,
    vencimento: d(18),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cr-4",
    obra_id: O(2),
    descricao: "Medição 3 — Galpão Industrial Zona Oeste",
    valor: 63_000,
    vencimento: d(25),
    status: "a_vencer",
    created_at: nowIso,
  },
  {
    id: "cr-5",
    obra_id: O(5),
    descricao: "Medição 2 — Escola Municipal",
    valor: 48_000,
    vencimento: d(-5),
    status: "vencido",
    created_at: nowIso,
  },
];

export const fluxoCaixa = [
  { mes: monthStart(-4), entradas: 720_000, saidas: 540_000 },
  { mes: monthStart(-3), entradas: 610_000, saidas: 655_000 },
  { mes: monthStart(-2), entradas: 880_000, saidas: 560_000 },
  { mes: monthStart(-1), entradas: 760_000, saidas: 610_000 },
  { mes: monthStart(0), entradas: 880_000, saidas: 720_000 },
];

/* ------------------------------------------------------------------ Fornecedores */

const F = (n: number) => `c0000000-0000-4000-8000-00000000000${n}`;

export const fornecedores: Fornecedor[] = [
  {
    id: F(1),
    nome: "Concreteira Rio Sul",
    categoria: "material",
    contato: "(21) 3344-9012",
    avaliacao: 4,
    created_at: nowIso,
  },
  {
    id: F(2),
    nome: "Equipa Locação de Máquinas",
    categoria: "equipamento",
    contato: "(21) 2233-7788",
    avaliacao: 3,
    created_at: nowIso,
  },
  {
    id: F(3),
    nome: "Mão de Obra Fluminense Ltda",
    categoria: "mao_de_obra",
    contato: "(21) 99887-1234",
    avaliacao: 5,
    created_at: nowIso,
  },
  {
    id: F(4),
    nome: "Aço Fluminense Distribuidora",
    categoria: "material",
    contato: "(24) 3322-5566",
    avaliacao: 4,
    created_at: nowIso,
  },
  {
    id: F(5),
    nome: "TopGrua Locações",
    categoria: "equipamento",
    contato: "(21) 3399-4410",
    avaliacao: 2,
    created_at: nowIso,
  },
  {
    id: F(6),
    nome: "Britagem Serra Azul",
    categoria: "material",
    contato: "(21) 3130-4455",
    avaliacao: 4,
    created_at: nowIso,
  },
  {
    id: F(7),
    nome: "Elétrica Predial RJ",
    categoria: "mao_de_obra",
    contato: "(21) 98123-7766",
    avaliacao: 3,
    created_at: nowIso,
  },
];

export const fornecedorCompras: FornecedorCompra[] = [
  { id: "fc-1", fornecedor_id: F(1), obra_id: O(1), valor: 286_200, data: d(-15) },
  { id: "fc-2", fornecedor_id: F(1), obra_id: O(2), valor: 200_000, data: d(-45) },
  { id: "fc-3", fornecedor_id: F(2), obra_id: O(2), valor: 118_900, data: d(-8) },
  { id: "fc-4", fornecedor_id: F(3), obra_id: O(1), valor: 402_000, data: d(-4) },
  { id: "fc-5", fornecedor_id: F(3), obra_id: O(3), valor: 300_000, data: d(-30) },
  { id: "fc-6", fornecedor_id: F(3), obra_id: O(2), valor: 200_000, data: d(-60) },
  { id: "fc-7", fornecedor_id: F(4), obra_id: O(3), valor: 214_500, data: d(-21) },
  { id: "fc-8", fornecedor_id: F(5), obra_id: O(1), valor: 76_400, data: d(-60) },
];

/* ------------------------------------------------------------------ Documentos */

export const documentos: Documento[] = [
  {
    id: "dc-1",
    nome: "Contrato Social consolidado",
    categoria: "societario",
    obra_id: null,
    licitacao_id: null,
    data_validade: null,
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-2",
    nome: "Certidão Negativa de Débitos Federais",
    categoria: "certidoes",
    obra_id: null,
    licitacao_id: null,
    data_validade: d(12),
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-3",
    nome: "Certidão FGTS (CRF)",
    categoria: "certidoes",
    obra_id: null,
    licitacao_id: null,
    data_validade: d(3),
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-4",
    nome: "Certidão Trabalhista (CNDT)",
    categoria: "certidoes",
    obra_id: null,
    licitacao_id: null,
    data_validade: d(-4),
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-5",
    nome: "Balanço Patrimonial 2025",
    categoria: "societario",
    obra_id: null,
    licitacao_id: null,
    data_validade: null,
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-6",
    nome: "ART — Residencial Bosque Verde",
    categoria: "arts_rrts",
    obra_id: O(1),
    licitacao_id: null,
    data_validade: d(200),
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-7",
    nome: "ART — Reforma Sede Administrativa",
    categoria: "arts_rrts",
    obra_id: O(3),
    licitacao_id: null,
    data_validade: d(40),
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-8",
    nome: "Contrato de execução — Bosque Verde",
    categoria: "contratos",
    obra_id: O(1),
    licitacao_id: null,
    data_validade: null,
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-9",
    nome: "Contrato de execução — Galpão Zona Oeste",
    categoria: "contratos",
    obra_id: O(2),
    licitacao_id: null,
    data_validade: null,
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-10",
    nome: "Edital assinado — Creche Itaboraí",
    categoria: "licitacoes",
    obra_id: null,
    licitacao_id: L(6),
    data_validade: null,
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-11",
    nome: "Proposta técnica — Drenagem São Gonçalo",
    categoria: "licitacoes",
    obra_id: null,
    licitacao_id: L(4),
    data_validade: null,
    arquivo_url: null,
    created_at: nowIso,
  },
  {
    id: "dc-12",
    nome: "Diário de obra — Escola Municipal",
    categoria: "obras",
    obra_id: O(5),
    licitacao_id: null,
    data_validade: null,
    arquivo_url: null,
    created_at: nowIso,
  },
];
