"use client";

import Link from "next/link";
import { KpiCard } from "@/components/analytics/KpiCard";
import { BatchTable } from "@/components/issuance/BatchTable";
import { Topbar } from "@/components/layout/Topbar";
import { batchStatsApi } from "@/lib/api/batchStats";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { useApi } from "@/lib/hooks/useApi";

export default function BatchesPage() {
  const { canEdit } = useCatalogueRole();
  const counts = useApi(() => batchStatsApi.batchCounts(), []);
  const inventory = useApi(() => batchStatsApi.codeInventory(), []);

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Batches &amp; codes</h1>
            <p className="mt-1 text-muted">
              Every batch across your products, with its issuance and print status.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {canEdit && (
              <Link href="/issuance/batches/new" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
                New batch
              </Link>
            )}
            <button
              type="button"
              disabled
              title="Issue codes flow is not built yet"
              className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-semibold opacity-60"
            >
              Issue codes
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Active batches" value={counts.data?.active ?? "—"} note={counts.data ? `${counts.data.total} in total` : "All products"} />
          <KpiCard label="Codes generated" value={inventory.data?.total_issued ?? "—"} note="Across all batches" />
          <KpiCard label="Codes active" value={inventory.data?.active ?? "—"} note="Currently resolvable" />
          <KpiCard label="Codes deactivated" value={inventory.data?.deactivated ?? "—"} note="Switched off" />
        </div>

        <BatchTable />
      </div>
    </>
  );
}
