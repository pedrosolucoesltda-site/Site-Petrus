import type { Obra } from "@/lib/database.types";

/** Funções puras sobre Obra — seguras para client components. */

export function obraProgressTone(o: Obra) {
  if (o.status === "atrasada") return "risk" as const;
  if (o.status === "atencao") return "alert" as const;
  return "positive" as const;
}

/**
 * Variação do custo realizado frente ao previsto para o estágio atual
 * (orçamento pró-rateado pelo progresso). Positivo = acima do previsto.
 */
export function custoVariacaoPct(o: Obra): number {
  const previsto = o.orcamento * (o.progresso_pct / 100);
  if (!previsto) return 0;
  return ((o.custo_realizado - previsto) / previsto) * 100;
}

/** Percentual do orçamento total já consumido. */
export function custoConsumoPct(o: Obra): number {
  if (!o.orcamento) return 0;
  return (o.custo_realizado / o.orcamento) * 100;
}
