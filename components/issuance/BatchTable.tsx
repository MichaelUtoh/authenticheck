"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Pagination } from "@/components/shared/Pagination";
import { batchesApi, type BatchStatus } from "@/lib/api/batches";
import { errorMessage } from "@/lib/api/client";
import { fmtDate, num } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { AttentionChip, BatchStatusBadge } from "./BatchStatusBadge";

const STATUSES: (BatchStatus | "all")[] = ["all", "active", "recalled", "expired"];
const PAGE_SIZE = 20;

export function BatchTable() {
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<BatchStatus | "all">("all");
  const [attention, setAttention] = useState(false);
  const [page, setPage] = useState(1);

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const req = useApi(
    () => batchesApi.list({ q: search, status: status === "all" ? undefined : status, needs_attention: attention || undefined, page, page_size: PAGE_SIZE }),
    [search, status, attention, page]
  );
  const rows = req.data?.results ?? [];
  const filtered = !!search || status !== "all" || attention;

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
            onChange={(e) => { setStatus(e.target.value as BatchStatus | "all"); setPage(1); }}
            className="h-11 rounded-xl border border-border bg-white px-3 text-sm capitalize text-foreground outline-none focus:border-primary"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s === "all" ? "All statuses" : s}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={attention} onChange={(e) => { setAttention(e.target.checked); setPage(1); }} className="size-4 accent-primary" />
          Needs attention
        </label>
      </div>

      {req.error ? (
        <div className="mt-4"><ErrorState message={errorMessage(req.error, "We couldn't load batches.")} onRetry={req.reload} /></div>
      ) : req.loading && !req.data ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <EmptyState
          title={filtered ? "No batches match" : "No batches yet"}
          body={filtered ? "Try a different search or status." : "Create a batch for an approved product to get started."}
        />
      ) : (
        <div className={`mt-4 overflow-x-auto ${req.loading ? "opacity-60" : ""}`}>
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
                    <Link href={`/issuance/batches/${b.id}`} className="text-primary underline underline-offset-2">{b.batchNumber}</Link>
                  </td>
                  <td className="py-3.5 pr-4">{b.product}</td>
                  <td className="py-3.5 pr-4 text-muted">{b.manufactured ? fmtDate(b.manufactured) : "—"}</td>
                  <td className="py-3.5 pr-4 text-muted">{b.bestBefore ? fmtDate(b.bestBefore) : "—"}</td>
                  <td className="py-3.5 pr-4 text-right tabular-nums">{b.declared != null ? num(b.declared) : "—"}</td>
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
        </div>
      )}
      {req.data && <Pagination page={page} pageSize={PAGE_SIZE} count={req.data.count} onChange={setPage} />}
    </section>
  );
}
