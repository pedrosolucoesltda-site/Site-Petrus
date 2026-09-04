"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isDemoMode } from "@/lib/env";

type Phase = "loading" | "enroll" | "challenge" | "done";

export default function TwoFactorPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("loading");
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (isDemoMode) {
      router.replace("/painel");
      return;
    }
    if (started.current) return;
    started.current = true;

    (async () => {
      const supabase = createClient();
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") {
        router.replace("/painel");
        return;
      }

      const { data: list } = await supabase.auth.mfa.listFactors();
      const verified = list?.totp?.find((f) => f.status === "verified");

      if (verified) {
        setFactorId(verified.id);
        setPhase("challenge");
        return;
      }

      // remove tentativas de cadastro não concluídas
      for (const f of list?.totp ?? []) {
        if (f.status !== "verified")
          await supabase.auth.mfa.unenroll({ factorId: f.id });
      }

      const { data: enroll, error: enrollErr } =
        await supabase.auth.mfa.enroll({
          factorType: "totp",
          friendlyName: `Petrus (${new Date().toLocaleDateString("pt-BR")})`,
        });
      if (enrollErr || !enroll) {
        setError(enrollErr?.message ?? "Falha ao iniciar o 2FA.");
        setPhase("enroll");
        return;
      }
      setFactorId(enroll.id);
      setQr(enroll.totp.qr_code);
      setSecret(enroll.totp.secret);
      setPhase("enroll");
    })();
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId || code.trim().length < 6) return;
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: verifyErr } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    if (verifyErr) {
      setError("Código incorreto ou expirado. Tente o próximo código do app.");
      setCode("");
      setBusy(false);
      return;
    }

    setPhase("done");
    router.replace("/painel");
    router.refresh();
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
            <p className="text-[12px] text-text-muted">Verificação em duas etapas</p>
          </div>
        </div>

        <div className="rounded-md border border-border-soft bg-panel p-6">
          {phase === "loading" && (
            <p className="text-[13px] text-text-muted">Carregando…</p>
          )}

          {phase === "enroll" && (
            <>
              <h1 className="text-base font-semibold">Ative a verificação em duas etapas</h1>
              <p className="mt-1 text-[12.5px] leading-relaxed text-text-muted">
                Abra o <b>Google Authenticator</b> (ou Authy / 1Password) no
                celular, toque em <b>adicionar</b> e escaneie o código abaixo.
              </p>

              {qr && (
                <div className="mt-4 flex justify-center rounded-sm bg-white p-3">
                  {qr.startsWith("data:") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="QR code do 2FA" className="h-44 w-44" />
                  ) : (
                    <div
                      className="h-44 w-44 [&>svg]:h-full [&>svg]:w-full"
                      dangerouslySetInnerHTML={{ __html: qr }}
                    />
                  )}
                </div>
              )}

              {secret && (
                <p className="mt-3 break-all text-center text-[11px] text-text-muted">
                  Não consegue escanear? Código:{" "}
                  <span className="font-grotesk text-text-secondary">{secret}</span>
                </p>
              )}

              <CodeForm
                code={code}
                setCode={setCode}
                onSubmit={submit}
                busy={busy}
                error={error}
                label="Digite o código de 6 dígitos que aparecer no app"
              />
            </>
          )}

          {phase === "challenge" && (
            <>
              <h1 className="text-base font-semibold">Código de verificação</h1>
              <p className="mt-1 text-[12.5px] text-text-muted">
                Abra o app autenticador e digite o código de 6 dígitos do
                &ldquo;Petrus&rdquo;.
              </p>
              <CodeForm
                code={code}
                setCode={setCode}
                onSubmit={submit}
                busy={busy}
                error={error}
              />
            </>
          )}

          {phase === "done" && (
            <p className="text-[13px] text-positive">Verificado. Entrando…</p>
          )}

          <form action="/auth/signout" method="post" className="mt-4">
            <button
              type="submit"
              className="text-[12px] text-text-muted hover:text-text-secondary"
            >
              Sair
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

function CodeForm({
  code,
  setCode,
  onSubmit,
  busy,
  error,
  label,
}: {
  code: string;
  setCode: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  busy: boolean;
  error: string | null;
  label?: string;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-4">
      {label && (
        <label className="block text-[12px] text-text-secondary">{label}</label>
      )}
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
        placeholder="000000"
        className="mt-1.5 w-full rounded-sm border border-border bg-panel-alt px-3 py-2.5 text-center font-grotesk text-lg tracking-[0.3em] text-text-primary outline-none focus:border-text-muted"
      />
      {error && <p className="mt-2 text-[12.5px] text-risk">{error}</p>}
      <button
        type="submit"
        disabled={busy || code.length < 6}
        className="mt-4 w-full rounded-sm bg-gold px-4 py-2.5 text-[13px] font-semibold text-[#141410] disabled:opacity-60"
      >
        {busy ? "Verificando…" : "Confirmar"}
      </button>
    </form>
  );
}
