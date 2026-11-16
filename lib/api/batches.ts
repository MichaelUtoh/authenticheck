import { apiFetch, qs } from "./client";
import type { PaginatedResponse } from "@/lib/types";

export type BatchStatus = "active" | "recalled" | "expired";
export type Attention = "partial" | "unreconciled" | "expiring" | "approval";

/** Raw row from `GET /catalogue/batches[/{id}]`. Date and quantity names vary between the docs, so several are read. */
interface RawBatch {
  id: string;
  batch_number: string;
  product_id?: string;
  product_name?: string;
  manufacture_date?: string | null;
  expiry?: string | null;
  expires_at?: string | null;
  best_before?: string | null;
  declared_quantity?: number | null;
  quantity?: number | null;
  pack_format?: string | null;
  status?: string;
  issuance?: { requested?: number; generated?: number; failed?: number; deactivated?: number };
  reconciled?: boolean;
  attention?: string[];
  created_at?: string;
}

export interface BatchItem {
  id: string;
  batchNumber: string;
  productId?: string;
  product: string;
  manufactured?: string;
  bestBefore?: string;
  declared?: number;
  requested: number;
  generated: number;
  failed: number;
  deactivated: number;
  packFormat?: string;
  status: BatchStatus;
  attention: Attention[];
}

const SERVER_ATTENTION: Record<string, Attention> = {
  partial_job: "partial",
  unreconciled: "unreconciled",
  expiring_soon: "expiring",
  approval_pending: "approval",
};
const DAY = 86_400_000;

function toItem(r: RawBatch): BatchItem {
  const bestBefore = r.expiry ?? r.expires_at ?? r.best_before ?? undefined;
  const status: BatchStatus = r.status === "recalled" || r.status === "expired" ? r.status : "active";
  const failed = r.issuance?.failed ?? 0;
  // Prefer the server's markers; otherwise derive what the counts and dates allow. "Unreconciled" and
  // "approval pending" can't be derived (see BCH-12).
  let attention: Attention[];
  if (r.attention) attention = r.attention.map((a) => SERVER_ATTENTION[a]).filter(Boolean);
  else {
    attention = [];
    if (failed > 0) attention.push("partial");
    const left = bestBefore ? new Date(bestBefore).getTime() - Date.now() : Infinity;
    if (status === "active" && left >= 0 && left <= 60 * DAY) attention.push("expiring");
  }
  return {
    id: r.id,
    batchNumber: r.batch_number,
    productId: r.product_id,
    product: r.product_name ?? "—",
    manufactured: r.manufacture_date ?? undefined,
    bestBefore,
    declared: r.declared_quantity ?? r.quantity ?? undefined,
    requested: r.issuance?.requested ?? 0,
    generated: r.issuance?.generated ?? 0,
    failed,
    deactivated: r.issuance?.deactivated ?? 0,
    packFormat: r.pack_format ?? undefined,
    status,
    attention,
  };
}

export interface BatchListParams {
  q?: string;
  status?: BatchStatus;
  product_id?: string;
  page?: number;
  page_size?: number;
}

export const batchesApi = {
  list: (params: BatchListParams = {}) =>
    apiFetch<PaginatedResponse<RawBatch> | RawBatch[]>(`/catalogue/batches${qs({ ...params })}`).then((r) => {
      const results = Array.isArray(r) ? r : r.results;
      return { count: Array.isArray(r) ? r.length : r.count, results: results.map(toItem) };
    }),
  get: (id: string) => apiFetch<RawBatch>(`/catalogue/batches/${id}`).then(toItem),
};
