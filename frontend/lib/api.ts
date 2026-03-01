import axios from "axios";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export const api = axios.create({
  baseURL: apiBase,
  withCredentials: false,
});

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: "user" | "staff" | "admin";
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserDTO;
}

export async function login(email: string, password: string) {
  const res = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  return res.data;
}

export async function register(name: string, email: string, password: string) {
  const res = await api.post("/api/auth/register", { name, email, password });
  return res.data as UserDTO;
}

export async function fetchProfile(token: string) {
  const res = await api.get<UserDTO>("/api/auth/profile", {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data;
}
