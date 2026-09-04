"use client";

import { useActionState, useEffect, useState } from "react";
import type { Anexo, DocumentoCategoria } from "@/lib/database.types";
import type { DocumentoComStatus } from "@/lib/queries";
import { shortDate } from "@/lib/format";
import { Panel, StatusPill, Tag, DataTable } from "@/components/ui";
import { CloseIcon } from "@/components/icons";
import { AnexosSection } from "@/components/anexos-section";
import {
  createDocumento,
  updateDocumento,
  deleteDocumento,
  type DocActionState,
} from "@/app/(app)/documentos/actions";

// Rótulos de exibição (inclui categorias legadas ainda presentes em dados antigos).
const CATEGORIA_LABEL: Record<DocumentoCategoria, string> = {
  contratos: "Contratos",
  certidoes: "Certidões",
  arts_rrts: "ARTs / RRTs",
  societario: "Documento dos Sócios",
  obras: "Obras",
  licitacoes: "Licitações",
};

// Categorias oferecidas ao usuário (Obras/Licitações saem — o vínculo já cobre isso).
const CATEGORIAS_ATIVAS: DocumentoCategoria[] = [
  "contratos",
  "certidoes",
  "arts_rrts",
  "societario",
];
const STATUS_META = {
  valido: { tone: "positive", label: "Válido" },
  vencendo: { tone: "alert", label: "Vencendo" },
  vencido: { tone: "risk", label: "Vencido" },
} as const;

const inputCls =
  "mt-1 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted disabled:opacity-60";

interface Ref {
  id: string;
  nome: string;
}

