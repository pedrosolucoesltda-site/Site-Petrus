import { getLicitacoes } from "@/lib/queries";
import { LicitacoesTable } from "@/components/licitacoes-table";

export const metadata = { title: "Licitações — Petrus Soluções" };

export default async function LicitacoesPage() {
  const lics = await getLicitacoes();
  return <LicitacoesTable lics={lics} />;
}
