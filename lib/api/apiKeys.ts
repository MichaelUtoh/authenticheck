import { apiFetch } from "./client";

// ENDPOINT_REFERENCE.md gives the paths and "raw key returned once"; the field names are assumed
// (BACKEND_API_REQUIREMENTS SET-*). `normalize` accepts a few likely spellings.
export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created_at?: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked: boolean;
}

export interface CreatedApiKey {
  key: ApiKey;
  /** The raw secret. Shown once; never stored. */
  secret: string;
}

function normalize(r: Record<string, unknown>): ApiKey {
  const s = (v: unknown) => (typeof v === "string" ? v : undefined);
  return {
    id: String(r.id),
    name: s(r.name) ?? "Unnamed key",
    prefix: s(r.prefix) ?? s(r.key_prefix) ?? "ac_…",
    created_at: s(r.created_at),
    last_used_at: s(r.last_used_at) ?? null,
    expires_at: s(r.expires_at) ?? null,
    revoked: r.revoked === true || r.is_active === false || !!r.revoked_at,
  };
}

export const apiKeysApi = {
  list: () =>
    apiFetch<Record<string, unknown>[] | { results: Record<string, unknown>[] }>("/api-keys").then((d) =>
      (Array.isArray(d) ? d : d.results ?? []).map(normalize)
    ),
  create: (body: { name: string; expires_at?: string }) =>
    apiFetch<Record<string, unknown>>("/api-keys", { method: "POST", body: JSON.stringify(body) }).then((r) => ({
      key: normalize(r),
      secret: String(r.key ?? r.raw_key ?? r.secret ?? r.token ?? ""),
    })),
  revoke: (id: string) => apiFetch<void>(`/api-keys/${id}`, { method: "DELETE" }),
};
