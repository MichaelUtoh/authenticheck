"use client";

import { useEffect } from "react";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/store";

export function useMe() {
  const { user, setUser, setActiveTenant } = useAuthStore();

  useEffect(() => {
    if (user) return;
    authApi.me().then((me) => {
      setUser(me);
      if (me.memberships.length > 0) setActiveTenant(me.memberships[0]);
    }).catch(() => {}); // 401s already redirect to /login
  }, []);

  return user;
}
