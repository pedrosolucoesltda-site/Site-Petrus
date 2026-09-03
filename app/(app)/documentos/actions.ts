"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { DocumentoCategoria } from "@/lib/database.types";

export interface DocActionState {
  ok?: boolean;
  error?: string;
  /** id do documento recém-criado (para anexar arquivos em seguida) */
  id?: string;
}

const CATEGORIAS: DocumentoCategoria[] = [
  "contratos",
  "certidoes",
  "arts_rrts",
  "societario",
  "obras",
  "licitacoes",
];

function fields(formData: FormData) {
  const categoria = String(formData.get("categoria") ?? "") as DocumentoCategoria;
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    categoria: CATEGORIAS.includes(categoria) ? categoria : "contratos",
    obra_id: String(formData.get("obra_id") ?? "") || null,
    licitacao_id: String(formData.get("licitacao_id") ?? "") || null,
    data_validade: String(formData.get("data_validade") ?? "") || null,
    arquivo_url: String(formData.get("arquivo_url") ?? "").trim() || null,
  };
}

export async function createDocumento(
  _prev: DocActionState,
  formData: FormData,
): Promise<DocActionState> {
  await requireAdmin();
  const f = fields(formData);
  if (!f.nome) return { error: "O nome do documento é obrigatório." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documentos")
    .insert(f)
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "Falha ao criar." };

  revalidatePath("/documentos");
  return { ok: true, id: data.id as string };
}

export async function updateDocumento(
  _prev: DocActionState,
  formData: FormData,
): Promise<DocActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Documento não identificado." };
  const f = fields(formData);
  if (!f.nome) return { error: "O nome do documento é obrigatório." };

  const supabase = await createClient();
  const { error } = await supabase.from("documentos").update(f).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/documentos");
  return { ok: true, id };
}

export async function deleteDocumento(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = await createClient();
  await supabase.from("documentos").delete().eq("id", id);
  revalidatePath("/documentos");
}
