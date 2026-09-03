import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Entrar — Petrus Soluções" };

export default function LoginPage() {
  // No modo demonstração não há login — vai direto para o painel.
  if (isDemoMode) redirect("/painel");

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
