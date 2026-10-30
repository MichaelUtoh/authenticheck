"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { KpiCard } from "@/components/analytics/KpiCard";
import { isActiveCase, useInvestigations } from "@/lib/mock/investigations";

export function InvestigationsHeader() {
  const pathname = usePathname();
  const flags = useInvestigations((s) => s.flags);
  const cases = useInvestigations((s) => s.cases);

  const openFlags = flags.filter((f) => f.state !== "reviewed");
  const active = cases.filter(isActiveCase);
  const oldest = active.reduce((m, c) => Math.max(m, c.ageDays), 0);

  const tabs = [
    { href: "/risk/cases", label: "Cases", count: active.length },
    { href: "/risk/flags", label: "Flags", count: openFlags.length },
  ];

  return (
    <>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Investigations</h1>
        <p className="mt-1 text-muted">
          Flags are leads for review, not proof of counterfeiting. They are never shown to consumers.
          <span className="ml-2 rounded-full bg-[#fbf0d6] px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">Sample data</span>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Open flags" value={openFlags.length} note={`${openFlags.filter((f) => f.severity === "high").length} high severity`} />
        <KpiCard label="Flags without a case" value={openFlags.filter((f) => f.state === "new").length} note="Not yet looked at" />
        <KpiCard label="Open cases" value={active.length} note={`Oldest ${oldest} days`} />
        <KpiCard label="Unassigned" value={active.filter((c) => !c.owner).length} note="Cases with no owner" />
      </div>

      <div role="tablist" aria-label="Investigations" className="flex gap-1 border-b border-border">
        {tabs.map((t) => {
          const on = pathname === t.href;
          return (
            <Link
              key={t.href}
              href={t.href}
              role="tab"
              aria-selected={on}
              className={`-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm ${on ? "border-primary font-semibold text-primary" : "border-transparent text-muted hover:text-foreground"}`}
            >
              {t.label}
              <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">{t.count}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
