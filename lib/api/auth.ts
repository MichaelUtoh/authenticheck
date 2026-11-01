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

  /** Only `full_name` is editable; email and password are ignored by this endpoint. Returns the same payload as `me`. */
  updateMe: (body: { full_name: string }) =>
    apiFetch<AuthUser>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),

  logout: () =>
    apiFetch<void>("/auth/logout", { method: "POST" }),
};
