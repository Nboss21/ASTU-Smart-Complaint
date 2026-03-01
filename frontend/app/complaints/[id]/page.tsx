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
  role?: string;
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
   dueDate?: string;
   escalated?: boolean;
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

interface InternalNote {
  _id?: string;
  author?: User | string;
  note: string;
  createdAt: string;
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
  const [notes, setNotes] = useState<InternalNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [staffUsers, setStaffUsers] = useState<User[]>([]);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");
  const [assigning, setAssigning] = useState(false);

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
      api.get<InternalNote[]>(`/api/complaints/${params.id}/notes`, {
        headers,
      }),
    ])
      .then(([c, h, a, n]) => {
        setComplaint(c.data);
        setHistory(h.data);
        setAttachments(a.data);
        setNotes(n.data);
      })
      .finally(() => setLoading(false));
  }, [accessToken, params?.id]);

  // Load staff list for admin assignment
  useEffect(() => {
    if (!accessToken || user?.role !== "admin") return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<User[]>("/api/users", { headers })
      .then((r) => setStaffUsers(r.data.filter((u) => u.role === "staff")))
      .catch(() => {});
  }, [accessToken, user?.role]);

  // Keep selected assignee in sync with loaded complaint
  useEffect(() => {
    if (!complaint) return;
    const current = complaint.assignedTo as User | string | undefined;
    if (!current || typeof current === "string") {
      setSelectedAssignee(current || "");
    } else {
      setSelectedAssignee(current._id);
    }
  }, [complaint]);

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

  const canUseStaffTools = user && (user.role === "staff" || user.role === "admin");

  const addNote = async () => {
    if (!accessToken || !complaint || !newNote.trim()) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const res = await api.post<InternalNote>(
      `/api/complaints/${complaint._id}/notes`,
      { note: newNote },
      { headers },
    );
    setNotes((xs) => [res.data, ...xs]);
    setNewNote("");
  };

  const escalate = async () => {
    if (!accessToken || !complaint) return;
    if (complaint.escalated) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const res = await api.post<Complaint>(
      `/api/complaints/${complaint._id}/escalate`,
      {},
      { headers },
    );
    setComplaint(res.data);
  };

  const assignToStaff = async () => {
    if (!accessToken || !complaint || user?.role !== "admin") return;
    setAssigning(true);
    const headers = { Authorization: `Bearer ${accessToken}` };
    try {
      const res = await api.put<Complaint>(
        `/api/complaints/${complaint._id}/assign`,
        { assignedTo: selectedAssignee || null },
        { headers },
      );
      setComplaint(res.data);
    } finally {
      setAssigning(false);
    }
  };

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
          {complaint.dueDate && (
            <div>
              <div className="text-[11px] text-slate-400">Due date</div>
              <div className="text-slate-100">
                {new Date(complaint.dueDate).toLocaleString()}
              </div>
            </div>
          )}
          {complaint.escalated && (
            <div>
              <div className="text-[11px] text-slate-400">Escalation</div>
              <div className="text-ember text-[11px] font-semibold">
                Escalated to admin
              </div>
            </div>
          )}
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
            {user?.role === "admin" && (
              <div className="mt-2 flex items-center gap-2 text-[11px]">
                <select
                  className="flex-1 bg-slate-950/80"
                  value={selectedAssignee}
                  onChange={(e) => setSelectedAssignee(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {staffUsers.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="secondary px-3 py-1"
                  onClick={assignToStaff}
                  disabled={assigning}
                >
                  {assigning ? "Assigning…" : "Assign"}
                </button>
              </div>
            )}
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
        {canUseStaffTools && (
          <div className="mt-6 space-y-3 text-xs">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Internal staff notes
            </h3>
            <textarea
              rows={3}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add an internal note for staff/admin only…"
            />
            <button
              type="button"
              className="secondary w-full"
              onClick={addNote}
              disabled={!newNote.trim()}
            >
              Add note
            </button>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto pr-1">
              {notes.map((n, idx) => (
                <div
                  key={n._id || idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-1.5"
                >
                  <div className="text-[11px] text-slate-400">
                    {new Date(n.createdAt).toLocaleString()}
                  </div>
                  <div className="text-slate-100">{n.note}</div>
                </div>
              ))}
              {!notes.length && (
                <div className="text-[11px] text-slate-500">
                  No internal notes yet.
                </div>
              )}
            </div>
          </div>
        )}
        {user?.role === "staff" && (
          <div className="mt-4 text-xs">
            <button
              type="button"
              className="secondary w-full border-ember/60 text-ember hover:bg-ember/10"
              onClick={escalate}
              disabled={complaint.escalated}
            >
              {complaint.escalated ? "Already escalated" : "Escalate to admin"}
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
