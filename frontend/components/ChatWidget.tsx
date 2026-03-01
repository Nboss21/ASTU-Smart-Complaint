"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuthStore } from "../lib/authStore";

interface Source {
  documentId: string;
  title: string;
  contentSnippet: string;
  relevance: number;
  sourceType: string;
  category?: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

export function ChatWidget() {
  const { accessToken, hydrateFromStorage } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hybridRatio, setHybridRatio] = useState(0.7);
  const [temperature, setTemperature] = useState(0.3);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<{ suggestions: string[] }>("/api/chatbot/suggestions", { headers })
      .then((r) => setSuggestions(r.data.suggestions))
      .catch(() => {});
  }, [accessToken]);

  const typeWriter = (full: string, baseId: string, sources?: Source[]) => {
    let index = 0;
    const interval = setInterval(() => {
      index += 6;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === baseId ? { ...m, content: full.slice(0, index) } : m,
        ),
      );
      if (index >= full.length) {
        clearInterval(interval);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === baseId ? { ...m, content: full, sources } : m,
          ),
        );
      }
    }, 35);
  };

  const send = async (e?: FormEvent, suggested?: string) => {
    if (e) e.preventDefault();
    const text = (suggested ?? input).trim();
    if (!accessToken || !text || loading) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    setLoading(true);
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
    try {
      const res = await api.post(
        "/api/chatbot/query",
        { query: text, hybrid_ratio: hybridRatio, temperature },
        { headers },
      );
      const answer = res.data.answer as string;
      const srcs = (res.data.sources || []) as Source[];
      typeWriter(answer, assistantId, srcs);
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry, I couldn't answer that just now.",
              }
            : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const latestSources = messages
    .slice()
    .reverse()
    .find(
      (m) => m.role === "assistant" && m.sources && m.sources.length,
    )?.sources;

  const hybridLabel =
    hybridRatio >= 0.8
      ? "Semantic-focused"
      : hybridRatio <= 0.2
        ? "Keyword-focused"
        : "Hybrid";

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="pointer-events-auto w-80 max-w-[90vw] rounded-2xl border border-slate-700/70 bg-slate-950/95 p-3 shadow-glow">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-50">
                AI assistant
              </div>
              <div className="text-[11px] text-slate-400">
                {hybridLabel} · {Math.round(hybridRatio * 100)}% vector
              </div>
            </div>
            <button
              type="button"
              className="badge-pill bg-slate-900/70 text-[10px] text-slate-300"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="mb-2 max-h-56 space-y-1 overflow-y-auto pr-1 text-[11px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-1.5 ${
                    m.role === "user"
                      ? "bg-aurora text-slate-950"
                      : "bg-slate-800/80 text-slate-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {!messages.length && (
              <div className="text-[11px] text-slate-500">
                Ask about complaint status, policies, or where to file a ticket.
              </div>
            )}
          </div>
          <form onSubmit={(e) => send(e)} className="mt-1 space-y-1">
            <input
              className="w-full text-[11px]"
              placeholder="Ask a question…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-1 items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={hybridRatio}
                  onChange={(e) => setHybridRatio(parseFloat(e.target.value))}
                  className="flex-1"
                />
                <span className="text-[10px] text-slate-400">
                  {Math.round(hybridRatio * 100)}%
                </span>
              </div>
              <button
                type="submit"
                className="primary px-3 py-1 text-[11px]"
                disabled={loading}
              >
                {loading ? "Thinking…" : "Send"}
              </button>
            </div>
          </form>
          {suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {suggestions.slice(0, 3).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="badge-pill bg-slate-900/80 text-[10px] text-slate-200 hover:border-sky-500/60 hover:text-sky-400"
                  onClick={() => send(undefined, s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {latestSources && latestSources.length > 0 && (
            <div className="mt-2 space-y-1 border-t border-slate-800 pt-1">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                Sources
              </div>
              {latestSources.slice(0, 2).map((s, idx) => (
                <div key={s.documentId} className="text-[10px] text-slate-400">
                  <span className="mr-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-200">
                    S{idx + 1}
                  </span>
                  {s.title}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <button
        type="button"
        className="pointer-events-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-aurora via-sky-400 to-ember shadow-glow hover:scale-105 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-xl text-slate-950">∑</span>
      </button>
    </div>
  );
}
