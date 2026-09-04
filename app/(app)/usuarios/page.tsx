import { redirect } from "next/navigation";

// Rota antiga — Usuários agora vive em Configurações.
export default function UsuariosRedirect() {
  redirect("/configuracoes/usuarios");
}
