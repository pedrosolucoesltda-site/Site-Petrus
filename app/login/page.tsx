import { Suspense } from "react";
import { isSupabaseConfigured } from "@/lib/env";
import { SetupNotice } from "@/components/ui";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Entrar — Petrus Soluções" };

export default function LoginPage() {
  if (!isSupabaseConfigured) {
    return (
      <main className="min-h-screen">
        <SetupNotice
          title="Conecte o Supabase para ativar o login"
          file=".env.local"
          steps={[
            "Crie um projeto em app.supabase.com.",
            "Copie .env.local.example para .env.local e preencha NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
            "Rode as migrations em supabase/migrations e o supabase/seed.sql.",
            "Crie o primeiro usuário e defina role = 'admin' na tabela profiles.",
            "Reinicie o servidor de desenvolvimento.",
          ]}
        />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold font-grotesk text-base font-bold text-[#141410]">
            P
          </div>
          <div>
            <p className="text-sm font-semibold">Petrus Soluções</p>
            <p className="text-[12px] text-text-muted">Sistema interno</p>
          </div>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
