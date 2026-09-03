import type { SVGProps } from "react";
import type { ModuleKey } from "@/lib/modules";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PainelIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function ObrasIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M3 21h18M5 21V9l7-5 7 5v12M9 21v-6h6v6" />
    </svg>
  );
}

export function LicitacoesIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 13h6M9 17h6" />
    </svg>
  );
}

export function FinanceiroIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

export function DocumentosIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M6 9h5M6 13h9M6 17h9" />
    </svg>
  );
}

export function FornecedoresIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="8" r="3" />
      <path d="M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1" />
      <circle cx="18" cy="9" r="2.4" />
      <path d="M22 21v-1a4.2 4.2 0 0 0-3-4" />
    </svg>
  );
}

export function UsuariosIcon(p: IconProps) {
  return (
    <svg {...base} {...p}>
      <circle cx="9" cy="7" r="3.2" />
      <path d="M2.5 20v-1.2A5 5 0 0 1 7.5 14h3a5 5 0 0 1 5 4.8V20" />
      <path d="M17 7.5a3 3 0 0 1 0 5.5M19.5 20v-1a4 4 0 0 0-3-3.6" />
    </svg>
  );
}

export function LockIcon(p: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function SearchIcon(p: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}

export function SendIcon(p: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

export function CloseIcon(p: IconProps) {
  return (
    <svg {...base} strokeWidth={2} {...p}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export const MODULE_ICONS: Record<
  ModuleKey,
  (p: IconProps) => React.JSX.Element
> = {
  painel: PainelIcon,
  obras: ObrasIcon,
  licitacoes: LicitacoesIcon,
  financeiro: FinanceiroIcon,
  documentos: DocumentosIcon,
  fornecedores: FornecedoresIcon,
  usuarios: UsuariosIcon,
};