export function DocumentosManager({
  docs,
  isAdmin,
  obras,
  licitacoes,
  anexosByRef,
  emptyMessage,
}: {
  docs: DocumentoComStatus[];
  isAdmin: boolean;
  obras: Ref[];
  licitacoes: Ref[];
  anexosByRef: Record<string, Anexo[]>;
  emptyMessage: string;
}) {
  const [mode, setMode] = useState<null | "new" | string>(null);
  const selected =
    typeof mode === "string" && mode !== "new"
      ? (docs.find((d) => d.id === mode) ?? null)
      : null;

  useEffect(() => {
    if (typeof mode === "string" && mode !== "new" && !selected) setMode(null);
  }, [mode, selected]);

  return (
    <Panel
      title="Documentos cadastrados"
      action={
        isAdmin ? (
          <button
            onClick={() => setMode("new")}
            className="rounded-full border border-blue bg-blue px-4 py-2 text-[12.5px] font-semibold text-[#0d1420]"
          >
            + Novo documento
          </button>
        ) : undefined
      }
    >
      {docs.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-text-muted">
          {emptyMessage}
        </p>
      ) : (
        <DataTable
          head={
            <>
              <th>Documento</th>
              <th>Categoria</th>
              <th>Vínculo</th>
              <th>Validade</th>
              <th>Status</th>
              <th className="text-right">Arquivos</th>
            </>
          }
        >
          {docs.map((d) => {
            const meta = STATUS_META[d.computedStatus];
            const n = anexosByRef[d.id]?.length ?? 0;
            return (
              <tr
                key={d.id}
                onClick={() => setMode(d.id)}
                className="cursor-pointer hover:bg-panel-alt"
              >
                <td className="font-medium">{d.nome}</td>
                <td>
                  <Tag>{CATEGORIA_LABEL[d.categoria]}</Tag>
                </td>
                <td className="text-text-secondary">
                  {d.obraNome ?? d.licitacaoObjeto ?? "—"}
                </td>
                <td className="text-text-secondary">
                  {shortDate(d.data_validade)}
                </td>
                <td>
                  <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                </td>
                <td className="text-right text-text-muted">
                  {n > 0 ? `${n} arquivo(s)` : "—"}
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}

      {mode !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMode(null)}
          />
          <DocDrawer
            key={selected?.id ?? "new"}
            doc={selected}
            isAdmin={isAdmin}
            obras={obras}
            licitacoes={licitacoes}
            anexos={selected ? (anexosByRef[selected.id] ?? []) : []}
            onClose={() => setMode(null)}
            onCreated={(id) => setMode(id)}
          />
        </>
      )}
    </Panel>
  );
}

function DocDrawer({
  doc,
  isAdmin,
  obras,
  licitacoes,
  anexos,
  onClose,
  onCreated,
}: {
  doc: DocumentoComStatus | null;
  isAdmin: boolean;
  obras: Ref[];
  licitacoes: Ref[];
  anexos: Anexo[];
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const isEdit = Boolean(doc);
  const [state, formAction, pending] = useActionState<DocActionState, FormData>(
    isEdit ? updateDocumento : createDocumento,
    {},
  );

  useEffect(() => {
    if (!state.ok) return;
    if (isEdit) onClose();
    else if (state.id) onCreated(state.id); // abre em modo edição p/ anexar
  }, [state.ok, state.id, isEdit, onClose, onCreated]);

  const disabled = !isAdmin;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border bg-panel shadow-2xl">
      <header className="flex items-center justify-between border-b border-border-soft p-4">
        <p className="text-[13px] font-semibold">
          {isEdit ? "Documento" : "Novo documento"}
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
          {isEdit && <input type="hidden" name="id" value={doc!.id} />}

          <label className="block text-[12px] text-text-secondary">
            Nome
            <input
              name="nome"
              required
              disabled={disabled}
              defaultValue={doc?.nome ?? ""}
              className={inputCls}
            />
          </label>
          <label className="block text-[12px] text-text-secondary">
            Categoria
            <select
              name="categoria"
              disabled={disabled}
              defaultValue={doc?.categoria ?? "contratos"}
              className={inputCls}
            >
              {/* mantém a categoria atual mesmo que seja uma legada */}
              {(doc && !CATEGORIAS_ATIVAS.includes(doc.categoria)
                ? [doc.categoria, ...CATEGORIAS_ATIVAS]
                : CATEGORIAS_ATIVAS
              ).map((c) => (
                <option key={c} value={c}>
                  {CATEGORIA_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Obra vinculada
              <select
                name="obra_id"
                disabled={disabled}
                defaultValue={doc?.obra_id ?? ""}
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
            <label className="block text-[12px] text-text-secondary">
              Licitação vinculada
              <select
                name="licitacao_id"
                disabled={disabled}
                defaultValue={doc?.licitacao_id ?? ""}
                className={inputCls}
              >
                <option value="">—</option>
                {licitacoes.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.nome}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Validade
              <input
                type="date"
                name="data_validade"
                disabled={disabled}
                defaultValue={doc?.data_validade ?? ""}
                className={inputCls}
              />
            </label>
            <label className="block text-[12px] text-text-secondary">
              Link externo (opcional)
              <input
                name="arquivo_url"
                disabled={disabled}
                defaultValue={doc?.arquivo_url ?? ""}
                className={inputCls}
              />
            </label>
          </div>

          {state.error && (
            <p className="text-[12.5px] text-risk">{state.error}</p>
          )}

          {isAdmin && (
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="rounded-sm bg-blue px-4 py-2 text-[13px] font-semibold text-[#0d1420] disabled:opacity-60"
              >
                {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar documento"}
              </button>
              {isEdit && (
                <button
                  type="submit"
                  formAction={deleteDocumento}
                  className="rounded-sm border border-border px-3 py-2 text-[12.5px] text-risk hover:border-risk"
                >
                  Excluir
                </button>
              )}
            </div>
          )}
        </form>

        {isEdit && doc && (
          <AnexosSection
            escopo="documento"
            refId={doc.id}
            anexos={anexos}
            readOnly={!isAdmin}
          />
        )}
        {!isEdit && (
          <p className="mt-4 text-[11.5px] text-text-muted">
            Salve o documento para poder anexar arquivos.
          </p>
        )}
      </div>
    </div>
  );
}
