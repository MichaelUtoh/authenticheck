"use client";

import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { batchesApi } from "@/lib/api/batches";
import { ApiError, errorMessage } from "@/lib/api/client";
import { fmtDate, num } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { AttentionChip, BatchStatusBadge } from "./BatchStatusBadge";

const card = "rounded-2xl border border-border bg-white p-5 sm:p-6";

/** A batch read from the API. Jobs, exports, reconciliation and history are not connected yet. */
export function LiveBatchDetail({ id }: { id: string }) {
  const req = useApi(() => batchesApi.get(id), [id]);
  const b = req.data;
  const notFound = req.error instanceof ApiError && (req.error.status === 404 || req.error.status === 400);

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <Link href="/issuance/batches" className="text-sm text-muted hover:underline">← Batches &amp; codes</Link>
        {req.error ? (
          notFound ? (
            <EmptyState title="Batch not found" body="It may have been removed, or the link is wrong." />
          ) : (
            <ErrorState message={errorMessage(req.error, "We couldn't load this batch.")} onRetry={req.reload} />
          )
        ) : !b ? (
          <LoadingSpinner />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-3xl font-semibold tracking-tight">{b.batchNumber}</h1>
              <BatchStatusBadge status={b.status} />
              {b.attention.map((a) => <AttentionChip key={a} kind={a} />)}
            </div>

            <section className={card}>
              <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
                {([
                  ["Product", b.productId ? <Link key="p" href={`/catalogue/products/${b.productId}`} className="text-primary underline underline-offset-2">{b.product}</Link> : b.product],
                  ["Pack format", b.packFormat ?? "—"],
                  ["Manufactured", b.manufactured ? fmtDate(b.manufactured) : "—"],
                  ["Best before", b.bestBefore ? fmtDate(b.bestBefore) : "—"],
                  ["Declared quantity", b.declared != null ? num(b.declared) : "—"],
                ] as [string, React.ReactNode][]).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={card}>
              <h2 className="text-base font-semibold">Code issuance</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[["Requested", b.requested], ["Generated", b.generated], ["Failed", b.failed], ["Deactivated", b.deactivated]].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border px-4 py-3">
                    <p className="text-xs text-muted">{k}</p>
                    <p className={`mt-1 text-2xl font-semibold tabular-nums ${k === "Failed" && v ? "text-danger" : ""}`}>{num(v as number)}</p>
                  </div>
                ))}
              </div>
              {b.requested === 0 && <p className="mt-3 text-sm text-muted">No codes have been issued for this batch yet.</p>}
              <p className="mt-4 text-xs text-muted">Code jobs, print exports, reconciliation and history for real batches aren&apos;t connected yet.</p>
            </section>
          </>
        )}
      </div>
    </>
  );
}
