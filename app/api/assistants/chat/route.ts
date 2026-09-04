import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getAssistant, type AssistantDef } from "@/lib/assistants";
import {
  ANTHROPIC_API_KEY,
  ANTHROPIC_MODEL,
  isAnthropicConfigured,
  isDemoMode,
} from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  assistantKey: string;
  conversationId?: string | null;
  message: string;
}

type ChatTurn = { role: "user" | "assistant"; content: string };

function textHeaders(conversationId: string | null) {
  const h: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
  };
  if (conversationId) h["X-Conversation-Id"] = conversationId;
  return h;
}

/** Traduz erros da API da Anthropic em mensagens claras para o usuário. */
function friendlyError(err: unknown): string {
  if (err instanceof Anthropic.APIError) {
    const raw = String(err.message ?? "").toLowerCase();
    if (raw.includes("credit balance is too low") || raw.includes("billing")) {
      return "⚠️ A conta da Anthropic está sem créditos. Adicione créditos em console.anthropic.com → Settings → Billing para ativar os assistentes.";
    }
    if (err.status === 401 || raw.includes("invalid x-api-key")) {
      return "⚠️ A chave da API da Anthropic é inválida ou foi revogada. Verifique a variável ANTHROPIC_API_KEY.";
    }
    if (err.status === 429) {
      return "⚠️ Muitas requisições seguidas à Anthropic. Aguarde alguns segundos e tente de novo.";
    }
    if (err.status === 529 || raw.includes("overloaded")) {
      return "⚠️ A API da Anthropic está sobrecarregada no momento. Tente novamente em instantes.";
    }
    return `⚠️ Erro na API da Anthropic (${err.status}). Tente novamente.`;
  }
  return "⚠️ Não foi possível falar com o assistente agora. Tente novamente.";
}

/** Streams the Anthropic reply as plain text; calls `onDone` with the full text. */
function streamReply(
  assistant: AssistantDef,
  messages: ChatTurn[],
  conversationId: string | null,
  onDone?: (fullText: string) => Promise<void> | void,
): Response {
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let full = "";
      try {
        const run = anthropic.messages.stream({
          model: ANTHROPIC_MODEL,
          max_tokens: 16000,
          system: assistant.system,
          messages,
        });
        for await (const event of run) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = (full ? "\n\n" : "") + friendlyError(err);
        full += msg;
        controller.enqueue(encoder.encode(msg));
      } finally {
        controller.close();
        await onDone?.(full || "[sem resposta]");
      }
    },
  });

  return new Response(stream, { headers: textHeaders(conversationId) });
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  const assistant = getAssistant(body.assistantKey);
  const message = body.message?.trim();
  if (!assistant || !message) {
    return NextResponse.json(
      { error: "assistantKey ou message ausente" },
      { status: 400 },
    );
  }

  const notice =
    `[${assistant.name}] O assistente ainda não está conectado. ` +
    `Defina a variável ANTHROPIC_API_KEY para ativar as respostas de IA.`;

  // ── modo demonstração: sem Supabase, sem histórico persistido ─────
  if (isDemoMode) {
    if (!isAnthropicConfigured) {
      return new Response(notice, { headers: textHeaders(null) });
    }
    return streamReply(assistant, [{ role: "user", content: message }], null);
  }

  // ── modo real: autentica, persiste histórico por usuário ──────────
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  let conversationId = body.conversationId ?? null;
  if (!conversationId) {
    const { data, error } = await supabase
      .from("assistant_conversations")
      .insert({
        user_id: user.id,
        assistant_key: assistant.key,
        title: message.slice(0, 48),
      })
      .select("id")
      .single();
    if (error || !data) {
      return NextResponse.json(
        { error: "falha ao criar conversa" },
        { status: 500 },
      );
    }
    conversationId = data.id as string;
  } else {
    const { error } = await supabase
      .from("assistant_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (error) {
      return NextResponse.json(
        { error: "conversa não encontrada" },
        { status: 404 },
      );
    }
  }

  const { data: history } = await supabase
    .from("assistant_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(40);

  await supabase.from("assistant_messages").insert({
    conversation_id: conversationId,
    role: "user",
    content: message,
  });

  const messages: ChatTurn[] = [
    ...(history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: message },
  ];

  const persist = async (content: string): Promise<void> => {
    await supabase
      .from("assistant_messages")
      .insert({ conversation_id: conversationId, role: "assistant", content });
  };

  if (!isAnthropicConfigured) {
    await persist(notice);
    return new Response(notice, { headers: textHeaders(conversationId) });
  }

  return streamReply(assistant, messages, conversationId, persist);
}
