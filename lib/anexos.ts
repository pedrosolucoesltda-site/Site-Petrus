import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Anexo, AnexoEscopo } from "@/lib/database.types";

/** Todos os anexos de um escopo (server-only). Vazio no modo demonstração. */
export async function getAnexos(escopo: AnexoEscopo): Promise<Anexo[]> {
  if (!isSupabaseConfigured) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("anexos")
      .select("*")
      .eq("escopo", escopo)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("[anexos:getAnexos]", error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error("[anexos:getAnexos]", e);
    return [];
  }
}

/** Agrupa anexos por ref_id. */
export function groupAnexos(anexos: Anexo[]): Map<string, Anexo[]> {
  const m = new Map<string, Anexo[]>();
  for (const a of anexos) {
    const arr = m.get(a.ref_id) ?? [];
    arr.push(a);
    m.set(a.ref_id, arr);
  }
  return m;
}
