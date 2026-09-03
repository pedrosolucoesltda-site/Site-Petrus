import Link from "next/link";
import type { ReactNode } from "react";

/* ---------------------------------------------------------------- utils */

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

type Tone = "positive" | "alert" | "risk" | "muted" | "teal";

const TONE_TEXT: Record<Tone, string> = {
  positive: "text-positive",
  alert: "text-alert",
  risk: "text-risk",
  muted: "text-text-muted",
  teal: "text-teal",
};

const TONE_PILL: Record<Tone, string> = {
  positive: "bg-positive/15 text-positive",
  alert: "bg-alert/15 text-alert",
  risk: "bg-risk/20 text-risk",
  muted: "bg-panel-alt text-text-secondary",
  teal: "bg-teal/15 text-teal",
};

/* ---------------------------------------------------------------- layout */

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-border-soft bg-panel p-[18px_20px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md border border-border-soft bg-panel p-5 sm:p-[20px_22px]",
        className,
      )}
    >
      {(title || action) && (
        <header className="mb-4 flex items-center justify-between gap-4">
          {typeof title === "string" ? (
            <h2 className="text-[14.5px] font-semibold">{title}</h2>
          ) : (
            title
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  subtitle,
  badge,
  right,
}: {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-[22px] font-semibold tracking-[-0.01em]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-[13px] text-text-secondary">{subtitle}</p>
        )}
        {badge}
      </div>
      {right}
    </div>
  );
}

export function DatePill({ children }: { children: ReactNode }) {
  return (
    <span className="whitespace-nowrap rounded-full border border-border bg-panel px-4 py-2 text-[13px] text-text-secondary">
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- KPI */

export function Kpi({
  label,
  value,
  note,
  tone,
  valueTone,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: Tone;
  valueTone?: Tone;
}) {
  return (
    <Card>
      <p className="mb-[10px] text-[13px] text-text-secondary">{label}</p>
      <p
        className={cn(
          "tabular mb-2 text-[28px] font-semibold leading-none",
          valueTone && TONE_TEXT[valueTone],
        )}
      >
        {value}
      </p>
      {note != null && (
        <p
          className={cn(
            "text-[12.5px] text-text-muted",
            tone && TONE_TEXT[tone],
          )}
        >
          {note}
        </p>
      )}
    </Card>
  );
}

export function KpiRow({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 xl:[grid-template-columns:repeat(var(--kpi-cols,3),minmax(0,1fr))]">
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- pills */

export function StatusPill({
  tone,
  children,
}: {
  tone: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded-[10px] px-[9px] py-[3px] text-[10.5px] font-medium",
        TONE_PILL[tone],
      )}
    >
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-[10px] border border-border-soft bg-panel-alt px-[9px] py-[3px] text-[11px] text-text-secondary">
      {children}
    </span>
  );
}

/* ---------------------------------------------------------------- progress */

export function ProgressBar({
  pct,
  tone = "positive",
  className,
}: {
  pct: number;
  tone?: Tone;
  className?: string;
}) {
  const bg =
    tone === "risk"
      ? "bg-risk"
      : tone === "alert"
        ? "bg-alert"
        : tone === "teal"
          ? "bg-teal"
          : "bg-positive";
  return (
    <div
      className={cn(
        "h-[5px] overflow-hidden rounded-[5px] bg-border",
        className,
      )}
    >
      <div
        className={cn("h-full rounded-[5px]", bg)}
        style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
      />
    </div>
  );
}

export function StarRating({ value }: { value: number }) {
  const full = Math.round(Math.max(0, Math.min(5, value)));
  return (
    <span className="tracking-[1px] text-[12px] text-gold" aria-label={`${full} de 5`}>
      {"★".repeat(full)}
      <span className="text-border">{"★".repeat(5 - full)}</span>
    </span>
  );
}

/* ---------------------------------------------------------------- rows / tables */

export function RowItem({
  title,
  sub,
  subTone,
  right,
}: {
  title: ReactNode;
  sub?: ReactNode;
  subTone?: Tone;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-soft py-[13px] last:border-none last:pb-[2px]">
      <div className="min-w-0">
        <div className="truncate text-[13.5px] font-medium">{title}</div>
        {sub != null && (
          <div
            className={cn(
              "mt-[3px] text-[12px] text-text-muted",
              subTone && TONE_TEXT[subTone],
            )}
          >
            {sub}
          </div>
        )}
      </div>
      {right && <div className="shrink-0 text-right">{right}</div>}
    </div>
  );
}

export function DataTable({
  head,
  children,
}: {
  head: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="[&>th]:border-b [&>th]:border-border-soft [&>th]:pb-[10px] [&>th]:pr-[10px] [&>th]:text-left [&>th]:text-[11.5px] [&>th]:font-medium [&>th]:text-text-muted">
            {head}
          </tr>
        </thead>
        <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border-soft [&>tr>td]:py-[14px] [&>tr>td]:pr-[10px] [&>tr>td]:text-[13px] [&>tr:last-child>td]:border-none">
          {children}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------------------------- states */

export function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-dashed border-border px-6 py-10 text-center">
      <p className="text-[13.5px] text-text-secondary">{title}</p>
      {hint && <p className="mt-1 text-[12px] text-text-muted">{hint}</p>}
    </div>
  );
}

export function SetupNotice({
  title,
  steps,
  file,
}: {
  title: string;
  steps: ReactNode[];
  file?: string;
}) {
  return (
    <div className="mx-auto mt-16 max-w-xl rounded-md border border-border bg-panel p-8">
      <h1 className="text-lg font-semibold text-text-primary">{title}</h1>
      <ol className="mt-4 list-decimal space-y-2 pl-5 text-[13.5px] text-text-secondary">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {file && (
        <p className="mt-4 text-[12px] text-text-muted">
          Configuração em <code className="text-gold">{file}</code>
        </p>
      )}
    </div>
  );
}

export function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 rounded-md border border-risk/40 bg-risk/10 px-4 py-3 text-[13px] text-risk">
      {children}
    </div>
  );
}

export function LinkPill({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="text-[12.5px] text-text-muted transition-colors hover:text-text-secondary"
    >
      {children}
    </Link>
  );
}
