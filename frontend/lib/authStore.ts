"use client";

import { create } from "zustand";
import { AuthResponse, UserDTO, login, fetchProfile } from "./api";

interface AuthState {
  user: UserDTO | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  setAuth: (payload: AuthResponse) => void;
  logout: () => void;
  hydrateFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  setAuth: (payload) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("astu_access", payload.accessToken);
      localStorage.setItem("astu_refresh", payload.refreshToken);
      localStorage.setItem("astu_user", JSON.stringify(payload.user));
    }
    set({
      user: payload.user,
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken,
    });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("astu_access");
      localStorage.removeItem("astu_refresh");
      localStorage.removeItem("astu_user");
    }
    set({ user: null, accessToken: null, refreshToken: null });
  },
  hydrateFromStorage: async () => {
    if (typeof window === "undefined") return;
    const access = localStorage.getItem("astu_access");
    const refresh = localStorage.getItem("astu_refresh");
    const userRaw = localStorage.getItem("astu_user");
    if (!access || !userRaw) return;
    try {
      const user = JSON.parse(userRaw) as UserDTO;
      // optionally validate token by hitting profile
      await fetchProfile(access);
      set({ user, accessToken: access, refreshToken: refresh });
    } catch {
      localStorage.removeItem("astu_access");
      localStorage.removeItem("astu_refresh");
      localStorage.removeItem("astu_user");
    }
  },
}));
