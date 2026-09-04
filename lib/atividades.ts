import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, LicitacaoAtividade } from "@/lib/database.types";
import type { SessionInfo } from "@/lib/auth";

type DB = SupabaseClient<Database>;

/**
 * Registra uma linha na linha do tempo de Licitações.
 * Falha silenciosa — um erro de log nunca deve quebrar a ação em si.
 */
export async function registrarAtividade(
  supabase: DB,
  session: SessionInfo,
  a: {
    licitacaoId: string | null;
    label: string;
    acao: string;
    descricao: string;
  },
): Promise<void> {
  try {
    await supabase.from("licitacao_atividades").insert({
      licitacao_id: a.licitacaoId,
      licitacao_label: a.label.slice(0, 200),
      user_id: session.user.id,
      user_nome:
        session.profile?.full_name || session.user.email || "Desconhecido",
      acao: a.acao,
      descricao: a.descricao,
    });
  } catch (e) {
    console.error("[atividades]", e);
  }
}

const ACAO_TONE: Record<string, string> = {
  criou: "text-positive",
  editou: "text-text-secondary",
  moveu: "text-blue",
  resultado: "text-gold",
  excluiu: "text-risk",
  checklist: "text-text-secondary",
  anexo: "text-text-secondary",
};

export function acaoTone(acao: string): string {
  return ACAO_TONE[acao] ?? "text-text-secondary";
}

export type { LicitacaoAtividade };
