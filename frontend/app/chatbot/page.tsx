"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface Source {
  documentId: string;
  title: string;
  contentSnippet: string;
  relevance: number;
  sourceType: string;
  category?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface SessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastAnswerPreview?: string;
}

export default function ChatbotPage() {
  const { accessToken, hydrateFromStorage } = useAuthStore();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentSources, setCurrentSources] = useState<Source[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    setLoadingSessions(true);
    api
      .get<{ sessions: SessionSummary[] }>("/api/chatbot/sessions", { headers })
      .then((r) => setSessions(r.data.sessions))
      .finally(() => setLoadingSessions(false));

    api
      .get<{ suggestions: string[] }>("/api/chatbot/suggestions", { headers })
      .then((r) => setSuggestions(r.data.suggestions))
      .catch(() => {});
  }, [accessToken]);

  const typeWriter = (full: string, assistantId: string, sources: Source[]) => {
    let index = 0;
    const length = full.length;
    const step = length > 600 ? 4 : length > 300 ? 3 : 2;

    const interval = setInterval(() => {
      index += step;
      const partial = full.slice(0, index);

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: index >= length ? full : `${partial}▌` }
            : m,
        ),
      );

      if (index >= length) {
        clearInterval(interval);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: full, sources } : m,
          ),
        );
      }
    }, 20);
  };

  const ask = async (e: FormEvent, suggested?: string) => {
    e.preventDefault();
    const text = (suggested ?? query).trim();
    if (!text) return;
    if (!accessToken) {
      setError("Please sign in to use the AI assistant.");
      return;
    }
    setError(null);
    setLoading(true);
    setCurrentSources([]);
    const headers = { Authorization: `Bearer ${accessToken}` };
    const userMessage: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    const assistantId = `a-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
    };
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setQuery("");
    try {
      const res = await api.post(
        "/api/chatbot/query",
        { query: text, sessionId },
        { headers },
      );
      const answer = res.data.answer as string;
      const srcs = (res.data.sources || []) as Source[];
      const newSessionId = (res.data.sessionId as string) || null;
      setSessionId(newSessionId);
      setCurrentSources(srcs);
      typeWriter(answer, assistantId, srcs);
      // refresh sessions list so sidebar reflects latest conversation order
      try {
        const list = await api.get<{ sessions: SessionSummary[] }>(
          "/api/chatbot/sessions",
          { headers },
        );
        setSessions(list.data.sessions);
      } catch {
        // ignore
      }
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: "Sorry, something went wrong answering this.",
              }
            : m,
        ),
      );
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to reach the assistant service right now.";
      if (msg.startsWith("Network Error")) {
        setError(
          "Cannot reach the AI assistant. Check that the backend is running and NEXT_PUBLIC_API_BASE_URL is correct.",
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const sendFeedback = async (value: "positive" | "negative") => {
    if (!accessToken || !sessionId) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    await api.post(
      "/api/chatbot/feedback",
      { sessionId, feedback: value },
      { headers },
    );
  };

  const loadSession = async (id: string) => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    setLoading(true);
    try {
      const res = await api.get<{
        sessionId: string;
        messages: {
          role: "user" | "assistant";
          content: string;
          timestamp: string;
        }[];
      }>(`/api/chatbot/sessions/${id}`, { headers });
      setSessionId(res.data.sessionId);
      setMessages(
        res.data.messages.map((m, idx) => ({
          id: `${m.role}-${idx}-${res.data.sessionId}`,
          role: m.role,
          content: m.content,
        })),
      );
      setCurrentSources([]);
    } finally {
      setLoading(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setCurrentSources([]);
    setQuery("");
  };

  return (
    <div className="flex w-full gap-4">
      <aside className="card-glass hidden w-60 flex-col p-4 text-xs md:flex">
        <button
          className="primary mb-3 w-full justify-start px-3 py-1.5 text-[11px]"
          type="button"
          onClick={startNewChat}
        >
          + New chat
        </button>
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Conversations
        </div>
        {loadingSessions && (
          <div className="text-[11px] text-slate-500">Loading…</div>
        )}
        <div className="mt-1 flex-1 space-y-1 overflow-y-auto pr-1">
          {sessions.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => loadSession(s.id)}
              className={`w-full rounded-xl px-3 py-2 text-left text-[11px] transition ${
                sessionId === s.id
                  ? "bg-slate-800 text-slate-50"
                  : "bg-slate-950/60 text-slate-300 hover:bg-slate-900/80"
              }`}
            >
              <div className="line-clamp-2 text-[11px] font-medium">
                {s.title}
              </div>
              {s.lastAnswerPreview && (
                <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                  {s.lastAnswerPreview}
                </div>
              )}
            </button>
          ))}
          {!sessions.length && !loadingSessions && (
            <div className="text-[11px] text-slate-500">
              No conversations yet. Start a new chat.
            </div>
          )}
        </div>
      </aside>
      <section className="card-glass mx-auto flex w-full max-w-3xl flex-col p-6">
        <h1 className="text-lg font-semibold text-slate-50">AI assistant</h1>
        <p className="mt-1 text-xs text-slate-400">
          Powered by hybrid RAG over policies, FAQs, and complaint templates.
        </p>
        {error && <p className="mt-2 text-[11px] text-ember-400">{error}</p>}
        <div className="mt-3 flex-1 overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/50">
          <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-3 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 ${
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
              <div className="text-xs text-slate-500">
                Start a conversation about complaint process, policies, or how
                to resolve specific scenarios. The assistant will remember the
                context within this session.
              </div>
            )}
          </div>
        </div>
        <form onSubmit={ask} className="mt-4 space-y-3 text-xs">
          <textarea
            rows={4}
            className="w-full resize-none rounded-2xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-aurora/60"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question here, like you would in ChatGPT…"
          />
          <div className="flex justify-end">
            <button className="primary" disabled={loading}>
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
        </form>
        <div className="mt-4 space-y-2 text-xs">
          {messages.some((m) => m.role === "assistant") && (
            <div className="mt-2 flex gap-2 text-[11px] text-slate-400">
              <span>Was the last answer helpful?</span>
              <button
                type="button"
                className="badge-pill bg-aurora/10 text-aurora"
                onClick={() => sendFeedback("positive")}
              >
                Yes
              </button>
              <button
                type="button"
                className="badge-pill bg-ember/10 text-ember"
                onClick={() => sendFeedback("negative")}
              >
                No
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
