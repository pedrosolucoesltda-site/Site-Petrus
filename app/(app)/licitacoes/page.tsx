import { getLicitacoes, type LicitacaoComChecklist } from "@/lib/queries";
import type { LicitacaoFase } from "@/lib/database.types";
import { moneyCompact, daysUntil, deadlineLabel } from "@/lib/format";
import { Card, PageHeader, StatusPill, cn } from "@/components/ui";

export const metadata = { title: "Licitações — Petrus Soluções" };

const FASES: { key: LicitacaoFase; label: string }[] = [
  { key: "em_analise", label: "Em análise" },
  { key: "documentacao", label: "Documentação" },
  { key: "enviado", label: "Enviado" },
  { key: "resultado", label: "Resultado" },
];

function prazoTone(dias: number | null) {
  if (dias === null) return "muted" as const;
  if (dias <= 3) return "risk" as const;
  if (dias <= 12) return "alert" as const;
  return "positive" as const;
}

export default async function LicitacoesPage() {
  const lics = await getLicitacoes();

  const abertas = lics.filter((l) => l.fase !== "resultado");
  const valorTotal = abertas.reduce((a, l) => a + l.valor_estimado, 0);
  const decididas = lics.filter((l) => l.resultado);
  const taxaHab = decididas.length
    ? Math.round(
        (decididas.filter((l) => l.resultado === "vencedor").length /
          decididas.length) *
          100,
      )
    : null;
  const urgentes = abertas.filter((l) => {
    const d = daysUntil(l.prazo_envio);
    return d !== null && d >= 0 && d <= 3;
  }).length;

  return (
    <>
      <PageHeader
        title="Licitações"
        subtitle="Petrus Soluções — acompanhamento por fase"
      />

      <div className="mb-[22px] grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[13px] text-text-secondary">Editais em disputa</p>
          <p className="tabular mb-2 mt-2 text-[28px] font-semibold leading-none">
            {abertas.length}
          </p>
          <p className="text-[12.5px] text-alert">
            {urgentes
              ? `${urgentes} com prazo em até 3 dias`
              : "Sem prazos críticos"}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-text-secondary">Valor total estimado</p>
          <p className="tabular mb-2 mt-2 text-[28px] font-semibold leading-none">
            {moneyCompact(valorTotal)}
          </p>
          <p className="text-[12.5px] text-text-muted">
            Somatório dos editais abertos
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-text-secondary">Taxa de habilitação</p>
          <p className="tabular mb-2 mt-2 text-[28px] font-semibold leading-none">
            {taxaHab === null ? "—" : `${taxaHab}%`}
          </p>
          <p className="text-[12.5px] text-text-muted">
            {decididas.length
              ? `${decididas.length} resultados no histórico`
              : "Sem resultados ainda"}
          </p>
        </Card>
      </div>

      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[14.5px] font-semibold">Funil de licitações</h2>
        <button className="rounded-sm border border-teal bg-teal px-3.5 py-2 text-[12.5px] font-semibold text-[#0e1a17]">
          + Novo edital
        </button>
      </div>

      <div className="grid gap-3.5 md:grid-cols-2 xl:grid-cols-4 xl:items-start">
        {FASES.map((f) => {
          const items = lics.filter((l) => l.fase === f.key);
          return (
            <div
              key={f.key}
              className="min-h-[120px] rounded-md border border-border-soft bg-panel p-3.5"
            >
              <div className="mb-3 flex items-center justify-between px-0.5">
                <span className="text-[12.5px] font-semibold text-text-secondary">
                  {f.label}
                </span>
                <span className="text-[11.5px] text-text-muted">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map((l) => (
                  <EditalCard key={l.id} l={l} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function EditalCard({ l }: { l: LicitacaoComChecklist }) {
  const dias = daysUntil(l.prazo_envio);
  const pct = l.docsTotal ? (l.docsEntregues / l.docsTotal) * 100 : 0;

  let deadlineText: string;
  if (l.fase === "resultado") {
    deadlineText = l.resultado === "vencedor" ? "Vencedor" : "Perdido";
  } else if (l.fase === "enviado") {
    deadlineText = "Aguardando resultado";
  } else {
    deadlineText = deadlineLabel(l.prazo_envio);
  }

  return (
    <div className="cursor-default rounded-sm border border-border-soft bg-panel-alt p-3 transition-colors hover:border-border">
      <p className="mb-1 text-[11px] text-text-muted">{l.orgao}</p>
      <p className="mb-2 text-[13px] font-medium leading-snug">{l.objeto}</p>
      <div className="mb-2 flex items-center justify-between text-[11.5px]">
        <span className="text-text-secondary">
          {moneyCompact(l.valor_estimado)}
        </span>
        <StatusPill
          tone={
            l.fase === "resultado"
              ? l.resultado === "vencedor"
                ? "positive"
                : "risk"
              : l.fase === "enviado"
                ? "positive"
                : prazoTone(dias)
          }
        >
          {deadlineText}
        </StatusPill>
      </div>
      {l.docsTotal > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-text-muted">
          <div className="h-[3px] flex-1 overflow-hidden rounded-[3px] bg-border">
            <div
              className={cn(
                "h-full rounded-[3px]",
                pct === 100 ? "bg-positive" : "bg-teal",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span>
            {l.docsEntregues}/{l.docsTotal} docs
          </span>
        </div>
      )}
    </div>
  );
}
