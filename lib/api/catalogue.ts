import { apiFetch, qs } from "./client";
import type {
  Batch,
  Brand,
  ConsumerVisibility,
  Industry,
  PaginatedResponse,
  Product,
  ProductFields,
  ProductStatus,
  RegulatoryRef,
  SupportContact,
} from "@/lib/types";

// ---- shapes -------------------------------------------------------------
// Where ENDPOINT_REFERENCE.md doesn't spell out a response, the shape below is
// an assumption. Each one is listed in docs/BACKEND_API_REQUIREMENTS.md.

export interface ProductListParams {
  q?: string;
  status?: ProductStatus[];
  brand_id?: string;
  industry?: Industry;
  is_active?: boolean;
  ordering?: "-updated_at" | "name" | "-name" | "sku" | "-sku" | "-created_at";
  page?: number;
  page_size?: number;
}

export type ProductList = PaginatedResponse<Product> & { status_counts?: Partial<Record<ProductStatus, number>> };

export interface RegulatoryRefWrite {
  authority: string;
  country_code: string;
  reference_number: string;
  source?: string;
}

/** Issuing country of each authority; the API requires `country_code` alongside the number. */
export const AUTHORITY_COUNTRY: Record<string, string> = { NAFDAC: "NG" };

export function regulatoryRefBody(authority: string, number: string): RegulatoryRefWrite {
  return {
    authority,
    country_code: AUTHORITY_COUNTRY[authority] ?? "NG",
    reference_number: number.trim(),
    source: "entered_by_manufacturer",
  };
}

export interface ProductWrite extends Partial<Omit<ProductFields, "consumer_visibility">> {
  consumer_visibility?: ConsumerVisibility;
  regulatory_reference?: RegulatoryRefWrite | null;
  confirm_not_duplicate?: boolean;
}

export interface IndustryCategory {
  key: string;
  label: string;
  allowed_units?: string[];
}

export interface IndustryInfo {
  key: Industry;
  label: string;
  description?: string;
  available: boolean;
  required_fields?: string[];
  categories?: IndustryCategory[];
}

export interface ActivityEvent {
  id?: string;
  at: string;
  actor?: { id?: string; name?: string } | string | null;
  action: string;
  changes?: { field: string; from: unknown; to: unknown }[];
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  note?: string | null;
}

export interface UploadedImage {
  id: string;
  url: string;
  width?: number;
  height?: number;
}

export interface ReleaseGateItem {
  key: string;
  label: string;
  state: "not_started" | "in_progress" | "done";
}
export type ReleaseGates = Partial<Record<Industry, { status: "live" | "locked"; items?: ReleaseGateItem[] }>>;

/** Accepts a bare array or a DRF-style `{ results }` envelope. */
export function asList<T>(data: T[] | { results: T[] } | undefined | null): T[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.results ?? [];
}

const P = "/catalogue/products";

