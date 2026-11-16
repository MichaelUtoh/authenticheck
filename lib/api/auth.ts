import { apiFetch } from "./client";
import type { AuthUser } from "@/lib/auth/store";

export interface LoginResponse {
  access_token?: string;
  mfa_required?: boolean;
  /** Staff only: short-lived (5 min) token that ties the next MFA call to this sign-in. Keep in memory. */
  challenge_token?: string;
  /** True when the staff user has no authenticator yet and must enrol first. */
  mfa_enrollment_required?: boolean;
}

/** Same shape as a normal login result once MFA passes. */
export interface MfaVerifyResponse {
  access_token: string;
}

export interface MfaEnrollResponse {
  provisioning_uri: string;
  secret: string;
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

  /** `token` is the 6 digits as a string (leading zeros matter). */
  mfaVerify: (challengeToken: string, token: string) =>
    apiFetch<MfaVerifyResponse>("/auth/mfa/verify", {
      method: "POST",
      body: JSON.stringify({ challenge_token: challengeToken, token }),
    }),

  /** Each call issues a NEW secret and invalidates the previous one: call once per visit. */
  mfaEnroll: (challengeToken: string) =>
    apiFetch<MfaEnrollResponse>("/auth/mfa/enroll", {
      method: "POST",
      body: JSON.stringify({ challenge_token: challengeToken }),
    }),

  mfaEnrollConfirm: (challengeToken: string, token: string) =>
    apiFetch<MfaVerifyResponse>("/auth/mfa/enroll/confirm", {
      method: "POST",
      body: JSON.stringify({ challenge_token: challengeToken, token }),
    }),

  me: () => apiFetch<AuthUser>("/auth/me"),

  /** Only `full_name` is editable; email and password are ignored by this endpoint. Returns the same payload as `me`. */
  updateMe: (body: { full_name: string }) =>
    apiFetch<AuthUser>("/auth/me", { method: "PATCH", body: JSON.stringify(body) }),

  logout: () =>
    apiFetch<void>("/auth/logout", { method: "POST" }),
};
