"use client";

import Link from "next/link";
import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Pagination } from "@/components/shared/Pagination";
import { Button, FormError } from "@/components/ui/Button";
import { errorMessage } from "@/lib/api/client";
import { platformTenantsApi, tenantDisplayName, type PlatformTenant, type TenantDecision } from "@/lib/api/platform";
import { fmtDate } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import type { TenantStatus } from "@/lib/types";

const PAGE_SIZE = 20;

type Filter = "waiting" | TenantStatus;
const FILTERS: { value: Filter; label: string }[] = [
  { value: "waiting", label: "Waiting for a decision" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "suspended", label: "Suspended" },
];

const STATUS_STYLE: Record<TenantStatus, { label: string; cls: string }> = {
  pending: { label: "Ready for review", cls: "bg-primary-soft text-primary" },
  info_requested: { label: "Info requested", cls: "bg-caution-soft text-caution" },
  approved: { label: "Approved", cls: "bg-primary-soft text-primary" },
  rejected: { label: "Rejected", cls: "bg-danger-soft text-danger" },
  suspended: { label: "Suspended", cls: "bg-danger-soft text-danger" },
};

const DECISIONS: { value: TenantDecision; label: string; done: string; verb: string }[] = [
  { value: "approve", label: "Approve", done: "approved", verb: "Approve" },
  { value: "request-info", label: "Request more information", done: "sent back for more information", verb: "Request information" },
  { value: "reject", label: "Reject", done: "rejected", verb: "Reject" },
];

export function TenantApplications() {
  const [filter, setFilter] = useState<Filter>("waiting");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const list = useApi(
    () => platformTenantsApi.list({ status: filter === "waiting" ? ["pending", "info_requested"] : filter, page }),
    [filter, page]
  );
  const rows = list.data?.results ?? [];
  const selected = rows.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">Tenant applications</h1>
        <label className="flex items-center gap-2 text-sm text-muted">
          Show
          <select value={filter} onChange={(e) => { setFilter(e.target.value as Filter); setPage(1); setSelectedId(null); }} className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
            {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </label>
      </div>

      {notice && <p role="status" className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary">{notice}</p>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold">{FILTERS.find((f) => f.value === filter)?.label}</h2>
          {list.error ? (
            <div className="mt-4"><ErrorState message={errorMessage(list.error, "We couldn't load applications.")} onRetry={list.reload} /></div>
          ) : list.loading && !list.data ? (
            <LoadingSpinner />
          ) : rows.length === 0 ? (
            <EmptyState title="Nothing here" body="No applications match this view." />
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-muted">
                  <tr><th className="pb-3 font-medium">Company</th><th className="pb-3 font-medium">Industry</th><th className="pb-3 font-medium">Status</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const st = STATUS_STYLE[r.status] ?? STATUS_STYLE.pending;
                    const when = r.submitted_at ?? r.created_at;
                    return (
                      <tr key={r.id} className={`border-t border-border/70 ${r.id === selectedId ? "bg-primary-soft/50" : ""}`}>
                        <td className="py-3 pr-4">
                          <button type="button" onClick={() => { setSelectedId(r.id); setNotice(null); }} className="text-left font-medium text-primary underline-offset-2 hover:underline">
                            {tenantDisplayName(r)}
                          </button>
                          {when && <div className="text-xs text-muted">Submitted {fmtDate(when)}</div>}
                        </td>
                        <td className="py-3 pr-4 capitalize">{r.industry ?? "—"}</td>
                        <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${st.cls}`}>{st.label}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {list.data && <Pagination page={page} pageSize={PAGE_SIZE} count={list.data.count} onChange={setPage} />}
          <p className="mt-4 text-xs text-muted">
            Looking for products instead? <Link href="/platform/products" className="font-medium text-primary hover:underline">Open the product review queue</Link>.
          </p>
        </section>

        {selected ? (
          <ReviewPanel
            key={selected.id}
            tenant={selected}
            onDone={(msg) => { setNotice(msg); setSelectedId(null); list.reload(); }}
          />
        ) : (
          <aside className="rounded-2xl border border-dashed border-border bg-white/60 p-6 text-sm text-muted">
            Select an application to review it.
          </aside>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1 text-sm">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right">{value || "—"}</dd>
    </div>
  );
}

function ReviewPanel({ tenant, onDone }: { tenant: PlatformTenant; onDone: (msg: string) => void }) {
  const [decision, setDecision] = useState<TenantDecision>("approve");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const name = tenantDisplayName(tenant);
  const decidable = tenant.status === "pending" || tenant.status === "info_requested";
  const brands = (tenant.brands ?? []).map((b) => (typeof b === "string" ? b : b.name)).join(", ");

  async function submit() {
    if (!reason.trim()) return setError("A reason is required. It's recorded in the audit log.");
    setBusy(true);
    setError(null);
    try {
      await platformTenantsApi.decide(tenant.id, decision, reason.trim());
      onDone(`${name} ${DECISIONS.find((d) => d.value === decision)?.done}.`);
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <aside className="rounded-2xl border-2 border-primary bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Reviewing</p>
      <h2 className="mt-1 text-2xl font-semibold">{name}</h2>
      <p className="text-sm text-muted">
        {[tenant.industry, tenant.legal_name && tenant.legal_name !== name ? `legal name “${tenant.legal_name}”` : null, tenant.city].filter(Boolean).join(" · ")}
      </p>

      <dl className="mt-4 divide-y divide-border/60">
        <Row label="CAC RC number" value={tenant.rc_number} />
        <Row label="Owner contact" value={tenant.owner_email ?? tenant.owner_name} />
        <Row label="Brands" value={brands} />
      </dl>

      {decidable ? (
        <div className="mt-5 space-y-3">
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">Decision</legend>
            <div className="space-y-2">
              {DECISIONS.map((d) => (
                <label key={d.value} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm ${decision === d.value ? "border-primary bg-primary-soft/60" : "border-border"}`}>
                  <input type="radio" name="decision" value={d.value} checked={decision === d.value} onChange={() => setDecision(d.value)} className="accent-[var(--primary)]" />
                  {d.label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="decision-reason" className="mb-1.5 block text-sm font-semibold">Reason <span className="text-danger">*</span></label>
            <textarea id="decision-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Shown in the audit log and to the applicant" className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
          <FormError message={error} />
          <Button loading={busy} onClick={submit}>Record decision</Button>
          <p className="text-xs text-muted">Approving a pharmaceutical company doesn&apos;t unlock live medicine checks. The pharmaceutical release gate stays locked until every prerequisite is met.</p>
        </div>
      ) : (
        <p className="mt-5 rounded-lg bg-black/5 px-3.5 py-2.5 text-sm text-muted">This application is {tenant.status}. No decision is pending.</p>
      )}
    </aside>
  );
}
