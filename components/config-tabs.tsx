"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const TABS = [
  { href: "/configuracoes/usuarios", label: "Usuários" },
  { href: "/configuracoes/atividades", label: "Linha do tempo" },
];

export function ConfigTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-5 flex gap-2 border-b border-border-soft">
      {TABS.map((t) => {
        const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
              active
                ? "border-gold text-text-primary"
                : "border-transparent text-text-muted hover:text-text-secondary",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
