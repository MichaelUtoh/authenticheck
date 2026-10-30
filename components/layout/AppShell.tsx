"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icons";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useMe } from "@/lib/hooks/useMe";
import { homeFor, onboardingState } from "@/lib/onboarding";
import { Sidebar } from "./Sidebar";

// Pages that live in the (auth) group but render without the app chrome.
const BARE_PATHS = ["/onboarding"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const user = useMe();

  const bare = BARE_PATHS.some((p) => pathname.startsWith(p));
  // Tenants that aren't approved yet can't use the app; send them back to finish setup.
  const blocked = !!user && !user.is_staff && onboardingState(user) !== "approved";
  useEffect(() => {
    if (user && !bare && blocked) router.replace(homeFor(user));
  }, [user, bare, blocked, router]);

  if (bare) return <>{children}</>;
  if (!user || blocked) return <LoadingSpinner />;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen border-r border-border bg-[#f8f8f6] lg:block">
        <Sidebar />
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85%] bg-[#f8f8f6] shadow-xl">
            <Sidebar onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0">
        <div className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 lg:hidden">
          <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid size-9 place-items-center rounded-lg border border-border">
            <Icon name="menu" className="size-5" />
          </button>
          <span className="font-semibold">AuthentiCheck</span>
        </div>
        {children}
      </div>
    </div>
  );
}
