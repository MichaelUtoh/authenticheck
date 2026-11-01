import { apiFetch, qs } from "./client";

// Not spelled out in ENDPOINT_REFERENCE.md; confirmed against a live response (`days=30`).
export interface ScanAnalytics {
  period_days: number;
  total_scans: number;
  /** Result name -> count. Only `genuine` has been seen so far; other keys are unconfirmed. */
  by_result: Record<string, number>;
  /** One entry per day for the whole period, zero days included, oldest first. */
  by_day: { date: string; count: number }[];
}

export const analyticsApi = {
  /** `days` is 1-365 (default 30). */
  scans: (days = 30) => apiFetch<ScanAnalytics>(`/analytics/scans${qs({ days })}`),
};
