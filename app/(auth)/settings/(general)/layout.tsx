"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Topbar } from "@/components/layout/Topbar";

const TABS = [
  { href: "/settings/company", label: "Company" },
  { href: "/settings/api-keys", label: "API keys" },
  { href: "/settings/profile", label: "Profile" },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-muted">Company details, the keys your systems use to connect, and your profile.</p>
        </div>
        <nav aria-label="Settings" className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => {
            const active = pathname === t.href;
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm ${active ? "border-primary font-medium text-primary" : "border-transparent text-muted hover:text-foreground"}`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </>
  );
}
