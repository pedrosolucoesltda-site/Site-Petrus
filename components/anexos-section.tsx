"use client";

import { useRef, useState } from "react";
import type { Anexo, AnexoEscopo } from "@/lib/database.types";
import { fileSize } from "@/lib/format";
import { CloseIcon } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { registerAnexo, removeAnexo, getAnexoUrl } from "@/lib/anexos-actions";

const BUCKET = "anexos";

export function AnexosSection({
  escopo,
  refId,
  anexos,
  readOnly = false,
  title = "Arquivos",
}: {
  escopo: AnexoEscopo;
  refId: string;
  anexos: Anexo[];
  readOnly?: boolean;
  title?: string;
}) {
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
      const caminho = `${escopo}/${refId}/${crypto.randomUUID()}.${ext}`;

      const up = await supabase.storage
        .from(BUCKET)
        .upload(caminho, file, { contentType: file.type || undefined });
      if (up.error) {
        setError(up.error.message);
        return;
      }

      const fd = new FormData();
      fd.set("escopo", escopo);
      fd.set("ref_id", refId);
      fd.set("nome", file.name);
      fd.set("caminho", caminho);
      fd.set("tamanho", String(file.size));
      fd.set("tipo", file.type);
      const res = await registerAnexo(fd);
      if (res.error) setError(res.error);
    } catch {
      setError("Falha no upload.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function download(caminho: string) {
    const url = await getAnexoUrl(caminho);
    if (url) window.open(url, "_blank", "noopener");
  }

  return (
    <div className="mt-6 border-t border-border-soft pt-5">
      <p className="mb-3 text-[12.5px] font-semibold">
        {title} <span className="text-text-muted">({anexos.length})</span>
      </p>

      <div className="space-y-1.5">
        {anexos.map((a) => (
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
            {!readOnly && (
              <form action={removeAnexo}>
                <input type="hidden" name="escopo" value={escopo} />
                <input type="hidden" name="id" value={a.id} />
                <button
                  type="submit"
                  aria-label="Remover arquivo"
                  className="text-text-muted hover:text-risk"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </form>
            )}
          </div>
        ))}
        {anexos.length === 0 && (
          <p className="text-[11.5px] text-text-muted">Nenhum arquivo anexado.</p>
        )}
      </div>

      {!readOnly && (
        <>
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
        </>
      )}
    </div>
  );
}
