import Link from "next/link";
import { getObras } from "@/lib/queries";
import { getAnexos, groupAnexos } from "@/lib/anexos";
import type { ObraStatus } from "@/lib/database.types";
import { Card, PageHeader, cn } from "@/components/ui";
import { ObrasManager } from "@/components/obras-manager";

export const metadata = { title: "Obras — Petrus Soluções" };

export default async function ObrasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const [all, anexos] = await Promise.all([getObras(), getAnexos("obra")]);
  const anexosByRef = Object.fromEntries(groupAnexos(anexos));

  const counts = {
    total: all.length,
    em_dia: all.filter((o) => o.status === "em_dia").length,
    atencao: all.filter((o) => o.status === "atencao").length,
    atrasada: all.filter((o) => o.status === "atrasada").length,
  };

  const active = (["em_dia", "atencao", "atrasada"] as const).includes(
    status as ObraStatus,
  )
    ? (status as ObraStatus)
    : null;
  const obras = active ? all.filter((o) => o.status === active) : all;

  const chips: { key: string | null; label: string }[] = [
    { key: null, label: `Todas (${counts.total})` },
    { key: "em_dia", label: `Em dia (${counts.em_dia})` },
    { key: "atencao", label: `Atenção (${counts.atencao})` },
    { key: "atrasada", label: `Atrasada (${counts.atrasada})` },
  ];

  return (
    <>
      <PageHeader
        title="Obras"
        subtitle="Petrus Soluções — andamento e responsáveis"
      />

      <div className="mb-[18px] grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-[12.5px] text-text-secondary">Em andamento</p>
          <p className="tabular mt-2 text-[24px] font-semibold">
            {all.filter((o) => o.progresso_pct < 100).length}
          </p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">No prazo</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-positive">
            {counts.em_dia}
          </p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">Atenção</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-alert">
            {counts.atencao}
          </p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">Atrasada</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-risk">
            {counts.atrasada}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        {chips.map((c) => {
          const isActive = c.key === active;
          return (
            <Link
              key={c.label}
              href={c.key ? `/obras?status=${c.key}` : "/obras"}
              className={cn(
                "rounded-full border px-4 py-2 text-[12.5px] transition-colors",
                isActive
                  ? "border-brick bg-brick/15 text-brick"
                  : "border-border bg-panel text-text-secondary hover:text-text-primary",
              )}
            >
              {c.label}
            </Link>
          );
        })}
      </div>

      <ObrasManager
        obras={obras}
        anexosByRef={anexosByRef}
        emptyMessage={
          active ? "Nenhuma obra para este filtro." : "Nenhuma obra cadastrada."
        }
      />
    </>
  );
}
