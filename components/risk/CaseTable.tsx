"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CaseStatus } from "@/lib/types";
import { isActiveCase, useInvestigations } from "@/lib/mock/investigations";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { FlagSeverityBadge } from "./FlagSeverityBadge";

type Filter = "active" | "all" | CaseStatus;

export function CaseTable() {
  const cases = useInvestigations((s) => s.cases);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return cases.filter(
      (c) =>
        (filter === "all" || (filter === "active" ? isActiveCase(c) : c.status === filter)) &&
        (!needle || [c.id, c.title, c.product, c.scope].some((v) => v.toLowerCase().includes(needle)))
    );
  }, [cases, q, filter]);

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Search cases</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by case, product or code"
            className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Show
          <select value={filter} onChange={(e) => setFilter(e.target.value as Filter)} className="h-11 rounded-xl border border-border bg-white px-3 text-sm capitalize text-foreground outline-none focus:border-primary">
            <option value="active">Open &amp; investigating</option>
            <option value="all">All cases</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              {["Case", "Summary", "Product", "Severity", "Status", "Owner", "Age", "Updated"].map((h) => (
                <th key={h} className="py-2.5 pr-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className="border-b border-border/70 last:border-0 hover:bg-background/60">
                <td className="py-3.5 pr-4 font-mono text-xs">
                  <Link href={`/risk/cases/${c.id}`} className="text-primary underline underline-offset-2">{c.id}</Link>
                </td>
                <td className="py-3.5 pr-4">
                  {c.title}
                  <span className="block font-mono text-xs text-muted">{c.scope}</span>
                </td>
                <td className="py-3.5 pr-4">{c.product}</td>
                <td className="py-3.5 pr-4"><FlagSeverityBadge severity={c.severity} /></td>
                <td className="py-3.5 pr-4"><CaseStatusBadge status={c.status} /></td>
                <td className="py-3.5 pr-4">{c.owner ?? <span className="font-medium text-danger">Unassigned</span>}</td>
                <td className="py-3.5 pr-4 text-muted">{c.ageDays === 0 ? "New" : `${c.ageDays} d`}</td>
                <td className="py-3.5 text-muted">{c.updated}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-10 text-center text-sm text-muted">No cases match these filters.</p>}
      </div>
    </section>
  );
}
