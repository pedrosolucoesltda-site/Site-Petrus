import Link from "next/link";
import { getFornecedores, type FornecedorComResumo } from "@/lib/queries";
import type { FornecedorCategoria } from "@/lib/database.types";
import { money, shortDate, initials } from "@/lib/format";
import {
  PageHeader,
  Panel,
  Tag,
  StarRating,
  DataTable,
  cn,
} from "@/components/ui";
import { SearchIcon } from "@/components/icons";

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
  const all = await getFornecedores();

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
        right={
          <div className="flex items-center gap-2.5">
            <span className="flex w-[200px] items-center gap-2 rounded-full border border-border bg-panel px-3.5 py-2 text-[13px] text-text-muted">
              <SearchIcon className="h-3.5 w-3.5 shrink-0" />
              Buscar fornecedor
            </span>
            <button className="whitespace-nowrap rounded-full border border-purple bg-purple px-4 py-2.5 text-[12.5px] font-semibold text-[#16131f]">
              + Novo fornecedor
            </button>
          </div>
        }
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

      <Panel title="Fornecedores cadastrados">
        {forns.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-text-muted">
            Nenhum fornecedor para este filtro.
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
            {forns.map((f) => (
              <FornRow key={f.id} f={f} />
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}

function FornRow({ f }: { f: FornecedorComResumo }) {
  return (
    <tr>
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
  );
}
