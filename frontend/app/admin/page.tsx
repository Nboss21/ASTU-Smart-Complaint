"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "../../lib/api";
import { useAuthStore } from "../../lib/authStore";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function AdminPage() {
  const { accessToken, hydrateFromStorage } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  useEffect(() => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<User[]>("/api/users", { headers })
      .then((r) => setUsers(r.data))
      .catch(() => {});
    api
      .get<Category[]>("/api/categories", { headers })
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, [accessToken]);

  const changeRole = async (id: string, role: string) => {
    if (!accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const res = await api.put(`/api/users/${id}/role`, { role }, { headers });
    setUsers((xs) => xs.map((u) => (u._id === id ? res.data : u)));
  };

  const createCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!accessToken || !newCategory.trim()) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    const res = await api.post(
      "/api/categories",
      { name: newCategory },
      { headers },
    );
    setCategories((cs) => [...cs, res.data]);
    setNewCategory("");
  };

  return (
    <div className="flex w-full flex-col gap-6 md:flex-row">
      <section className="card-glass w-full p-6 md:w-2/3">
        <h1 className="text-lg font-semibold text-slate-50">User management</h1>
        <p className="mt-1 text-xs text-slate-400">
          Promote staff, manage admins, and keep roles aligned with governance.
        </p>
        <div className="mt-4 space-y-2 max-h-[420px] overflow-y-auto pr-2 text-xs">
          {users.map((u) => (
            <div
              key={u._id}
              className="flex items-center justify-between rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2"
            >
              <div>
                <div className="text-sm font-semibold text-slate-100">
                  {u.name}
                </div>
                <div className="text-[11px] text-slate-400">{u.email}</div>
              </div>
              <select
                className="bg-slate-950/80 text-xs"
                value={u.role}
                onChange={(e) => changeRole(u._id, e.target.value)}
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          ))}
        </div>
      </section>
      <section className="card-glass w-full p-6 md:w-1/3">
        <h2 className="text-sm font-semibold text-slate-50">Categories</h2>
        <form onSubmit={createCategory} className="mt-3 flex gap-2 text-xs">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="Infrastructure, Exams, Facilities…"
          />
          <button className="primary">Add</button>
        </form>
        <div className="mt-3 space-y-1 text-xs text-slate-300">
          {categories.map((c) => (
            <div
              key={c._id}
              className="rounded-full border border-slate-700/70 bg-slate-950/60 px-3 py-1"
            >
              {c.name}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
