import { apiFetch, qs } from "./client";

// Not spelled out in ENDPOINT_REFERENCE.md; confirmed against a live response.
export interface CodeInventory {
  total_issued: number;
  active: number;
  deactivated: number;
}

export interface BatchCounts {
  total: number;
  active: number;
}

/** `count` from a one-row page is the cheapest way to read a filtered total. */
const countBatches = (status?: string) =>
  apiFetch<{ count: number }>(`/catalogue/batches${qs({ status, page_size: 1 })}`).then((r) => r.count);

export const batchStatsApi = {
  codeInventory: () => apiFetch<CodeInventory>("/analytics/codes"),
  batchCounts: async (): Promise<BatchCounts> => {
    const [total, active] = await Promise.all([countBatches(), countBatches("active")]);
    return { total, active };
  },
};
