"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { LicitacaoComChecklist } from "@/lib/queries";
import type { LicitacaoStatus } from "@/lib/database.types";
import { money, moneyCompact, dateTime } from "@/lib/format";
import {
  STATUS_LABEL,
  STATUS_ORDER,
  STATUS_TONE,
  MODALIDADE_LABEL,
  countdown,
  dataDisputa,
  isCritica,
  type Countdown,
} from "@/lib/licitacoes";
import { Card, StatusPill, cn } from "@/components/ui";
import { CloseIcon, SearchIcon, ClockIcon } from "@/components/icons";
import { AnexosSection } from "@/components/anexos-section";
import {
  createLicitacao,
  updateLicitacao,
  deleteLicitacao,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  type ActionState,
} from "@/app/(app)/licitacoes/actions";

const inputCls =
  "mt-1 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted";

export function LicitacoesTable({ lics }: { lics: LicitacaoComChecklist[] }) {
  const [mode, setMode] = useState<null | "new" | string>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"" | LicitacaoStatus>("");

  const selected =
    typeof mode === "string" && mode !== "new"
      ? (lics.find((l) => l.id === mode) ?? null)
      : null;
  useEffect(() => {
    if (typeof mode === "string" && mode !== "new" && !selected) setMode(null);
  }, [mode, selected]);

  // KPIs (sobre o total)
  const hoje = new Date().toDateString();
  const kpis = {
    novasHoje: lics.filter((l) => new Date(l.created_at).toDateString() === hoje)
      .length,
    criticas: lics.filter(isCritica).length,
    andamento: lics.filter((l) => l.status !== "resultado").length,
    contratos: lics.filter((l) => l.resultado === "vencedor").length,
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return lics.filter((l) => {
      if (status && l.status !== status) return false;
      if (!t) return true;
      return [l.processo, l.orgao, l.objeto, l.uf, l.modalidade_numero]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(t));
    });
  }, [lics, q, status]);

  const totalEstimado = filtered.reduce((a, l) => a + l.valor_estimado, 0);
  const totalProposta = filtered.reduce((a, l) => a + (l.valor_proposta ?? 0), 0);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
            Licitações
          </h1>
          <p className="mt-1 text-[13px] text-text-secondary">
            Do edital ao resultado — acompanhamento por processo
          </p>
        </div>
        <button
          onClick={() => setMode("new")}
          className="rounded-sm border border-teal bg-teal px-4 py-2 text-[12.5px] font-semibold text-[#0e1a17]"
        >
          + Nova licitação
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Novas hoje" value={kpis.novasHoje} />
        <Kpi
          label="Prazos críticos"
          value={kpis.criticas}
          hint="próximos 7 dias"
          tone={kpis.criticas ? "risk" : undefined}
        />
        <Kpi label="Em andamento" value={kpis.andamento} hint="do funil ativo" />
        <Kpi
          label="Contratos"
          value={kpis.contratos}
          hint="licitações ganhas"
          tone={kpis.contratos ? "positive" : undefined}
        />
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="flex min-w-[240px] flex-1 items-center gap-2 rounded-sm border border-border bg-panel px-3 py-2 text-[13px] text-text-muted">
          <SearchIcon className="h-3.5 w-3.5 shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar processo, órgão, objeto…"
            className="w-full bg-transparent text-text-primary outline-none placeholder:text-text-muted"
          />
        </span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "" | LicitacaoStatus)}
          className="rounded-sm border border-border bg-panel px-3 py-2 text-[13px] text-text-secondary outline-none"
        >
          <option value="">Todos os status ({lics.length})</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]} ({lics.filter((l) => l.status === s).length})
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-4 rounded-sm border border-border-soft bg-panel px-4 py-2 text-right">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              Total estimado
            </p>
            <p className="tabular text-[13px] font-semibold">
              {money(totalEstimado)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">
              Total de proposta
            </p>
            <p className="tabular text-[13px] font-semibold text-teal">
              {money(totalProposta)}
            </p>
          </div>
        </div>
      </div>

      <p className="mb-2 text-[11.5px] text-text-muted">
        {filtered.length} de {lics.length} licitações
      </p>

      <div className="overflow-x-auto rounded-md border border-border-soft bg-panel">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="[&>th]:border-b [&>th]:border-border-soft [&>th]:px-3 [&>th]:py-3 [&>th]:text-left [&>th]:text-[11px] [&>th]:font-medium [&>th]:uppercase [&>th]:tracking-wide [&>th]:text-text-muted">
              <th>Processo</th>
              <th>Classif.</th>
              <th>Órgão / Prefeitura</th>
              <th>UF</th>
              <th className="text-right">Valor</th>
              <th>Data</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border-soft [&>tr>td]:px-3 [&>tr>td]:py-3 [&>tr>td]:align-top [&>tr>td]:text-[12.5px] [&>tr:last-child>td]:border-none">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-text-muted">
                  Nenhuma licitação para o filtro.
                </td>
              </tr>
            )}
            {filtered.map((l) => {
              const cd = countdown(l);
              return (
                <tr
                  key={l.id}
                  onClick={() => setMode(l.id)}
                  className="cursor-pointer transition-colors hover:bg-panel-alt"
                >
                  <td>
                    <div className="font-medium">{l.processo ?? "—"}</div>
                    <div className="mt-0.5 text-[11px] text-text-muted">
                      {l.modalidade_numero ?? MODALIDADE_LABEL[l.modalidade]}
                    </div>
                  </td>
                  <td>
                    {l.classificacao === 1 ? (
                      <span className="inline-flex items-center gap-1 rounded-[10px] bg-positive/15 px-2 py-0.5 text-[11px] font-semibold text-positive">
                        🏆 1º
                      </span>
                    ) : l.classificacao ? (
                      <span className="text-text-secondary">
                        {l.classificacao}º
                      </span>
                    ) : (
                      <span className="text-text-muted">—</span>
                    )}
                  </td>
                  <td className="max-w-[340px]">
                    <div className="font-medium">{l.orgao}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11.5px] text-text-muted">
                      {l.objeto}
                    </div>
                  </td>
                  <td className="text-text-secondary">{l.uf ?? "—"}</td>
                  <td className="text-right">
                    <div className="tabular text-[11.5px] text-text-muted">
                      EST. {moneyCompact(l.valor_estimado)}
                    </div>
                    {l.valor_proposta != null && (
                      <div className="tabular text-[12.5px] font-semibold text-teal">
                        PROP. {moneyCompact(l.valor_proposta)}
                      </div>
                    )}
                  </td>
                  <td>
                    <PrazoBadge cd={cd} />
                    <div className="mt-1 whitespace-nowrap text-[11px] text-text-muted">
                      {dateTime(dataDisputa(l))}
                    </div>
                  </td>
                  <td>
                    <StatusPill tone={STATUS_TONE[l.status]}>
                      {STATUS_LABEL[l.status]}
                    </StatusPill>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {mode !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMode(null)}
          />
          <LicitacaoDrawer
            key={selected?.id ?? "new"}
            lic={selected}
            onClose={() => setMode(null)}
          />
        </>
      )}
    </>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint?: string;
  tone?: "risk" | "positive";
}) {
  return (
    <Card>
      <p className="text-[11px] uppercase tracking-wide text-text-secondary">
        {label}
      </p>
      <p
        className={cn(
          "tabular mt-1.5 text-[26px] font-semibold leading-none",
          tone === "risk" && "text-risk",
          tone === "positive" && "text-positive",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1.5 text-[11.5px] text-text-muted">{hint}</p>}
    </Card>
  );
}

const PRAZO_TONE: Record<Countdown["tone"], string> = {
  risk: "bg-risk/20 text-risk",
  alert: "bg-alert/20 text-alert",
  positive: "bg-positive/15 text-positive",
  muted: "bg-panel-alt text-text-secondary",
  teal: "bg-teal/15 text-teal",
  blue: "bg-blue/15 text-blue",
};

/** Selo da coluna DATA: relógio + contagem ("8h", "4d", "12d"). */
function PrazoBadge({ cd }: { cd: Countdown }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px] text-[11px] font-semibold",
        PRAZO_TONE[cd.tone],
      )}
    >
      {cd.clock && <ClockIcon className="h-3 w-3" />}
      {cd.label}
    </span>
  );
}

