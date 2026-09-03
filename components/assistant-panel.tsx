"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getAssistant } from "@/lib/assistants";
import { isDemoMode } from "@/lib/env";
import { CloseIcon, SendIcon } from "@/components/icons";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AssistantPanel({
  assistantKey,
  onClose,
}: {
  assistantKey: string;
  onClose: () => void;
}) {
  const assistant = getAssistant(assistantKey);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // load the most recent conversation for this assistant
  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    setMessages([]);
    setConversationId(null);

    // Modo demonstração: sem histórico persistido.
    if (isDemoMode) {
      setLoadingHistory(false);
      return;
    }

    (async () => {
      const supabase = createClient();
      const { data: conv } = await supabase
        .from("assistant_conversations")
        .select("id")
        .eq("assistant_key", assistantKey)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (conv?.id) {
        setConversationId(conv.id);
        const { data: msgs } = await supabase
          .from("assistant_messages")
          .select("role, content")
          .eq("conversation_id", conv.id)
          .order("created_at", { ascending: true });
        if (!cancelled && msgs) {
          setMessages(msgs.map((m) => ({ role: m.role, content: m.content })));
        }
      }
      if (!cancelled) setLoadingHistory(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [assistantKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setSending(true);
    setMessages((m) => [
      ...m,
      { role: "user", content: text },
      { role: "assistant", content: "" },
    ]);

    try {
      const res = await fetch("/api/assistants/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assistantKey, conversationId, message: text }),
      });

      const convId = res.headers.get("X-Conversation-Id");
      if (convId) setConversationId(convId);

      if (!res.ok || !res.body) {
        const err = await res.text();
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = {
            role: "assistant",
            content: `[erro: ${err || res.status}]`,
          };
          return next;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const next = [...m];
          next[next.length - 1] = { role: "assistant", content: acc };
          return next;
        });
      }
    } catch {
      setMessages((m) => {
        const next = [...m];
        next[next.length - 1] = {
          role: "assistant",
          content: "[erro de conexão]",
        };
        return next;
      });
    } finally {
      setSending(false);
    }
  }

  function newConversation() {
    setConversationId(null);
    setMessages([]);
    setInput("");
  }

  if (!assistant) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-border bg-panel shadow-2xl">
      <header className="flex items-center gap-3 border-b border-border-soft p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-teal font-grotesk text-[12px] font-semibold text-[#14140f]">
          {assistant.initials}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold">{assistant.name}</p>
          <p className="text-[11px] text-text-muted">{assistant.role}</p>
        </div>
        <button
          onClick={newConversation}
          className="rounded-sm border border-border px-2.5 py-1 text-[11px] text-text-secondary hover:text-text-primary"
        >
          Nova
        </button>
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="text-text-muted hover:text-text-primary"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingHistory ? (
          <p className="text-[12px] text-text-muted">Carregando histórico…</p>
        ) : messages.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-text-muted">
            {assistant.system}
          </p>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === "user"
                  ? "ml-auto max-w-[85%] rounded-md bg-panel-alt px-3 py-2 text-[12.5px]"
                  : "max-w-[92%] whitespace-pre-wrap text-[12.5px] leading-relaxed text-text-secondary"
              }
            >
              {m.content || (sending && i === messages.length - 1 ? "…" : "")}
            </div>
          ))
        )}
      </div>

      <div className="border-t border-border-soft p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            placeholder={`Falar com ${assistant.name}…`}
            className="flex-1 resize-none rounded-sm border border-border bg-panel-alt px-3 py-2 text-[12.5px] text-text-primary outline-none focus:border-text-muted"
          />
          <button
            onClick={() => void send()}
            disabled={sending || !input.trim()}
            aria-label="Enviar"
            className="rounded-sm bg-teal p-2 text-[#0e1a17] transition-opacity disabled:opacity-40"
          >
            <SendIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
