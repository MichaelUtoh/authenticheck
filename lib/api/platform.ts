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
  /** Other tenants registered with the same CAC number. */
  rc_duplicates?: { id: string; legal_name?: string; status?: string }[];
}

export const EVIDENCE_ITEMS: { key: string; label: string }[] = [
  { key: "cac_certificate", label: "CAC certificate" },
  { key: "brand_ownership", label: "Brand ownership" },
  { key: "nafdac_registrations", label: "NAFDAC registrations" },
  { key: "signatory", label: "Authorised signatory" },
  { key: "support_contact", label: "Support contact" },
];

export interface EvidenceState {
  checked: boolean;
  note?: string;
}

/** The checklist as `{ [key]: state }`, whether the API sends an array of items or an object keyed by item. */
export function toEvidence(raw: unknown): Record<string, EvidenceState> {
  const out: Record<string, EvidenceState> = {};
  const read = (key: string, v: unknown) => {
    if (typeof v === "boolean") out[key] = { checked: v };
    else if (v && typeof v === "object") {
      const o = v as { checked?: boolean; note?: string | null };
      out[key] = { checked: !!o.checked, note: o.note ?? undefined };
    }
  };
  if (Array.isArray(raw)) raw.forEach((i) => i && typeof i === "object" && "key" in i && read(String((i as { key: unknown }).key), i));
  else if (raw && typeof raw === "object") Object.entries(raw).forEach(([k, v]) => read(k, v));
  return out;
}

export interface PlatformTenantDetail extends PlatformTenant {
  evidence?: unknown;
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
  decide: (id: string, decision: TenantDecision, reason: string, extra: { rc_conflict_resolution?: string } = {}) =>
    apiFetch<unknown>(`/tenants/${id}/${decision}`, { method: "POST", body: JSON.stringify({ reason, ...extra }) }),
  get: (id: string) => apiFetch<PlatformTenantDetail>(`/platform/tenants/${id}`),
  /** Tick or untick a checklist item (audited). Returns the checklist. */
  setEvidence: (id: string, key: string, checked: boolean, note?: string) =>
    apiFetch<unknown>(`/platform/tenants/${id}/evidence/${key}`, { method: "PUT", body: JSON.stringify({ checked, ...(note ? { note } : {}) }) }),
  suspend: (id: string, reason: string) =>
    apiFetch<unknown>(`/tenants/${id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) }),
};
