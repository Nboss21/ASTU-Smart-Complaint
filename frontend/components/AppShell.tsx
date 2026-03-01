"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { useAuthStore } from "../lib/authStore";
import { api } from "../lib/api";
import { ChatWidget } from "./ChatWidget";

const baseNavItems = [
  { href: "/", label: "Overview", roles: ["user", "staff", "admin"] },
  {
    href: "/complaints",
    label: "Complaints",
    roles: ["user", "staff", "admin"],
  },
  {
    href: "/staff",
    label: "Staff Desk",
    roles: ["staff", "admin"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    roles: ["staff", "admin"],
  },
  {
    href: "/chatbot",
    label: "AI Assistant",
    roles: ["user", "staff", "admin"],
  },
  {
    href: "/notifications",
    label: "Notifications",
    roles: ["user", "staff", "admin"],
  },
  {
    href: "/kb",
    label: "Knowledge Base",
    roles: ["staff", "admin"],
  },
  { href: "/admin", label: "Admin", roles: ["admin"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, accessToken } = useAuthStore();
  const [authHydrated, setAuthHydrated] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Hydrate auth state from localStorage once on mount
    useAuthStore.getState().hydrateFromStorage();
    setAuthHydrated(true);
  }, []);

  useEffect(() => {
    if (!authHydrated) return;
    if (!user && pathname !== "/auth" && pathname !== "/") {
      // Unauthenticated users are allowed to see the landing page (/) and auth page.
      router.replace("/");
    }
  }, [authHydrated, user, pathname, router]);

  // Fetch notifications to determine if there are any unread items
  useEffect(() => {
    if (!authHydrated || !user || !accessToken) return;
    const headers = { Authorization: `Bearer ${accessToken}` };
    api
      .get<Array<{ read: boolean }>>("/api/notifications", { headers })
      .then((r) => {
        setHasUnreadNotifications(r.data.some((n) => !n.read));
      })
      .catch(() => {
        setHasUnreadNotifications(false);
      });
  }, [authHydrated, user, accessToken]);

  // When the notifications page is open, treat notifications as "checked"
  useEffect(() => {
    if (pathname === "/notifications") {
      setHasUnreadNotifications(false);
    }
  }, [pathname]);

  const navItems = useMemo(() => {
    if (!user) return baseNavItems.filter((n) => n.href === "/");
    // For signed-in users, hide the landing/overview link from navigation
    return baseNavItems.filter(
      (n) => n.href !== "/" && n.roles.includes(user.role),
    );
  }, [user]);

  return (
    <div className="relative flex min-h-screen flex-col text-slate-100">
      <header className="border-b border-slate-800/60 bg-slate-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-aurora via-sky-400 to-ember shadow-glow" />
            <div>
              <div className="text-sm font-semibold tracking-wide text-slate-200">
                ASTU STEM
              </div>
              <div className="text-xs text-slate-400">
                Unified service & insight hub
              </div>
            </div>
          </div>
          <nav className="hidden items-center gap-3 md:flex">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-slate-800 text-aurora shadow-glow/40"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`}
                >
                  <span className="relative inline-flex items-center gap-1">
                    <span>{item.label}</span>
                    {item.href === "/notifications" && hasUnreadNotifications && (
                      <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3 text-xs">
            {user ? (
              <>
                <div className="text-right">
                  <div className="font-medium text-slate-100">{user.name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-slate-400">
                    {user.role}
                  </div>
                </div>
                <button className="secondary" onClick={logout}>
                  Sign out
                </button>
              </>
            ) : (
              <Link href="/auth" className="primary">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 md:py-10">
        {children}
      </main>
      <ChatWidget />
    </div>
  );
}
