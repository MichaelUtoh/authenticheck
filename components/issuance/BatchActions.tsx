"use client";

import { useState } from "react";
import { Button, FormError } from "@/components/ui/Button";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { batchesApi, type BatchItem } from "@/lib/api/batches";
import { ApiError, errorMessage } from "@/lib/api/client";
import { issuanceApi, type CodeRow } from "@/lib/api/issuance";
import { num } from "@/lib/format";

const textarea = "w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/** A destructive action: a reason is required, and the batch number must be typed when `confirmText` is set. */
function DangerDialog({ title, body, action, confirmText, onClose, onSubmit }: {
  title: string;
  body: React.ReactNode;
  action: string;
  confirmText?: string;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [typed, setTyped] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function go() {
    if (!reason.trim()) return setError("A reason is required. It's recorded in the audit log.");
    if (confirmText && typed.trim() !== confirmText) return setError(`Type ${confirmText} to confirm.`);
    setBusy(true);
    setError(null);
    try {
      await onSubmit(reason.trim());
    } catch (e) {
      setError(e instanceof ApiError && e.status === 403 ? "You don't have permission to do this. Ask an owner or admin." : errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="text-sm text-muted">{body}</div>
      <div className="mt-4 space-y-3">
        <FormError message={error} />
        <div>
          <label htmlFor="danger-reason" className="mb-1.5 block text-sm font-medium">Reason <span className="text-danger">*</span></label>
          <textarea id="danger-reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Roll 14 jammed on line 2" className={textarea} />
        </div>
        {confirmText && (
          <div>
            <label htmlFor="danger-confirm" className="mb-1.5 block text-sm font-medium">Type <span className="font-mono">{confirmText}</span> to confirm</label>
            <input id="danger-confirm" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" className="h-11 w-full rounded-lg border border-border px-3.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Button className="!w-auto !bg-danger hover:!opacity-90" loading={busy} onClick={go}>{action}</Button>
        </div>
      </div>
    </Modal>
  );
}

type Active = { kind: "batch" } | { kind: "recall" } | { kind: "code"; code: string } | null;

/** Owner and admin actions on a batch: deactivate one code or all of them, or recall the batch. */
export function BatchActions({ batch, onChange }: { batch: BatchItem; onChange: () => void }) {
  const [active, setActive] = useState<Active>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [found, setFound] = useState<CodeRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const canRecall = batch.status === "active" && !!batch.productId;
  const remaining = Math.max(batch.generated - batch.deactivated, 0);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setSearching(true);
    setSearchError(null);
    try {
      setFound(await issuanceApi.searchCodes(batch.id, q.trim()));
    } catch (err) {
      setSearchError(errorMessage(err, "We couldn't search codes."));
    } finally {
      setSearching(false);
    }
  }

  const done = (msg: string) => {
    setActive(null);
    setNotice(msg);
    setFound(null);
    setQ("");
    onChange();
  };

  return (
    <section className="rounded-2xl border border-danger/30 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold">Deactivate codes or recall</h2>
      <p className="mt-0.5 text-sm text-muted">
        Deactivated codes are never reused. Consumers who check one will see that it is no longer active. These actions take effect straight away and are recorded in the audit log.
      </p>
      {notice && <p role="status" className="mt-3 rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">{notice}</p>}

      <div className="mt-5">
        <h3 className="text-sm font-semibold">One code</h3>
        <form onSubmit={search} className="mt-2 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a code, e.g. 7KQ2-M9XW" aria-label="Find a code in this batch" className="h-11 w-full max-w-xs rounded-lg border border-border px-3.5 font-mono text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          <GhostButton type="submit" disabled={searching || !q.trim()}>{searching ? "Searching…" : "Search"}</GhostButton>
        </form>
        {searchError && <p role="alert" className="mt-2 text-sm text-danger">{searchError}</p>}
        {found && (
          found.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No code in this batch matches that.</p>
          ) : (
            <ul className="mt-2 divide-y divide-border/70 rounded-xl border border-border">
              {found.map((c) => (
                <li key={c.code} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-sm">
                  <span><span className="font-mono">{c.code}</span> <span className="ml-2 text-xs capitalize text-muted">{c.status}</span></span>
                  {c.status === "deactivated" ? (
                    <span className="text-xs text-muted">Already deactivated</span>
                  ) : (
                    <button type="button" onClick={() => setActive({ kind: "code", code: c.code })} className="font-semibold text-danger hover:underline">Deactivate</button>
                  )}
                </li>
              ))}
            </ul>
          )
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border/70 pt-5">
        <GhostButton className="!text-danger" disabled={remaining === 0} onClick={() => setActive({ kind: "batch" })}>
          Deactivate all active codes{remaining > 0 ? ` (${num(remaining)})` : ""}
        </GhostButton>
        <GhostButton className="!text-danger" disabled={!canRecall} onClick={() => setActive({ kind: "recall" })}>Recall batch</GhostButton>
      </div>
      {batch.status === "recalled" && <p className="mt-2 text-xs text-muted">This batch has been recalled.</p>}

      {active?.kind === "code" && (
        <DangerDialog title="Deactivate this code" action="Deactivate code" onClose={() => setActive(null)}
          body={<>Code <span className="font-mono text-foreground">{active.code}</span> stops working. It can&apos;t be switched back on.</>}
          onSubmit={async (r) => { await issuanceApi.deactivateCode(active.code, r); done(`Code ${active.code} deactivated.`); }} />
      )}
      {active?.kind === "batch" && (
        <DangerDialog title="Deactivate all active codes" action="Deactivate all" confirmText={batch.batchNumber} onClose={() => setActive(null)}
          body={<>Every active code in <span className="font-mono text-foreground">{batch.batchNumber}</span> stops working, including codes already on packs in shops. This can&apos;t be undone. For a safety recall, use Recall batch instead.</>}
          onSubmit={async (r) => { await issuanceApi.deactivateBatch(batch.id, r); done("All active codes in this batch were deactivated."); }} />
      )}
      {active?.kind === "recall" && (
        <DangerDialog title="Recall this batch" action="Recall batch" confirmText={batch.batchNumber} onClose={() => setActive(null)}
          body={<>Recalling <span className="font-mono text-foreground">{batch.batchNumber}</span> marks the batch as recalled and deactivates all of its codes. No more codes can be issued for it. This can&apos;t be undone from here.</>}
          onSubmit={async (r) => { await batchesApi.recall(batch.productId!, batch.id, r); done("Batch recalled. All its codes are deactivated."); }} />
      )}
    </section>
  );
}
