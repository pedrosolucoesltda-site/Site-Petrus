"use client";

import { useActionState, useEffect, useState } from "react";
import type { Anexo, ContaPagar, ContaReceber } from "@/lib/database.types";
import { money, deadlineLabel } from "@/lib/format";
import { Panel, RowItem, StatusPill } from "@/components/ui";
import { CloseIcon } from "@/components/icons";
import { AnexosSection } from "@/components/anexos-section";
import {
  saveContaPagar,
  deleteContaPagar,
  saveContaReceber,
  deleteContaReceber,
  marcarPaga,
  upsertFluxoMes,
  type ContaActionState,
} from "@/app/(app)/financeiro/actions";

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

const inputCls =
  "mt-1 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted";

interface Ref {
  id: string;
  nome: string;
}

type Conta = (ContaPagar | ContaReceber) & {
  fornecedor?: string;
  obra_id?: string | null;
};

export function ContasPanel({
  tipo,
  contas,
  obras,
  anexosByRef,
}: {
  tipo: "pagar" | "receber";
  contas: Conta[];
  obras: Ref[];
  anexosByRef: Record<string, Anexo[]>;
}) {
  const [mode, setMode] = useState<null | "new" | string>(null);
  const selected =
    typeof mode === "string" && mode !== "new"
      ? (contas.find((c) => c.id === mode) ?? null)
      : null;

  useEffect(() => {
    if (typeof mode === "string" && mode !== "new" && !selected) setMode(null);
  }, [mode, selected]);

  const title = tipo === "pagar" ? "Contas a pagar" : "Contas a receber";
  const escopo = tipo === "pagar" ? "conta_pagar" : "conta_receber";
  const tabela = tipo === "pagar" ? "contas_pagar" : "contas_receber";
  const abertas = contas.filter((c) => c.status !== "pago");

  return (
    <Panel
      title={title}
      action={
        <button
          onClick={() => setMode("new")}
          className="rounded-sm border border-gold px-3 py-1.5 text-[12px] font-semibold text-gold hover:bg-gold/10"
        >
          + Nova
        </button>
      }
    >
      {abertas.length === 0 && (
        <p className="py-6 text-[13px] text-text-muted">Nenhuma conta em aberto.</p>
      )}
      {abertas.slice(0, 8).map((c) => (
        <div
          key={c.id}
          onClick={() => setMode(c.id)}
          className="cursor-pointer"
        >
          <RowItem
            title={tipo === "pagar" ? (c.fornecedor ?? "—") : c.descricao}
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
        </div>
      ))}
      {contas.length > abertas.length && (
        <p className="pt-2 text-[11.5px] text-text-muted">
          {contas.length - abertas.length} conta(s) já paga(s)
        </p>
      )}

      {mode !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMode(null)}
          />
          <ContaDrawer
            key={selected?.id ?? "new"}
            tipo={tipo}
            conta={selected}
            obras={obras}
            escopo={escopo}
            tabela={tabela}
            anexos={selected ? (anexosByRef[selected.id] ?? []) : []}
            onClose={() => setMode(null)}
          />
        </>
      )}
    </Panel>
  );
}

function ContaDrawer({
  tipo,
  conta,
  obras,
  escopo,
  tabela,
  anexos,
  onClose,
}: {
  tipo: "pagar" | "receber";
  conta: Conta | null;
  obras: Ref[];
  escopo: "conta_pagar" | "conta_receber";
  tabela: string;
  anexos: Anexo[];
  onClose: () => void;
}) {
  const isEdit = Boolean(conta);
  const action = tipo === "pagar" ? saveContaPagar : saveContaReceber;
  const del = tipo === "pagar" ? deleteContaPagar : deleteContaReceber;
  const [state, formAction, pending] = useActionState<ContaActionState, FormData>(
    action,
    {},
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border bg-panel shadow-2xl">
      <header className="flex items-center justify-between border-b border-border-soft p-4">
        <p className="text-[13px] font-semibold">
          {isEdit ? "Editar conta" : "Nova conta"} —{" "}
          {tipo === "pagar" ? "a pagar" : "a receber"}
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
          {isEdit && <input type="hidden" name="id" value={conta!.id} />}

          {tipo === "pagar" ? (
            <label className="block text-[12px] text-text-secondary">
              Fornecedor
              <input
                name="fornecedor"
                required
                defaultValue={conta?.fornecedor ?? ""}
                className={inputCls}
              />
            </label>
          ) : (
            <label className="block text-[12px] text-text-secondary">
              Obra vinculada
              <select
                name="obra_id"
                defaultValue={conta?.obra_id ?? ""}
                className={inputCls}
              >
                <option value="">—</option>
                {obras.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nome}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block text-[12px] text-text-secondary">
            Descrição
            <input
              name="descricao"
              required={tipo === "receber"}
              defaultValue={conta?.descricao ?? ""}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Valor (R$)
              <input
                name="valor"
                inputMode="decimal"
                required
                defaultValue={conta?.valor ?? ""}
                className={inputCls}
              />
            </label>
            <label className="block text-[12px] text-text-secondary">
              Vencimento
              <input
                type="date"
                name="vencimento"
                required
                defaultValue={conta?.vencimento ?? ""}
                className={inputCls}
              />
            </label>
          </div>
          <label className="block text-[12px] text-text-secondary">
            Situação
            <select
              name="status"
              defaultValue={conta?.status ?? "a_vencer"}
              className={inputCls}
            >
              <option value="a_vencer">A vencer</option>
              <option value="vencido">Vencido</option>
              <option value="pago">Pago</option>
            </select>
          </label>

          {state.error && (
            <p className="text-[12.5px] text-risk">{state.error}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-gold px-4 py-2 text-[13px] font-semibold text-[#141410] disabled:opacity-60"
            >
              {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar conta"}
            </button>
            {isEdit && conta?.status !== "pago" && (
              <button
                type="submit"
                formAction={marcarPaga}
                className="rounded-sm border border-positive px-3 py-2 text-[12.5px] text-positive hover:bg-positive/10"
              >
                Marcar como paga
              </button>
            )}
            {isEdit && (
              <button
                type="submit"
                formAction={del}
                className="rounded-sm border border-border px-3 py-2 text-[12.5px] text-risk hover:border-risk"
              >
                Excluir
              </button>
            )}
          </div>
          {isEdit && <input type="hidden" name="tabela" value={tabela} />}
        </form>

        {isEdit && conta && (
          <AnexosSection escopo={escopo} refId={conta.id} anexos={anexos} />
        )}
      </div>
    </div>
  );
}

/* ---------------- fluxo de caixa ---------------- */

export function FluxoEditor() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<ContaActionState, FormData>(
    upsertFluxoMes,
    {},
  );
  useEffect(() => {
    if (state.ok) setOpen(false);
  }, [state.ok]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[12.5px] text-text-muted hover:text-text-secondary"
      >
        editar meses
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 text-[11.5px] text-text-secondary"
    >
      <label>
        Mês
        <input type="month" name="mes" required className={inputCls} />
      </label>
      <label>
        Entradas
        <input name="entradas" inputMode="decimal" className={inputCls} />
      </label>
      <label>
        Saídas
        <input name="saidas" inputMode="decimal" className={inputCls} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-gold px-3 py-2 text-[12px] font-semibold text-[#141410]"
      >
        {pending ? "…" : "Salvar"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-text-muted"
      >
        cancelar
      </button>
      {state.error && <span className="text-risk">{state.error}</span>}
    </form>
  );
}
