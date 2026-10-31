"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/auth/AuthShell";
import { Icon, type IconName } from "@/components/ui/Icons";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/auth/store";

interface NavItem {
  label: string;
  icon: IconName;
  href?: string; // no href = page not built yet
  badge?: number;
  /** Extra path prefixes that keep this item highlighted. */
  also?: string[];
}

const nav: NavItem[] = [
  { label: "Overview", icon: "home", href: "/dashboard" },
  { label: "Products", icon: "box", href: "/catalogue/products" },
  { label: "Batches & codes", icon: "grid", href: "/issuance/batches" },
  { label: "Imports", icon: "upload", href: "/catalogue/import" },
  { label: "Scan activity", icon: "pulse" },
  { label: "Investigations", icon: "flag", href: "/risk/cases", badge: 7 },
  { label: "Team & roles", icon: "users", href: "/settings/team" },
  { label: "Audit log", icon: "list" },
  { label: "Settings", icon: "sliders", href: "/settings/company", also: ["/settings/api-keys", "/webhooks"] },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const tenant = useAuthStore((s) => s.activeTenant);

  const initials = (user?.full_name ?? "")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    try {
      await authApi.logout();
    } finally {
      useAuthStore.getState().clear();
      router.replace("/login");
    }
  }

  return (
    <div className="flex h-full flex-col gap-5 px-3.5 py-5">
      <div className="px-1.5">
        <Logo />
      </div>

      <button type="button" className="flex items-center justify-between rounded-xl border border-border bg-white/60 px-3 py-2.5 text-left">
        <span className="min-w-0">
          <span className="block text-[10px] font-medium uppercase tracking-widest text-muted">Active company</span>
          <span className="block truncate text-sm font-semibold">{tenant?.tenant_name ?? "Your company"}</span>
          <span className="block text-xs capitalize text-muted">{tenant?.tenant_status ?? "—"}</span>
        </span>
        <Icon name="chevrons" className="size-4 shrink-0 text-muted" />
      </button>

      <nav className="flex flex-col gap-0.5" aria-label="Main">
        {nav.map((item) => {
          const active = item.href && [item.href, ...(item.also ?? [])].some((h) => pathname === h || pathname.startsWith(h + "/"));
          const base = "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm";
          const inner = (
            <>
              <Icon name={item.icon} className="size-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">{item.badge}</span>
              ) : !item.href ? (
                <span className="text-[10px] uppercase tracking-wide text-muted/70">Soon</span>
              ) : null}
            </>
          );
          return item.href ? (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`${base} ${active ? "bg-primary-soft font-medium text-primary" : "text-foreground/80 hover:bg-black/5"}`}
            >
              {inner}
            </Link>
          ) : (
            <span key={item.label} className={`${base} cursor-not-allowed text-muted`} aria-disabled>
              {inner}
            </span>
          );
        })}
      </nav>

      <div className="mt-auto flex items-center gap-3 border-t border-border px-1.5 pt-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-sm font-semibold text-white">{initials || "?"}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{user?.full_name ?? "…"}</span>
          <span className="block text-xs capitalize text-muted">{tenant?.role ?? "Member"}</span>
        </span>
        <button type="button" onClick={signOut} className="text-xs font-medium text-primary hover:underline">
          Sign out
        </button>
      </div>
    </div>
  );
}
