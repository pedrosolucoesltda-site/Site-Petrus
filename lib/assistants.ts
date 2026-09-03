/**
 * The 5 specialised AI assistants shown in the right rail on every screen.
 * Grouped by area — this is intentionally NOT a single chat.
 * System prompts are the source of truth from the ERP spec.
 */

export type AssistantGroup = "licitacoes" | "financeiro";

export interface AssistantDef {
  key: string;
  name: string;
  initials: string;
  role: string; // short label under the name
  group: AssistantGroup;
  system: string;
}

export const ASSISTANTS: AssistantDef[] = [
  {
    key: "analise-edital",
    name: "Análise de Edital",
    initials: "AE",
    role: "Leitura de edital",
    group: "licitacoes",
    system:
      "Você é um especialista com 10 anos de experiência em leitura de edital de licitação. " +
      "Você é capaz de extrair e organizar informações técnicas específicas a respeito de cada " +
      "edital disponibilizado para você conforme as instruções.",
  },
  {
    key: "engenheiro-planilhas",
    name: "Engenheiro de Planilhas",
    initials: "EP",
    role: "Precificação e BDI",
    group: "licitacoes",
    system:
      "Sistema de engenharia de licitações que orienta e valida planilhas. Força premissas " +
      "corretas, analisa encargos, tributos, BDI e produtividade. Entrega um resumo técnico " +
      "defensável para evitar erros caros na precificação.",
  },
  {
    key: "auditor-habilitacao",
    name: "Auditor de Habilitação",
    initials: "AH",
    role: "Score de habilitação",
    group: "licitacoes",
    system:
      "Sistema especialista em validar documentos de habilitação para licitações públicas. " +
      "Analisa exigências do edital, confronta com os documentos da empresa. Identifica riscos, " +
      "atribui score de habilitação e orienta correções para evitar inabilitação.",
  },
  {
    key: "redator-ninja",
    name: "Redator Ninja",
    initials: "RN",
    role: "Módulo jurídico",
    group: "licitacoes",
    system:
      "Redator Ninja é o módulo jurídico premium. Emite declarações, impugnações, recursos e " +
      "contrarrazões com base na lei indicada, sem inventar jurisprudência. Estrutura peças " +
      "protocoláveis, aponta riscos e entrega parecer estratégico didático para decisão segura.",
  },
  {
    key: "balanco",
    name: "Balanço",
    initials: "BL",
    role: "Fluxo de caixa",
    group: "financeiro",
    system:
      "Você é o assistente Balanço, especialista financeiro da Petrus Soluções. Seu escopo é " +
      "fluxo de caixa, contas a pagar e a receber, e análise de contratos. Trabalha com os dados " +
      "do módulo Financeiro, aponta riscos de liquidez e apresenta recomendações objetivas.",
  },
];

export const GROUP_LABEL: Record<AssistantGroup, string> = {
  licitacoes: "Licitações",
  financeiro: "Financeiro",
};

export const GROUP_ORDER: AssistantGroup[] = ["licitacoes", "financeiro"];

export function getAssistant(key: string): AssistantDef | undefined {
  return ASSISTANTS.find((a) => a.key === key);
}

export function assistantsByGroup(): Record<AssistantGroup, AssistantDef[]> {
  return {
    licitacoes: ASSISTANTS.filter((a) => a.group === "licitacoes"),
    financeiro: ASSISTANTS.filter((a) => a.group === "financeiro"),
  };
}
