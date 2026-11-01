"use client";

import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/store";
import { homeFor } from "@/lib/onboarding";

/** `?next=` is only honoured for in-app paths, so a crafted login link can't send people to another site. */
export function safeNext(next: string | null): string | null {
  return next && /^\/(?![/\\])/.test(next) ? next : null;
}

/** Stores the token, loads the profile, and sends the user to `?next=` or the right place. */
export function useCompleteLogin() {
  const router = useRouter();
  return async (accessToken: string) => {
    const { setAccessToken, setUser, setActiveTenant } = useAuthStore.getState();
    setAccessToken(accessToken);
    const user = await authApi.me();
    setUser(user);
    if (user.memberships[0]) setActiveTenant(user.memberships[0]);
    router.replace(safeNext(new URLSearchParams(window.location.search).get("next")) ?? homeFor(user));
  };
}
