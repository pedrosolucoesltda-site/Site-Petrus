import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDocumentos, getObras, getLicitacoes } from "@/lib/queries";
import { getAnexos, groupAnexos } from "@/lib/anexos";
import type { DocumentoCategoria } from "@/lib/database.types";
import { Card, PageHeader, cn } from "@/components/ui";
import { DocumentosManager } from "@/components/documentos-manager";

export const metadata = { title: "Documentos — Petrus Soluções" };

const CATEGORIA_LABEL: Record<DocumentoCategoria, string> = {
  contratos: "Contratos",
  certidoes: "Certidões",
  arts_rrts: "ARTs / RRTs",
  societario: "Documento dos Sócios",
  obras: "Obras",
  licitacoes: "Licitações",
};

// Categorias oferecidas nos filtros (Obras/Licitações ficam de fora).
const CATEGORIAS_ATIVAS: DocumentoCategoria[] = [
  "contratos",
  "certidoes",
  "arts_rrts",
  "societario",
];

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const [session, all, obras, licitacoes, anexos] = await Promise.all([
    getSession(),
    getDocumentos(),
    getObras(),
    getLicitacoes(),
    getAnexos("documento"),
  ]);
  const anexosByRef = Object.fromEntries(groupAnexos(anexos));

  const cats = CATEGORIAS_ATIVAS;
  const active = cats.includes(categoria as DocumentoCategoria)
    ? (categoria as DocumentoCategoria)
    : null;
  const docs = active ? all.filter((d) => d.categoria === active) : all;

  const vencendo = all.filter((d) => d.computedStatus === "vencendo").length;
  const vencido = all.filter((d) => d.computedStatus === "vencido").length;

  return (
    <>
      <PageHeader
        title="Documentos"
        subtitle="Petrus Soluções — contratos, certidões e ARTs"
        badge={
          !session?.isAdmin ? (
            <span className="mt-2 block text-[11px] text-text-muted">
              Modo visualização — apenas administradores editam ou excluem.
            </span>
          ) : undefined
        }
      />

      <div className="mb-4 grid grid-cols-3 gap-4">
        <Card>
          <p className="text-[12.5px] text-text-secondary">Total</p>
          <p className="tabular mt-2 text-[24px] font-semibold">{all.length}</p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">Vencendo (30 dias)</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-alert">
            {vencendo}
          </p>
        </Card>
        <Card>
          <p className="text-[12.5px] text-text-secondary">Vencidos</p>
          <p className="tabular mt-2 text-[24px] font-semibold text-risk">
            {vencido}
          </p>
        </Card>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        <Link
          href="/documentos"
          className={cn(
            "rounded-full border px-4 py-2 text-[12.5px]",
            !active
              ? "border-blue bg-blue/15 text-blue"
              : "border-border bg-panel text-text-secondary hover:text-text-primary",
          )}
        >
          Todos ({all.length})
        </Link>
        {cats.map((c) => {
          const n = all.filter((d) => d.categoria === c).length;
          return (
            <Link
              key={c}
              href={`/documentos?categoria=${c}`}
              className={cn(
                "rounded-full border px-4 py-2 text-[12.5px]",
                active === c
                  ? "border-blue bg-blue/15 text-blue"
                  : "border-border bg-panel text-text-secondary hover:text-text-primary",
              )}
            >
              {CATEGORIA_LABEL[c]} ({n})
            </Link>
          );
        })}
      </div>

      <DocumentosManager
        docs={docs}
        isAdmin={!!session?.isAdmin}
        obras={obras.map((o) => ({ id: o.id, nome: o.nome }))}
        licitacoes={licitacoes.map((l) => ({ id: l.id, nome: l.objeto }))}
        anexosByRef={anexosByRef}
        emptyMessage="Nenhum documento para este filtro."
      />
    </>
  );
}
