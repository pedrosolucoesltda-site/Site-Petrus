"use client";

import { useActionState, useState } from "react";
import type { ManagedUser } from "@/lib/users";
import {
  createUserAction,
  setRoleAction,
  deleteUserAction,
  reset2FAAction,
  type ActionState,
} from "@/app/(app)/usuarios/actions";
import {
  Panel,
  DataTable,
  StatusPill,
  Tag,
  cn,
} from "@/components/ui";
import { shortDate, initials } from "@/lib/format";

export function UsuariosManager({
  users,
  currentUserId,
}: {
  users: ManagedUser[];
  currentUserId: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    createUserAction,
    {},
  );
  const [open, setOpen] = useState(false);

  return (
    <>
      <Panel
        title={`Equipe (${users.length})`}
        action={
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-full border border-gold bg-gold px-4 py-2 text-[12.5px] font-semibold text-[#141410]"
          >
            {open ? "Fechar" : "+ Novo usuário"}
          </button>
        }
      >
        {open && (
          <form
            action={formAction}
            className="mb-5 grid gap-3 rounded-md border border-border-soft bg-panel-alt p-4 sm:grid-cols-2"
          >
            <label className="text-[12px] text-text-secondary">
              Nome
              <input
                name="full_name"
                className="mt-1 w-full rounded-sm border border-border bg-panel px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted"
              />
            </label>
            <label className="text-[12px] text-text-secondary">
              E-mail
              <input
                name="email"
                type="email"
                required
                className="mt-1 w-full rounded-sm border border-border bg-panel px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted"
              />
            </label>
            <label className="text-[12px] text-text-secondary">
              Senha inicial
              <input
                name="password"
                type="text"
                required
                minLength={8}
                placeholder="mín. 8 caracteres"
                className="mt-1 w-full rounded-sm border border-border bg-panel px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted"
              />
            </label>
            <label className="text-[12px] text-text-secondary">
              Papel
              <select
                name="role"
                defaultValue="user"
                className="mt-1 w-full rounded-sm border border-border bg-panel px-3 py-2 text-[13px] text-text-primary outline-none focus:border-text-muted"
              >
                <option value="user">Usuário comum</option>
                <option value="admin">Administrador</option>
              </select>
            </label>

            <div className="sm:col-span-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={pending}
                className="rounded-sm bg-gold px-4 py-2 text-[13px] font-semibold text-[#141410] disabled:opacity-60"
              >
                {pending ? "Criando…" : "Criar usuário"}
              </button>
              {state.error && (
                <span className="text-[12.5px] text-risk">{state.error}</span>
              )}
              {state.ok && (
                <span className="text-[12.5px] text-positive">{state.ok}</span>
              )}
            </div>
            <p className="sm:col-span-2 text-[11px] text-text-muted">
              O usuário já entra confirmado. Compartilhe a senha inicial com
              segurança — ele pode trocá-la depois.
            </p>
          </form>
        )}

        {users.length === 0 ? (
          <p className="py-8 text-center text-[13px] text-text-muted">
            Nenhum usuário. Crie o primeiro acima.
          </p>
        ) : (
          <DataTable
            head={
              <>
                <th>Usuário</th>
                <th>Papel</th>
                <th>Último acesso</th>
                <th className="text-right">Ações</th>
              </>
            }
          >
            {users.map((u) => (
              <UserRow key={u.id} u={u} isSelf={u.id === currentUserId} />
            ))}
          </DataTable>
        )}
      </Panel>
    </>
  );
}

function UserRow({ u, isSelf }: { u: ManagedUser; isSelf: boolean }) {
  return (
    <tr>
      <td>
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-alt font-grotesk text-[12px] font-semibold text-gold">
            {initials(u.full_name || u.email)}
          </span>
          <div>
            <div className="font-medium">
              {u.full_name || "—"}
              {isSelf && (
                <span className="ml-2 text-[11px] text-text-muted">(você)</span>
              )}
            </div>
            <div className="mt-0.5 text-[11.5px] text-text-muted">{u.email}</div>
          </div>
        </div>
      </td>
      <td>
        {u.role === "admin" ? (
          <StatusPill tone="teal">Administrador</StatusPill>
        ) : (
          <Tag>Usuário comum</Tag>
        )}
        {!u.confirmed && (
          <span className="ml-2 text-[11px] text-alert">não confirmado</span>
        )}
      </td>
      <td className="text-text-secondary">
        {u.last_sign_in_at ? shortDate(u.last_sign_in_at) : "nunca"}
      </td>
      <td className="text-right">
        <div className="inline-flex items-center gap-2">
          <form action={reset2FAAction}>
            <input type="hidden" name="user_id" value={u.id} />
            <button
              type="submit"
              title="Remove o 2FA — o usuário cadastra um novo app no próximo login"
              className="rounded-sm border border-border px-2.5 py-1 text-[11.5px] text-text-secondary hover:text-text-primary"
            >
              Resetar 2FA
            </button>
          </form>
          {!isSelf && (
            <form action={setRoleAction}>
              <input type="hidden" name="user_id" value={u.id} />
              <input
                type="hidden"
                name="role"
                value={u.role === "admin" ? "user" : "admin"}
              />
              <button
                type="submit"
                className="rounded-sm border border-border px-2.5 py-1 text-[11.5px] text-text-secondary hover:text-text-primary"
              >
                {u.role === "admin" ? "Tornar comum" : "Tornar admin"}
              </button>
            </form>
          )}
          {!isSelf && (
            <form action={deleteUserAction}>
              <input type="hidden" name="user_id" value={u.id} />
              <button
                type="submit"
                className={cn(
                  "rounded-sm border border-border px-2.5 py-1 text-[11.5px] text-risk",
                  "hover:border-risk",
                )}
              >
                Excluir
              </button>
            </form>
          )}
        </div>
      </td>
    </tr>
  );
}
