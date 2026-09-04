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

      <div className="relative hidden overflow-hidden lg:block lg:w-1/2">
        <Image
          src="/login-banner-photo.jpg"
          alt="Obra em construção — Petrus Soluções"
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1220]/90 via-[#0b1220]/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-12">
          <Logo className="h-11" />
          <p className="mt-4 max-w-sm text-[15px] font-medium tracking-wide text-text-primary/90">
            Estruturando sonhos, construindo futuros.
          </p>
        </div>
      </div>
    </main>
  );
}
