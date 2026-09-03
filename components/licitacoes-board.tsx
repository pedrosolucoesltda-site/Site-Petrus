"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { LicitacaoComChecklist } from "@/lib/queries";
import type { LicitacaoFase } from "@/lib/database.types";
import { moneyCompact, daysUntil, deadlineLabel, fileSize } from "@/lib/format";
import { StatusPill, cn } from "@/components/ui";
import { CloseIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import {
  createLicitacao,
  updateLicitacao,
  deleteLicitacao,
  addChecklistItem,
  toggleChecklistItem,
  removeChecklistItem,
  registerArquivo,
  removeArquivo,
  getArquivoUrl,
  type ActionState,
} from "@/app/(app)/licitacoes/actions";

const BUCKET = "licitacao-arquivos";

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

export function LicitacoesBoard({ lics }: { lics: LicitacaoComChecklist[] }) {
  const [mode, setMode] = useState<null | "new" | string>(null);
  const selected =
    typeof mode === "string" && mode !== "new"
      ? (lics.find((l) => l.id === mode) ?? null)
      : null;

  // edital aberto foi excluído → fecha o painel
  useEffect(() => {
    if (typeof mode === "string" && mode !== "new" && !selected) setMode(null);
  }, [mode, selected]);

  return (
    <>
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[14.5px] font-semibold">Funil de licitações</h2>
        <button
          onClick={() => setMode("new")}
          className="rounded-sm border border-teal bg-teal px-3.5 py-2 text-[12.5px] font-semibold text-[#0e1a17]"
        >
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
                  <button
                    key={l.id}
                    onClick={() => setMode(l.id)}
                    className="block w-full text-left"
                  >
                    <EditalCard l={l} />
                  </button>
                ))}
                {items.length === 0 && (
                  <p className="px-1 py-2 text-[11.5px] text-text-muted">
                    Vazio
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mode !== null && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMode(null)}
          />
          <EditalDrawer
            key={selected?.id ?? "new"}
            edital={selected}
            onClose={() => setMode(null)}
          />
        </>
      )}
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
    <div className="rounded-sm border border-border-soft bg-panel-alt p-3 transition-colors hover:border-teal">
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

const inputCls =
  "mt-1 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted";

