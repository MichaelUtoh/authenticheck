"use client";

import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/store";
import { homeFor } from "@/lib/onboarding";

/** Stores the token, loads the profile, and sends the user to the right place. */
export function useCompleteLogin() {
  const router = useRouter();
  return async (accessToken: string) => {
    const { setAccessToken, setUser, setActiveTenant } = useAuthStore.getState();
    setAccessToken(accessToken);
    const user = await authApi.me();
    setUser(user);
    if (user.memberships[0]) setActiveTenant(user.memberships[0]);
    router.replace(homeFor(user));
  };
}
