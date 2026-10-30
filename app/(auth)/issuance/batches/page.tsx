"use client";

import { KpiCard } from "@/components/analytics/KpiCard";
import { BatchTable } from "@/components/issuance/BatchTable";
import { Topbar } from "@/components/layout/Topbar";
import { batchStatsApi } from "@/lib/api/batchStats";
import { useApi } from "@/lib/hooks/useApi";
import { getBatches } from "@/lib/mock/batches";

export default function BatchesPage() {
  const batches = getBatches();
  const counts = useApi(() => batchStatsApi.batchCounts(), []);
  const inventory = useApi(() => batchStatsApi.codeInventory(), []);
  const attention = batches.filter((b) => b.attention.length > 0).length;
  const approvals = batches.filter((b) => b.attention.includes("approval")).length;

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Batches &amp; codes</h1>
            <p className="mt-1 text-muted">
              Every batch across your products, with its issuance and print status.
              <span className="ml-2 rounded-full bg-[#fbf0d6] px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">Sample data</span>
            </p>
          </div>
          <button
            type="button"
            disabled
            title="Issue codes flow is not built yet"
            className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white opacity-60"
          >
            Issue codes
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Active batches" value={counts.data?.active ?? "—"} note={counts.data ? `${counts.data.total} in total` : "All products"} />
          <KpiCard label="Codes generated" value={inventory.data?.total_issued ?? "—"} note="Across all batches" />
          <KpiCard label="Need attention" value={attention} note="Partial, unreconciled or expiring" />
          <KpiCard label="Awaiting approval" value={approvals} note="Deactivation requests" />
        </div>

        <BatchTable batches={batches} />
      </div>
    </>
  );
}
