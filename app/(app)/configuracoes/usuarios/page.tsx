import { requireAdmin } from "@/lib/auth";
import { isServiceRoleConfigured } from "@/lib/env";
import { listManagedUsers } from "@/lib/users";
import { SetupNotice } from "@/components/ui";
import { UsuariosManager } from "@/components/usuarios-manager";

export const metadata = { title: "Usuários — Configurações — Petrus Soluções" };

export default async function UsuariosPage() {
  const session = await requireAdmin();

  if (!isServiceRoleConfigured) {
    return (
      <SetupNotice
        title="Falta a chave de serviço do Supabase"
        file=".env.local (e nas variáveis da Vercel)"
        steps={[
          "No Supabase: Project Settings → API → copie a chave secreta service_role.",
          "Adicione SUPABASE_SERVICE_ROLE_KEY=... no .env.local e nas Environment Variables da Vercel (só Production).",
          "Reinicie o servidor / faça Redeploy.",
        ]}
      />
    );
  }

  const users = await listManagedUsers();
  return <UsuariosManager users={users} currentUserId={session.user.id} />;
}
