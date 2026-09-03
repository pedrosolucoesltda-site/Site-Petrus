"use client";

import { useActionState, useEffect, useState } from "react";
import type { Anexo, Obra, ObraStatus } from "@/lib/database.types";
import { custoVariacaoPct, obraProgressTone } from "@/lib/obras";
import { monthYear, percentDelta, initials } from "@/lib/format";
import { Card, ProgressBar, StatusPill } from "@/components/ui";
import { CloseIcon } from "@/components/icons";
import { AnexosSection } from "@/components/anexos-section";
import {
  createObra,
  updateObra,
  deleteObra,
  type ObraActionState,
} from "@/app/(app)/obras/actions";

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

const inputCls =
  "mt-1 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted";

export function ObrasManager({
  obras,
  anexosByRef,
  emptyMessage,
}: {
  obras: Obra[];
  anexosByRef: Record<string, Anexo[]>;
  emptyMessage: string;
}) {
  const [mode, setMode] = useState<null | "new" | string>(null);
  const selected =
    typeof mode === "string" && mode !== "new"
      ? (obras.find((o) => o.id === mode) ?? null)
      : null;

  useEffect(() => {
    if (typeof mode === "string" && mode !== "new" && !selected) setMode(null);
  }, [mode, selected]);

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setMode("new")}
          className="rounded-full border border-brick bg-brick px-4 py-2.5 text-[12.5px] font-semibold text-[#1a1108]"
        >
          + Nova obra
        </button>
      </div>

      {obras.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-text-muted">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {obras.map((o) => {
            const varPct = custoVariacaoPct(o);
            return (
              <button
                key={o.id}
                onClick={() => setMode(o.id)}
                className="block text-left"
              >
                <Card className="transition-colors hover:border-brick">
                  <div className="mb-3.5 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[14.5px] font-semibold">{o.nome}</p>
                      <p className="mt-0.5 text-[12px] text-text-muted">
                        {o.cidade_uf || "—"}
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
                    <span className={varPct > 0 ? "text-risk" : "text-positive"}>
                      {percentDelta(varPct)} do previsto
                    </span>
                  </div>
                  {(anexosByRef[o.id]?.length ?? 0) > 0 && (
                    <p className="mt-2 text-[11px] text-text-muted">
                      {anexosByRef[o.id].length} arquivo(s)
                    </p>
                  )}
                </Card>
              </button>
            );
          })}
        </div>
      )}

      {mode !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMode(null)}
          />
          <ObraDrawer
            key={selected?.id ?? "new"}
            obra={selected}
            anexos={selected ? (anexosByRef[selected.id] ?? []) : []}
            onClose={() => setMode(null)}
          />
        </>
      )}
    </>
  );
}

function ObraDrawer({
  obra,
  anexos,
  onClose,
}: {
  obra: Obra | null;
  anexos: Anexo[];
  onClose: () => void;
}) {
  const isEdit = Boolean(obra);
  const [state, formAction, pending] = useActionState<ObraActionState, FormData>(
    isEdit ? updateObra : createObra,
    {},
  );

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border bg-panel shadow-2xl">
      <header className="flex items-center justify-between border-b border-border-soft p-4">
        <p className="text-[13px] font-semibold">
          {isEdit ? "Editar obra" : "Nova obra"}
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
          {isEdit && <input type="hidden" name="id" value={obra!.id} />}

          <label className="block text-[12px] text-text-secondary">
            Nome
            <input
              name="nome"
              required
              defaultValue={obra?.nome ?? ""}
              className={inputCls}
            />
          </label>
          <label className="block text-[12px] text-text-secondary">
            Cidade / UF
            <input
              name="cidade_uf"
              defaultValue={obra?.cidade_uf ?? ""}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Status
              <select
                name="status"
                defaultValue={obra?.status ?? "em_dia"}
                className={inputCls}
              >
                <option value="em_dia">Em dia</option>
                <option value="atencao">Atenção</option>
                <option value="atrasada">Atrasada</option>
              </select>
            </label>
            <label className="block text-[12px] text-text-secondary">
              Progresso (%)
              <input
                name="progresso_pct"
                type="number"
                min={0}
                max={100}
                defaultValue={obra?.progresso_pct ?? 0}
                className={inputCls}
              />
            </label>
          </div>
          <label className="block text-[12px] text-text-secondary">
            Responsável
            <input
              name="responsavel"
              defaultValue={obra?.responsavel ?? ""}
              className={inputCls}
            />
          </label>
          <label className="block text-[12px] text-text-secondary">
            Entrega prevista
            <input
              type="date"
              name="data_entrega_prevista"
              defaultValue={obra?.data_entrega_prevista ?? ""}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Orçamento (R$)
              <input
                name="orcamento"
                inputMode="decimal"
                defaultValue={obra?.orcamento ?? ""}
                className={inputCls}
              />
            </label>
            <label className="block text-[12px] text-text-secondary">
              Custo realizado (R$)
              <input
                name="custo_realizado"
                inputMode="decimal"
                defaultValue={obra?.custo_realizado ?? ""}
                className={inputCls}
              />
            </label>
          </div>

          {state.error && (
            <p className="text-[12.5px] text-risk">{state.error}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-brick px-4 py-2 text-[13px] font-semibold text-[#1a1108] disabled:opacity-60"
            >
              {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar obra"}
            </button>
            {isEdit && (
              <button
                type="submit"
                formAction={deleteObra}
                className="rounded-sm border border-border px-3 py-2 text-[12.5px] text-risk hover:border-risk"
              >
                Excluir
              </button>
            )}
          </div>
        </form>

        {isEdit && obra && (
          <AnexosSection escopo="obra" refId={obra.id} anexos={anexos} />
        )}
      </div>
    </div>
  );
}
