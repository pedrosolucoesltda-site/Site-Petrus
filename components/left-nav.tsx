"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MODULES } from "@/lib/modules";
import { MODULE_ICONS } from "@/components/icons";
import { cn } from "@/components/ui";
import { initials } from "@/lib/format";

export function LeftNav({
  isAdmin,
  userLabel,
}: {
  isAdmin: boolean;
  userLabel: string;
}) {
  const pathname = usePathname();
  const items = MODULES.filter((m) => !m.adminOnly || isAdmin);

  return (
    <nav className="flex flex-col items-center gap-1.5 border-r border-border-soft bg-rail py-[18px]">
      <div className="mb-[22px] flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-gold font-grotesk text-base font-bold text-[#141410]">
        P
      </div>

      {items.map((m) => {
        const Icon = MODULE_ICONS[m.key];
        const active =
          pathname === m.href || pathname.startsWith(`${m.href}/`);
        return (
          <Link
            key={m.key}
            href={m.href}
            title={m.label}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-[38px] w-[38px] items-center justify-center rounded-lg transition-colors",
              active
                ? "bg-panel-alt"
                : "text-text-muted hover:text-text-secondary",
            )}
            style={active ? { color: `var(--color-${m.accent})` } : undefined}
          >
            <Icon className="h-[18px] w-[18px]" />
          </Link>
        );
      })}

      <form action="/auth/signout" method="post" className="mt-auto">
        <button
          type="submit"
          title={`Sair (${userLabel})`}
          className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-panel-alt font-grotesk text-[11px] font-semibold text-text-secondary transition-colors hover:text-text-primary"
        >
          {initials(userLabel)}
        </button>
      </form>
    </nav>
  );
}
