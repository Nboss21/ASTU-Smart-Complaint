"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { login, register } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { setAuth, user } = useAuthStore();

  if (user) {
    // If already signed in, keep them on the main home page
    router.replace("/");
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        await register(name, email, password);
      }
      const auth = await login(email, password);
      setAuth(auth);
      // After sign-in or sign-up, always send to the home overview.
      router.push("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center gap-8 md:flex-row">
      <section className="hidden w-full max-w-md flex-1 flex-col gap-4 md:flex">
        <div className="rounded-3xl bg-gradient-to-br from-aurora via-sky-500 to-ember p-[1px] shadow-glow">
          <div className="rounded-3xl bg-slate-950/90 p-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/70 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ASTU STEM unified service hub
            </div>
            <h1 className="mt-4 text-2xl font-semibold leading-snug text-slate-50">
              Resolve campus issues faster, with an assistant that never sleeps.
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              One place for students, staff, and admins to submit complaints,
              track resolutions, and ask questions powered by an AI assistant
              trained on your university knowledge.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              <li>• Students file complaints with evidence and live status.</li>
              <li>• Staff triage, assign, and resolve tickets in one desk.</li>
              <li>
                • Admins see patterns, analytics, and manage the knowledge base.
              </li>
              <li>
                • The AI assistant answers policy and process questions in
                seconds.
              </li>
            </ul>
          </div>
        </div>
        <div className="card-glass mt-3 flex items-center gap-3 p-4 text-xs text-slate-300">
          <div className="h-8 w-8 rounded-2xl bg-gradient-to-tr from-aurora to-sky-400" />
          <div>
            <div className="font-semibold text-slate-100">
              Designed for clarity
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              A clean, role-based workspace tailored separately for students,
              staff, and administrators.
            </p>
          </div>
        </div>
      </section>
      <section className="card-glass w-full max-w-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              {mode === "login"
                ? "Sign in to continue"
                : "Create your ASTU STEM account"}
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Access your personalised dashboard, tickets, and AI assistant.
            </p>
          </div>
          <button
            className="badge-pill bg-slate-800 text-[11px] text-slate-200"
            type="button"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Need an account?" : "Already registered?"}
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 text-xs">
          {mode === "register" && (
            <div>
              <label className="text-[11px] text-slate-300">Full name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alice Student"
              />
            </div>
          )}
          <div>
            <label className="text-[11px] text-slate-300">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@astu.edu"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-[11px] text-ember">{error}</p>}
          <button className="primary mt-1 w-full" disabled={loading}>
            {loading
              ? "Processing..."
              : mode === "login"
                ? "Sign in"
                : "Sign up & sign in"}
          </button>
        </form>
        <p className="mt-3 text-[10px] leading-relaxed text-slate-500">
          By continuing, you agree to use this platform responsibly for academic
          and administrative matters only. Misuse may be subject to university
          policy.
        </p>
      </section>
    </div>
  );
}