function EditalDrawer({
  edital,
  onClose,
}: {
  edital: LicitacaoComChecklist | null;
  onClose: () => void;
}) {
  const isEdit = Boolean(edital);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    isEdit ? updateLicitacao : createLicitacao,
    {},
  );
  const [fase, setFase] = useState<LicitacaoFase>(edital?.fase ?? "em_analise");

  useEffect(() => {
    if (state.ok) onClose();
  }, [state.ok, onClose]);

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[440px] flex-col border-l border-border bg-panel shadow-2xl">
      <header className="flex items-center justify-between border-b border-border-soft p-4">
        <p className="text-[13px] font-semibold">
          {isEdit ? "Editar edital" : "Novo edital"}
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
          {isEdit && <input type="hidden" name="id" value={edital!.id} />}

          <label className="block text-[12px] text-text-secondary">
            Órgão
            <input
              name="orgao"
              required
              defaultValue={edital?.orgao ?? ""}
              className={inputCls}
            />
          </label>
          <label className="block text-[12px] text-text-secondary">
            Objeto
            <input
              name="objeto"
              required
              defaultValue={edital?.objeto ?? ""}
              className={inputCls}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Valor estimado (R$)
              <input
                name="valor_estimado"
                inputMode="decimal"
                defaultValue={edital?.valor_estimado ?? ""}
                className={inputCls}
              />
            </label>
            <label className="block text-[12px] text-text-secondary">
              Prazo de envio
              <input
                type="date"
                name="prazo_envio"
                defaultValue={edital?.prazo_envio ?? ""}
                className={inputCls}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-[12px] text-text-secondary">
              Fase
              <select
                name="fase"
                value={fase}
                onChange={(e) => setFase(e.target.value as LicitacaoFase)}
                className={inputCls}
              >
                {FASES.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            {fase === "resultado" && (
              <label className="block text-[12px] text-text-secondary">
                Resultado
                <select
                  name="resultado"
                  defaultValue={edital?.resultado ?? "vencedor"}
                  className={inputCls}
                >
                  <option value="vencedor">Vencedor</option>
                  <option value="perdido">Perdido</option>
                </select>
              </label>
            )}
          </div>

          {state.error && (
            <p className="text-[12.5px] text-risk">{state.error}</p>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              type="submit"
              disabled={pending}
              className="rounded-sm bg-teal px-4 py-2 text-[13px] font-semibold text-[#0e1a17] disabled:opacity-60"
            >
              {pending ? "Salvando…" : isEdit ? "Salvar" : "Criar edital"}
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

        {isEdit && edital && (
          <div className="mt-6 border-t border-border-soft pt-5">
            <p className="mb-3 text-[12.5px] font-semibold">
              Checklist de habilitação{" "}
              <span className="text-text-muted">
                ({edital.docsEntregues}/{edital.docsTotal})
              </span>
            </p>

            <div className="space-y-1.5">
              {edital.checklist.map((c) => (
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
              {edital.checklist.length === 0 && (
                <p className="text-[11.5px] text-text-muted">
                  Nenhum documento no checklist.
                </p>
              )}
            </div>

            <form
              action={addChecklistItem}
              className="mt-2.5 flex gap-2"
            >
              <input type="hidden" name="licitacao_id" value={edital.id} />
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
        )}

        {isEdit && edital && <ArquivosSection edital={edital} />}
      </div>
    </div>
  );
}

function ArquivosSection({ edital }: { edital: LicitacaoComChecklist }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      if (file.size > 50 * 1024 * 1024) {
        setError("Arquivo acima de 50 MB.");
        return;
      }
      const supabase = createClient();
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const caminho = `${edital.id}/${crypto.randomUUID()}.${ext}`;

      const up = await supabase.storage
        .from(BUCKET)
        .upload(caminho, file, { contentType: file.type || undefined });
      if (up.error) {
        setError(up.error.message);
        return;
      }

      const fd = new FormData();
      fd.set("licitacao_id", edital.id);
      fd.set("nome", file.name);
      fd.set("caminho", caminho);
      fd.set("tamanho", String(file.size));
      fd.set("tipo", file.type);
      const res = await registerArquivo(fd);
      if (res.error) setError(res.error);
    } catch {
      setError("Falha no upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function download(caminho: string) {
    const url = await getArquivoUrl(caminho);
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div className="mt-6 border-t border-border-soft pt-5">
      <p className="mb-3 text-[12.5px] font-semibold">
        Arquivos{" "}
        <span className="text-text-muted">({edital.arquivos.length})</span>
      </p>

      <div className="space-y-1.5">
        {edital.arquivos.map((a) => (
          <div
            key={a.id}
            className="flex items-center gap-2 rounded-sm bg-panel-alt px-2.5 py-1.5"
          >
            <button
              onClick={() => download(a.caminho)}
              className="flex-1 truncate text-left text-[12px] text-teal hover:underline"
              title={a.nome}
            >
              {a.nome}
            </button>
            <span className="shrink-0 text-[11px] text-text-muted">
              {fileSize(a.tamanho)}
            </span>
            <form action={removeArquivo}>
              <input type="hidden" name="id" value={a.id} />
              <button
                type="submit"
                aria-label="Remover arquivo"
                className="text-text-muted hover:text-risk"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </form>
          </div>
        ))}
        {edital.arquivos.length === 0 && (
          <p className="text-[11.5px] text-text-muted">Nenhum arquivo anexado.</p>
        )}
      </div>

      <label className="mt-2.5 flex cursor-pointer items-center justify-center rounded-sm border border-dashed border-border px-3 py-2.5 text-[12px] text-text-secondary hover:border-text-muted hover:text-text-primary">
        {uploading ? "Enviando…" : "+ Anexar arquivo do computador"}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          disabled={uploading}
          onChange={onPick}
        />
      </label>
      {error && <p className="mt-1.5 text-[12px] text-risk">{error}</p>}
      <p className="mt-1 text-[11px] text-text-muted">
        PDF, Word, planilhas, imagens, zip — até 50 MB por arquivo.
      </p>
    </div>
  );
}
