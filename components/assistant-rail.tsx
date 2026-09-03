"use client";

import { useState } from "react";
import { ASSISTANTS, GROUP_LABEL, GROUP_ORDER } from "@/lib/assistants";
import { AssistantPanel } from "@/components/assistant-panel";
import { cn } from "@/components/ui";

const GROUP_DOT: Record<string, string> = {
  licitacoes: "bg-teal",
  financeiro: "bg-gold",
};
const GROUP_AVATAR: Record<string, string> = {
  licitacoes: "bg-teal",
  financeiro: "bg-gold",
};

export function AssistantRail({ note }: { note?: string }) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <>
      <aside className="flex flex-col border-l border-border-soft bg-rail px-4 py-5">
        <p className="mb-[18px] pl-1 text-[11px] tracking-[0.04em] text-text-muted">
          ASSISTENTES
        </p>

        {GROUP_ORDER.map((group) => {
          const items = ASSISTANTS.filter((a) => a.group === group);
          return (
            <div key={group} className="mb-[22px]">
              <div className="mb-2.5 flex items-center gap-1.5 pl-1 text-[11px] text-text-muted">
                <span
                  className={cn("h-1.5 w-1.5 rounded-full", GROUP_DOT[group])}
                />
                {GROUP_LABEL[group]}
              </div>

              {items.map((a) => (
                <button
                  key={a.key}
                  onClick={() => setOpenKey(a.key)}
                  title={a.system}
                  className="mb-0.5 flex w-full items-center gap-2.5 rounded-sm p-2 text-left transition-colors hover:bg-panel-alt"
                >
                  <span
                    className={cn(
                      "flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] font-grotesk text-[12px] font-semibold text-[#14140f]",
                      GROUP_AVATAR[group],
                    )}
                  >
                    {a.initials}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-text-primary">
                      {a.name}
                    </span>
                    <span className="block truncate text-[11px] text-text-muted">
                      {a.role}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          );
        })}

        {note && (
          <p className="mt-1.5 border-t border-dashed border-border-soft px-2 pt-2.5 text-[11.5px] leading-relaxed text-text-muted">
            {note}
          </p>
        )}

        <div className="mt-auto border-t border-border-soft pt-4">
          <button
            onClick={() => setOpenKey(ASSISTANTS[0].key)}
            className="w-full rounded-sm border border-dashed border-border px-2.5 py-2.5 text-[12px] text-text-secondary transition-colors hover:border-text-muted hover:text-text-primary"
          >
            + Nova conversa
          </button>
        </div>
      </aside>

      {openKey && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setOpenKey(null)}
          />
          <AssistantPanel
            assistantKey={openKey}
            onClose={() => setOpenKey(null)}
          />
        </>
      )}
    </>
  );
}
