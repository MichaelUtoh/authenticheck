"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { ScanChart } from "@/components/analytics/ScanChart";
import { ReleaseGates } from "@/components/dashboard/ReleaseGates";
import { RecentJobsTable } from "@/components/issuance/RecentJobsTable";
import { Topbar } from "@/components/layout/Topbar";
import { FlagTable } from "@/components/risk/FlagTable";
import { batchStatsApi } from "@/lib/api/batchStats";
import { useApi } from "@/lib/hooks/useApi";
import { useStatusCounts } from "@/lib/hooks/useStatusCounts";
import { useTenant } from "@/lib/hooks/useTenant";
import { getDashboard, type Period } from "@/lib/mock/dashboard";

export default function DashboardPage() {
  const tenant = useTenant();
  const [period, setPeriod] = useState<Period>(30);
  const d = useMemo(() => getDashboard(period), [period]);
  const k = d.kpis;
  const products = useStatusCounts();
  const batches = useApi(() => batchStatsApi.batchCounts(), []);
  const codes = useApi(() => batchStatsApi.codeInventory(), []);
  const fmt = (n?: number) => (n === undefined ? "—" : n.toLocaleString("en-US"));

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
            <p className="mt-1 text-muted">
              {tenant?.tenant_name ?? "Your company"} · all brands · times in WAT
              <span className="ml-2 rounded-full bg-[#fbf0d6] px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">Sample data</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-muted">
              Period
              <select
                value={period}
                onChange={(e) => setPeriod(Number(e.target.value) as Period)}
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
            <Link href="/issuance/jobs" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
              Issue codes
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
          <KpiCard label="Products" value={fmt(products.data?.total)} note={`${fmt(products.data?.counts.draft)} drafts`} />
          <KpiCard label="Active batches" value={fmt(batches.data?.active)} note={`${fmt(batches.data?.total)} in total`} />
          <KpiCard label="Codes issued" value={fmt(codes.data?.total)} note={`${fmt(codes.data?.deactivated)} deactivated`} />
          <KpiCard label="Checks" value={k.totalChecks} note={`Last ${period} days`} />
          <KpiCard label="Repeat checks" value={k.repeatChecks} note={`${k.repeatShare}% of checks`} />
          <KpiCard label="Open flags" value={k.openFlags} note={`${k.highFlags} high severity`} />
          <KpiCard label="Open cases" value={k.openCases} note={`Oldest ${k.oldestCaseDays} days`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <ScanChart data={d.checks} />
          <ReleaseGates />
        </div>

        <FlagTable flags={d.flags} />
        <RecentJobsTable jobs={d.jobs} />
      </div>
    </>
  );
}
