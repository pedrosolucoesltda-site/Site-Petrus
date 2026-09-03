import Link from "next/link";
import { getObras, custoVariacaoPct, obraProgressTone } from "@/lib/queries";
import type { ObraStatus } from "@/lib/database.types";
import {
  monthYear,
  percentDelta,
  initials,
} from "@/lib/format";
import {
  Card,
  PageHeader,
  ProgressBar,
  StatusPill,
  cn,
} from "@/components/ui";

export const metadata = { title: "Obras — Petrus Soluções" };

const STATUS_LABEL: Record<ObraStatus, string> = {
  em_dia: "Em dia",
  atencao: "Atenção",
  atrasada: "Atrasada",
};
const STATUS_TONE: Record<ObraStatus, "positive" | "alert" | "risk"> = {
  em_dia: "positive",
  atencao: "alert",
  atrasada: "risk",
};

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const all = await getObras();

  const counts = {
    total: all.length,
    em_dia: all.filter((o) => o.status === "em_dia").length,
    atencao: all.filter((o) => o.status === "atencao").length,
    atrasada: all.filter((o) => o.status === "atrasada").length,
  };

  const active = (["em_dia", "atencao", "atrasada"] as const).includes(
    status as ObraStatus,
  )
    ? (status as ObraStatus)
    : null;
  const obras = active ? all.filter((o) => o.status === active) : all;

  const chips: { key: string | null; label: string }[] = [
    { key: null, label: `Todas (${counts.total})` },
    { key: "em_dia", label: `Em dia (${counts.em_dia})` },
    { key: "atencao", label: `Atenção (${counts.atencao})` },
    { key: "atrasada", label: `Atrasada (${counts.atrasada})` },
  ];

  return (
    <>
      <PageHeader
        title="Obras"
        subtitle="Petrus Soluções — andamento e responsáveis"
        right={
          <button className="rounded-full border border-brick bg-brick px-4 py-2.5 text-[12.5px] font-semibold text-[#1a1108]">
            + Nova obra
          </button>
        }
      />

      <div className="mb-[18px] grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-[12.5px] text-text-secondary">Em andamento</p>
          <p className="tabular mt-2 text-[24px] font-semibold">
            {all.filter((o) => o.progresso_pct < 100).length}
          </p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">No prazo</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-positive">
            {counts.em_dia}
          </p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">Atenção</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-alert">
            {counts.atencao}
          </p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">Atrasada</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-risk">
            {counts.atrasada}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        {chips.map((c) => {
          const isActive = c.key === active;
          return (
            <Link
              key={c.label}
              href={c.key ? `/obras?status=${c.key}` : "/obras"}
              className={cn(
                "rounded-full border px-4 py-2 text-[12.5px] transition-colors",
                isActive
                  ? "border-brick bg-brick/15 text-brick"
                  : "border-border bg-panel text-text-secondary hover:text-text-primary",
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      {obras.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-text-muted">
          Nenhuma obra para este filtro.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {obras.map((o) => {
            const varPct = custoVariacaoPct(o);
            return (
              <Card key={o.id}>
                <div className="mb-3.5 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14.5px] font-semibold">{o.nome}</p>
                    <p className="mt-0.5 text-[12px] text-text-muted">
                      {o.cidade_uf}
                    </p>
                  </div>
                  <StatusPill tone={STATUS_TONE[o.status]}>
                    {STATUS_LABEL[o.status]}
                  </StatusPill>
                </div>

                <div className="mb-3.5">
                  <div className="mb-1.5 flex justify-between text-[11.5px] text-text-muted">
                    <span>Progresso</span>
                    <span>{o.progresso_pct}%</span>
                  </div>
                  <ProgressBar
                    pct={o.progresso_pct}
                    tone={obraProgressTone(o)}
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border-soft pt-3">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-panel-alt font-grotesk text-[10.5px] font-semibold text-text-secondary">
                      {initials(o.responsavel)}
                    </span>
                    <span className="text-[12px] text-text-secondary">
                      {o.responsavel ?? "Sem responsável"}
                    </span>
                  </div>
                  <span className="text-[11.5px] text-text-muted">
                    Entrega{" "}
                    <b className="font-medium text-text-secondary">
                      {monthYear(o.data_entrega_prevista)}
                    </b>
                  </span>
                </div>

                <div className="mt-3 flex justify-between text-[11.5px] text-text-muted">
                  <span>Custo realizado</span>
                  <span
                    className={
                      varPct > 0 ? "text-risk" : "text-positive"
                    }
                  >
                    {percentDelta(varPct)} do orçado
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
