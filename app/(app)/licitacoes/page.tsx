import { getLicitacoes } from "@/lib/queries";
import { moneyCompact, daysUntil } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { LicitacoesBoard } from "@/components/licitacoes-board";

export const metadata = { title: "Licitações — Petrus Soluções" };

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

      <LicitacoesBoard lics={lics} />
    </>
  );
}
