import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/env";
import { getSession } from "@/lib/auth";
import { LeftNav } from "@/components/left-nav";
import { AssistantRail } from "@/components/assistant-rail";
import { SetupNotice } from "@/components/ui";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen">
        <SetupNotice
          title="Conecte o Supabase para usar o ERP"
          file=".env.local"
          steps={[
            "Crie um projeto no Supabase e pegue a URL + anon key em Project Settings → API.",
            "Copie .env.local.example para .env.local e preencha as variáveis NEXT_PUBLIC_SUPABASE_*.",
            "Aplique supabase/migrations/0001_schema.sql e 0002_rls.sql (SQL Editor ou supabase db push).",
            "Rode supabase/seed.sql para carregar os dados de demonstração.",
            "Crie um usuário em Authentication → Users e defina role = 'admin' na tabela profiles.",
          ]}
        />
      </main>
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  const userLabel =
    session.profile?.full_name || session.user.email || "Usuário";

  return (
    <div className="grid min-h-screen grid-cols-[64px_1fr] xl:grid-cols-[64px_1fr_232px]">
      <LeftNav isAdmin={session.isAdmin} userLabel={userLabel} />
      <main className="min-w-0 overflow-x-hidden px-6 py-7 sm:px-8">
        {children}
      </main>
      <div className="hidden xl:block">
        <AssistantRail />
      </div>
    </div>
  );
}
