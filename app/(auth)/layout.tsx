import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // The access token lives in memory; AppShell's useMe() restores the session
  // via the refresh cookie and redirects to /login if that fails.
  return (
    <Suspense fallback={null}>
      <AppShell>{children}</AppShell>
    </Suspense>
  );
}
