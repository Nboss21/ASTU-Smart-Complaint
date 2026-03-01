"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "../../../lib/api";
import { useAuthStore } from "../../../lib/authStore";

interface Category {
  _id: string;
  name: string;
}

interface User {
  _id: string;
  name: string;
}

interface Complaint {
  _id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category?: Category | string;
  user?: User | string;
  assignedTo?: User | string;
  location?: string;
  createdAt: string;
  updatedAt?: string;
}

interface StatusHistoryItem {
  _id: string;
  oldStatus: string;
  newStatus: string;
  timestamp: string;
  remarks?: string;
}

interface AttachmentItem {
  _id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export default function ComplaintDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, hydrateFromStorage, user } = useAuthStore();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [nextStatus, setNextStatus] = useState<string>("in_progress");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken || !params?.id) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    setLoading(true);
    Promise.all([
      api.get<Complaint>(`/api/complaints/${params.id}`, { headers }),
      api.get<StatusHistoryItem[]>(`/api/complaints/${params.id}/history`, {
        headers,
      }),
      api.get<AttachmentItem[]>(`/api/files/complaint/${params.id}`, {
        headers,
      }),
    ])
      .then(([c, h, a]) => {
        setComplaint(c.data);
        setHistory(h.data);
        setAttachments(a.data);
      })
      .finally(() => setLoading(false));
  }, [accessToken, params?.id]);

  const updateStatus = async () => {
    if (!accessToken || !complaint) return;
    setStatusUpdating(true);
    const headers = { Authorization: `Bearer ${accessToken}` };
    try {
      const res = await api.put<Complaint>(
        `/api/complaints/${complaint._id}/status`,
        { status: nextStatus, remarks },
        { headers },
      );
      setComplaint(res.data);
      const h = await api.get<StatusHistoryItem[]>(
        `/api/complaints/${complaint._id}/history`,
        { headers },
      );
      setHistory(h.data);
      setRemarks("");
    } finally {
      setStatusUpdating(false);
    }
  };

  const canManageStatus =
    user && (user.role === "staff" || user.role === "admin");

  if (loading || !complaint) {
    return (
      <div className="card-glass w-full p-6 text-xs text-slate-300">
        Loading complaint details…
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <section className="card-glass w-full p-6 md:w-2/3">
        <button
          type="button"
          className="text-[11px] text-sky-400 hover:underline"
          onClick={() => router.back()}
        >
          ← Back to list
        </button>
        <h1 className="mt-2 text-lg font-semibold text-slate-50">
          {complaint.title}
        </h1>
        <p className="mt-1 text-xs text-slate-400">{complaint.description}</p>
        <div className="mt-4 grid gap-3 text-xs md:grid-cols-2">
          <div>
            <div className="text-[11px] text-slate-400">Category</div>
            <div className="text-slate-100">
              {(complaint.category as Category)?.name || "Uncategorized"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Status</div>
            <div className="text-slate-100">{complaint.status}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Priority</div>
            <div className="text-slate-100">{complaint.priority}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Location</div>
            <div className="text-slate-100">{complaint.location || "—"}</div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Created at</div>
            <div className="text-slate-100">
              {new Date(complaint.createdAt).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Last updated</div>
            <div className="text-slate-100">
              {new Date(
                complaint.updatedAt || complaint.createdAt,
              ).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Requester</div>
            <div className="text-slate-100">
              {(complaint.user as User)?.name || "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Assigned to</div>
            <div className="text-slate-100">
              {(complaint.assignedTo as User)?.name || "Unassigned"}
            </div>
          </div>
        </div>
      </section>
      <aside className="card-glass w-full p-6 md:w-1/3">
        <h2 className="text-sm font-semibold text-slate-50">Status timeline</h2>
        <div className="mt-3 max-h-64 space-y-3 overflow-y-auto pr-1 text-xs">
          {history.map((h) => (
            <div key={h._id} className="flex gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-aurora" />
              <div>
                <div className="text-[11px] text-slate-400">
                  {new Date(h.timestamp).toLocaleString()}
                </div>
                <div className="text-slate-100">
                  {h.oldStatus} → {h.newStatus}
                </div>
                {h.remarks && (
                  <div className="text-[11px] text-slate-400">{h.remarks}</div>
                )}
              </div>
            </div>
          ))}
          {!history.length && (
            <div className="text-[11px] text-slate-500">
              No status changes recorded yet.
            </div>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-slate-50">Attachments</h3>
          <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1 text-xs">
            {attachments.map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-950/70 px-3 py-1.5"
              >
                <div>
                  <div className="text-slate-100">{f.fileName}</div>
                  <div className="text-[11px] text-slate-400">
                    {Math.round(f.fileSize / 1024)} KB • {f.mimeType}
                  </div>
                </div>
                <a
                  href={`/api/files/${complaint._id}/${f._id}`}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  View
                </a>
              </div>
            ))}
            {!attachments.length && (
              <div className="text-[11px] text-slate-500">
                No files attached to this complaint yet.
              </div>
            )}
          </div>
        </div>
        {canManageStatus && (
          <div className="mt-4 space-y-2 text-xs">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Update status
            </h3>
            <select
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              className="w-full bg-slate-950/80 text-xs"
            >
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="archived">Archived</option>
            </select>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Internal remarks for this transition…"
            />
            <button
              type="button"
              className="primary w-full"
              disabled={statusUpdating}
              onClick={updateStatus}
            >
              {statusUpdating ? "Updating…" : "Apply status change"}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
