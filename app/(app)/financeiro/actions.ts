"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { ContaStatus } from "@/lib/database.types";

export interface ContaActionState {
  ok?: boolean;
  error?: string;
}

const STATUS: ContaStatus[] = ["a_vencer", "vencido", "pago"];

function num(raw: FormDataEntryValue | null): number {
  const s = String(raw ?? "")
    .replace(/[R$\s.]/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function contaFields(formData: FormData) {
  const status = String(formData.get("status") ?? "a_vencer") as ContaStatus;
  return {
    descricao: String(formData.get("descricao") ?? "").trim(),
    valor: num(formData.get("valor")),
    vencimento: String(formData.get("vencimento") ?? ""),
    status: STATUS.includes(status) ? status : "a_vencer",
  };
}

/* ---------------- contas a pagar ---------------- */

export async function saveContaPagar(
  _prev: ContaActionState,
  formData: FormData,
): Promise<ContaActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const f = contaFields(formData);
  const fornecedor = String(formData.get("fornecedor") ?? "").trim();
  if (!fornecedor) return { error: "Informe o fornecedor." };
  if (!f.vencimento) return { error: "Informe o vencimento." };

  const supabase = await createClient();
  const row = { ...f, fornecedor };
  const { error } = id
    ? await supabase.from("contas_pagar").update(row).eq("id", id)
    : await supabase.from("contas_pagar").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function deleteContaPagar(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("contas_pagar").delete().eq("id", id);
  revalidatePath("/financeiro");
}

/* ---------------- contas a receber ---------------- */

export async function saveContaReceber(
  _prev: ContaActionState,
  formData: FormData,
): Promise<ContaActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const f = contaFields(formData);
  const obra_id = String(formData.get("obra_id") ?? "") || null;
  if (!f.descricao) return { error: "Informe a descrição." };
  if (!f.vencimento) return { error: "Informe o vencimento." };

  const supabase = await createClient();
  const row = { ...f, obra_id };
  const { error } = id
    ? await supabase.from("contas_receber").update(row).eq("id", id)
    : await supabase.from("contas_receber").insert(row);
  if (error) return { error: error.message };
  revalidatePath("/financeiro");
  return { ok: true };
}

export async function deleteContaReceber(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("contas_receber").delete().eq("id", id);
  revalidatePath("/financeiro");
}

/** Marca uma conta como paga (ação rápida). */
export async function marcarPaga(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const tabela = String(formData.get("tabela") ?? "");
  if (!id || (tabela !== "contas_pagar" && tabela !== "contas_receber")) return;
  const supabase = await createClient();
  await supabase.from(tabela).update({ status: "pago" }).eq("id", id);
  revalidatePath("/financeiro");
}

/* ---------------- fluxo de caixa mensal ---------------- */

export async function upsertFluxoMes(
  _prev: ContaActionState,
  formData: FormData,
): Promise<ContaActionState> {
  await requireAdmin();
  const mesRaw = String(formData.get("mes") ?? ""); // YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(mesRaw)) return { error: "Mês inválido." };
  const mes = `${mesRaw}-01`;
  const entradas = num(formData.get("entradas"));
  const saidas = num(formData.get("saidas"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("fluxo_caixa_mensal")
    .upsert({ mes, entradas, saidas }, { onConflict: "mes" });
  if (error) return { error: error.message };
  revalidatePath("/financeiro");
  return { ok: true };
}
