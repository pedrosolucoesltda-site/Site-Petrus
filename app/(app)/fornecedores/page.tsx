import Link from "next/link";
import { getFornecedores, getObras } from "@/lib/queries";
import { getAnexos, groupAnexos } from "@/lib/anexos";
import type { FornecedorCategoria } from "@/lib/database.types";
import { PageHeader, cn } from "@/components/ui";
import { FornecedoresManager } from "@/components/fornecedores-manager";

export const metadata = { title: "Fornecedores — Petrus Soluções" };

const CATEGORIA_LABEL: Record<FornecedorCategoria, string> = {
  material: "Material",
  mao_de_obra: "Mão de obra",
  equipamento: "Equipamento",
};

export default async function FornecedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [all, obras, anexos] = await Promise.all([
    getFornecedores(),
    getObras(),
    getAnexos("fornecedor"),
  ]);
  const anexosByRef = Object.fromEntries(groupAnexos(anexos));

  const cats = Object.keys(CATEGORIA_LABEL) as FornecedorCategoria[];
  const active = cats.includes(categoria as FornecedorCategoria)
    ? (categoria as FornecedorCategoria)
    : null;
  const forns = active ? all.filter((f) => f.categoria === active) : all;

  return (
    <>
      <PageHeader
        title="Fornecedores"
        subtitle="Petrus Soluções — cadastro e histórico"
      />

      <div className="mb-5 flex flex-wrap gap-2.5">
        <Link
          href="/fornecedores"
          className={cn(
            "rounded-full border px-4 py-2 text-[12.5px]",
            !active
              ? "border-purple bg-purple/15 text-purple"
              : "border-border bg-panel text-text-secondary hover:text-text-primary",
          )}
        >
          Todos ({all.length})
        </Link>
        {cats.map((c) => {
          const n = all.filter((f) => f.categoria === c).length;
          return (
            <Link
              key={c}
              href={`/fornecedores?categoria=${c}`}
              className={cn(
                "rounded-full border px-4 py-2 text-[12.5px]",
                active === c
                  ? "border-purple bg-purple/15 text-purple"
                  : "border-border bg-panel text-text-secondary hover:text-text-primary",
              )}
            >
              {CATEGORIA_LABEL[c]} ({n})
            </Link>
          );
        })}
      </div>

      <FornecedoresManager
        fornecedores={forns}
        obras={obras.map((o) => ({ id: o.id, nome: o.nome }))}
        anexosByRef={anexosByRef}
        emptyMessage="Nenhum fornecedor para este filtro."
      />
    </>
  );
}
