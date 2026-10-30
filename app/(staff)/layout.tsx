"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth/store";
import { useMe } from "@/lib/hooks/useMe";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useMe(); // restores the session on a hard refresh (AppShell does this for (auth))
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && !user.is_staff) router.replace("/dashboard");
  }, [user, router]);

  if (!user || !user.is_staff) return null;

  return <>{children}</>;
}
