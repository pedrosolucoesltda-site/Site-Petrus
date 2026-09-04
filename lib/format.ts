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

// Todo o site exibe datas/horas no fuso de Brasília, independente de onde
// o código roda (o servidor da Vercel roda em UTC).
const TZ = "America/Sao_Paulo";

const dateTimeFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  dateStyle: "long",
});
const monthFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  month: "short",
  year: "numeric",
});
const shortFmt = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TZ,
  dateStyle: "short",
});

function parseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** [ano, mês(1-12), dia] do instante `d` como visto no fuso de Brasília. */
function ymdBrasilia(d: Date): [number, number, number] {
  const s = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
  const [y, m, day] = s.split("-").map(Number);
  return [y, m, day];
}

// Brasil não tem mais horário de verão desde 2019 → offset fixo -03:00.
const BR_OFFSET = "-03:00";

/**
 * Valor de `<input type="datetime-local">` ("2026-10-15T09:00", entendido
 * como horário de Brasília) → instante ISO em UTC para salvar no banco.
 */
export function datetimeLocalToISO(local: string): string | null {
  if (!local) return null;
  const withSecs = local.length === 16 ? `${local}:00` : local;
  const d = new Date(`${withSecs}${BR_OFFSET}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/**
 * Instante ISO (UTC) do banco → valor "YYYY-MM-DDTHH:MM" no fuso de Brasília,
 * para preencher o `<input type="datetime-local">`.
 */
export function isoToDatetimeLocal(
  value: string | Date | null | undefined,
): string {
  const d = parseDate(value);
  if (!d) return "";
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const g = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${g("year")}-${g("month")}-${g("day")}T${g("hour")}:${g("minute")}`;
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

/** 03/09/2026 às 14:30 */
export function dateTime(value: string | Date | null | undefined): string {
  const d = parseDate(value);
  if (!d) return "—";
  return dateTimeFmt.format(d).replace(", ", " às ");
}

/** dez/2026 */
export function monthYear(value: string | Date | null | undefined): string {
  const d = parseDate(value);
  return d ? monthFmt.format(d).replace(".", "") : "—";
}

/** Dias inteiros de hoje até `value`, contados no calendário de Brasília. */
export function daysUntil(value: string | Date | null | undefined): number | null {
  const d = parseDate(value);
  if (!d) return null;
  const [ay, am, ad] = ymdBrasilia(new Date());
  const [by, bm, bd] = ymdBrasilia(d);
  const hoje = Date.UTC(ay, am - 1, ad);
  const alvo = Date.UTC(by, bm - 1, bd);
  return Math.round((alvo - hoje) / 86_400_000);
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

/** 1,2 MB · 340 KB · 512 B */
export function fileSize(bytes: number): string {
  const b = bytes ?? 0;
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024)
    return `${(b / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} KB`;
  return `${(b / (1024 * 1024)).toLocaleString("pt-BR", {
    maximumFractionDigits: 1,
  })} MB`;
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
