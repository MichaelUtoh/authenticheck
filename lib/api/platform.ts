import { apiFetch, qs } from "./client";
import type { TenantStatus } from "@/lib/types";

// `GET /platform/tenants` rows and the decision bodies are not spelled out in ENDPOINT_REFERENCE.md.
// Every field except `id` and `status` is optional and read defensively; see PLT-9 and PLT-10 in
// docs/BACKEND_API_REQUIREMENTS.md.
export interface PlatformTenant {
  id: string;
  status: TenantStatus;
  legal_name?: string;
  trading_name?: string;
  /** Some serializers expose a single display name. */
  name?: string;
  industry?: string;
  rc_number?: string;
  owner_email?: string;
  owner_name?: string;
  city?: string;
  brands?: ({ name: string } | string)[];
  created_at?: string;
  submitted_at?: string;
}

export interface Paginated<T> {
  count: number;
  results: T[];
}

export const tenantDisplayName = (t: PlatformTenant) => t.trading_name || t.legal_name || t.name || "Unnamed company";

export type TenantDecision = "approve" | "request-info" | "reject";

export const platformTenantsApi = {
  list: (params: { status?: TenantStatus | TenantStatus[]; page?: number } = {}) =>
    apiFetch<Paginated<PlatformTenant> | PlatformTenant[]>(`/platform/tenants${qs({ ...params })}`).then((r) =>
      Array.isArray(r) ? { count: r.length, results: r } : r
    ),
  /** `reason` is audited and, for rejections and info requests, shown to the applicant. */
  decide: (id: string, decision: TenantDecision, reason: string) =>
    apiFetch<unknown>(`/tenants/${id}/${decision}`, { method: "POST", body: JSON.stringify({ reason }) }),
  suspend: (id: string, reason: string) =>
    apiFetch<unknown>(`/tenants/${id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) }),
};
