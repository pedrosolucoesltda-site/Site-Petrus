"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import type { Anexo, FornecedorCategoria } from "@/lib/database.types";
import type { FornecedorComResumo } from "@/lib/queries";
import { money, shortDate, initials } from "@/lib/format";
import { Panel, Tag, StarRating, DataTable } from "@/components/ui";
import { CloseIcon, SearchIcon } from "@/components/icons";
import { Drawer } from "@/components/drawer";
import { AnexosSection } from "@/components/anexos-section";
import {
  saveFornecedor,
  deleteFornecedor,
  addCompra,
  removeCompra,
  type FornActionState,
} from "@/app/(app)/fornecedores/actions";

const CATEGORIA_LABEL: Record<FornecedorCategoria, string> = {
  material: "Material",
  mao_de_obra: "Mão de obra",
  equipamento: "Equipamento",
};

const inputCls =
  "mt-1 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted";

interface Ref {
  id: string;
  nome: string;
}

export function FornecedoresManager({
  fornecedores,
  obras,
  anexosByRef,
  emptyMessage,
}: {
  fornecedores: FornecedorComResumo[];
  obras: Ref[];
  anexosByRef: Record<string, Anexo[]>;
  emptyMessage: string;
}) {
  const [mode, setMode] = useState<null | "new" | string>(null);
  const [q, setQ] = useState("");

  const selected =
    typeof mode === "string" && mode !== "new"
      ? (fornecedores.find((f) => f.id === mode) ?? null)
      : null;

  useEffect(() => {
    if (typeof mode === "string" && mode !== "new" && !selected) setMode(null);
  }, [mode, selected]);

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return fornecedores;
    return fornecedores.filter(
      (f) =>
        f.nome.toLowerCase().includes(t) ||
        (f.contato ?? "").toLowerCase().includes(t),
    );
  }, [fornecedores, q]);

  return (
    <Panel
      title="Fornecedores cadastrados"
      action={
        <div className="flex items-center gap-2.5">
          <span className="flex w-[200px] items-center gap-2 rounded-full border border-border bg-panel px-3.5 py-1.5 text-[13px] text-text-muted">
            <SearchIcon className="h-3.5 w-3.5 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar fornecedor"
              className="w-full bg-transparent outline-none placeholder:text-text-muted"
            />
          </span>
          <button
            onClick={() => setMode("new")}
            className="whitespace-nowrap rounded-full border border-purple bg-purple px-4 py-2 text-[12.5px] font-semibold text-[#16131f]"
          >
            + Novo fornecedor
          </button>
        </div>
      }
    >
      {list.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-text-muted">
          {q ? "Nenhum fornecedor encontrado." : emptyMessage}
        </p>
      ) : (
        <DataTable
          head={
            <>
              <th>Fornecedor</th>
              <th>Categoria</th>
              <th>Avaliação</th>
              <th>Obras vinculadas</th>
              <th className="text-right">Total comprado</th>
              <th className="text-right">Última compra</th>
            </>
          }
        >
          {list.map((f) => (
            <tr
              key={f.id}
              onClick={() => setMode(f.id)}
              className="cursor-pointer hover:bg-panel-alt"
            >
              <td>
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-alt font-grotesk text-[12px] font-semibold text-purple">
                    {initials(f.nome)}
                  </span>
                  <div>
                    <div className="font-medium">{f.nome}</div>
                    <div className="mt-0.5 text-[11.5px] text-text-muted">
                      {f.contato ?? "sem contato"}
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <Tag>{CATEGORIA_LABEL[f.categoria]}</Tag>
              </td>
              <td>
                <StarRating value={f.avaliacao} />
              </td>
              <td className="text-text-secondary">
                {f.obrasVinculadas.length ? (
                  <>
                    {f.obrasVinculadas.slice(0, 2).join(", ")}
                    <span className="text-text-muted">
                      {" "}
                      ({f.obrasVinculadas.length})
                    </span>
                  </>
                ) : (
                  "—"
                )}
              </td>
              <td className="tabular text-right font-semibold">
                {money(f.totalComprado)}
              </td>
              <td className="text-right text-text-secondary">
                {shortDate(f.ultimaCompra)}
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {mode !== null && (
        <FornecedorDrawer
          key={selected?.id ?? "new"}
          fornecedor={selected}
          obras={obras}
          anexos={selected ? (anexosByRef[selected.id] ?? []) : []}
          onClose={() => setMode(null)}
        />
      )}
    </Panel>
  );
}

function FornecedorDrawer({
  fornecedor,
  obras,
  anexos,
  onClose,
}: {
  fornecedor: FornecedorComResumo | null;
  obras: Ref[];
  anexos: Anexo[];
  onClose: () => void;
}) {
  const isEdit = Boolean(fornecedor);
  const [state, formAction, pending] = useActionState<FornActionState, FormData>(
    saveFornecedor,
    {},
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <Drawer
      open
      onClose={onClose}
      dirty={dirty}
      title={isEdit ? "Editar fornecedor" : "Novo fornecedor"}
    >
      <>
        <form
          action={formAction}
          onChange={() => setDirty(true)}
          className="space-y-3"
        >
          {isEdit && <input type="hidden" name="id" value={fornecedor!.id} />}
          <label className="block text-[12px] text-text-secondary">
            Nome
            <input
              name="nome"
              required
              defaultValue={fornecedor?.nome ?? ""}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Categoria
              <select
                name="categoria"
                defaultValue={fornecedor?.categoria ?? "material"}
                className={inputCls}
              >
                <option value="material">Material</option>
                <option value="mao_de_obra">Mão de obra</option>
                <option value="equipamento">Equipamento</option>
              </select>
            </label>
            <label className="block text-[12px] text-text-secondary">
              Avaliação
              <select
                name="avaliacao"
                defaultValue={fornecedor?.avaliacao ?? 3}
                className={inputCls}
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} estrela{n > 1 ? "s" : ""}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-[12px] text-text-secondary">
            Contato
            <input
              name="contato"
              defaultValue={fornecedor?.contato ?? ""}
              className={inputCls}
            />
          </label>

          {state.error && (
            <p className="text-[12.5px] text-risk">{state.error}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-purple px-4 py-2 text-[13px] font-semibold text-[#16131f] disabled:opacity-60"
            >
              {pending
                ? "Salvando…"
                : isEdit
                  ? "Salvar"
                  : "Criar fornecedor"}
            </button>
            {isEdit && (
              <button
                type="submit"
                formAction={deleteFornecedor}
                className="rounded-sm border border-border px-3 py-2 text-[12.5px] text-risk hover:border-risk"
              >
                Excluir
              </button>
            )}
          </div>
        </form>

        {isEdit && fornecedor && (
          <>
            <div className="mt-6 border-t border-border-soft pt-5">
              <p className="mb-3 text-[12.5px] font-semibold">
                Compras{" "}
                <span className="text-text-muted">
                  ({fornecedor.compras.length} · {money(fornecedor.totalComprado)})
                </span>
              </p>
              <div className="space-y-1.5">
                {fornecedor.compras.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 rounded-sm bg-panel-alt px-2.5 py-1.5 text-[12px]"
                  >
                    <span className="w-16 shrink-0 text-text-muted">
                      {shortDate(c.data)}
                    </span>
                    <span className="flex-1 truncate text-text-secondary">
                      {c.obraNome ?? "sem obra"}
                    </span>
                    <span className="tabular shrink-0 font-medium">
                      {money(c.valor)}
                    </span>
                    <form action={removeCompra}>
                      <input type="hidden" name="id" value={c.id} />
                      <button
                        type="submit"
                        aria-label="Remover compra"
                        className="text-text-muted hover:text-risk"
                      >
                        <CloseIcon className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                ))}
                {fornecedor.compras.length === 0 && (
                  <p className="text-[11.5px] text-text-muted">
                    Nenhuma compra registrada.
                  </p>
                )}
              </div>

              <form action={addCompra} className="mt-2.5 flex flex-wrap gap-2">
                <input
                  type="hidden"
                  name="fornecedor_id"
                  value={fornecedor.id}
                />
                <select
                  name="obra_id"
                  className={`${inputCls} mt-0 flex-1 basis-[45%]`}
                >
                  <option value="">Sem obra</option>
                  {obras.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nome}
                    </option>
                  ))}
                </select>
                <input
                  name="valor"
                  inputMode="decimal"
                  required
                  placeholder="Valor (R$)"
                  className={`${inputCls} mt-0 w-[110px]`}
                />
                <input
                  type="date"
                  name="data"
                  className={`${inputCls} mt-0 w-[140px]`}
                />
                <button
                  type="submit"
                  className="rounded-sm border border-border px-3 text-[12.5px] text-text-secondary hover:text-text-primary"
                >
                  + compra
                </button>
              </form>
            </div>

            <AnexosSection
              escopo="fornecedor"
              refId={fornecedor.id}
              anexos={anexos}
              title="Contratos e documentos"
            />
          </>
        )}
      </>
    </Drawer>
  );
}
