import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getDocumentos, type DocumentoComStatus } from "@/lib/queries";
import type { DocumentoCategoria } from "@/lib/database.types";
import { shortDate } from "@/lib/format";
import {
  Card,
  PageHeader,
  Panel,
  StatusPill,
  Tag,
  DataTable,
  cn,
} from "@/components/ui";

export const metadata = { title: "Documentos — Petrus Soluções" };

const CATEGORIA_LABEL: Record<DocumentoCategoria, string> = {
  contratos: "Contratos",
  certidoes: "Certidões",
  arts_rrts: "ARTs / RRTs",
  societario: "Societário",
  obras: "Obras",
  licitacoes: "Licitações",
};

const STATUS_META = {
  valido: { tone: "positive", label: "Válido" },
  vencendo: { tone: "alert", label: "Vencendo" },
  vencido: { tone: "risk", label: "Vencido" },
} as const;

export default async function DocumentosPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const session = await getSession();
  const all = await getDocumentos();

  const cats = Object.keys(CATEGORIA_LABEL) as DocumentoCategoria[];
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
              Modo visualização — apenas administradores podem editar ou excluir.
            </span>
          ) : undefined
        }
        right={
          session?.isAdmin ? (
            <button className="rounded-full border border-blue bg-blue px-4 py-2.5 text-[12.5px] font-semibold text-[#0d1420]">
              + Novo documento
            </button>
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

      <Panel title="Documentos cadastrados">
        {docs.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-text-muted">
            Nenhum documento para este filtro.
          </p>
        ) : (
          <DataTable
            head={
              <>
                <th>Documento</th>
                <th>Categoria</th>
                <th>Vínculo</th>
                <th>Validade</th>
                <th>Status</th>
                {session?.isAdmin && <th className="text-right">Ações</th>}
              </>
            }
          >
            {docs.map((d) => (
              <DocRow key={d.id} d={d} isAdmin={!!session?.isAdmin} />
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}

function DocRow({ d, isAdmin }: { d: DocumentoComStatus; isAdmin: boolean }) {
  const meta = STATUS_META[d.computedStatus];
  const vinculo = d.obraNome ?? d.licitacaoObjeto ?? "—";
  return (
    <tr>
      <td className="font-medium">{d.nome}</td>
      <td>
        <Tag>{CATEGORIA_LABEL[d.categoria]}</Tag>
      </td>
      <td className="text-text-secondary">{vinculo}</td>
      <td className="text-text-secondary">{shortDate(d.data_validade)}</td>
      <td>
        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
      </td>
      {isAdmin && (
        <td className="text-right">
          <span className="text-[12px] text-text-muted">
            {d.arquivo_url ? (
              <a
                href={d.arquivo_url}
                className="text-blue hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                abrir
              </a>
            ) : (
              "sem arquivo"
            )}
          </span>
        </td>
      )}
    </tr>
  );
}
