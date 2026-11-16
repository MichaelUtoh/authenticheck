import { apiFetch, qs } from "./client";

export type JobStatus = "pending" | "processing" | "partial" | "done" | "failed" | "cancelled";

/** Raw job from `/issuance/jobs`. `quantity_issued` is the older name for `quantity_generated`. */
interface RawJob {
  id: string;
  status: JobStatus;
  batch_id?: string;
  batch_number?: string;
  product_name?: string;
  quantity_requested?: number;
  quantity_generated?: number;
  quantity_issued?: number;
  quantity_failed?: number;
  started_at?: string;
  created_at?: string;
  started_by?: { id?: string; name?: string } | null;
}

export interface IssuanceJob {
  id: string;
  status: JobStatus;
  batchId?: string;
  requested: number;
  generated: number;
  failed: number;
  startedAt?: string;
  startedBy?: string;
}

const toJob = (r: RawJob): IssuanceJob => ({
  id: r.id,
  status: r.status,
  batchId: r.batch_id,
  requested: r.quantity_requested ?? 0,
  generated: r.quantity_generated ?? r.quantity_issued ?? 0,
  failed: r.quantity_failed ?? 0,
  startedAt: r.started_at ?? r.created_at,
  startedBy: r.started_by?.name,
});

export const isRunning = (s: JobStatus) => s === "pending" || s === "processing";

export const issuanceApi = {
  async listJobs(batchId: string): Promise<IssuanceJob[]> {
    const r = await apiFetch<RawJob[] | { results: RawJob[] }>(`/issuance/jobs${qs({ batch_id: batchId })}`);
    return (Array.isArray(r) ? r : r.results).map(toJob);
  },
  /** `key` makes a retry of the same submission safe: the API returns the first job instead of making a second. */
  async createJob(batchId: string, quantity: number, key: string): Promise<IssuanceJob> {
    return toJob(
      await apiFetch<RawJob>("/issuance/jobs", {
        method: "POST",
        headers: { "Idempotency-Key": key },
        body: JSON.stringify({ batch_id: batchId, quantity }),
      })
    );
  },
  async resumeJob(id: string): Promise<IssuanceJob> {
    return toJob(await apiFetch<RawJob>(`/issuance/jobs/${id}/resume`, { method: "POST", headers: { "Idempotency-Key": crypto.randomUUID() } }));
  },
  exportPath: (id: string) => `/issuance/jobs/${id}/export`,
};
