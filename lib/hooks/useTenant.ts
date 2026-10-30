"use client";

import { useAuthStore } from "@/lib/auth/store";

export function useTenant() {
  return useAuthStore((s) => s.activeTenant);
}
