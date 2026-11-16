"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GhostButton } from "@/components/ui/Modal";
import { SectionCard } from "@/components/ui/SectionCard";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { asList, catalogueApi, regulatoryRefBody, tenantApi, type ProductWrite } from "@/lib/api/catalogue";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/client";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { useApi } from "@/lib/hooks/useApi";
import type { ConsumerVisibility, Industry, PackConfiguration, Product, ProductFields, RegulatoryRef, SizeUnit } from "@/lib/types";
import { ConsumerPreview } from "./ConsumerPreview";

const UNITS: SizeUnit[] = ["ml", "L", "g", "kg", "mg", "units"];
const VISIBILITY: { key: keyof ConsumerVisibility; label: string; hint?: string }[] = [
  { key: "brand", label: "Brand" },
  { key: "variant_size", label: "Variant and size" },
  { key: "batch_number", label: "Batch number" },
  { key: "manufacture_date", label: "Manufacture date" },
  { key: "expiry", label: "Expiry / best before" },
  { key: "regulatory_reference", label: "Regulatory reference" },
  { key: "product_image", label: "Product image" },
  { key: "support_contact", label: "Support contact" },
];
const DEFAULT_VISIBILITY = Object.fromEntries(VISIBILITY.map((v) => [v.key, true])) as unknown as ConsumerVisibility;
const FIELD_LABEL: Record<string, string> = {
  name: "Product name", brand_id: "Brand", variant: "Variant", size: "Size", category: "Category", sku: "SKU",
  dosage_form: "Dosage form", strength: "Strength", pack_configuration: "Pack configuration", gtin: "GTIN",
};

interface FormValues {
  industry: Industry;
  name: string;
  brand_id: string;
  variant: string;
  size_value: string;
  size_unit: SizeUnit | "";
  pack_packs: string;
  pack_per_pack: string;
  pack_unit: string;
  dosage_form: string;
  strength: string;
  category: string;
  sku: string;
  gtin: string;
  description: string;
  reg_authority: string;
  reg_number: string;
  consumer_visibility: ConsumerVisibility;
  support_email: string;
  support_phone: string;
  support_url: string;
}

interface Dup {
  kind: "possible_duplicate" | "sku_conflict";
  message: string;
  existing?: { id: string; name: string; variant?: string; size?: string; sku?: string; batch_count?: number };
}

function toValues(p?: Product, ref?: Pick<RegulatoryRef, "authority" | "number" | "reference_number"> | null): FormValues {
  // A product with a revision in flight is edited from that revision, not the live values.
  const b = (p ? { ...p, ...(p.pending_revision ?? {}) } : {}) as Partial<Product> & Partial<ProductFields>;
  const pack = typeof b.pack_configuration === "object" ? b.pack_configuration : null;
  return {
    industry: b.industry ?? "cosmetics",
    name: b.name ?? "",
    brand_id: b.brand_id ?? "",
    variant: b.variant ?? "",
    size_value: b.size_value != null ? String(b.size_value) : "",
    size_unit: b.size_unit ?? "",
    pack_packs: pack?.packs != null ? String(pack.packs) : "",
    pack_per_pack: pack?.per_pack != null ? String(pack.per_pack) : "",
    pack_unit: pack?.unit ?? "",
    dosage_form: b.dosage_form ?? "",
    strength: b.strength ?? "",
    category: b.category ?? "",
    sku: b.sku ?? "",
    gtin: b.gtin ?? "",
    description: b.description ?? "",
    reg_authority: ref?.authority ?? "NAFDAC",
    reg_number: ref?.reference_number ?? ref?.number ?? "",
    consumer_visibility: { ...DEFAULT_VISIBILITY, ...(b.consumer_visibility ?? {}) },
    support_email: b.support_contact?.email ?? "",
    support_phone: b.support_contact?.phone ?? "",
    support_url: b.support_contact?.url ?? "",
  };
}

const packFilled = (v: FormValues) => !!(v.pack_packs.trim() || v.pack_per_pack.trim() || v.pack_unit.trim());

