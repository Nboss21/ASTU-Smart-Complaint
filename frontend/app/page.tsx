"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "../lib/authStore";

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    const role = user.role;
    const target =
      role === "admin" ? "/admin" : role === "staff" ? "/staff" : "/complaints";
    router.replace(target);
  }, [user, router]);

  return (
    <div className="flex w-full flex-col items-center justify-center gap-10 md:flex-row">
      <section className="w-full max-w-xl flex-1">
        <div className="rounded-3xl bg-gradient-to-br from-aurora via-sky-500 to-ember p-[1px] shadow-glow">
          <div className="rounded-3xl bg-slate-950/95 p-7 md:p-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] uppercase tracking-wide text-slate-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              ASTU STEM unified service portal
            </div>
            <h1 className="mt-4 text-2xl font-semibold leading-snug text-slate-50 md:text-3xl">
              One place for complaints, resolution, and AI-powered answers.
            </h1>
            <p className="mt-3 text-sm text-slate-300">
              Students, staff, and administrators share a single workspace to
              submit issues, track progress, and ask questions about campus
              policies and processesall powered by a modern AI assistant.
            </p>
            <ul className="mt-4 space-y-2 text-xs text-slate-300">
              <li>
                • File complaints with evidence and follow every status change.
              </li>
              <li>
                • Staff triage, assign, and resolve tickets from a focused desk.
              </li>
              <li>
                • Admins see patterns, analytics, and manage the knowledge base.
              </li>
              <li>
                • The chatbot responds using your university documents and
                history.
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
          <span className="badge-pill bg-slate-800/80 text-slate-200">
            Role-based experiences
          </span>
          <span className="badge-pill bg-slate-800/80 text-slate-200">
            AI assistant included
          </span>
          <span className="badge-pill bg-slate-800/80 text-slate-200">
            Designed for universities
          </span>
        </div>
      </section>
      <section className="card-glass w-full max-w-sm p-6 text-xs">
        <h2 className="text-sm font-semibold text-slate-50">
          Sign in to get started
        </h2>
        <p className="mt-1 text-[11px] text-slate-400">
          Access is restricted to authenticated users. Sign in or create your
          account to use complaints, analytics, the staff desk, and the AI
          assistant.
        </p>
        <div className="mt-4 space-y-3">
          <Link href="/auth" className="primary block text-center">
            Sign in
          </Link>
          <button
            type="button"
            className="secondary block w-full text-center"
            onClick={() => router.push("/auth")}
          >
            Create an account
          </button>
        </div>
        <p className="mt-4 text-[10px] leading-relaxed text-slate-500">
          This portal is intended for ASTU STEM students, staff, and
          administrators. By continuing you agree to abide by university
          communication and data policies.
        </p>
      </section>
    </div>
  );
}