export const catalogueApi = {
  // products
  listProducts: (params: ProductListParams = {}) => apiFetch<ProductList>(`${P}${qs({ ...params })}`),
  getProduct: (id: string) => apiFetch<Product>(`${P}/${id}`),
  createProduct: (body: ProductWrite) => apiFetch<Product>(P, { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: string, body: ProductWrite & { is_active?: boolean }) =>
    apiFetch<Product>(`${P}/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  submitProduct: (id: string) => apiFetch<Product>(`${P}/${id}/submit`, { method: "POST" }),
  withdrawProduct: (id: string, reason: string) =>
    apiFetch<Product>(`${P}/${id}/withdraw`, { method: "POST", body: JSON.stringify({ reason }) }),
  requestCorrection: (id: string, body: { field: "sku" | "gtin"; requested_value: string; reason: string }) =>
    apiFetch<unknown>(`${P}/${id}/correction-request`, { method: "POST", body: JSON.stringify(body) }),
  activity: (id: string) => apiFetch<ActivityEvent[] | { results: ActivityEvent[] }>(`${P}/${id}/activity`),
  consumerPreview: (id: string) => apiFetch<Record<string, unknown>>(`${P}/${id}/consumer-preview`),
  industries: () => apiFetch<IndustryInfo[] | { results: IndustryInfo[] }>("/catalogue/industries"),

  // images
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return apiFetch<UploadedImage>("/catalogue/images", { method: "POST", body: form });
  },
  deleteImage: (id: string) => apiFetch<void>(`/catalogue/images/${id}`, { method: "DELETE" }),

  // regulatory references
  listRefs: (productId: string) =>
    apiFetch<RegulatoryRef[] | { results: RegulatoryRef[] }>(`${P}/${productId}/regulatory-refs`),
  addRef: (productId: string, body: RegulatoryRefWrite) =>
    apiFetch<RegulatoryRef>(`${P}/${productId}/regulatory-refs`, { method: "POST", body: JSON.stringify(body) }),

  // batches (read-only here; the Batches & codes tab owns writes)
  listBatches: (productId: string) =>
    apiFetch<ProductBatch[] | { results: ProductBatch[] }>(`${P}/${productId}/batches`),

  // brands
  listBrands: () => apiFetch<Brand[] | { results: Brand[] }>("/catalogue/brands"),
  createBrand: (name: string) =>
    apiFetch<Brand>("/catalogue/brands", { method: "POST", body: JSON.stringify({ name }) }),
};

export type ProductBatch = Batch & { manufacture_date?: string | null; expiry?: string | null };

// ENDPOINT_REFERENCE.md names the contact fields `support_email`, `support_phone`, `support_url`;
// the product form's override uses `{ email, phone, url }`. Read either, write the documented names.
type RawContact = Record<string, string | null | undefined>;
const toContact = (r: RawContact): SupportContact => ({
  email: r.support_email ?? r.email ?? null,
  phone: r.support_phone ?? r.phone ?? null,
  url: r.support_url ?? r.url ?? null,
});

export const tenantApi = {
  supportContact: () => apiFetch<RawContact>("/tenants/me/support-contact").then(toContact),
  updateSupportContact: (body: SupportContact) =>
    apiFetch<RawContact>("/tenants/me/support-contact", {
      method: "PATCH",
      body: JSON.stringify({ support_email: body.email, support_phone: body.phone, support_url: body.url }),
    }).then(toContact),
  releaseGates: () => apiFetch<ReleaseGates>("/tenants/me/release-gates"),
};

export const platformApi = {
  productQueue: (params: { status?: ProductStatus; tenant_id?: string; page?: number } = {}) =>
    apiFetch<PaginatedResponse<Product & { tenant_name?: string; submitted_at?: string }>>(
      `/platform/products${qs({ ...params })}`
    ),
  approve: (id: string, body: { gtin_conflict_resolution?: string } = {}) =>
    apiFetch<Product>(`/platform/products/${id}/approve`, { method: "POST", body: JSON.stringify(body) }),
  requestChanges: (id: string, review_note: string) =>
    apiFetch<Product>(`/platform/products/${id}/request-changes`, { method: "POST", body: JSON.stringify({ review_note }) }),
  reject: (id: string, review_note: string) =>
    apiFetch<Product>(`/platform/products/${id}/reject`, { method: "POST", body: JSON.stringify({ review_note }) }),
  suspend: (id: string, reason: string) =>
    apiFetch<Product>(`/platform/products/${id}/suspend`, { method: "POST", body: JSON.stringify({ reason }) }),
  unsuspend: (id: string, reason: string) =>
    apiFetch<Product>(`/platform/products/${id}/unsuspend`, { method: "POST", body: JSON.stringify({ reason }) }),
  correct: (id: string, body: { field: "sku" | "gtin"; new_value: string; reason: string }) =>
    apiFetch<Product>(`/platform/products/${id}/correct`, { method: "POST", body: JSON.stringify(body) }),
  verifyRef: (productId: string, refId: string, body: { method: string; note?: string }) =>
    apiFetch<RegulatoryRef>(`/platform/products/${productId}/regulatory-refs/${refId}/verify`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
};
