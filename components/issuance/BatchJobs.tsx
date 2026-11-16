"use client";

import { useEffect, useRef, useState } from "react";
import { ErrorState } from "@/components/shared/EmptyState";
import { ApiError, apiDownload, errorMessage, fieldErrors } from "@/lib/api/client";
import { isRunning, issuanceApi, type IssuanceJob, type JobStatus } from "@/lib/api/issuance";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { fmtDateTime, num } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";

const card = "rounded-2xl border border-border bg-white p-5 sm:p-6";

const STATUS: Record<JobStatus, { label: string; cls: string }> = {
  pending: { label: "Queued", cls: "bg-black/5 text-foreground/80" },
  processing: { label: "Generating…", cls: "bg-black/5 text-foreground/80" },
  partial: { label: "Partial · resume available", cls: "bg-[#fbf0d6] text-[#8a5a00]" },
  done: { label: "Done", cls: "bg-primary-soft text-primary" },
  failed: { label: "Failed", cls: "bg-danger/10 text-danger" },
  cancelled: { label: "Cancelled", cls: "bg-black/5 text-muted" },
};

function issueError(e: unknown): string {
  if (e instanceof ApiError) {
    switch (e.error.code) {
      case "batch_not_active": return "This batch is recalled or expired, so codes can't be issued for it.";
      case "product_not_approved": return "The product isn't approved yet, so codes can't be issued.";
      case "over_issuance": return "That would issue more codes than the batch's declared quantity.";
    }
    const f = fieldErrors(e);
    if (f.quantity) return f.quantity;
  }
  return errorMessage(e, "We couldn't start code issuance. Please try again.");
}

/** Issuance jobs for one batch: start a job, watch it run, resume a partial one, download its codes. */
export function BatchJobs({ batchId, declared, requested, active, onChange }: {
  batchId: string;
  declared?: number;
  requested: number;
  active: boolean;
  onChange: () => void;
}) {
  const { canIssue } = useCatalogueRole();
  const req = useApi(() => issuanceApi.listJobs(batchId), [batchId]);
  const jobs = req.data ?? [];
  const running = jobs.some((j) => isRunning(j.status));

  // Poll while a job is running; the batch's counts refresh once it settles.
  const wasRunning = useRef(false);
  const { reload } = req;
  useEffect(() => {
    if (running) {
      const t = setInterval(reload, 3000);
      return () => clearInterval(t);
    }
    if (wasRunning.current) onChange();
  }, [running, reload, onChange]);
  useEffect(() => { wasRunning.current = running; }, [running]);

  const remaining = declared != null ? Math.max(declared - requested, 0) : undefined;
  const [qty, setQty] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // One key per submission attempt: a retry after a dropped connection can't create a second job.
  const key = useRef<string>(null);

  async function issue(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(qty || remaining);
    if (!Number.isInteger(n) || n < 1) return setError("Enter a whole number of codes, at least 1.");
    setBusy(true);
    setError(null);
    key.current ??= crypto.randomUUID();
    try {
      await issuanceApi.createJob(batchId, n, key.current);
      key.current = null;
      setQty("");
      req.reload();
      onChange();
    } catch (err) {
      setError(issueError(err));
      // A definite refusal means the next try is a new submission.
      if (err instanceof ApiError) key.current = null;
    } finally {
      setBusy(false);
    }
  }

  const [acting, setActing] = useState<string | null>(null);
  async function act(job: IssuanceJob, kind: "resume" | "download") {
    setActing(job.id);
    setError(null);
    try {
      if (kind === "resume") {
        await issuanceApi.resumeJob(job.id);
        req.reload();
      } else {
        await apiDownload(issuanceApi.exportPath(job.id), `codes-${job.id}.csv`);
      }
    } catch (err) {
      setError(err instanceof ApiError && err.error.code === "job_not_resumable" ? "This job can't be resumed." : errorMessage(err, kind === "resume" ? "We couldn't resume that job." : "We couldn't download the codes."));
      req.reload();
    } finally {
      setActing(null);
    }
  }

  return (
    <section className={card}>
      <h2 className="text-base font-semibold">Issuance jobs</h2>

      {canIssue && active && (
        <form onSubmit={issue} className="mt-4 flex flex-wrap items-end gap-3 rounded-xl bg-background p-4">
          <div>
            <label htmlFor="issue-qty" className="mb-1.5 block text-sm font-medium">Codes to issue</label>
            <input
              id="issue-qty"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
              placeholder={remaining != null ? String(remaining) : "e.g. 20000"}
              className="h-11 w-44 rounded-lg border border-border bg-white px-3.5 text-sm tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button type="submit" disabled={busy || running || remaining === 0} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
            {busy ? "Starting…" : "Issue codes"}
          </button>
          <p className="basis-full text-xs text-muted">
            {remaining === 0
              ? "The declared quantity has already been requested."
              : running
                ? "A job is running. You can start another when it finishes."
                : remaining != null
                  ? `Leave blank to issue the remaining ${num(remaining)}. Codes are generated in the background.`
                  : "Codes are generated in the background."}
          </p>
        </form>
      )}
      {!active && <p className="mt-3 text-sm text-muted">This batch is recalled or expired, so no more codes can be issued.</p>}
      {error && <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="mt-4">
        {req.error ? (
          <ErrorState message={errorMessage(req.error, "We couldn't load the jobs.")} onRetry={req.reload} />
        ) : !req.data ? (
          <p className="text-sm text-muted">Loading…</p>
        ) : jobs.length === 0 ? (
          <p className="text-sm text-muted">No jobs yet.</p>
        ) : (
          <ul className="divide-y divide-border/70">
            {jobs.map((j) => {
              const pct = j.requested ? Math.min(100, (j.generated / j.requested) * 100) : 0;
              const st = STATUS[j.status] ?? { label: j.status, cls: "bg-black/5" };
              return (
                <li key={j.id} className="py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      <span className="font-mono text-xs text-muted">{j.id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-muted">{j.startedAt ? `Started ${fmtDateTime(j.startedAt)} WAT` : ""}{j.startedBy ? ` by ${j.startedBy}` : ""}</p>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-black/5" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted">
                      <b className="text-foreground">{num(j.generated)}</b> of {num(j.requested)} generated
                      {j.failed > 0 && <span className="ml-3 text-danger">{num(j.failed)} failed</span>}
                    </p>
                    <div className="flex gap-2">
                      {canIssue && (j.status === "partial" || (j.status === "failed" && j.generated > 0)) && (
                        <button type="button" disabled={acting === j.id} onClick={() => act(j, "resume")} className="h-9 rounded-lg bg-foreground px-4 text-sm font-semibold text-white hover:bg-black disabled:opacity-60">
                          Resume {num(j.failed)} codes
                        </button>
                      )}
                      {j.status === "done" && (
                        <button type="button" disabled={acting === j.id} onClick={() => act(j, "download")} className="h-9 rounded-lg border border-border bg-white px-4 text-sm font-semibold hover:bg-background disabled:opacity-60">
                          Download codes (CSV)
                        </button>
                      )}
                    </div>
                  </div>
                  {j.status === "partial" && (
                    <p className="mt-2 text-xs text-muted">Resuming only creates the missing codes. It never duplicates ones already made.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
