// TypeScript types — generated from API_CONTRACTS.md

export type TenantStatus = "pending" | "info_requested" | "approved" | "rejected" | "suspended";
export type CodeStatus = "active" | "deactivated" | "recalled";
export type JobStatus = "pending" | "processing" | "done" | "failed";
export type FlagSeverity = "low" | "medium" | "high" | "critical";
export type CaseStatus = "open" | "investigating" | "resolved" | "closed";
export type VerifyResult = "genuine" | "recalled" | "deactivated" | "not_found";

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Brand {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export type ProductStatus = "draft" | "in_review" | "approved" | "changes_requested" | "rejected";
export type Industry = "cosmetics" | "pharmaceuticals";
export type SizeUnit = "ml" | "L" | "g" | "kg" | "mg" | "units";
export type RefVerification = "unverified" | "verified";

export interface ConsumerVisibility {
  brand: boolean;
  variant_size: boolean;
  batch_number: boolean;
  manufacture_date: boolean;
  expiry: boolean;
  regulatory_reference: boolean;
  product_image: boolean;
  support_contact: boolean;
}

export interface SupportContact {
  email?: string | null;
  phone?: string | null;
  url?: string | null;
}

export interface RegulatoryRef {
  id: string;
  authority: string;
  /** Legacy name; the API now reads and writes `reference_number`. */
  number?: string;
  reference_number?: string;
  country_code?: string;
  source?: "entered_by_manufacturer" | "imported" | "verified_by_reviewer";
  verification_status: RefVerification;
  verified_at?: string | null;
  verification_method?: string | null;
  verification_note?: string | null;
}

/** The API stores pack configuration as an object; older rows may still hold free text. */
export interface PackConfiguration {
  packs: number;
  per_pack: number;
  unit: string;
}

/** Consumer-visible fields; also the shape of `pending_revision`. */
export interface ProductFields {
  name: string;
  brand_id: string | null;
  industry: Industry | null;
  variant: string | null;
  size_value: number | string | null;
  size_unit: SizeUnit | null;
  pack_configuration: PackConfiguration | string | null;
  dosage_form: string | null;
  strength: string | null;
  category: string | null;
  sku: string;
  gtin: string | null;
  description: string | null;
  reference_image_id: string | null;
  consumer_visibility: ConsumerVisibility;
  support_contact: SupportContact | null;
}

export interface Product extends ProductFields {
  id: string;
  /** Read-only, generated from size_value + size_unit, e.g. "400 ml" */
  size: string | null;
  brand_name?: string;
  /** Older responses sent the brand name as `brand` */
  brand?: string;
  reference_image_url?: string | null;
  status: ProductStatus;
  is_active: boolean;
  approved_version: number | null;
  pending_revision: Partial<ProductFields> | null;
  public_suspended: boolean;
  review_note: string | null;
  correction_request: { field: "sku" | "gtin"; requested_value: string; reason: string } | null;
  regulatory_reference?: Omit<RegulatoryRef, "id"> | null;
  // detail only
  batch_count?: number;
  active_batch_count?: number;
  codes_issued?: number;
  gtin_conflict?: boolean | { product_id?: string; name?: string } | null;
  created_at: string;
  updated_at: string;
}

export interface Batch {
  id: string;
  product_id: string;
  batch_number: string;
  expiry: string;
  status: CodeStatus;
  created_at: string;
}

export interface IssuanceJob {
  id: string;
  batch_id: string;
  quantity_requested: number;
  quantity_issued: number;
  status: JobStatus;
  is_reconciled: boolean;
  created_at: string;
}

export interface AuthCode {
  id: string;
  code_str: string;
  batch_id: string;
  job_id: string;
  status: CodeStatus;
  scan_count: number;
  created_at: string;
}

export interface RiskFlag {
  id: string;
  severity: FlagSeverity;
  kind: string;
  is_reviewed: boolean;
  created_at: string;
}

export interface RiskCase {
  id: string;
  title: string;
  description: string;
  status: CaseStatus;
  batch_id?: string;
  product_id?: string;
  created_at: string;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  description: string;
  created_at: string;
}

export interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  last_used?: string;
  expiry?: string;
  is_revoked: boolean;
  created_at: string;
}