/* ------------------------------------------------------------------ drawer */

function LicitacaoDrawer({
  lic,
  onClose,
}: {
  lic: LicitacaoComChecklist | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(lic);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    isEdit ? updateLicitacao : createLicitacao,
    {},
  );
  const [status, setStatus] = useState<LicitacaoStatus>(lic?.status ?? "aberta");

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  const dtLocal = lic?.data_disputa
    ? new Date(lic.data_disputa).toISOString().slice(0, 16)
    : lic?.prazo_envio
      ? `${lic.prazo_envio}T09:00`
      : "";

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[460px] flex-col border-l border-border bg-panel shadow-2xl">
      <header className="flex items-center justify-between border-b border-border-soft p-4">
        <p className="text-[13px] font-semibold">
          {isEdit ? "Editar licitação" : "Nova licitação"}
        </p>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="text-text-muted hover:text-text-primary"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <form action={formAction} className="space-y-3">
          {isEdit && <input type="hidden" name="id" value={lic!.id} />}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Nº do processo
              <input
                name="processo"
                defaultValue={lic?.processo ?? ""}
                className={inputCls}
              />
            </label>
            <label className="block text-[12px] text-text-secondary">
              UF
              <input
                name="uf"
                maxLength={2}
                defaultValue={lic?.uf ?? ""}
                className={inputCls}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Modalidade
              <select
                name="modalidade"
                defaultValue={lic?.modalidade ?? "concorrencia_eletronica"}
                className={inputCls}
              >
                {(
                  Object.keys(MODALIDADE_LABEL) as (keyof typeof MODALIDADE_LABEL)[]
                ).map((m) => (
                  <option key={m} value={m}>
                    {MODALIDADE_LABEL[m]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-text-secondary">
              Nº / edital da modalidade
              <input
                name="modalidade_numero"
                defaultValue={lic?.modalidade_numero ?? ""}
                className={inputCls}
              />
            </label>
          </div>

          <label className="block text-[12px] text-text-secondary">
            Órgão / Prefeitura
            <input
              name="orgao"
              required
              defaultValue={lic?.orgao ?? ""}
              className={inputCls}
            />
          </label>
          <label className="block text-[12px] text-text-secondary">
            Objeto
            <textarea
              name="objeto"
              required
              rows={2}
              defaultValue={lic?.objeto ?? ""}
              className={cn(inputCls, "resize-none")}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Valor estimado (R$)
              <input
                name="valor_estimado"
                inputMode="decimal"
                defaultValue={lic?.valor_estimado ?? ""}
                className={inputCls}
              />
            </label>
            <label className="block text-[12px] text-text-secondary">
              Nossa proposta (R$)
              <input
                name="valor_proposta"
                inputMode="decimal"
                defaultValue={lic?.valor_proposta ?? ""}
                className={inputCls}
              />
            </label>
          </div>

          <label className="block text-[12px] text-text-secondary">
            Data / hora da disputa
            <input
              type="datetime-local"
              name="data_disputa"
              defaultValue={dtLocal}
              className={inputCls}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Status
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as LicitacaoStatus)}
                className={inputCls}
              >
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-[12px] text-text-secondary">
              Classificação
              <input
                name="classificacao"
                type="number"
                min={1}
                placeholder="—"
                defaultValue={lic?.classificacao ?? ""}
                className={inputCls}
              />
            </label>
          </div>

          {status === "resultado" && (
            <label className="block text-[12px] text-text-secondary">
              Resultado
              <select
                name="resultado"
                defaultValue={lic?.resultado ?? "vencedor"}
                className={inputCls}
              >
                <option value="vencedor">Vencedor</option>
                <option value="perdido">Perdido</option>
              </select>
            </label>
          )}

          {state.error && (
            <p className="text-[12.5px] text-risk">{state.error}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-teal px-4 py-2 text-[13px] font-semibold text-[#0e1a17] disabled:opacity-60"
            >
              {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar licitação"}
            </button>
            {isEdit && (
              <button
                type="submit"
                formAction={deleteLicitacao}
                className="rounded-sm border border-border px-3 py-2 text-[12.5px] text-risk hover:border-risk"
              >
                Excluir
              </button>
            )}
          </div>
        </form>

        {isEdit && lic && (
          <>
            <div className="mt-6 border-t border-border-soft pt-5">
              <p className="mb-3 text-[12.5px] font-semibold">
                Checklist de habilitação{" "}
                <span className="text-text-muted">
                  ({lic.docsEntregues}/{lic.docsTotal})
                </span>
              </p>
              <div className="space-y-1.5">
                {lic.checklist.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-sm bg-panel-alt px-2.5 py-1.5"
                  >
                    <form action={toggleChecklistItem} className="flex">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        type="hidden"
                        name="entregue"
                        value={(!c.entregue).toString()}
                      />
                      <button
                        type="submit"
                        aria-label="Alternar entregue"
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-[4px] border text-[10px]",
                          c.entregue
                            ? "border-positive bg-positive text-[#0e1a17]"
                            : "border-border",
                        )}
                      >
                        {c.entregue ? "✓" : ""}
                      </button>
                    </form>
                    <span
                      className={cn(
                        "flex-1 text-[12px]",
                        c.entregue
                          ? "text-text-muted line-through"
                          : "text-text-secondary",
                      )}
                    >
                      {c.documento_exigido}
                    </span>
                    <form action={removeChecklistItem}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        aria-label="Remover"
                        className="text-text-muted hover:text-risk"
                      >
                        <CloseIcon className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                ))}
                {lic.checklist.length === 0 && (
                  <p className="text-[11.5px] text-text-muted">
                    Nenhum documento no checklist.
                  </p>
                )}
              </div>
              <form action={addChecklistItem} className="mt-2.5 flex gap-2">
                <input type="hidden" name="licitacao_id" value={lic.id} />
                <input
                  name="documento_exigido"
                  required
                  placeholder="Adicionar documento exigido…"
                  className={cn(inputCls, "mt-0 flex-1")}
                />
                <button
                  type="submit"
                  className="rounded-sm border border-border px-3 text-[12.5px] text-text-secondary hover:text-text-primary"
                >
                  +
                </button>
              </form>
            </div>

            <AnexosSection
              escopo="licitacao"
              refId={lic.id}
              anexos={lic.arquivos}
            />
          </>
        )}
      </div>
    </div>
  );
}
