"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/auth/AuthShell";
import { Icon } from "@/components/ui/Icons";
import { authApi } from "@/lib/api/auth";
import { platformTenantsApi } from "@/lib/api/platform";
import { useAuthStore } from "@/lib/auth/store";
import { useApi } from "@/lib/hooks/useApi";

const nav: { label: string; href?: string; badge?: boolean }[] = [
  { label: "Tenant applications", href: "/platform/tenants", badge: true },
  { label: "Product review", href: "/platform/products" },
  { label: "Platform flags" },
  { label: "Support access" },
  { label: "Audit log" },
  { label: "Operations health", href: "/platform/ops" },
  { label: "Staff", href: "/platform/staff" },
];

function SideNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  // Waiting applications = `pending` + `info_requested` would double count; the badge is new submissions only.
  const pending = useApi(() => platformTenantsApi.list({ status: "pending" }), []);

  async function signOut() {
    try {
      await authApi.logout();
    } finally {
      useAuthStore.getState().clear();
      router.replace("/login");
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 px-4 py-6 text-white">
      <div>
        <div className="[&_*]:!text-white"><Logo /></div>
        <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-white/50">Platform admin</p>
      </div>
      <nav className="flex flex-col gap-1" aria-label="Platform">
        {nav.map((n) => {
          const active = n.href && (pathname === n.href || pathname.startsWith(n.href + "/"));
          const base = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm";
          const count = n.badge ? pending.data?.count : undefined;
          const inner = (
            <>
              <span className="flex-1">{n.label}</span>
              {count ? <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-black">{count}</span> : null}
              {!n.href && <span className="text-[10px] uppercase tracking-wide text-white/40">Soon</span>}
            </>
          );
          return n.href ? (
            <Link key={n.label} href={n.href} onClick={onNavigate} aria-current={active ? "page" : undefined} className={`${base} ${active ? "bg-white/10 font-medium" : "text-white/75 hover:bg-white/5"}`}>
              {inner}
            </Link>
          ) : (
            <span key={n.label} aria-disabled className={`${base} cursor-not-allowed text-white/40`}>{inner}</span>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-white/10 pt-4 text-sm">
        <p className="font-medium">{user?.full_name ?? "…"}</p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-white/60">
          <Icon name="check" className="size-3.5" /> MFA verified
        </p>
        <button type="button" onClick={signOut} className="mt-3 text-xs font-medium text-white/80 underline-offset-2 hover:underline">Sign out</button>
      </div>
    </div>
  );
}

export function StaffShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[288px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen bg-[#14201c] lg:block"><SideNav /></aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85%] bg-[#14201c]"><SideNav onNavigate={() => setOpen(false)} /></aside>
        </div>
      )}
      <div className="min-w-0">
        <div className="flex items-center gap-2 border-b border-border bg-[#e8ecf4] px-4 py-2.5 text-sm text-foreground/80">
          <button type="button" aria-label="Open menu" onClick={() => setOpen(true)} className="grid size-8 place-items-center rounded-lg border border-border bg-white lg:hidden">
            <Icon name="menu" className="size-4" />
          </button>
          <Icon name="list" className="size-4" />
          Every action on this page is recorded with your name, time and reason.
        </div>
        {children}
      </div>
    </div>
  );
}
