import { requireAdmin } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { listManagedUsers } from "@/lib/users";
import { PageHeader, SetupNotice } from "@/components/ui";
import { LockIcon } from "@/components/icons";
import { UsuariosManager } from "@/components/usuarios-manager";

export const metadata = { title: "Usuários — Petrus Soluções" };

export default async function UsuariosPage() {
  const session = await requireAdmin();

  if (!isServiceRoleConfigured) {
    return (
      <>
        <PageHeader
          title="Usuários"
          subtitle="Petrus Soluções — equipe e acessos"
        />
        <SetupNotice
          title="Falta a chave de serviço do Supabase"
          file=".env.local (e nas variáveis da Vercel)"
          steps={[
            "No Supabase: Project Settings → API → copie a chave secreta service_role.",
            "Adicione SUPABASE_SERVICE_ROLE_KEY=... no .env.local e nas Environment Variables da Vercel (só Production).",
            "Reinicie o servidor / faça Redeploy.",
          ]}
        />
      </>
    );
  }

  const users = await listManagedUsers();

  return (
    <>
      <PageHeader
        title="Usuários"
        subtitle="Petrus Soluções — equipe e acessos"
        badge={
          <span className="mt-2 flex items-center gap-1.5 text-[11px] text-text-muted">
            <LockIcon className="h-3 w-3" />
            Somente administradores
          </span>
        }
      />
      <UsuariosManager users={users} currentUserId={session.user.id} />
    </>
  );
}
