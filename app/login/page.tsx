import { Suspense } from "react";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/env";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Entrar — Petrus Soluções" };

export default function LoginPage() {
  // No modo demonstração não há login — vai direto para o painel.
  if (isDemoMode) redirect("/painel");

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo />
          <p className="mt-2 text-[12px] text-text-muted">Sistema interno</p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