/** The three pack inputs as the API's object, or null when all are empty. */
function packConfig(v: FormValues): PackConfiguration | null {
  if (!packFilled(v)) return null;
  return { packs: Number(v.pack_packs), per_pack: Number(v.pack_per_pack), unit: v.pack_unit.trim() };
}

/** Form values -> API body. Empty text becomes null so an edit can clear a field. */
function toPayload(v: FormValues, imageId: string | null): ProductWrite {
  const t = (s: string) => (s.trim() === "" ? null : s.trim());
  const contact = { email: t(v.support_email), phone: t(v.support_phone), url: t(v.support_url) };
  return {
    name: v.name.trim(),
    industry: v.industry,
    brand_id: v.brand_id || null,
    variant: t(v.variant),
    size_value: v.size_value.trim() === "" ? null : Number(v.size_value),
    size_unit: v.size_unit || null,
    pack_configuration: packConfig(v),
    dosage_form: t(v.dosage_form),
    strength: t(v.strength),
    category: v.category || null,
    sku: v.sku.trim().toUpperCase(),
    gtin: t(v.gtin),
    description: t(v.description),
    reference_image_id: imageId,
    consumer_visibility: v.consumer_visibility,
    support_contact: contact.email || contact.phone || contact.url ? contact : null,
    regulatory_reference: v.reg_number.trim()
      ? regulatoryRefBody(v.reg_authority, v.reg_number)
      : null,
  };
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function ProductForm({ product, regRef: existingRef }: { product?: Product; regRef?: RegulatoryRef | null }) {
  const router = useRouter();
  const { canAdminister, canSubmit } = useCatalogueRole();
  const initial = useMemo(() => toValues(product, existingRef), [product, existingRef]);
  const initialImage = product?.reference_image_id ? { id: product.reference_image_id, url: product.reference_image_url ?? null, uploaded: false } : null;

  const industries = useApi(() => catalogueApi.industries(), []);
  const brandsReq = useApi(() => catalogueApi.listBrands(), []);
  const defaultContact = useApi(() => tenantApi.supportContact().catch(() => null), []);
  const gates = useApi(() => tenantApi.releaseGates().catch(() => null), []);

  const [productId, setProductId] = useState(product?.id);
  const [extraBrands, setExtraBrands] = useState<{ id: string; name: string }[]>([]);
  const [newBrand, setNewBrand] = useState<string | null>(null);
  const [brandBusy, setBrandBusy] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [pendingBrandId, setPendingBrandId] = useState<string | null>(null);
  const [image, setImage] = useState<{ id: string; url: string | null; uploaded: boolean } | null>(initialImage);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [dup, setDup] = useState<Dup | null>(null);
  const [busy, setBusy] = useState<"draft" | "submit" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const wantSubmit = useRef(false); // remembered so the duplicate banner can retry the same action

  const {
    register, handleSubmit, watch, setValue, setError, clearErrors,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: initial });

  const v = watch();
  const approved = !!product && product.approved_version != null;
  const lockedIdentifiers = approved; // sku + gtin locked after approval
  const lockedIndustry = !!product?.industry;
  const canSubmitNow = canSubmit && (!product || ["draft", "rejected", "changes_requested"].includes(product.status));

  const industryList = asList(industries.data);
  const industry = industryList.find((i) => i.key === v.industry);
  const required = new Set(industry?.required_fields ?? []);
  const category = industry?.categories?.find((c) => c.key === v.category);
  const unitOptions = (category?.allowed_units?.length ? category.allowed_units : UNITS) as string[];
  const brands = [...asList(brandsReq.data), ...extraBrands];
  const brandName = brands.find((b) => b.id === v.brand_id)?.name;
  const req = (k: string) => (required.has(k) ? " *" : "");

  // "Ready to submit" checklist, driven by the industry's required fields.
  const filled: Record<string, boolean> = {
    name: v.name.trim().length >= 2,
    brand_id: !!v.brand_id,
    variant: !!v.variant.trim(),
    size: !!v.size_value.trim() && !!v.size_unit,
    category: !!v.category,
    sku: !!v.sku.trim(),
    dosage_form: !!v.dosage_form.trim(),
    strength: !!v.strength.trim(),
    pack_configuration: !!v.pack_packs.trim() && !!v.pack_per_pack.trim() && !!v.pack_unit.trim(),
    gtin: !!v.gtin.trim(),
  };
  const missing = ["name", ...(industry?.required_fields ?? [])].filter((k, i, a) => a.indexOf(k) === i && k in filled && !filled[k]);

  function applyServerErrors(e: unknown): boolean {
    const details = fieldErrors(e);
    const map: Record<string, keyof FormValues> = {
      pack_configuration: "pack_packs", "pack_configuration.packs": "pack_packs", "pack_configuration.per_pack": "pack_per_pack",
      "pack_configuration.unit": "pack_unit", size: "size_value", size_value: "size_value", size_unit: "size_unit", "regulatory_reference.number": "reg_number", "regulatory_reference.reference_number": "reg_number", reference_number: "reg_number", country_code: "reg_authority",
      regulatory_reference: "reg_number", "support_contact.email": "support_email", "support_contact.phone": "support_phone",
      "support_contact.url": "support_url",
    };
    let leftover = "";
    let first = true;
    for (const [k, msg] of Object.entries(details)) {
      const name = (map[k] ?? k) as keyof FormValues;
      if (name in initial) setError(name, { message: msg }, { shouldFocus: first });
      else leftover += `${k}: ${msg} `;
      first = false;
    }
    if (leftover) setFormError(leftover.trim());
    return Object.keys(details).length > 0;
  }

  /** Create or patch; returns the product id, or null when the API rejected it. */
  async function persist(values: FormValues, confirmed: boolean): Promise<string | null> {
    const full = toPayload(values, image?.id ?? null);
    try {
      if (!productId) {
        // Drafts may be partial: send only what the user filled in.
        const body = Object.fromEntries(Object.entries(full).filter(([, x]) => x !== null && x !== "")) as ProductWrite;
        const created = await catalogueApi.createProduct({ ...body, confirm_not_duplicate: confirmed || undefined });
        setProductId(created.id);
        return created.id;
      }
      const before = toPayload(initial, initialImage?.id ?? null);
      const body: ProductWrite = {};
      for (const k of Object.keys(full) as (keyof ProductWrite)[]) {
        if (lockedIdentifiers && (k === "sku" || k === "gtin")) continue;
        if (k === "industry") continue;
        if (!same(full[k], before[k])) (body as Record<string, unknown>)[k] = full[k];
      }
      if (confirmed) body.confirm_not_duplicate = true;
      if (Object.keys(body).length) await catalogueApi.updateProduct(productId, body);
      return productId;
    } catch (e) {
      if (e instanceof ApiError && (e.error.code === "possible_duplicate" || e.error.code === "sku_conflict")) {
        const existing = (e.error.details as { existing_product?: Dup["existing"] } | undefined)?.existing_product;
        setDup({ kind: e.error.code, message: e.error.message, existing });
        if (e.error.code === "sku_conflict") setError("sku", { message: "This SKU is already used by another product in your company." });
      } else if (e instanceof ApiError && e.error.code === "industry_locked") {
        setFormError("Pharmaceuticals are locked until the release gate opens. Choose Cosmetics for now.");
      } else if (e instanceof ApiError && e.error.code === "field_locked") {
        setFormError(`${(e.error.details as { field?: string } | undefined)?.field ?? "That field"} can't be changed after approval. Use “Request a correction” on the product page.`);
      } else if (!applyServerErrors(e)) {
        setFormError(errorMessage(e, "We couldn't save this product. Please try again."));
      }
      return null;
    }
  }

  async function run(values: FormValues, submit: boolean, confirmed = false) {
    setFormError(null);
    setDup(null);
    wantSubmit.current = submit;
    setBusy(submit ? "submit" : "draft");
    try {
      const id = await persist(values, confirmed);
      if (!id) return;
      if (submit) {
        try {
          await catalogueApi.submitProduct(id);
        } catch (e) {
          const handled = applyServerErrors(e);
          setFormError(
            handled
              ? "Saved as a draft, but some required fields still need attention."
              : `Saved as a draft, but it couldn't be submitted. ${errorMessage(e, "")}`.trim()
          );
          return;
        }
      }
      router.push(`/catalogue/products/${id}`);
    } finally {
      setBusy(null);
    }
  }

  const onSave = (submit: boolean, confirmed = false) => handleSubmit((values) => run(values, submit, confirmed))();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setImageError(null);
    setUploading(true);
    try {
      const up = await catalogueApi.uploadImage(file);
      if (image?.uploaded) catalogueApi.deleteImage(image.id).catch(() => {});
      setImage({ id: up.id, url: up.url, uploaded: true });
    } catch (e) {
      setImageError(
        e instanceof ApiError
          ? { file_too_large: "That image is over 5 MB.", unsupported_media_type: "Use a PNG or JPEG image.", image_invalid: "We couldn't read that image. Try another." }[e.error.code] ?? e.error.message
          : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage() {
    if (image?.uploaded) catalogueApi.deleteImage(image.id).catch(() => {});
    setImage(null);
  }

  async function addBrand() {
    const name = newBrand?.trim();
    if (!name || brandBusy) return;
    setBrandBusy(true);
    setBrandError(null);
    try {
      const b = await catalogueApi.createBrand(name);
      setExtraBrands((x) => [...x, b]);
      setPendingBrandId(b.id); // selected once its <option> is rendered (see effect below)
      setNewBrand(null);
    } catch (e) {
      setBrandError(errorMessage(e, "We couldn't create that brand."));
    } finally {
      setBrandBusy(false);
    }
  }

  // setValue on a <select> is ignored until the matching <option> exists in the DOM.
  useEffect(() => {
    if (!pendingBrandId || !extraBrands.some((b) => b.id === pendingBrandId)) return;
    setValue("brand_id", pendingBrandId, { shouldDirty: true });
    clearErrors("brand_id");
    setPendingBrandId(null);
  }, [pendingBrandId, extraBrands, setValue, clearErrors]);

  if (industries.loading && !industries.data) return <LoadingSpinner label="Loading form…" />;
  if (industries.error) return <ErrorState message="We couldn't load the industry and category list." onRetry={industries.reload} />;

  const vis = v.consumer_visibility;
  const previewContact = vis.support_contact
    ? v.support_email || v.support_phone || v.support_url
      ? { email: v.support_email, phone: v.support_phone, url: v.support_url }
      : defaultContact.data
    : null;
  const pharmaGate = gates.data?.pharmaceuticals;

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div>
        <FormError message={formError} />

        {product?.status === "approved" && (
          <p className="mb-2 rounded-xl bg-[#e6eef7] px-4 py-3 text-sm text-[#2b5a8a]">
            This product is live. Changes to what consumers see go to review as a new version, and the current approved values stay live until it&apos;s approved. SKU and GTIN are locked.
          </p>
        )}

        {dup && (
          <div role="alert" className="mb-2 rounded-xl border border-caution/40 bg-[#fbf0d6] px-4 py-3 text-sm text-[#6b4700]">
            <p className="font-semibold">{dup.kind === "sku_conflict" ? "This SKU is already in use" : "This looks like a product you already have"}</p>
            <p className="mt-0.5">{dup.message}</p>
            {dup.existing && (
              <p className="mt-2">
                <Link href={`/catalogue/products/${dup.existing.id}`} className="font-medium underline underline-offset-2">{dup.existing.name}</Link>
                {" · "}{[dup.existing.variant, dup.existing.size].filter(Boolean).join(" · ")}
                {dup.existing.sku && <> · <span className="font-mono text-xs">{dup.existing.sku}</span></>}
                {dup.existing.batch_count != null && <> · {dup.existing.batch_count} batches</>}
              </p>
            )}
            {dup.kind === "possible_duplicate" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => onSave(wantSubmit.current, true)} className="h-9 rounded-lg bg-[#6b4700] px-3 text-sm font-semibold text-white">
                  It&apos;s a different product
                </button>
                {dup.existing && <Link href={`/catalogue/products/${dup.existing.id}`} className="inline-flex h-9 items-center rounded-lg border border-[#6b4700]/30 px-3 text-sm font-semibold">Open the existing one</Link>}
              </div>
            )}
          </div>
        )}

        <SectionCard label="1 · Industry">
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Industry">
            {industryList.map((i) => (
              <label key={i.key} className={`flex gap-3 rounded-xl border p-3.5 ${v.industry === i.key ? "border-primary bg-primary-soft" : "border-border"} ${!i.available || lockedIndustry ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
                <input type="radio" value={i.key} disabled={!i.available || lockedIndustry} className="mt-1 accent-[var(--primary)]" {...register("industry")} />
                <span>
                  <span className="block text-sm font-semibold">{i.label}{!i.available && " · Locked"}</span>
                  {i.description && <span className="block text-xs text-muted">{i.description}</span>}
                </span>
              </label>
            ))}
          </div>
          {pharmaGate?.status === "locked" && pharmaGate.items && (
            <ul className="mt-3 space-y-1 text-xs text-muted">
              {pharmaGate.items.map((g) => (
                <li key={g.key} className="flex justify-between gap-3"><span>{g.label}</span><span>{g.state.replace("_", " ")}</span></li>
              ))}
            </ul>
          )}
          {lockedIndustry && <p className="mt-3 text-xs text-muted">Industry can&apos;t be changed once it&apos;s set.</p>}
        </SectionCard>

        <SectionCard label="2 · Product identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={`Product name${req("name") || " *"}`} placeholder="Shea Butter Body Lotion" error={errors.name?.message}
                {...register("name", { maxLength: { value: 120, message: "Use 120 characters or fewer" }, validate: (s) => !s.trim() || s.trim().length >= 2 || "Use at least 2 characters" })} />
            </div>

            <div>
              <Select label={`Brand${req("brand_id")}`} error={errors.brand_id?.message} {...register("brand_id")}>
                <option value="">Select a brand</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
              {canAdminister && (newBrand === null ? (
                <button type="button" onClick={() => { setBrandError(null); setNewBrand(""); }} className="mt-1.5 text-xs font-medium text-primary hover:underline">+ New brand</button>
              ) : (
                <div className="mt-2">
                <div className="flex gap-2">
                  <input autoFocus value={newBrand} disabled={brandBusy} onChange={(e) => setNewBrand(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBrand())} placeholder="Brand name" aria-label="New brand name" className="h-9 min-w-0 flex-1 rounded-lg border border-border px-3 text-sm outline-none focus:border-primary" />
                  <button type="button" onClick={addBrand} disabled={brandBusy || !newBrand.trim()} className="h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-white disabled:opacity-60">{brandBusy ? "Adding…" : "Add"}</button>
                  <button type="button" onClick={() => { setNewBrand(null); setBrandError(null); }} disabled={brandBusy} className="h-9 px-2 text-sm text-muted">Cancel</button>
                </div>
                {brandError && <p role="alert" className="mt-1.5 text-xs text-danger">{brandError}</p>}
                </div>
              ))}
            </div>

            <Select label={`Category${req("category")}`} error={errors.category?.message} {...register("category")}>
              <option value="">Select a category</option>
              {industry?.categories?.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </Select>

            <Field label={`Variant${req("variant")}`} placeholder="Unscented" hint="Shade, scent or flavour." error={errors.variant?.message}
              {...register("variant", { maxLength: { value: 80, message: "Use 80 characters or fewer" } })} />

            <div>
              <div className="grid grid-cols-[1fr_110px] gap-2">
                <Field label={`Size${req("size")}`} inputMode="decimal" placeholder="400" error={errors.size_value?.message}
                  {...register("size_value", { validate: (s) => !s.trim() || (Number(s) > 0 && Number.isFinite(Number(s))) || "Enter a number above 0" })} />
                <Select label="Unit" aria-label="Size unit" error={errors.size_unit?.message} {...register("size_unit")}>
                  <option value="">—</option>
                  {unitOptions.map((u) => <option key={u} value={u}>{u}</option>)}
                </Select>
              </div>
              <p className="mt-1.5 text-xs text-muted">Shown to consumers as “{v.size_value && v.size_unit ? `${v.size_value} ${v.size_unit}` : "400 ml"}”.</p>
            </div>

            <div>
              <div className="grid grid-cols-[1fr_1fr_1.4fr] gap-2">
                <Field label={`Packs${req("pack_configuration")}`} inputMode="numeric" placeholder="1" error={errors.pack_packs?.message}
                  {...register("pack_packs", { validate: (s) => !s.trim() || /^[1-9]\d*$/.test(s.trim()) || "Whole number, at least 1" })} />
                <Field label="Per pack" inputMode="numeric" placeholder="10" error={errors.pack_per_pack?.message}
                  {...register("pack_per_pack", { validate: (s) => !s.trim() || /^[1-9]\d*$/.test(s.trim()) || "Whole number, at least 1" })} />
                <Field label="Unit" placeholder="bars" error={errors.pack_unit?.message}
                  {...register("pack_unit", { validate: (s, f) => !packFilled(f) || !!s.trim() || "Enter a unit" })} />
              </div>
              <p className="mt-1.5 text-xs text-muted">Packs in the product, items in each pack, and what the items are. A single bar is 1 pack of 1 bar.</p>
            </div>

            {v.industry === "pharmaceuticals" && (
              <>
                <Field label={`Dosage form${req("dosage_form")}`} placeholder="Tablet" error={errors.dosage_form?.message} {...register("dosage_form")} />
                <Field label={`Strength${req("strength")}`} placeholder="500 mg" error={errors.strength?.message} {...register("strength")} />
              </>
            )}

            <Field label={`SKU${req("sku")}`} className="font-mono uppercase" placeholder="EN-SBL-400" disabled={lockedIdentifiers}
              hint={lockedIdentifiers ? "Locked after approval." : "3–64 characters: letters, numbers, - and _. Unique in your company."} error={errors.sku?.message}
              {...register("sku", { pattern: { value: /^[A-Za-z0-9_-]{3,64}$/, message: "Use 3–64 letters, numbers, - or _" } })} />

            <Field label="GTIN (optional)" className="font-mono" inputMode="numeric" placeholder="13 or 14 digits" disabled={lockedIdentifiers}
              hint={lockedIdentifiers ? "Locked after approval." : "Checked against the GS1 check digit. A GTIN already registered elsewhere is flagged at review, not here."} error={errors.gtin?.message}
              {...register("gtin", { pattern: { value: /^(\d{13}|\d{14})?$/, message: "A GTIN has 13 or 14 digits" } })} />

            <div className="sm:col-span-2">
              <label htmlFor="description" className="mb-1.5 block text-sm font-medium">Internal notes (optional)</label>
              <textarea id="description" rows={3} className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" {...register("description")} />
              <p className="mt-1.5 text-xs text-muted">Never shown to consumers. Don&apos;t put staff personal data in product fields.</p>
            </div>
          </div>
        </SectionCard>

        <SectionCard label="3 · Regulatory reference">
          <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
            <Select label="Authority" {...register("reg_authority")}>
              <option value="NAFDAC">NAFDAC</option>
            </Select>
            <Field label="Registration number (optional)" className="font-mono" placeholder="A1-1234" error={errors.reg_number?.message} {...register("reg_number")} />
          </div>
          <p className="mt-3 text-xs text-muted">Provided by you and shown as “not independently checked” until an AuthentiCheck reviewer verifies it. Changing the number resets verification.</p>
        </SectionCard>

        <SectionCard label="4 · Reference image">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid size-24 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-background text-xs text-muted">
              {image?.url ? (
                // eslint-disable-next-line @next/next/no-img-element -- remote CDN/signed URL, size unknown
                <img src={image.url} alt="Reference" className="size-full object-cover" />
              ) : image ? "Attached" : "No image"}
            </div>
            <div className="min-w-0 flex-1">
              <input ref={fileRef} type="file" accept="image/png,image/jpeg" className="sr-only" id="ref-image" onChange={(e) => onFile(e.target.files?.[0])} />
              <div className="flex flex-wrap gap-2">
                <label htmlFor="ref-image" className={`inline-flex h-10 cursor-pointer items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold hover:bg-background ${uploading ? "pointer-events-none opacity-60" : ""}`}>
                  {uploading ? "Uploading…" : image ? "Replace image" : "Upload image"}
                </label>
                {image && <button type="button" onClick={removeImage} className="h-10 px-3 text-sm font-medium text-danger hover:underline">Remove</button>}
              </div>
              <p className="mt-2 text-xs text-muted">PNG or JPEG, up to 5 MB. Location and camera data are removed when you upload.</p>
              {imageError && <p role="alert" className="mt-1.5 text-xs text-danger">{imageError}</p>}
            </div>
          </div>
        </SectionCard>

        <SectionCard label="5 · What consumers see">
          <p className="mb-3 text-sm text-muted">The product name is always shown. Choose what else appears when someone checks a code.</p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {VISIBILITY.map((o) => (
              <Toggle key={o.key} label={o.label} {...register(`consumer_visibility.${o.key}` as const)} />
            ))}
          </div>
          <div className="mt-5">
            <p className="text-sm font-medium">Support contact for this product (optional)</p>
            <p className="text-xs text-muted">
              Leave blank to use your company default
              {defaultContact.data?.email ? ` (${defaultContact.data.email})` : ""}.
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <Field label="Email" type="email" error={errors.support_email?.message} {...register("support_email")} />
              <Field label="Phone" type="tel" error={errors.support_phone?.message} {...register("support_phone")} />
              <Field label="Web page" type="url" placeholder="https://" error={errors.support_url?.message} {...register("support_url")} />
            </div>
          </div>
        </SectionCard>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <GhostButton type="button" disabled={!!busy} onClick={() => onSave(false)}>
            {busy === "draft" ? "Saving…" : product && !canSubmitNow ? "Save changes" : "Save draft"}
          </GhostButton>
          {canSubmitNow && (
            <Button type="button" className="!w-auto" loading={busy === "submit"} disabled={!!busy} onClick={() => onSave(true)}>
              Save and submit for review
            </Button>
          )}
          <Link href={product ? `/catalogue/products/${product.id}` : "/catalogue/products"} className="text-sm font-medium text-muted hover:underline">Cancel</Link>
        </div>
        {canSubmitNow && <p className="mt-2 text-xs text-muted">Submitting records your name, the time and every field value in the audit log.</p>}
      </div>

      <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
        <div>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted">Consumer preview</h2>
          <ConsumerPreview
            sample
            data={{
              name: v.name,
              brand: vis.brand ? brandName : undefined,
              variantSize: vis.variant_size ? [v.variant, v.size_value && v.size_unit ? `${v.size_value} ${v.size_unit}` : ""].filter(Boolean).join(" · ") : undefined,
              imageUrl: vis.product_image ? image?.url : undefined,
              regulatory: vis.regulatory_reference && v.reg_number.trim() ? { authority: v.reg_authority, number: v.reg_number.trim(), verification: "unverified" } : undefined,
              batch: {
                number: vis.batch_number ? "EN-2409-117" : undefined,
                manufactured: vis.manufacture_date ? "2026-09-12" : undefined,
                expiry: vis.expiry ? "2028-09-11" : undefined,
              },
              support: previewContact,
            }}
          />
        </div>

        <div className="rounded-2xl border border-border bg-white p-4">
          <h2 className="text-sm font-semibold">{missing.length ? "Before you can submit" : "Ready to submit"}</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {missing.map((k) => <li key={k} className="text-danger">Add {FIELD_LABEL[k] ?? k}</li>)}
            {!image && <li className="text-[#8a5a00]">No reference image (recommended, not required)</li>}
            {!missing.length && <li className="text-primary">All required fields are filled in.</li>}
          </ul>
          <p className="mt-2 text-xs text-muted">Drafts can be saved with missing fields. These are checked when you submit.</p>
        </div>
      </aside>
    </form>
  );
}
