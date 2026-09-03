import { NextResponse, type NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { getAssistant } from "@/lib/assistants";
import { ANTHROPIC_API_KEY, ANTHROPIC_MODEL, isAnthropicConfigured } from "@/lib/env";

export const runtime = "nodejs";
export const maxDuration = 60;

interface Body {
  assistantKey: string;
  conversationId?: string | null;
  message: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

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

  // ── ensure a conversation ─────────────────────────────────────────
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
    // touch updated_at + verify ownership through RLS
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

  if (!conversationId) {
    return NextResponse.json(
      { error: "conversa indisponível" },
      { status: 500 },
    );
  }

  // ── load history + persist the new user message ───────────────────
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

  const messages = [
    ...(history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const headers = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Conversation-Id": conversationId,
  };

  // ── no API key: still a useful, persisted reply ───────────────────
  if (!isAnthropicConfigured) {
    const notice =
      `[${assistant.name}] O assistente ainda não está conectado. ` +
      `Defina ANTHROPIC_API_KEY em .env.local para ativar as respostas de IA.`;
    await supabase.from("assistant_messages").insert({
      conversation_id: conversationId,
      role: "assistant",
      content: notice,
    });
    return new Response(notice, { headers });
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
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
        const msg =
          err instanceof Anthropic.APIError
            ? `\n\n[erro ${err.status}: ${err.message}]`
            : "\n\n[erro ao consultar o assistente]";
        full += msg;
        controller.enqueue(new TextEncoder().encode(msg));
      } finally {
        controller.close();
        await supabase.from("assistant_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: full || "[sem resposta]",
        });
      }
    },
  });

  return new Response(stream, { headers });
}
