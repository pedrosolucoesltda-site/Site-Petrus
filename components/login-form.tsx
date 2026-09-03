"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") || "/painel";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      setLoading(false);
      return;
    }

    router.replace(redirectTo);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-md border border-border-soft bg-panel p-6"
    >
      <h1 className="text-base font-semibold">Entrar</h1>
      <p className="mt-1 text-[12.5px] text-text-muted">
        Acesso restrito à equipe Petrus.
      </p>

      <label className="mt-5 block text-[12.5px] text-text-secondary">
        E-mail
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1.5 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted"
        />
      </label>

      <label className="mt-4 block text-[12.5px] text-text-secondary">
        Senha
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-sm border border-border bg-panel-alt px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted"
        />
      </label>

      {error && <p className="mt-3 text-[12.5px] text-risk">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="mt-5 w-full rounded-sm bg-gold px-4 py-2.5 text-[13px] font-semibold text-[#141410] transition-opacity disabled:opacity-60"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
