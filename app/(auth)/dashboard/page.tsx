"use client";

import Link from "next/link";
import { useState } from "react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { ScanChart } from "@/components/analytics/ScanChart";
import { ReleaseGates } from "@/components/dashboard/ReleaseGates";
import { RecentJobsTable } from "@/components/issuance/RecentJobsTable";
import { Topbar } from "@/components/layout/Topbar";
import { FlagTable } from "@/components/risk/FlagTable";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { analyticsApi } from "@/lib/api/analytics";
import { errorMessage } from "@/lib/api/client";
import { batchStatsApi } from "@/lib/api/batchStats";
import { useApi } from "@/lib/hooks/useApi";
import { useStatusCounts } from "@/lib/hooks/useStatusCounts";
import { useTenant } from "@/lib/hooks/useTenant";
import { getDashboard } from "@/lib/mock/dashboard";

type Period = 7 | 30 | 90;

export default function DashboardPage() {
  const tenant = useTenant();
  const [period, setPeriod] = useState<Period>(30);
  const d = getDashboard();
  const k = d.kpis;
  const products = useStatusCounts();
  const batches = useApi(() => batchStatsApi.batchCounts(), []);
  const codes = useApi(() => batchStatsApi.codeInventory(), []);
  const scans = useApi(() => analyticsApi.scans(period), [period]);
  const genuine = scans.data?.by_result.genuine;
  const genuineShare = scans.data && scans.data.total_scans > 0 ? `${Math.round(((genuine ?? 0) / scans.data.total_scans) * 1000) / 10}% of checks` : "No checks yet";
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
          <KpiCard label="Codes issued" value={fmt(codes.data?.total_issued)} note={`${fmt(codes.data?.deactivated)} deactivated`} />
          <KpiCard label="Checks" value={fmt(scans.data?.total_scans)} note={`Last ${period} days`} />
          <KpiCard label="Genuine results" value={scans.data ? fmt(genuine ?? 0) : "—"} note={scans.data ? genuineShare : `Last ${period} days`} />
          <KpiCard label="Open flags" value={k.openFlags} note={`${k.highFlags} high severity`} />
          <KpiCard label="Open cases" value={k.openCases} note={`Oldest ${k.oldestCaseDays} days`} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          {scans.error ? (
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <ErrorState message={errorMessage(scans.error, "We couldn't load checks.")} onRetry={scans.reload} />
            </section>
          ) : !scans.data ? (
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6"><LoadingSpinner /></section>
          ) : scans.data.total_scans === 0 ? (
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
              <EmptyState title="No checks yet" body={`Nobody has checked a code in the last ${period} days.`} />
            </section>
          ) : (
            <ScanChart data={scans.data.by_day} />
          )}
          <ReleaseGates />
        </div>

        <FlagTable flags={d.flags} />
        <RecentJobsTable jobs={d.jobs} />
      </div>
    </>
  );
}
