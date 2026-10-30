import { apiFetch } from "./client";
import type { AuthUser } from "@/lib/auth/store";

export interface LoginResponse {
  access_token?: string;
  mfa_required?: boolean;
}

export interface MfaVerifyResponse {
  access_token: string;
}

export interface RegisterPayload {
  full_name: string;
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload) =>
    apiFetch<unknown>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (email: string, password: string) =>
    apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  mfaVerify: (code: string) =>
    apiFetch<MfaVerifyResponse>("/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  me: () => apiFetch<AuthUser>("/auth/me"),

  logout: () =>
    apiFetch<void>("/auth/logout", { method: "POST" }),
};
