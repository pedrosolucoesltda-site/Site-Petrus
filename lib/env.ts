/**
 * Central place to read + validate environment configuration.
 * The app is designed to boot even when Supabase / Anthropic are not yet
 * configured — screens then render a setup notice instead of crashing.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ?? "";
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-5";

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const isAnthropicConfigured = Boolean(ANTHROPIC_API_KEY);

/**
 * Modo demonstração: enquanto o Supabase não estiver configurado, o site roda
 * com dados fictícios em memória (lib/demo-data) e sem exigir login — assim dá
 * para ver todas as telas funcionando. Basta preencher as variáveis
 * NEXT_PUBLIC_SUPABASE_* para passar automaticamente ao modo real.
 */
export const isDemoMode = !isSupabaseConfigured;
