/** Navigation model + per-module accent colour (from the prototypes). */

export type ModuleKey =
  | "painel"
  | "obras"
  | "licitacoes"
  | "financeiro"
  | "documentos"
  | "fornecedores"
  | "configuracoes";

export interface ModuleDef {
  key: ModuleKey;
  label: string;
  href: string;
  /** CSS colour token name → `text-<accent>` / `var(--color-<accent>)` */
  accent: "gold" | "brick" | "teal" | "blue" | "purple";
  adminOnly?: boolean;
}

export const MODULES: ModuleDef[] = [
  { key: "painel", label: "Painel geral", href: "/painel", accent: "gold" },
  { key: "obras", label: "Obras", href: "/obras", accent: "brick" },
  { key: "licitacoes", label: "Licitações", href: "/licitacoes", accent: "teal" },
  {
    key: "financeiro",
    label: "Financeiro",
    href: "/financeiro",
    accent: "gold",
    adminOnly: true,
  },
  { key: "documentos", label: "Documentos", href: "/documentos", accent: "blue" },
  {
    key: "fornecedores",
    label: "Fornecedores",
    href: "/fornecedores",
    accent: "purple",
  },
  {
    key: "configuracoes",
    label: "Configurações",
    href: "/configuracoes",
    accent: "gold",
    adminOnly: true,
  },
];

export function accentVar(accent: ModuleDef["accent"]): string {
  return `var(--color-${accent})`;
}
