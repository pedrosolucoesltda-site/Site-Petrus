/* Marca Petrus Soluções — versão clara (off-white) com fundo transparente,
   para uso direto sobre o tema escuro do sistema. */

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-mark-light.png"
      alt="Petrus Soluções"
      className={`object-contain ${className}`}
    />
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo-light.png"
      alt="Petrus Soluções"
      className={`h-9 w-auto object-contain ${className}`}
    />
  );
}
