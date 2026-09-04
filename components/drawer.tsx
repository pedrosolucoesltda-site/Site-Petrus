"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons";
import { cn } from "@/components/ui";

/**
 * Painel lateral padrão. Fecha ao clicar fora ou apertar Esc — mas se
 * `dirty` estiver marcado (formulário alterado), pede confirmação antes.
 */
export function Drawer({
  open,
  onClose,
  title,
  dirty = false,
  width = "max-w-[440px]",
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  dirty?: boolean;
  width?: string;
  children: React.ReactNode;
}) {
  function requestClose() {
    if (
      dirty &&
      !window.confirm("Você tem alterações não salvas. Deseja descartá-las?")
    )
      return;
    onClose();
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={requestClose}
      />
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-border bg-panel shadow-2xl",
          width,
        )}
      >
        <header className="flex items-center justify-between border-b border-border-soft p-4">
          {typeof title === "string" ? (
            <p className="text-[13px] font-semibold">{title}</p>
          ) : (
            title
          )}
          <button
            onClick={requestClose}
            aria-label="Fechar"
            className="text-text-muted hover:text-text-primary"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </>
  );
}
