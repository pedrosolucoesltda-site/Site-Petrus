import { requireAdmin } from "@/lib/auth";
import {
  getFinanceiro,
  saldoEmCaixa,
  saldoDeltaPct,
  somaJanela,
  custoVariacaoPct,
} from "@/lib/queries";
import {
  money,
  moneyCompact,
  percentDelta,
  deadlineLabel,
  monthYear,
  longDate,
} from "@/lib/format";
import {
  Card,
  DatePill,
  PageHeader,
  Panel,
  RowItem,
  StatusPill,
  DataTable,
  LinkPill,
} from "@/components/ui";
import { LockIcon } from "@/components/icons";

export const metadata = { title: "Financeiro — Petrus Soluções" };

const CONTA_TONE = {
  vencido: "risk",
  a_vencer: "alert",
  pago: "positive",
} as const;
const CONTA_LABEL = {
  vencido: "Vencido",
  a_vencer: "A vencer",
  pago: "Pago",
} as const;

export default async function FinanceiroPage() {
  await requireAdmin();
  const { contasPagar, contasReceber, fluxo, obras } = await getFinanceiro();

  const saldo = saldoEmCaixa(fluxo);
  const delta = saldoDeltaPct(fluxo);
  const aReceber30 = somaJanela(contasReceber, 30);
  const aPagar30 = somaJanela(contasPagar, 30);
  const resultado = aReceber30 - aPagar30;
  const pagarAbertas = contasPagar.filter((c) => c.status !== "pago");
  const vencidas = pagarAbertas.filter((c) => c.status === "vencido").length;

  const maxBar = Math.max(1, ...fluxo.flatMap((f) => [f.entradas, f.saidas]));

  return (
    <>
      <PageHeader
        title="Financeiro"
        subtitle="Petrus Soluções — caixa, contas e custo por obra"
        badge={
          <span className="mt-2 flex items-center gap-1.5 text-[11px] text-text-muted">
            <LockIcon className="h-3 w-3" />
            Visível apenas para administradores
          </span>
        }
        right={<DatePill>{longDate(new Date())}</DatePill>}
      />

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <p className="text-[13px] text-text-secondary">Saldo em caixa</p>
          <p className="tabular mb-2 mt-2 text-[24px] font-semibold leading-none">
            {moneyCompact(saldo)}
          </p>
          <p
            className={`text-[12.5px] ${delta >= 0 ? "text-positive" : "text-risk"}`}
          >
            {percentDelta(delta)} vs. mês anterior
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-text-secondary">A receber (30 dias)</p>
          <p className="tabular mb-2 mt-2 text-[24px] font-semibold leading-none">
            {moneyCompact(aReceber30)}
          </p>
          <p className="text-[12.5px] text-text-muted">
            {contasReceber.filter((c) => c.status !== "pago").length} lançamentos
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-text-secondary">A pagar (30 dias)</p>
          <p className="tabular mb-2 mt-2 text-[24px] font-semibold leading-none">
            {moneyCompact(aPagar30)}
          </p>
          <p
            className={`text-[12.5px] ${vencidas ? "text-risk" : "text-text-muted"}`}
          >
            {vencidas
              ? `${vencidas} conta${vencidas > 1 ? "s" : ""} vencida${vencidas > 1 ? "s" : ""}`
              : "Nenhuma conta vencida"}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-text-secondary">Resultado projetado</p>
          <p
            className={`tabular mb-2 mt-2 text-[24px] font-semibold leading-none ${resultado >= 0 ? "text-positive" : "text-risk"}`}
          >
            {resultado >= 0 ? "+" : ""}
            {moneyCompact(resultado)}
          </p>
          <p className="text-[12.5px] text-text-muted">Próximos 30 dias</p>
        </Card>
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
        <Panel
          title="Fluxo de caixa"
          action={
            <div className="flex gap-3.5 text-[11.5px] text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-positive" />
                Entradas
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-[2px] bg-risk" />
                Saídas
              </span>
            </div>
          }
        >
          {fluxo.length === 0 ? (
            <p className="py-8 text-[13px] text-text-muted">
              Sem histórico de fluxo de caixa.
            </p>
          ) : (
            <>
              <div className="flex h-[150px] items-end gap-3.5 border-b border-border-soft px-1">
                {fluxo.map((f) => (
                  <div
                    key={f.mes}
                    className="flex h-full flex-1 items-end justify-center gap-1"
                  >
                    <div
                      className="w-3 rounded-t-[3px] bg-positive"
                      style={{ height: `${(f.entradas / maxBar) * 100}%` }}
                      title={`Entradas ${money(f.entradas)}`}
                    />
                    <div
                      className="w-3 rounded-t-[3px] bg-risk/80"
                      style={{ height: `${(f.saidas / maxBar) * 100}%` }}
                      title={`Saídas ${money(f.saidas)}`}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex gap-3.5 px-1">
                {fluxo.map((f) => (
                  <span
                    key={f.mes}
                    className="flex-1 text-center text-[11px] text-text-muted"
                  >
                    {monthYear(f.mes)}
                  </span>
                ))}
              </div>
            </>
          )}
        </Panel>

        <Panel
          title="Contas a pagar"
          action={<LinkPill href="/financeiro">ver todas</LinkPill>}
        >
          {pagarAbertas.length === 0 && (
            <p className="py-6 text-[13px] text-text-muted">
              Nenhuma conta em aberto.
            </p>
          )}
          {pagarAbertas.slice(0, 6).map((c) => (
            <RowItem
              key={c.id}
              title={c.fornecedor}
              sub={deadlineLabel(c.vencimento)}
              right={
                <>
                  <div className="tabular text-[13.5px] font-semibold">
                    {money(c.valor)}
                  </div>
                  <StatusPill tone={CONTA_TONE[c.status]}>
                    {CONTA_LABEL[c.status]}
                  </StatusPill>
                </>
              }
            />
          ))}
        </Panel>
      </div>

      <Panel title="Custo por obra">
        {obras.length === 0 ? (
          <p className="py-6 text-[13px] text-text-muted">
            Nenhuma obra cadastrada.
          </p>
        ) : (
          <DataTable
            head={
              <>
                <th>Obra</th>
                <th className="text-right">Orçado</th>
                <th className="text-right">Realizado</th>
                <th className="text-right">Variação</th>
                <th className="text-right">Entrega</th>
              </>
            }
          >
            {obras.map((o) => {
              const v = custoVariacaoPct(o);
              return (
                <tr key={o.id}>
                  <td className="font-medium">{o.nome}</td>
                  <td className="tabular text-right">
                    {moneyCompact(o.orcamento)}
                  </td>
                  <td className="tabular text-right">
                    {moneyCompact(o.custo_realizado)}
                  </td>
                  <td
                    className={`tabular text-right ${v > 0 ? "text-risk" : "text-positive"}`}
                  >
                    {percentDelta(v)}
                  </td>
                  <td className="text-right text-text-secondary">
                    {monthYear(o.data_entrega_prevista)}
                  </td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </>
  );
}
