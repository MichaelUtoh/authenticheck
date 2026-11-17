"use client";

import { ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { errorMessage } from "@/lib/api/client";
import { platformOpsApi } from "@/lib/api/platformOps";
import { fmtDateTime, num } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";

type Tone = "ok" | "warn" | "bad" | "none";
const TONE: Record<Tone, string> = { ok: "", warn: "text-caution", bad: "text-danger", none: "text-muted" };

function Tile({ label, value, hint, tone = "none" }: { label: string; value: string; hint?: string; tone?: Tone }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-2 text-3xl font-semibold tabular-nums ${tone === "none" ? "" : TONE[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

const dash = "—";
const count = (v?: number) => (v == null ? dash : num(v));

export function OpsHealth() {
  const req = useApi(() => platformOpsApi.get(), []);
  const o = req.data;

  let tls: { value: string; hint: string; tone: Tone } = { value: dash, hint: "Not set yet", tone: "none" };
  if (o?.tlsExpiresAt) {
    const days = o.tlsDaysLeft;
    tls = days == null
      ? { value: o.tlsExpiresAt, hint: "", tone: "none" }
      : { value: days < 0 ? "Expired" : `${days} days`, hint: `Expires ${fmtDateTime(o.tlsExpiresAt)} WAT`, tone: days < 14 ? "bad" : days < 30 ? "warn" : "ok" };
  }
  let restore: { value: string; hint: string; tone: Tone } = { value: dash, hint: "Not recorded yet", tone: "none" };
  if (o?.lastRestoreTestAt) {
    const days = o.restoreDaysAgo;
    restore = days == null
      ? { value: o.lastRestoreTestAt, hint: "", tone: "none" }
      : { value: days <= 0 ? "Today" : `${days} days ago`, hint: `${fmtDateTime(o.lastRestoreTestAt)} WAT`, tone: days > 90 ? "bad" : days > 30 ? "warn" : "ok" };
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Operations health</h1>
          <p className="mt-1 text-muted">A snapshot taken when this page loaded.</p>
        </div>
        <button type="button" onClick={req.reload} disabled={req.loading} className="h-11 rounded-xl border border-border bg-white px-4 text-sm font-semibold hover:bg-background disabled:opacity-60">
          {req.loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {req.error ? (
        <ErrorState message={errorMessage(req.error, "We couldn't load operations health.")} onRetry={req.reload} />
      ) : !o ? (
        <LoadingSpinner />
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-semibold">Verification, last hour</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Tile label="Requests" value={count(o.verifyRequests)} />
              <Tile label="Errors" value={count(o.verifyErrors)} tone={o.verifyErrors ? "warn" : "none"} />
              <Tile label="Error rate" value={o.errorRate == null ? dash : `${o.errorRate < 10 ? o.errorRate.toFixed(2) : Math.round(o.errorRate)}%`} tone={o.errorRate == null ? "none" : o.errorRate >= 5 ? "bad" : o.errorRate >= 1 ? "warn" : "ok"} />
              <Tile label="p95 response time" value={o.p95Ms == null ? dash : `${num(Math.round(o.p95Ms))} ms`} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold">Activity and code issuance</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Tile label="Scans, last 24 hours" value={count(o.scans24h)} />
              <Tile label="Issuance queue backlog" value={count(o.queueBacklog)} tone={o.queueBacklog ? "warn" : "none"} />
              <Tile label="Failed jobs" value={count(o.failedJobs)} tone={o.failedJobs ? "bad" : "none"} hint={o.failedJobs ? "Jobs that stopped with codes missing" : undefined} />
            </div>
          </section>
          <section>
            <h2 className="mb-3 text-sm font-semibold">Platform</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Tile label="TLS certificate" value={tls.value} hint={tls.hint} tone={tls.tone} />
              <Tile label="Last restore test" value={restore.value} hint={restore.hint} tone={restore.tone} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
