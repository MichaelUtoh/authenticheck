"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { fmtDate, num } from "@/lib/format";
import type { BatchRow, BatchStatus } from "@/lib/mock/batches";
import { AttentionChip, BatchStatusBadge } from "./BatchStatusBadge";

const STATUSES: (BatchStatus | "all")[] = ["all", "active", "recalled", "expired"];

export function BatchTable({ batches }: { batches: BatchRow[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<BatchStatus | "all">("all");
  const [attentionOnly, setAttentionOnly] = useState(false);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return batches.filter(
      (b) =>
        (status === "all" || b.status === status) &&
        (!attentionOnly || b.attention.length > 0) &&
        (!needle || b.id.toLowerCase().includes(needle) || b.product.toLowerCase().includes(needle))
    );
  }, [batches, q, status, attentionOnly]);

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Search batches</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by batch number or product"
            className="h-11 w-full rounded-xl border border-border bg-background px-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BatchStatus | "all")}
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm capitalize text-foreground outline-none focus:border-primary"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
            ))}
          </select>
        </label>
        <label className="flex h-11 items-center gap-2 rounded-xl border border-border px-3.5 text-sm">
          <input type="checkbox" checked={attentionOnly} onChange={(e) => setAttentionOnly(e.target.checked)} className="size-4 accent-[var(--primary)]" />
          Needs attention
        </label>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="py-2.5 pr-4 font-semibold">Batch</th>
              <th className="py-2.5 pr-4 font-semibold">Product</th>
              <th className="py-2.5 pr-4 font-semibold">Manufactured</th>
              <th className="py-2.5 pr-4 font-semibold">Best before</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Declared</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Generated</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Failed</th>
              <th className="py-2.5 pr-4 font-semibold">Status</th>
              <th className="py-2.5 font-semibold">Attention</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => (
              <tr key={b.id} className="border-b border-border/70 last:border-0 hover:bg-background/60">
                <td className="py-3.5 pr-4 font-mono text-xs">
                  <Link href={`/issuance/batches/${b.id}`} className="text-primary underline underline-offset-2">{b.id}</Link>
                </td>
                <td className="py-3.5 pr-4">{b.product}</td>
                <td className="py-3.5 pr-4 text-muted">{fmtDate(b.manufactured)}</td>
                <td className="py-3.5 pr-4 text-muted">{fmtDate(b.bestBefore)}</td>
                <td className="py-3.5 pr-4 text-right tabular-nums">{num(b.declared)}</td>
                <td className="py-3.5 pr-4 text-right tabular-nums">{num(b.generated)}</td>
                <td className={`py-3.5 pr-4 text-right tabular-nums ${b.failed ? "font-semibold text-danger" : ""}`}>{b.failed}</td>
                <td className="py-3.5 pr-4"><BatchStatusBadge status={b.status} /></td>
                <td className="py-3.5">
                  <div className="flex flex-wrap gap-1.5">
                    {b.attention.length ? b.attention.map((a) => <AttentionChip key={a} kind={a} />) : <span className="text-muted">—</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No batches match these filters.</p>
        )}
      </div>
    </section>
  );
}
