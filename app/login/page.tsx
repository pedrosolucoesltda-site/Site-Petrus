import { Suspense } from "react";
import { redirect } from "next/navigation";
import Image from "next/image";
import { isDemoMode } from "@/lib/env";
import { Logo } from "@/components/logo";
import { LoginForm } from "@/components/login-form";

export const metadata = { title: "Entrar — Petrus Soluções" };

export default function LoginPage() {
  // No modo demonstração não há login — vai direto para o painel.
  if (isDemoMode) redirect("/painel");

  return (
    <main className="flex min-h-screen">
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <Logo />
            <p className="mt-2 text-[12px] text-text-muted">Sistema interno</p>
          </div>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <div className="hidden bg-canvas lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <div className="relative aspect-video w-full">
          <Image
            src="/login-banner.jpg"
            alt="Petrus Soluções — Estruturando sonhos, construindo futuros"
            fill
            priority
            sizes="50vw"
            className="object-contain"
          />
        </div>
      </div>
    </main>
  );
}
