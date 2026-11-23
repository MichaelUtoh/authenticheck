import type { SupportContact } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export const CODE_LENGTH = 12;

/** Strip dashes/spaces and upper-case. Characters are never swapped (0 and O stay as typed). */
export const cleanCode = (raw: string) => raw.replace(/[\s-]/g, "").toUpperCase();

/** "7KQ2M9XW4PRT" -> "7KQ2-M9XW-4PRT" */
export const formatCode = (code: string) => code.match(/.{1,4}/g)?.join("-") ?? code;

/** Returns a consumer-facing message, or null when the code has the right shape. */
export function validateCode(raw: string): string | null {
  const code = cleanCode(raw);
  if (!code) return "Enter the code printed on the pack.";
  if (!/^[A-Z0-9]+$/.test(code)) return "Codes only use letters and numbers.";
  if (code.length !== CODE_LENGTH) return `Codes have ${CODE_LENGTH} letters and numbers. This one has ${code.length}.`;
  return null;
}

/** Pull a code out of whatever a QR holds: a bare code, /verify/{code}, or a GS1 /01/{gtin}/21/{serial} link. */
export function codeFromScan(text: string): string | null {
  const t = text.trim();
  const m = t.match(/\/verify\/([^/?#\s]+)/i) ?? t.match(/\/21\/([^/?#\s]+)/);
  const candidate = cleanCode(decodeURIComponent(m ? m[1] : t));
  return validateCode(candidate) ? null : candidate;
}

export interface ProductInfo {
  name: string;
  brand?: string;
  variantSize?: string;
  imageUrl?: string;
  manufacturer?: string;
  /** Medicines get extra "speak to a pharmacist" wording. */
  isMedicine?: boolean;
  regulatory?: { authority: string; number: string; verified: boolean };
  batch?: { number?: string; manufactured?: string; expiry?: string };
  support?: SupportContact;
}

export type OutcomeKind = "first" | "repeat" | "withdrawn" | "expired" | "deactivated" | "not_recognised";

export interface CheckOutcome {
  kind: OutcomeKind;
  code: string;
  /** ISO timestamp of this check (our clock when the API doesn't say). */
  checkedAt: string;
  firstCheckedAt?: string;
  /** Withdrawn only. */
  effectiveAt?: string;
  instructions?: string;
  approvedBy?: string;
  product?: ProductInfo;
}

/** The service didn't answer: not a pass and not a fail. */
export class CheckUnavailableError extends Error {}

type Raw = Record<string, unknown>;
const obj = (v: unknown): Raw => (v && typeof v === "object" ? (v as Raw) : {});
const str = (...vs: unknown[]) => vs.find((v): v is string => typeof v === "string" && v.trim() !== "");

/**
 * Everything we assume about the `/verify/{code}` payload lives here, because the API reference does
 * not spell it out yet. Accepts nested (`product`, `batch`) or flat fields. Hidden fields are omitted.
 */
function parse(code: string, body: Raw): CheckOutcome {
  const p = obj(body.product);
  const b = obj(body.batch);
  const reg = obj(body.regulatory_reference ?? p.regulatory_reference);
  const sc = obj(body.support_contact);
  const result = String(body.result ?? "").toLowerCase();
  const scans = typeof body.scan_count === "number" ? body.scan_count : undefined;
  const firstAt = str(body.first_checked_at, body.first_scan_at);

  const regNumber = str(reg.number, reg.reference_number);
  const product: ProductInfo = {
    name: str(p.name, body.product_name) ?? "Product",
    brand: str(p.brand, body.brand, body.manufacturer),
    variantSize: str(p.variant_size, p.variant, body.variant_size),
    imageUrl: str(p.image_url, body.image_url),
    manufacturer: str(body.manufacturer, p.manufacturer, p.brand),
    isMedicine: p.industry === "pharmaceuticals" || body.industry === "pharmaceuticals",
    regulatory: regNumber
      ? { authority: str(reg.authority) ?? "Reg. no.", number: regNumber, verified: reg.verification === "verified" }
      : undefined,
    batch: {
      number: str(b.batch_number, b.number, body.batch_number),
      manufactured: str(b.manufacture_date, b.manufactured_at, b.manufactured, body.manufacture_date, body.manufactured_at),
      expiry: str(b.expiry, b.expires_at, b.best_before, body.expiry, body.expires_at, body.best_before),
    },
    support: { email: str(sc.email), phone: str(sc.phone), url: str(sc.url) },
  };

  const base = { code, checkedAt: str(body.checked_at) ?? new Date().toISOString(), product };
  if (result === "recalled" || result === "withdrawn")
    return {
      ...base,
      kind: "withdrawn",
      effectiveAt: str(body.effective_at, body.withdrawn_at),
      instructions: str(body.consumer_message, body.instructions),
      approvedBy: str(body.approved_by, body.manufacturer),
    };
  if (result === "deactivated") return { ...base, kind: "deactivated" };
  if (result === "expired") return { ...base, kind: "expired" };
  if (result === "not_found" || result === "not_recognised") return { code, kind: "not_recognised", checkedAt: base.checkedAt };
  const repeat = body.first_check === false || body.is_repeat === true || result === "repeat" || (scans ?? 1) > 1 || !!firstAt;
  return { ...base, kind: repeat ? "repeat" : "first", firstCheckedAt: firstAt };
}

/** Anonymous on purpose: no cookies, no token. Every call records a check, so only call it on an explicit user action. */
export async function checkCode(code: string): Promise<CheckOutcome> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/verify/${encodeURIComponent(code)}`, { credentials: "omit", cache: "no-store", headers: { Accept: "application/json" } });
  } catch {
    throw new CheckUnavailableError("network");
  }
  if (res.status === 404) return { code, kind: "not_recognised", checkedAt: new Date().toISOString() };
  if (!res.ok) throw new CheckUnavailableError(String(res.status));
  const body = await res.json().catch(() => null);
  if (!body) throw new CheckUnavailableError("bad_body");
  return parse(code, body as Raw);
}
