import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { getSession, getAAL } from "@/lib/auth";
import { LeftNav } from "@/components/left-nav";
import { AssistantRail } from "@/components/assistant-rail";

// ERP interno: dados por usuário (RLS) e sempre atuais — nada de cache/prerender.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  // 2FA obrigatório: quem não passou pelo segundo fator vai para /2fa
  // (que decide entre cadastrar o app autenticador ou pedir o código).
  const { level } = await getAAL();
  if (level !== "aal2") redirect("/2fa");

  const userLabel =
    session.profile?.full_name || session.user.email || "Usuário";

  return (
    <div className="grid min-h-screen grid-cols-[64px_1fr] xl:grid-cols-[64px_1fr_232px]">
      <LeftNav isAdmin={session.isAdmin} userLabel={userLabel} />
      <main className="min-w-0 overflow-x-hidden px-6 py-7 sm:px-8">
        {isDemoMode && <DemoBanner />}
        {children}
      </main>
      <div className="hidden xl:block">
        <AssistantRail />
      </div>
    </div>
  );
}

function DemoBanner() {
  return (
    <div className="mb-5 rounded-md border border-gold/30 bg-gold/10 px-4 py-2.5 text-[12.5px] text-gold">
      <b>Modo demonstração</b> — dados fictícios, sem login. Configure o Supabase
      (<code>.env.local</code>) para usar de verdade. Veja o{" "}
      <code>README.md</code>.
    </div>
  );
}
