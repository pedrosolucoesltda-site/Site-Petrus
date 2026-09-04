import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { ConfigTabs } from "@/components/config-tabs";

export default async function ConfiguracoesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <>
      <PageHeader
        title="Configurações"
        subtitle="Petrus Soluções — administração do sistema"
      />
      <ConfigTabs />
      {children}
    </>
  );
}
