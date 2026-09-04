import { daysUntil } from "@/lib/format";
import type {
  Licitacao,
  LicitacaoModalidade,
  LicitacaoStatus,
} from "@/lib/database.types";

/** Rótulos e helpers de Licitações — puros, seguros em client components. */

export const STATUS_LABEL: Record<LicitacaoStatus, string> = {
  aberta: "Aberta",
  em_proposta: "Em proposta",
  aguardando_julgamento: "Aguardando julgamento",
  selecao_fornecedores: "Seleção de fornecedores",
  resultado: "Resultado",
};

export const STATUS_ORDER: LicitacaoStatus[] = [
  "aberta",
  "em_proposta",
  "aguardando_julgamento",
  "selecao_fornecedores",
  "resultado",
];

export const MODALIDADE_LABEL: Record<LicitacaoModalidade, string> = {
  concorrencia_eletronica: "Concorrência Eletrônica",
  concorrencia_presencial: "Concorrência Presencial",
  pregao_eletronico: "Pregão Eletrônico",
  pregao_presencial: "Pregão Presencial",
  dispensa_eletronica: "Dispensa Eletrônica",
  tomada_de_precos: "Tomada de Preços",
  credenciamento: "Credenciamento",
  outras: "Outras",
};

export type Tone = "positive" | "alert" | "risk" | "muted" | "teal" | "blue";

export const STATUS_TONE: Record<LicitacaoStatus, Tone> = {
  aberta: "teal",
  em_proposta: "blue",
  aguardando_julgamento: "alert",
  selecao_fornecedores: "alert",
  resultado: "muted",
};

/** A data efetiva da disputa (usa data_disputa; cai no prazo_envio antigo). */
export function dataDisputa(l: Licitacao): string | null {
  return l.data_disputa ?? l.prazo_envio ?? null;
}

export interface Countdown {
  label: string;
  tone: Tone;
  /** true = mostrar o ícone de relógio (rótulo baseado em tempo) */
  clock: boolean;
}

/** Rótulo do "relógio" da coluna DATA. */
export function countdown(l: Licitacao): Countdown {
  if (l.status === "resultado") {
    return l.resultado === "vencedor"
      ? { label: "Vencedor", tone: "positive", clock: false }
      : l.resultado === "perdido"
        ? { label: "Perdido", tone: "risk", clock: false }
        : { label: "Encerrada", tone: "muted", clock: false };
  }
  const iso = dataDisputa(l);
  if (!iso) return { label: "—", tone: "muted", clock: false };

  const alvo = new Date(iso).getTime();
  const agora = Date.now();
  const diffH = (alvo - agora) / 3_600_000;

  if (diffH <= 0) return { label: "Encerrada", tone: "muted", clock: true };
  // disputa hoje (calendário de Brasília)
  if (daysUntil(iso) === 0)
    return { label: "Aberta", tone: "positive", clock: true };
  if (diffH < 24)
    return { label: `${Math.ceil(diffH)}h`, tone: "risk", clock: true };
  const dias = Math.ceil(diffH / 24);
  return { label: `${dias}d`, tone: dias <= 7 ? "alert" : "muted", clock: true };
}

export function isCritica(l: Licitacao): boolean {
  if (l.status === "resultado") return false;
  const iso = dataDisputa(l);
  if (!iso) return false;
  const dias = (new Date(iso).getTime() - Date.now()) / 86_400_000;
  return dias >= 0 && dias <= 7;
}
