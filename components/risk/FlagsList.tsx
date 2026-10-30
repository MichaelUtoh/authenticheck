"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { FlagSeverity } from "@/lib/types";
import { flagStatusText, useInvestigations } from "@/lib/mock/investigations";
import { useAuthStore } from "@/lib/auth/store";
import { FlagSeverityBadge } from "./FlagSeverityBadge";

export function FlagsList() {
  const router = useRouter();
  const flags = useInvestigations((s) => s.flags);
  const openCase = useInvestigations((s) => s.openCase);
  const markReviewed = useInvestigations((s) => s.markFlagReviewed);
  const author = useAuthStore((s) => s.user?.full_name) ?? "You";

  const [severity, setSeverity] = useState<FlagSeverity | "all">("all");
  const [showReviewed, setShowReviewed] = useState(false);

  const rows = useMemo(
    () => flags.filter((f) => (showReviewed || f.state !== "reviewed") && (severity === "all" || f.severity === severity)),
    [flags, severity, showReviewed]
  );

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          Severity
          <select value={severity} onChange={(e) => setSeverity(e.target.value as FlagSeverity | "all")} className="h-11 rounded-xl border border-border bg-white px-3 text-sm capitalize text-foreground outline-none focus:border-primary">
            <option value="all">All severities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-border px-3.5 text-sm">
          <input type="checkbox" checked={showReviewed} onChange={(e) => setShowReviewed(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          Include reviewed
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              {["Flag", "Rule", "Code / scope", "Product", "Severity", "Age", "Status", ""].map((h, i) => (
                <th key={i} className="py-2.5 pr-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id} className="border-b border-border/70 last:border-0">
                <td className="py-3.5 pr-4 font-mono text-xs">{f.id}</td>
                <td className="py-3.5 pr-4">{f.rule}</td>
                <td className="py-3.5 pr-4 font-mono text-xs">{f.scope}</td>
                <td className="py-3.5 pr-4">{f.product}</td>
                <td className="py-3.5 pr-4"><FlagSeverityBadge severity={f.severity} /></td>
                <td className="py-3.5 pr-4 text-muted">{f.age}</td>
                <td className="py-3.5 pr-4">
                  {f.caseId ? (
                    <Link href={`/risk/cases/${f.caseId}`} className="text-primary underline underline-offset-2">{flagStatusText(f)}</Link>
                  ) : (
                    flagStatusText(f)
                  )}
                </td>
                <td className="py-3.5 text-right">
                  {!f.caseId && f.state !== "reviewed" && (
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => router.push(`/risk/cases/${openCase(f.id, author)}`)} className="h-9 whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover">
                        Open case
                      </button>
                      <button type="button" onClick={() => markReviewed(f.id)} className="h-9 whitespace-nowrap rounded-lg border border-border px-3 text-sm font-medium hover:bg-background">
                        Mark reviewed
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-10 text-center text-sm text-muted">No flags need review. Nice.</p>}
      </div>
    </section>
  );
}
