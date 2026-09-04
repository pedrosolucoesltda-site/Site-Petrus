/* Marca Petrus Soluções. Os PNGs têm fundo branco → ficam num "chip" claro
   para contrastar bem com o tema escuro. */

export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex items-center justify-center rounded-lg bg-white p-1 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-mark.png"
        alt="Petrus Soluções"
        className="h-full w-full object-contain"
      />
    </span>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md bg-white px-3 py-2 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.png"
        alt="Petrus Soluções"
        className="h-7 w-auto object-contain"
      />
    </span>
  );
}
