"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface DashboardStats {
  total: number;
  open: number;
  resolved: number;
}

export default function AnalyticsPage() {
  const { accessToken, hydrateFromStorage } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    setLoading(true);
    api
      .get<DashboardStats>("/api/analytics/dashboard", { headers })
      .then((r) => setStats(r.data))
      .catch((err) => setError(err?.response?.data?.message || "Error"))
      .finally(() => setLoading(false));
  }, [accessToken]);

  return (
    <div className="card-glass w-full p-6">
      <h1 className="text-lg font-semibold text-slate-50">Live analytics</h1>
      <p className="mt-1 text-xs text-slate-400">
        Overview of complaint volume and resolution posture. Staff and admins
        see global metrics.
      </p>
      {loading && <p className="mt-4 text-xs text-slate-400">Loading…</p>}
      {error && <p className="mt-4 text-xs text-ember">{error}</p>}
      {stats && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="card-glass border-slate-700/60 p-4">
            <div className="text-xs text-slate-400">Total complaints</div>
            <div className="mt-1 text-2xl font-semibold text-slate-50">
              {stats.total}
            </div>
          </div>
          <div className="card-glass border-slate-700/60 p-4">
            <div className="text-xs text-slate-400">Open right now</div>
            <div className="mt-1 text-2xl font-semibold text-amber-400">
              {stats.open}
            </div>
          </div>
          <div className="card-glass border-slate-700/60 p-4">
            <div className="text-xs text-slate-400">Resolved</div>
            <div className="mt-1 text-2xl font-semibold text-emerald-400">
              {stats.resolved}
            </div>
          </div>
          {"attachments" in stats && (
            <div className="card-glass border-slate-700/60 p-4">
              <div className="text-xs text-slate-400">Uploaded files</div>
              <div className="mt-1 text-2xl font-semibold text-sky-400">
                {(stats as any).attachments}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
