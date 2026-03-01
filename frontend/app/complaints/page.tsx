"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface Category {
  _id: string;
  name: string;
}

interface Complaint {
  _id: string;
  title: string;
  status: string;
  priority: string;
  category: Category | string;
  createdAt: string;
  updatedAt?: string;
   dueDate?: string;
   escalated?: boolean;
}

export default function ComplaintsPage() {
  const { accessToken, hydrateFromStorage } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [location, setLocation] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority">(
    "newest",
  );
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<Category[]>("/api/categories", { headers })
      .then((r) => setCategories(r.data))
      .catch(() => {});
    api
      .get<Complaint[]>("/api/complaints", { headers })
      .then((r) => setComplaints(r.data))
      .catch(() => {});
  }, [accessToken]);

  const submitComplaint = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!categoryId) {
      setFormError("Please select a category for your complaint.");
      return;
    }
    setFormError(null);
    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("categoryId", categoryId);
    form.append("priority", priority);
    form.append("location", location);
    if (file) form.append("files", file);
    const headers = { Authorization: `Bearer ${accessToken}` };
    try {
      const res = await api.post("/api/complaints", form, { headers });
      setComplaints((c) => [res.data, ...c]);
      setTitle("");
      setDescription("");
      setLocation("");
      setFile(null);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to submit complaint. Please try again.";
      setFormError(
        message.startsWith("Network Error")
          ? "Cannot reach the complaint service. Make sure the backend is running and NEXT_PUBLIC_API_BASE_URL is correct."
          : message,
      );
    }
  };

  const filteredComplaints = complaints
    .filter((c) => (statusFilter === "all" ? true : c.status === statusFilter))
    .sort((a, b) => {
      if (sortBy === "priority") {
        const order = { urgent: 3, high: 2, medium: 1, low: 0 } as Record<
          string,
          number
        >;
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      const da = new Date(a.updatedAt || a.createdAt).getTime();
      const db = new Date(b.updatedAt || b.createdAt).getTime();
      return sortBy === "newest" ? db - da : da - db;
    });

  return (
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <section className="card-glass w-full p-6 md:w-2/3">
        <h1 className="text-lg font-semibold text-slate-50">Your complaints</h1>
        <p className="mt-1 text-xs text-slate-400">
          Role-aware list of complaints. Students see their own, staff and
          admins see wider scopes.
        </p>
        <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-300">
          <label className="flex items-center gap-1">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/80 text-[11px]"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="flex items-center gap-1">
            <span>Sort</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950/80 text-[11px]"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
            </select>
          </label>
        </div>
        <div className="mt-3 space-y-2 max-h-[420px] overflow-y-auto pr-2">
          {filteredComplaints.map((c) => (
            <div
              key={c._id}
              className="flex items-start justify-between rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-xs"
            >
              <div>
                <div className="font-medium text-slate-100">{c.title}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">
                  {(c.category as Category)?.name || "Uncategorized"} • Last
                  update {new Date(c.updatedAt || c.createdAt).toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
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
                <span className="badge-pill bg-slate-900 text-slate-400">
                  {c.priority}
                </span>
                <Link
                  href={`/complaints/${c._id}`}
                  className="mt-1 text-[11px] text-sky-400 hover:underline"
                >
                  View details
                </Link>
              </div>
            </div>
          ))}
          {!complaints.length && (
            <div className="text-xs text-slate-500">
              No complaints yet. Use the form on the right to file your first
              ticket.
            </div>
          )}
        </div>
      </section>
      <section className="card-glass w-full p-6 md:w-1/3">
        <h2 className="text-sm font-semibold text-slate-50">New complaint</h2>
        <p className="mt-1 text-xs text-slate-400">
          Attach evidence files and describe the impact clearly for faster
          resolution.
        </p>
        <form onSubmit={submitComplaint} className="mt-4 space-y-3 text-xs">
          <div>
            <label className="text-[11px] text-slate-300">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Fan in Lab 202 not working"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-300">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what is wrong, since when, and how it affects you."
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[11px] text-slate-300">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">Select…</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-slate-300">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] text-slate-300">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Block B, Lab 202"
            />
          </div>
          <div>
            <label className="text-[11px] text-slate-300">Attachment</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          {formError && (
            <div className="text-[11px] text-ember-400">{formError}</div>
          )}
          <button className="primary w-full">Submit complaint</button>
        </form>
      </section>
    </div>
  );
}
