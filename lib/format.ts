/** pt-BR formatting helpers shared across every module. */

const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const brlCents = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** R$ 42.300 */
export function money(value: number, withCents = false): string {
  return (withCents ? brlCents : brl).format(value ?? 0);
}

/** R$ 812 mil · R$ 18,4 mi — compact form used in KPI cards. */
export function moneyCompact(value: number): string {
  const v = value ?? 0;
  if (Math.abs(v) >= 1_000_000) {
    return `R$ ${(v / 1_000_000)
      .toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  }
  if (Math.abs(v) >= 1_000) {
    return `R$ ${Math.round(v / 1_000).toLocaleString("pt-BR")} mil`;
  }
  return money(v);
}

/** +6,2% / -4,1% */
export function percentDelta(value: number, digits = 1): string {
  const v = value ?? 0;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toLocaleString("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function percent(value: number): string {
  return `${Math.round(value ?? 0)}%`;
}

const dateFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" });
const monthFmt = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  year: "numeric",
});
const shortFmt = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 31 de agosto de 2026 */
export function longDate(value: string | Date | null | undefined): string {
  const d = parseDate(value);
  return d ? dateFmt.format(d) : "—";
}

/** 18/08/2026 */
export function shortDate(value: string | Date | null | undefined): string {
  const d = parseDate(value);
  return d ? shortFmt.format(d) : "—";
}

/** dez/2026 */
export function monthYear(value: string | Date | null | undefined): string {
  const d = parseDate(value);
  return d ? monthFmt.format(d).replace(".", "") : "—";
}

/** Whole days from today until `value` (negative = overdue). */
export function daysUntil(value: string | Date | null | undefined): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86_400_000);
}

/** "Vence em 4 dias" / "Venceu há 2 dias" / "Vence hoje" */
export function deadlineLabel(
  value: string | Date | null | undefined,
): string {
  const days = daysUntil(value);
  if (days === null) return "Sem prazo";
  if (days === 0) return "Vence hoje";
  if (days > 0) return `Vence em ${days} ${days === 1 ? "dia" : "dias"}`;
  const abs = Math.abs(days);
  return `Venceu há ${abs} ${abs === 1 ? "dia" : "dias"}`;
}

export function initials(name: string | null | undefined, max = 2): string {
  if (!name) return "—";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, max)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
