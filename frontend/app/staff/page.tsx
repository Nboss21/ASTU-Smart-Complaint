"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface User {
  _id: string;
  name: string;
}

interface Category {
  _id: string;
  name: string;
}

interface Complaint {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category?: Category | string;
  assignedTo?: User | string;
  createdAt: string;
}

export default function StaffDeskPage() {
  const { accessToken, user, hydrateFromStorage } = useAuthStore();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewScope, setViewScope] = useState<"assigned" | "all">("assigned");

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<Complaint[]>("/api/complaints", { headers })
      .then((r) => setComplaints(r.data))
      .catch(() => {});
    api
      .get<Category[]>("/api/categories", { headers })
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, [accessToken]);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const isAssignedToMe =
        (c.assignedTo as User | undefined)?._id === user?.id;
      if (viewScope === "assigned" && !isAssignedToMe) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (
        categoryFilter !== "all" &&
        ((c.category as Category | undefined)?._id || "") !== categoryFilter
      )
        return false;
      return true;
    });
  }, [complaints, viewScope, statusFilter, categoryFilter, user?.id]);

  const assignedCount = complaints.filter(
    (c) => (c.assignedTo as User | undefined)?._id === user?.id,
  ).length;
  const openAssigned = complaints.filter(
    (c) =>
      (c.assignedTo as User | undefined)?._id === user?.id &&
      c.status === "open",
  ).length;

  return (
    <div className="card-glass w-full p-6 text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-50">Staff desk</h1>
          <p className="mt-1 text-xs text-slate-400">
            View and work on tickets assigned to you, with quick filters by
            status and category.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="card-glass border-slate-700/70 px-3 py-2 text-right">
            <div className="text-[11px] text-slate-400">Assigned to you</div>
            <div className="text-lg font-semibold text-slate-50">
              {assignedCount}
            </div>
          </div>
          <div className="card-glass border-slate-700/70 px-3 py-2 text-right">
            <div className="text-[11px] text-slate-400">Open & assigned</div>
            <div className="text-lg font-semibold text-amber-400">
              {openAssigned}
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
        <label className="flex items-center gap-1">
          <span>View</span>
          <select
            value={viewScope}
            onChange={(e) => setViewScope(e.target.value as any)}
            className="bg-slate-950/80"
          >
            <option value="assigned">Assigned to me</option>
            <option value="all">All tickets</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span>Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/80"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="resolved">Resolved</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="flex items-center gap-1">
          <span>Category</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950/80"
          >
            <option value="all">All</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-4 max-h-[420px] overflow-y-auto rounded-xl border border-slate-800/70 bg-slate-950/60">
        <table className="min-w-full text-left text-[11px]">
          <thead className="border-b border-slate-800/80 bg-slate-900/80 text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Category</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Priority</th>
              <th className="px-3 py-2 font-medium">Assigned to</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c._id} className="border-b border-slate-800/40">
                <td className="px-3 py-2 text-slate-100">{c.title}</td>
                <td className="px-3 py-2 text-slate-300">
                  {(c.category as Category | undefined)?.name || "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`badge-pill text-slate-100 ${
                      c.status === "resolved"
                        ? "bg-emerald-600/80"
                        : c.status === "in_progress"
                          ? "bg-amber-500/80"
                          : c.status === "archived"
                            ? "bg-slate-700/80"
                            : "bg-sky-600/80"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-3 py-2 text-slate-300">{c.priority}</td>
                <td className="px-3 py-2 text-slate-300">
                  {(c.assignedTo as User | undefined)?.name || "Unassigned"}
                </td>
                <td className="px-3 py-2 text-slate-400">
                  {new Date(c.createdAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-4 text-center text-slate-500"
                >
                  No tickets match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
