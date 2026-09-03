import Link from "next/link";
import { getPainel } from "@/lib/queries";
import {
  longDate,
  moneyCompact,
  percentDelta,
  deadlineLabel,
} from "@/lib/format";
import {
  Card,
  DatePill,
  ErrorBanner,
  Kpi,
  PageHeader,
  Panel,
  ProgressBar,
  RowItem,
  LinkPill,
} from "@/components/ui";
import { obraProgressTone } from "@/lib/queries";

export const metadata = { title: "Painel geral — Petrus Soluções" };

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>;
}) {
  const { erro } = await searchParams;
  const p = await getPainel();

  return (
    <>
      <PageHeader
        title="Painel geral"
        subtitle="Petrus Soluções — visão consolidada"
        right={<DatePill>{longDate(new Date())}</DatePill>}
      />

      {erro === "acesso-negado" && (
        <ErrorBanner>
          Você não tem acesso ao módulo Financeiro. Fale com um administrador.
        </ErrorBanner>
      )}

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Kpi
          label="Obras em andamento"
          value={p.obrasAndamento.length}
          tone={p.obrasCriticas.length ? "alert" : "muted"}
          note={
            p.obrasCriticas.length
              ? `${p.obrasCriticas.length} dentro do prazo crítico`
              : "Todas dentro do prazo"
          }
        />
        <Kpi
          label="Licitações abertas"
          value={p.licitacoesAbertas.length}
          tone={p.licitacoesUrgentes.length ? "alert" : "muted"}
          note={
            p.licitacoesUrgentes.length
              ? `${p.licitacoesUrgentes.length} com prazo em até 3 dias`
              : "Sem prazos críticos"
          }
        />
        <Kpi
          label="Saldo em caixa"
          value={p.temFinanceiro ? moneyCompact(p.saldo) : "—"}
          tone={p.saldoDelta >= 0 ? "positive" : "risk"}
          note={
            p.temFinanceiro
              ? `${percentDelta(p.saldoDelta)} vs. mês anterior`
              : "Sem dados de fluxo de caixa"
          }
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr]">
        <Panel
          title="Obras — andamento"
          action={<LinkPill href="/obras">ver todas</LinkPill>}
        >
          {p.obras.length === 0 && (
            <p className="py-6 text-[13px] text-text-muted">
              Nenhuma obra cadastrada.
            </p>
          )}
          {p.obras.slice(0, 5).map((o) => (
            <RowItem
              key={o.id}
              title={<Link href="/obras">{o.nome}</Link>}
              sub={o.cidade_uf}
              right={
                <div className="flex items-center gap-2.5">
                  <ProgressBar
                    pct={o.progresso_pct}
                    tone={obraProgressTone(o)}
                    className="w-20"
                  />
                  <span className="w-8 text-right text-[12.5px] text-text-secondary">
                    {o.progresso_pct}%
                  </span>
                </div>
              }
            />
          ))}
        </Panel>

        <Panel
          title="Editais em análise"
          action={<LinkPill href="/licitacoes">ver todos</LinkPill>}
        >
          {p.editaisEmAnalise.length === 0 && (
            <p className="py-6 text-[13px] text-text-muted">
              Nenhum edital em análise.
            </p>
          )}
          {p.editaisEmAnalise.map((l) => {
            const label = deadlineLabel(l.prazo_envio);
            return (
              <RowItem
                key={l.id}
                title={`${l.orgao} — ${l.objeto}`}
                sub={label}
                subTone="alert"
              />
            );
          })}
        </Panel>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-[13px] text-text-secondary">Obras concluídas</p>
          <p className="tabular mt-2 text-[22px] font-semibold">
            {p.obrasConcluidas.length}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-text-secondary">
            Licitações vencidas (histórico)
          </p>
          <p className="tabular mt-2 text-[22px] font-semibold text-positive">
            {p.licitacoesVencedoras.length}
          </p>
        </Card>
        <Card>
          <p className="text-[13px] text-text-secondary">Prazo mais próximo</p>
          <p className="tabular mt-2 text-[15px] font-semibold text-alert">
            {p.proximoPrazo ? deadlineLabel(p.proximoPrazo) : "—"}
          </p>
        </Card>
      </div>
    </>
  );
}
