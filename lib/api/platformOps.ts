import { apiFetch } from "./client";

// `GET /platform/ops` and `GET /platform/staff` are described in prose in ENDPOINT_REFERENCE.md, without field
// names. Values are read under several likely spellings; anything missing shows as "—" (see PLT-13).

type Dict = Record<string, unknown>;

/** First value found at any of the dotted paths (`verify.p95_ms`) or flat names (`verify_p95_ms`). */
function pick(o: Dict, ...paths: string[]): unknown {
  for (const path of paths) {
    let v: unknown = o;
    for (const k of path.split(".")) v = v && typeof v === "object" ? (v as Dict)[k] : undefined;
    if (v !== undefined && v !== null) return v;
  }
  return undefined;
}
const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined);
const s = (v: unknown) => (typeof v === "string" && v ? v : undefined);

export interface OpsHealth {
  verifyRequests?: number;
  verifyErrors?: number;
  /** Percent, 0 to 100. */
  errorRate?: number;
  p95Ms?: number;
  scans24h?: number;
  queueBacklog?: number;
  failedJobs?: number;
  tlsExpiresAt?: string;
  lastRestoreTestAt?: string;
  /** Whole days, worked out when the snapshot was fetched. Negative once expired. */
  tlsDaysLeft?: number;
  restoreDaysAgo?: number;
}

const DAY = 86_400_000;
const days = (iso?: string, from = false) => {
  const t = iso ? new Date(iso).getTime() : NaN;
  return Number.isNaN(t) ? undefined : Math.floor((from ? Date.now() - t : t - Date.now()) / DAY);
};

export function toOps(raw: Dict): OpsHealth {
  const requests = n(pick(raw, "verify.requests", "verify_requests", "verify.total", "verify_total", "verify.count"));
  const errors = n(pick(raw, "verify.errors", "verify_errors", "verify.error_count"));
  const rate = n(pick(raw, "verify.error_rate", "verify_error_rate", "error_rate"));
  const tlsExpiresAt = s(pick(raw, "tls.expires_at", "tls_cert_expires_at", "tls_expires_at", "tls_certificate_expires_at", "tls.cert_expires_at"));
  const lastRestoreTestAt = s(pick(raw, "last_restore_test_at", "restore_test.last_at", "restore.last_test_at", "last_restore_test"));
  return {
    tlsDaysLeft: days(tlsExpiresAt),
    restoreDaysAgo: days(lastRestoreTestAt, true),
    verifyRequests: requests,
    verifyErrors: errors,
    // Work the rate out from the counts when they are there; otherwise treat a value up to 1 as a fraction.
    errorRate: requests && errors != null ? (errors / requests) * 100 : rate != null ? (rate <= 1 ? rate * 100 : rate) : undefined,
    p95Ms: n(pick(raw, "verify.p95_ms", "verify_p95_ms", "verify.p95", "p95_ms", "p95")),
    scans24h: n(pick(raw, "scans_24h", "scans.last_24h", "scans_last_24h", "scans.24h", "scans")),
    queueBacklog: n(pick(raw, "issuance.queue_backlog", "issuance_queue_backlog", "queue_backlog", "issuance.backlog", "backlog")),
    failedJobs: n(pick(raw, "issuance.failed_jobs", "issuance_failed_jobs", "failed_jobs")),
    tlsExpiresAt,
    lastRestoreTestAt,
  };
}

export interface StaffUser {
  id: string;
  name: string;
  email?: string;
  mfaEnabled: boolean;
  isYou: boolean;
}

interface RawStaff { id: string; full_name?: string; name?: string; email?: string; mfa_enabled?: boolean; is_you?: boolean }

export const platformOpsApi = {
  get: () => apiFetch<Dict>("/platform/ops").then(toOps),
};

export const platformStaffApi = {
  list: () =>
    apiFetch<RawStaff[] | { results: RawStaff[] }>("/platform/staff").then((r) =>
      (Array.isArray(r) ? r : r.results).map((u): StaffUser => ({ id: u.id, name: u.full_name ?? u.name ?? u.email ?? "Unnamed", email: u.email, mfaEnabled: !!u.mfa_enabled, isYou: !!u.is_you }))
    ),
  /** Removes the person's authenticators and signs them out. Not allowed on yourself. */
  resetMfa: (id: string, reason: string) =>
    apiFetch<unknown>(`/platform/staff/${id}/reset-mfa`, { method: "POST", body: JSON.stringify({ reason }) }),
};
