"use client";

import { create } from "zustand";

export interface Membership {
  tenant_id: string;
  tenant_name: string;
  role: string;
  tenant_status: string;
  /** Editors only; not in /auth/me yet, see docs/BACKEND_API_REQUIREMENTS.md */
  can_submit_products?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  is_staff: boolean;
  memberships: Membership[];
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  activeTenant: Membership | null;
  setAccessToken: (token: string) => void;
  setUser: (user: AuthUser) => void;
  setActiveTenant: (tenant: Membership) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  activeTenant: null,
  setAccessToken: (token) => set({ accessToken: token }),
  setUser: (user) => set({ user }),
  setActiveTenant: (tenant) => set({ activeTenant: tenant }),
  clear: () => set({ accessToken: null, user: null, activeTenant: null }),
}));

export function getAccessToken(): string | null {
  return useAuthStore.getState().accessToken;
}

export async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "X-Requested-With": "XMLHttpRequest" },
      credentials: "include",
    });
    if (!res.ok) return false;
    const data = await res.json();
    useAuthStore.getState().setAccessToken(data.access_token);
    return true;
  } catch {
    return false;
  }
}

export function redirectToLogin() {
  useAuthStore.getState().clear();
  if (typeof window !== "undefined") window.location.href = "/login";
}
