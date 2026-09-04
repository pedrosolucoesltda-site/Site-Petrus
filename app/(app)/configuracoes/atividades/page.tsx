import { getAtividades } from "@/lib/queries";
import { acaoTone } from "@/lib/atividades";
import { dateTime, initials } from "@/lib/format";
import { Panel } from "@/components/ui";

export const metadata = {
  title: "Linha do tempo — Configurações — Petrus Soluções",
};

export default async function AtividadesPage() {
  const atividades = await getAtividades();

  return (
    <Panel
      title="Linha do tempo — Licitações"
      action={
        <span className="text-[11.5px] text-text-muted">
          {atividades.length} registro(s)
        </span>
      }
    >
      {atividades.length === 0 ? (
        <p className="py-8 text-center text-[13px] text-text-muted">
          Nenhuma alteração registrada ainda.
        </p>
      ) : (
        <ol className="space-y-0">
          {atividades.map((a) => (
            <li
              key={a.id}
              className="flex gap-3 border-b border-border-soft py-3 last:border-none"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-panel-alt font-grotesk text-[10.5px] font-semibold text-text-secondary">
                {initials(a.user_nome)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] leading-snug">
                  <span className="font-medium">{a.user_nome}</span>{" "}
                  <span className={acaoTone(a.acao)}>{a.descricao}</span>
                </p>
                <p className="mt-0.5 truncate text-[11.5px] text-text-muted">
                  {a.licitacao_label || "—"}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[11px] text-text-muted">
                {dateTime(a.created_at)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
