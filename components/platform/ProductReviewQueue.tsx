"use client";

import { useState } from "react";
import { ProductBadges } from "@/components/catalogue/ProductStatusBadge";
import { ReasonDialog } from "@/components/catalogue/ReasonDialog";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Pagination } from "@/components/shared/Pagination";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { platformApi } from "@/lib/api/catalogue";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/client";
import { fmtDateTime } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import type { Product, ProductStatus } from "@/lib/types";

type Row = Product & { tenant_name?: string; submitted_at?: string };
type Action = "approve" | "request-changes" | "reject" | "suspend" | "unsuspend" | "correct";

const PAGE_SIZE = 20; // server default; the queue is paginated oldest-first
const STATUSES: ProductStatus[] = ["in_review", "changes_requested", "rejected", "approved", "draft"];

export function ProductReviewQueue() {
  const [status, setStatus] = useState<ProductStatus>("in_review");
  const [page, setPage] = useState(1);
  const [active, setActive] = useState<{ row: Row; action: Action } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const queue = useApi(() => platformApi.productQueue({ status, page }), [status, page]);
  const rows = queue.data?.results ?? [];

  const done = (msg: string) => {
    setActive(null);
    setNotice(msg);
    queue.reload();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Product review</h1>
          <p className="mt-1 text-muted">Oldest submission first. Approving a product doesn&apos;t unlock pharmaceuticals, batches or code issuance.</p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          Status
          <select value={status} onChange={(e) => { setStatus(e.target.value as ProductStatus); setPage(1); }} className="h-11 rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none focus:border-primary">
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </label>
      </div>

      {notice && <p role="status" className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary">{notice}</p>}

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        {queue.error ? (
          <ErrorState message={errorMessage(queue.error, "We couldn't load the queue.")} onRetry={queue.reload} />
        ) : queue.loading && !queue.data ? (
          <LoadingSpinner />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing here" body="No products have this status." />
        ) : (
          <ul className="divide-y divide-border/70">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="font-medium">{r.name || "Untitled"} <span className="ml-1 font-mono text-xs text-muted">{r.sku}</span></p>
                  <p className="text-sm text-muted">
                    {[r.tenant_name, r.brand_name ?? r.brand, r.variant, r.size].filter(Boolean).join(" · ")}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {r.submitted_at ? `Submitted ${fmtDateTime(r.submitted_at)}` : `Updated ${fmtDateTime(r.updated_at)}`}
                    {r.pending_revision ? " · revision of an approved product" : ""}
                  </p>
                  <div className="mt-2"><ProductBadges product={r} /></div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {r.status === "in_review" && (
                    <>
                      <Button className="!h-9 !w-auto" onClick={() => setActive({ row: r, action: "approve" })}>Approve</Button>
                      <GhostButton className="!h-9" onClick={() => setActive({ row: r, action: "request-changes" })}>Request changes</GhostButton>
                      <GhostButton className="!h-9 !text-danger" onClick={() => setActive({ row: r, action: "reject" })}>Reject</GhostButton>
                    </>
                  )}
                  {r.approved_version != null && (
                    <>
                      <GhostButton className="!h-9" onClick={() => setActive({ row: r, action: "correct" })}>Correct SKU / GTIN</GhostButton>
                      <GhostButton className="!h-9" onClick={() => setActive({ row: r, action: r.public_suspended ? "unsuspend" : "suspend" })}>
                        {r.public_suspended ? "Restore verification" : "Suspend verification"}
                      </GhostButton>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        {queue.data && <Pagination page={page} pageSize={PAGE_SIZE} count={queue.data.count} onChange={setPage} />}
      </section>

      {active?.action === "approve" && <ApproveDialog row={active.row} onClose={() => setActive(null)} onDone={() => done(`${active.row.name} approved.`)} />}
      {active?.action === "request-changes" && (
        <ReasonDialog title="Request changes" label="Note for the manufacturer" body="The product goes back to the manufacturer with your note." action="Send back" onClose={() => setActive(null)}
          onSubmit={async (n) => { await platformApi.requestChanges(active.row.id, n); done("Sent back for changes."); }} />
      )}
      {active?.action === "reject" && (
        <ReasonDialog title="Reject product" label="Note for the manufacturer" body="Explain why. The manufacturer can edit and submit again." action="Reject" onClose={() => setActive(null)}
          onSubmit={async (n) => { await platformApi.reject(active.row.id, n); done("Product rejected."); }} />
      )}
      {active?.action === "suspend" && (
        <ReasonDialog title="Suspend public verification" body="Codes for this product show as not recognised until it's restored. Use this for safety or integrity concerns." action="Suspend" onClose={() => setActive(null)}
          onSubmit={async (n) => { await platformApi.suspend(active.row.id, n); done("Verification suspended."); }} />
      )}
      {active?.action === "unsuspend" && (
        <ReasonDialog title="Restore public verification" body="Consumers will see the last approved values again." action="Restore" onClose={() => setActive(null)}
          onSubmit={async (n) => { await platformApi.unsuspend(active.row.id, n); done("Verification restored."); }} />
      )}
      {active?.action === "correct" && <CorrectDialog row={active.row} onClose={() => setActive(null)} onDone={() => done("Correction applied and audited.")} />}
    </div>
  );
}

function ApproveDialog({ row, onClose, onDone }: { row: Row; onClose: () => void; onDone: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [resolution, setResolution] = useState("");
  const [busy, setBusy] = useState(false);

  async function go() {
    if (conflict && !resolution.trim()) return setError("Record how the GTIN conflict was resolved.");
    setBusy(true);
    setError(null);
    try {
      await platformApi.approve(row.id, conflict ? { gtin_conflict_resolution: resolution.trim() } : {});
      onDone();
    } catch (e) {
      if (e instanceof ApiError && e.error.code === "gtin_conflict") {
        setConflict(true);
        setError("This GTIN is registered against another product. Check it, then record the resolution to approve anyway.");
      } else {
        setError(e instanceof ApiError && e.error.code === "industry_locked" ? "Pharmaceuticals stay blocked until the release gate opens." : errorMessage(e));
      }
      setBusy(false);
    }
  }

  return (
    <Modal title={`Approve ${row.name || "product"}`} onClose={onClose}>
      <p className="text-sm text-muted">{row.pending_revision ? "The pending revision becomes the new live version." : "The product becomes publicly verifiable once it has batches with issued codes."}</p>
      <div className="mt-4 space-y-3">
        <FormError message={error} />
        {conflict && (
          <div>
            <label htmlFor="gtin-res" className="mb-1.5 block text-sm font-medium">GTIN conflict resolution</label>
            <textarea id="gtin-res" rows={3} value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Button className="!w-auto" loading={busy} onClick={go}>{conflict ? "Approve anyway" : "Approve"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function CorrectDialog({ row, onClose, onDone }: { row: Row; onClose: () => void; onDone: () => void }) {
  const [field, setField] = useState<"sku" | "gtin">(row.correction_request?.field ?? "sku");
  const [value, setValue] = useState(row.correction_request?.requested_value ?? "");
  const [reason, setReason] = useState(row.correction_request?.reason ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!value.trim() || !reason.trim()) return setError("Enter the new value and a reason.");
    setBusy(true);
    try {
      await platformApi.correct(row.id, { field, new_value: value.trim(), reason: reason.trim() });
      onDone();
    } catch (e) {
      setError(Object.values(fieldErrors(e))[0] || errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Modal title="Correct SKU / GTIN" onClose={onClose}>
      <p className="text-sm text-muted">Uniqueness is re-checked and the old and new values are written to the audit log.</p>
      <div className="mt-4 space-y-3">
        <FormError message={error} />
        <Select label="Field" value={field} onChange={(e) => setField(e.target.value as "sku" | "gtin")}>
          <option value="sku">SKU (now {row.sku})</option>
          <option value="gtin">GTIN (now {row.gtin ?? "none"})</option>
        </Select>
        <Field label="New value" className="font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
        <div>
          <label htmlFor="c-reason" className="mb-1.5 block text-sm font-medium">Reason</label>
          <textarea id="c-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Button className="!w-auto" loading={busy} onClick={go}>Apply correction</Button>
        </div>
      </div>
    </Modal>
  );
}
