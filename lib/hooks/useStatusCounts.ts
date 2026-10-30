"use client";

import { catalogueApi } from "@/lib/api/catalogue";
import type { ProductStatus } from "@/lib/types";
import { useApi } from "./useApi";

/** Counts for the KPI row. Uses `status_counts` when the API sends it, else one cheap call per status. */
export function useStatusCounts() {
  return useApi(async () => {
    const first = await catalogueApi.listProducts({ page_size: 1, is_active: true });
    if (first.status_counts) return { total: first.count, counts: first.status_counts };
    const wanted: ProductStatus[] = ["draft", "in_review", "changes_requested"];
    const rest = await Promise.all(wanted.map((status) => catalogueApi.listProducts({ status: [status], page_size: 1, is_active: true })));
    return { total: first.count, counts: Object.fromEntries(wanted.map((s, i) => [s, rest[i].count])) as Partial<Record<ProductStatus, number>> };
  }, []);
}
