"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { fmtDate, num } from "@/lib/format";
import { getBatchDetail, type ExportRow, type Reconciliation } from "@/lib/mock/batches";
import { BatchStatusBadge } from "./BatchStatusBadge";
import { DeactivateCard, type Scope } from "./DeactivateCard";
import { ExportsCard } from "./ExportsCard";
import { IssuanceStats, JobCard } from "./JobCard";
import { ReconciliationCard } from "./ReconciliationCard";

const TABS = ["Codes & reconciliation", "Exports", "Scan activity", "History"] as const;
type Tab = (typeof TABS)[number];

export function BatchDetail({ id }: { id: string }) {
  const detail = getBatchDetail(id);
  const [tab, setTab] = useState<Tab>(TABS[0]);
  const [resumed, setResumed] = useState(false);
  const [recon, setRecon] = useState<Reconciliation | null>(detail?.reconciliation ?? null);
  const [exports, setExports] = useState<ExportRow[]>(detail?.exports ?? []);
  const [scope, setScope] = useState<Scope>("selected");

  if (!detail) {
    return (
      <>
        <Topbar />
        <div className="px-4 py-10 sm:px-8">
          <h1 className="text-2xl font-semibold">Batch not found</h1>
          <p className="mt-2 text-muted">
            We couldn&apos;t find batch <span className="font-mono">{id}</span>.{" "}
            <Link href="/issuance/batches" className="font-medium text-primary underline">Back to batches</Link>
          </p>
        </div>
      </>
    );
  }

  const { batch, job, history } = detail;
  const issuance = resumed
    ? { ...detail.issuance, generated: detail.issuance.requested, failed: 0 }
    : detail.issuance;

  function newExport() {
    const n = exports.length + 1;
    setExports([
      ...exports,
      { id: `EXP-${3300 + n + 10}`, format: "CSV for printer · template v2", codes: issuance.generated, created: "Just now", by: "You", sha: "e5a9…12d0", downloads: 0 },
    ]);
  }

  function reviewDamaged() {
    setScope("selected");
    document.getElementById("deactivate")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const facts: [string, string][] = [
    ["Product", batch.product],
    ["Manufactured", fmtDate(batch.manufactured)],
    ["Best before", fmtDate(batch.bestBefore)],
    ["Declared quantity", `${num(batch.declared)} units`],
    ["Pack format", batch.packFormat],
  ];

  const exportsCard = (
    <ExportsCard
      exports={exports}
      onNew={newExport}
      onDownload={(eid) => setExports((xs) => xs.map((x) => (x.id === eid ? { ...x, downloads: x.downloads + 1 } : x)))}
    />
  );

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div>
          <nav aria-label="Breadcrumb" className="text-sm text-muted">
            <Link href="/issuance/batches" className="text-primary underline underline-offset-2">Batches &amp; codes</Link>
            {" / "}
            <Link href={`/catalogue/products/${batch.productId}`} className="text-primary underline underline-offset-2">{batch.product}</Link>
            {" / "}
            <span className="font-mono">{batch.id}</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-mono text-3xl font-semibold tracking-tight">Batch {batch.id}</h1>
              <BatchStatusBadge status={batch.status} />
              <span className="rounded-full bg-[#fbf0d6] px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">Sample data</span>
            </div>
            <div className="flex gap-3">
              <button type="button" disabled title="Recall flow is not built yet" className="h-11 rounded-xl border border-danger/40 bg-white px-4 text-sm font-semibold text-danger opacity-60">
                Recall or withdraw…
              </button>
              <button type="button" disabled title="Issue codes flow is not built yet" className="h-11 rounded-xl bg-primary px-4 text-sm font-semibold text-white opacity-60">
                Issue more codes
              </button>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3 lg:grid-cols-5">
          {facts.map(([k, v]) => (
            <div key={k} className="bg-white p-4">
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="mt-1 text-sm font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <div role="tablist" aria-label="Batch sections" className="flex gap-1 overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`-mb-px whitespace-nowrap border-b-2 px-4 py-3 text-sm ${tab === t ? "border-primary font-semibold text-primary" : "border-transparent text-muted hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "Codes & reconciliation" && (
          <div className="space-y-6">
            <JobCard job={job} issuance={issuance} onResume={() => setResumed(true)} />
            <div className="grid gap-6 lg:grid-cols-2">
              <IssuanceStats issuance={issuance} />
              <ReconciliationCard
                value={recon}
                exported={issuance.exported}
                damagedActive={recon?.damagedActive ?? 0}
                onSave={(c) => setRecon({ ...c, updated: "Just now", damagedActive: recon?.damagedActive ?? 0 })}
                onReview={reviewDamaged}
              />
            </div>
            {exportsCard}
            <DeactivateCard scope={scope} onScope={setScope} selectedCount={recon?.damagedActive ?? 0} batchCount={issuance.generated} />
          </div>
        )}

        {tab === "Exports" && exportsCard}

        {tab === "Scan activity" && (
          <section className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
            <h2 className="font-semibold">Scan activity for this batch</h2>
            <p className="mt-1 text-sm text-muted">First and repeat checks for this batch will appear here once the per-batch analytics endpoint exists.</p>
          </section>
        )}

        {tab === "History" && (
          <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold">History</h2>
            <ol className="mt-4 divide-y divide-border/70 text-sm">
              {history.map((h, i) => (
                <li key={i} className="flex flex-wrap gap-x-4 gap-y-1 py-3">
                  <span className="w-32 shrink-0 text-muted">{h.at}</span>
                  <span className="font-medium">{h.actor}</span>
                  <span>{h.text}</span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}
