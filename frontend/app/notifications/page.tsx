"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface Notification {
  _id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const { accessToken, hydrateFromStorage } = useAuthStore();
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<Notification[]>("/api/notifications", { headers })
      .then((r) => setItems(r.data))
      .catch(() => {});
  }, [accessToken]);

  const markRead = async (id: string) => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    await api.put(`/api/notifications/${id}/read`, {}, { headers });
    setItems((xs) => xs.map((x) => (x._id === id ? { ...x, read: true } : x)));
  };

  const markAll = async () => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    await api.put("/api/notifications/read-all", {}, { headers });
    setItems((xs) => xs.map((x) => ({ ...x, read: true })));
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    await api.delete(`/api/notifications/${id}`, { headers });
    setItems((xs) => xs.filter((x) => x._id !== id));
  };

  return (
    <div className="card-glass w-full p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-50">Notifications</h1>
        <button className="secondary" onClick={markAll}>
          Mark all as read
        </button>
      </div>
      <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-2 text-xs">
        {items.map((n) => (
          <div
            key={n._id}
            className={`flex items-start justify-between rounded-xl border px-3 py-2 ${
              n.read
                ? "border-slate-800 bg-slate-950/60"
                : "border-sky-500/50 bg-slate-900/70"
            }`}
          >
            <div>
              <div className="font-medium text-slate-100">{n.message}</div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                {new Date(n.createdAt).toLocaleString()} • {n.type}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              {!n.read && (
                <button
                  className="secondary px-2 py-1"
                  onClick={() => markRead(n._id)}
                >
                  Read
                </button>
              )}
              <button
                className="secondary px-2 py-1"
                onClick={() => remove(n._id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
        {!items.length && (
          <div className="text-xs text-slate-500">
            No notifications yet. You&apos;ll see ticket updates and assignments
            here.
          </div>
        )}
      </div>
    </div>
  );
}
