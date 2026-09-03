"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { FornecedorCategoria } from "@/lib/database.types";

export interface FornActionState {
  ok?: boolean;
  error?: string;
}

const CATEGORIAS: FornecedorCategoria[] = [
  "material",
  "mao_de_obra",
  "equipamento",
];

function num(raw: FormDataEntryValue | null): number {
  const s = String(raw ?? "")
    .replace(/[R$\s.]/g, "")
    .replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

function fields(formData: FormData) {
  const categoria = String(formData.get("categoria") ?? "") as FornecedorCategoria;
  const av = Math.round(num(formData.get("avaliacao")));
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    categoria: CATEGORIAS.includes(categoria) ? categoria : "material",
    contato: String(formData.get("contato") ?? "").trim() || null,
    avaliacao: Math.max(1, Math.min(5, av || 3)),
  };
}

export async function saveFornecedor(
  _prev: FornActionState,
  formData: FormData,
): Promise<FornActionState> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  const f = fields(formData);
  if (!f.nome) return { error: "O nome do fornecedor é obrigatório." };

  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("fornecedores").update(f).eq("id", id)
    : await supabase.from("fornecedores").insert(f);
  if (error) return { error: error.message };
  revalidatePath("/fornecedores");
  return { ok: true };
}

export async function deleteFornecedor(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("fornecedores").delete().eq("id", id);
  revalidatePath("/fornecedores");
}

export async function addCompra(formData: FormData): Promise<void> {
  await requireSession();
  const fornecedor_id = String(formData.get("fornecedor_id") ?? "");
  const obra_id = String(formData.get("obra_id") ?? "") || null;
  const valor = num(formData.get("valor"));
  const data = String(formData.get("data") ?? "") || new Date().toISOString().slice(0, 10);
  if (!fornecedor_id || valor <= 0) return;
  const supabase = await createClient();
  await supabase
    .from("fornecedor_compras")
    .insert({ fornecedor_id, obra_id, valor, data });
  revalidatePath("/fornecedores");
}

export async function removeCompra(formData: FormData): Promise<void> {
  await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("fornecedor_compras").delete().eq("id", id);
  revalidatePath("/fornecedores");
}
