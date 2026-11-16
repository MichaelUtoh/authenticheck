"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { asList, catalogueApi, regulatoryRefBody, type ActivityEvent } from "@/lib/api/catalogue";
import { ApiError, errorMessage, fieldErrors } from "@/lib/api/client";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { fmtDate, fmtDateTime, num } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import type { Product, ProductFields, RegulatoryRef } from "@/lib/types";
import { ConsumerPreview, type PreviewData } from "./ConsumerPreview";
import { ReasonDialog } from "./ReasonDialog";
import { ProductBadges } from "./ProductStatusBadge";

type Tab = "overview" | "batches" | "activity" | "preview";
type Dialog = "withdraw" | "correction" | null;

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "batches", label: "Batches" },
  { key: "activity", label: "Activity" },
  { key: "preview", label: "Consumer preview" },
];
const VIS_LABEL: Record<string, string> = {
  brand: "Brand", variant_size: "Variant and size", batch_number: "Batch number", manufacture_date: "Manufacture date",
  expiry: "Expiry / best before", regulatory_reference: "Regulatory reference", product_image: "Product image", support_contact: "Support contact",
};
const FIELD_LABEL: Record<string, string> = {
  name: "Name", brand_id: "Brand", variant: "Variant", size_value: "Size", size_unit: "Size unit", category: "Category", sku: "SKU", gtin: "GTIN",
  pack_configuration: "Pack configuration", dosage_form: "Dosage form", strength: "Strength", reference_image_id: "Image",
  consumer_visibility: "Consumer visibility", support_contact: "Support contact", description: "Internal notes", industry: "Industry",
};

const card = "rounded-2xl border border-border bg-white p-5 sm:p-6";
const pretty = (v: unknown) => (v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

export function ProductDetail({ id }: { id: string }) {
  const { canEdit, canAdminister, canSubmit } = useCatalogueRole();
  const req = useApi(() => catalogueApi.getProduct(id), [id]);
  const [tab, setTab] = useState<Tab>("overview");
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const p = req.data;

  async function act(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    setNotice(null);
    try {
      await fn();
      setNotice({ kind: "ok", text: ok });
      req.reload();
    } catch (e) {
      const d = fieldErrors(e);
      const detail = Object.keys(d).length ? ` Needs attention: ${Object.entries(d).map(([k, m]) => `${FIELD_LABEL[k] ?? k} (${m})`).join(", ")}.` : "";
      setNotice({ kind: "error", text: errorMessage(e) + detail });
    } finally {
      setBusy(false);
    }
  }

  const submittable = !!p && ["draft", "rejected", "changes_requested"].includes(p.status);

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <Link href="/catalogue/products" className="text-sm text-muted hover:underline">← Products</Link>

        {req.error ? (
          <ErrorState message={req.error instanceof ApiError && req.error.status === 404 ? "This product doesn't exist or isn't in your company." : errorMessage(req.error, "We couldn't load this product.")} onRetry={req.reload} />
        ) : !p ? (
          <LoadingSpinner />
        ) : (
          <>
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="break-words text-3xl font-semibold tracking-tight">{p.name || "Untitled draft"}</h1>
                <p className="mt-1 text-muted">
                  {[p.brand_name ?? p.brand, p.variant, p.size].filter(Boolean).join(" · ") || "No details yet"}
                  {p.sku && <span className="ml-2 font-mono text-xs">{p.sku}</span>}
                </p>
                <div className="mt-2"><ProductBadges product={p} /></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {canEdit && p.status !== "in_review" && (
                  <Link href={`/catalogue/products/${p.id}/edit`} className="inline-flex h-11 items-center rounded-lg border border-border bg-white px-4 text-sm font-semibold hover:bg-background">Edit</Link>
                )}
                {canSubmit && submittable && (
                  <Button className="!w-auto" loading={busy} onClick={() => act(() => catalogueApi.submitProduct(p.id), "Submitted for review. We recorded your name, the time and every field value.")}>
                    Submit for review
                  </Button>
                )}
                {canEdit && p.status === "in_review" && <GhostButton onClick={() => setDialog("withdraw")}>Withdraw</GhostButton>}
                {canEdit && p.approved_version != null && !p.correction_request && <GhostButton onClick={() => setDialog("correction")}>Request a correction</GhostButton>}
                {canAdminister && (
                  <GhostButton disabled={busy} onClick={() => act(() => catalogueApi.updateProduct(p.id, { is_active: !p.is_active }), p.is_active ? "Product archived." : "Product restored.")}>
                    {p.is_active ? "Archive" : "Restore"}
                  </GhostButton>
                )}
              </div>
            </header>

            {notice && (
              <p role={notice.kind === "error" ? "alert" : "status"} className={`rounded-xl px-4 py-3 text-sm ${notice.kind === "error" ? "bg-danger-soft text-danger" : "bg-primary-soft text-primary"}`}>
                {notice.text}
              </p>
            )}
            <Banners p={p} />

            <nav className="flex gap-1 overflow-x-auto border-b border-border" aria-label="Product sections">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  aria-current={tab === t.key ? "page" : undefined}
                  onClick={() => setTab(t.key)}
                  className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium ${tab === t.key ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"}`}
                >
                  {t.label}
                </button>
              ))}
            </nav>

            {tab === "overview" && <Overview p={p} canEdit={canEdit} />}
            {tab === "batches" && <Batches id={p.id} canCreate={canEdit && p.status === "approved" && p.is_active !== false} />}
            {tab === "activity" && <Activity id={p.id} />}
            {tab === "preview" && <Preview id={p.id} />}
          </>
        )}
      </div>

      {p && dialog === "withdraw" && (
        <ReasonDialog
          title="Withdraw from review"
          body="This returns the product to draft so you can edit it. It's only possible before a reviewer decides."
          action="Withdraw"
          onClose={() => setDialog(null)}
          onSubmit={async (reason) => {
            await catalogueApi.withdrawProduct(p.id, reason);
            setDialog(null);
            setNotice({ kind: "ok", text: "Withdrawn. The product is a draft again." });
            req.reload();
          }}
        />
      )}
      {p && dialog === "correction" && (
        <CorrectionDialog
          product={p}
          onClose={() => setDialog(null)}
          onDone={() => {
            setDialog(null);
            setNotice({ kind: "ok", text: "Correction requested. An AuthentiCheck reviewer will apply it." });
            req.reload();
          }}
        />
      )}
    </>
  );
}

function Banners({ p }: { p: Product }) {
  const box = "rounded-xl px-4 py-3 text-sm";
  const gtin = p.gtin_conflict && typeof p.gtin_conflict === "object" ? p.gtin_conflict : null;
  return (
    <div className="space-y-2">
      {(p.status === "changes_requested" || p.status === "rejected") && (
        <div className={`${box} ${p.status === "rejected" ? "bg-danger-soft text-danger" : "bg-[#fbf0d6] text-[#6b4700]"}`}>
          <p className="font-semibold">{p.status === "rejected" ? "Rejected by the reviewer" : "The reviewer asked for changes"}</p>
          <p className="mt-0.5 whitespace-pre-line">{p.review_note || "No note was left."}</p>
          <p className="mt-1 text-xs opacity-80">Edit the product and submit it again.</p>
        </div>
      )}
      {p.status === "in_review" && (
        <p className={`${box} bg-[#e6eef7] text-[#2b5a8a]`}>
          {p.approved_version != null
            ? "A revision is in review. Consumers keep seeing the last approved values until it is approved."
            : "In review with AuthentiCheck. You can't edit it unless you withdraw it."}
        </p>
      )}
      {p.public_suspended && (
        <p className={`${box} bg-foreground text-white`}>Public verification is suspended by AuthentiCheck. Codes for this product will show as not recognised until it is restored.</p>
      )}
      {p.correction_request && (
        <p className={`${box} bg-[#e6eef7] text-[#2b5a8a]`}>
          Correction requested for {p.correction_request.field.toUpperCase()}: <span className="font-mono">{p.correction_request.requested_value}</span>. {p.correction_request.reason}
        </p>
      )}
      {p.gtin_conflict && (
        <p className={`${box} bg-[#fbf0d6] text-[#6b4700]`}>
          This GTIN is registered against another product{gtin?.name ? ` (${gtin.name})` : ""}. A reviewer has to resolve that before approval.
        </p>
      )}
    </div>
  );
}

function fmtPack(c: Product["pack_configuration"]) {
  if (!c) return "—";
  return typeof c === "string" ? c : `${c.packs} × ${c.per_pack} ${c.unit}`;
}

function Overview({ p, canEdit }: { p: Product; canEdit: boolean }) {
  const facts: [string, React.ReactNode][] = [
    ["Industry", p.industry ? <span className="capitalize">{p.industry}</span> : "—"],
    ["Category", p.category ?? "—"],
    ["Brand", p.brand_name ?? p.brand ?? "—"],
    ["Variant", p.variant ?? "—"],
    ["Size", p.size ?? "—"],
    ["Pack configuration", fmtPack(p.pack_configuration)],
    ...(p.industry === "pharmaceuticals" ? ([["Dosage form", p.dosage_form ?? "—"], ["Strength", p.strength ?? "—"]] as [string, React.ReactNode][]) : []),
    ["SKU", <span key="s" className="font-mono text-xs">{p.sku || "—"}</span>],
    ["GTIN", <span key="g" className="font-mono text-xs">{p.gtin ?? "—"}</span>],
    ["Approved version", p.approved_version ?? "Not approved yet"],
    ["Created", fmtDateTime(p.created_at)],
    ["Last updated", fmtDateTime(p.updated_at)],
  ];
  const pending = p.pending_revision ? (Object.entries(p.pending_revision) as [keyof ProductFields, unknown][]) : [];
  const contact = p.support_contact;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-6">
        <section className={card}>
          <h2 className="text-base font-semibold">Product details</h2>
          <dl className="mt-4 grid gap-x-8 gap-y-3 sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-border/70 pb-2 text-sm">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right">{v}</dd>
              </div>
            ))}
          </dl>
          {p.description && <p className="mt-4 whitespace-pre-line text-sm text-muted"><span className="font-medium text-foreground">Internal notes: </span>{p.description}</p>}
          {p.reference_image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- remote CDN/signed URL, size unknown
            <img src={p.reference_image_url} alt="Reference" className="mt-4 size-28 rounded-xl border border-border object-cover" />
          )}
        </section>

        {pending.length > 0 && (
          <section className={card}>
            <h2 className="text-base font-semibold">Pending revision</h2>
            <p className="mt-1 text-sm text-muted">These values replace the live ones once a reviewer approves.</p>
            <table className="mt-3 w-full text-left text-sm">
              <thead><tr className="text-xs uppercase tracking-wider text-muted"><th className="py-2 pr-4 font-semibold">Field</th><th className="py-2 pr-4 font-semibold">Live</th><th className="py-2 font-semibold">Proposed</th></tr></thead>
              <tbody>
                {pending.map(([k, to]) => (
                  <tr key={k} className="border-t border-border/70 align-top">
                    <td className="py-2 pr-4">{FIELD_LABEL[k] ?? k}</td>
                    <td className="py-2 pr-4 text-muted">{pretty(p[k])}</td>
                    <td className="py-2 font-medium">{pretty(to)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <RegulatoryRefs productId={p.id} canEdit={canEdit && p.status !== "in_review"} />
      </div>

      <div className="space-y-6">
        <section className={card}>
          <h2 className="text-base font-semibold">Usage</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Batches</dt><dd className="tabular-nums">{p.batch_count != null ? num(p.batch_count) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Active batches</dt><dd className="tabular-nums">{p.active_batch_count != null ? num(p.active_batch_count) : "—"}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Codes issued</dt><dd className="tabular-nums">{p.codes_issued != null ? num(p.codes_issued) : "—"}</dd></div>
          </dl>
        </section>

        <section className={card}>
          <h2 className="text-base font-semibold">What consumers see</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex justify-between"><span>Product name</span><span className="text-primary">Always</span></li>
            {Object.entries(VIS_LABEL).map(([k, label]) => {
              const on = p.consumer_visibility?.[k as keyof typeof p.consumer_visibility];
              return <li key={k} className="flex justify-between"><span>{label}</span><span className={on ? "text-primary" : "text-muted"}>{on ? "Shown" : "Hidden"}</span></li>;
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            {contact && (contact.email || contact.phone || contact.url)
              ? `Support contact override: ${[contact.email, contact.phone, contact.url].filter(Boolean).join(" · ")}`
              : "Support contact: company default"}
          </p>
        </section>
      </div>
    </div>
  );
}

function RegulatoryRefs({ productId, canEdit }: { productId: string; canEdit: boolean }) {
  const refs = useApi(() => catalogueApi.listRefs(productId), [productId]);
  const [adding, setAdding] = useState(false);
  const [number, setNumber] = useState("");
  const [authority, setAuthority] = useState("NAFDAC");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function add() {
    if (!number.trim()) return setError("Enter the registration number.");
    setSaving(true);
    setError(null);
    try {
      await catalogueApi.addRef(productId, regulatoryRefBody(authority, number));
      setAdding(false);
      setNumber("");
      refs.reload();
    } catch (e) {
      setError(Object.values(fieldErrors(e))[0] || errorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const list = asList<RegulatoryRef>(refs.data);
  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Regulatory references</h2>
        {canEdit && !adding && <button type="button" onClick={() => setAdding(true)} className="text-sm font-medium text-primary hover:underline">Add reference</button>}
      </div>
      {refs.error ? (
        <div className="mt-3"><ErrorState message="We couldn't load regulatory references." onRetry={refs.reload} /></div>
      ) : refs.loading && !refs.data ? (
        <LoadingSpinner />
      ) : list.length === 0 && !adding ? (
        <p className="mt-3 text-sm text-muted">None added. This is optional.</p>
      ) : (
        <ul className="mt-3 divide-y divide-border/70">
          {list.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span><span className="font-medium">{r.authority}</span> <span className="ml-1 font-mono text-xs">{r.reference_number ?? r.number}</span></span>
              {r.verification_status === "verified" ? (
                <span className="text-right text-xs text-primary">
                  Verified{r.verification_method ? ` · ${r.verification_method}` : ""}{r.verified_at ? ` · ${fmtDate(r.verified_at.slice(0, 10))}` : ""}
                </span>
              ) : (
                <span className="text-xs text-muted">Provided by the manufacturer · not independently checked</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <div className="mt-3 space-y-3">
          <FormError message={error} />
          <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
            <Select label="Authority" value={authority} onChange={(e) => setAuthority(e.target.value)}><option value="NAFDAC">NAFDAC</option></Select>
            <Field label="Registration number" className="font-mono" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button className="!w-auto" loading={saving} onClick={add}>Add</Button>
            <GhostButton onClick={() => { setAdding(false); setError(null); }}>Cancel</GhostButton>
          </div>
        </div>
      )}
    </section>
  );
}

function Batches({ id, canCreate }: { id: string; canCreate: boolean }) {
  const req = useApi(() => catalogueApi.listBatches(id), [id]);
  const rows = asList(req.data);
  return (
    <section className={card}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold">Batches</h2>
        <div className="flex items-center gap-4">
          {canCreate && <Link href={`/issuance/batches/new?product_id=${id}`} className="text-sm font-semibold text-primary hover:underline">New batch</Link>}
          <Link href="/issuance/batches" className="text-sm font-medium text-primary hover:underline">All batches &amp; codes</Link>
        </div>
      </div>
      {req.error ? (
        <div className="mt-3"><ErrorState message={errorMessage(req.error, "We couldn't load batches.")} onRetry={req.reload} /></div>
      ) : req.loading && !req.data ? (
        <LoadingSpinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No batches yet" body="Batches can be added once the product is approved. Approval doesn't issue codes by itself." />
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr className="border-b border-border text-xs uppercase tracking-wider text-muted"><th className="py-2.5 pr-4 font-semibold">Batch</th><th className="py-2.5 pr-4 font-semibold">Manufactured</th><th className="py-2.5 pr-4 font-semibold">Expiry</th><th className="py-2.5 font-semibold">Status</th></tr></thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id} className="border-b border-border/70 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs"><Link href={`/issuance/batches/${b.id}`} className="text-primary underline underline-offset-2">{b.batch_number}</Link></td>
                  <td className="py-3 pr-4 text-muted">{b.manufacture_date ? fmtDate(b.manufacture_date) : "—"}</td>
                  <td className="py-3 pr-4 text-muted">{b.expiry ? fmtDate(b.expiry) : "—"}</td>
                  <td className="py-3 capitalize">{b.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function changesOf(e: ActivityEvent): { field: string; from: unknown; to: unknown }[] {
  if (e.changes?.length) return e.changes;
  const keys = new Set([...Object.keys(e.before ?? {}), ...Object.keys(e.after ?? {})]);
  return [...keys]
    .filter((k) => JSON.stringify(e.before?.[k]) !== JSON.stringify(e.after?.[k]))
    .map((field) => ({ field, from: e.before?.[field], to: e.after?.[field] }));
}

function Activity({ id }: { id: string }) {
  const req = useApi(() => catalogueApi.activity(id), [id]);
  const events = asList(req.data);
  return (
    <section className={card}>
      <h2 className="text-base font-semibold">Activity</h2>
      <p className="text-sm text-muted">The last 100 changes to this product. Times are West Africa Time.</p>
      {req.error ? (
        <div className="mt-3"><ErrorState message={errorMessage(req.error, "We couldn't load activity.")} onRetry={req.reload} /></div>
      ) : req.loading && !req.data ? (
        <LoadingSpinner />
      ) : events.length === 0 ? (
        <EmptyState title="No activity yet" />
      ) : (
        <ol className="mt-4 space-y-4">
          {events.map((e, i) => {
            const actor = typeof e.actor === "string" ? e.actor : e.actor?.name;
            const ch = changesOf(e);
            return (
              <li key={e.id ?? i} className="border-l-2 border-border pl-4">
                <p className="text-sm"><span className="font-medium">{e.action.replace(/[._]/g, " ")}</span>{actor && <span className="text-muted"> · {actor}</span>}</p>
                <p className="text-xs text-muted">{fmtDateTime(e.at)}</p>
                {e.note && <p className="mt-1 text-sm">{e.note}</p>}
                {ch.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5 text-xs">
                    {ch.map((c) => (
                      <li key={c.field}><span className="text-muted">{FIELD_LABEL[c.field] ?? c.field}:</span> <span className="line-through opacity-60">{pretty(c.from)}</span> → <span className="font-medium">{pretty(c.to)}</span></li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

/** Reads the /verify-shaped payload defensively: it may be flat or nested under `product`. */
function toPreview(raw: Record<string, unknown>): PreviewData {
  const prod = ((raw.product as Record<string, unknown> | undefined) ?? raw) as Record<string, string | undefined> & Record<string, never>;
  const batch = (raw.batch ?? undefined) as Record<string, string> | undefined;
  const reg = (raw.regulatory_reference ?? prod.regulatory_reference) as PreviewData["regulatory"] | undefined;
  const image = (raw.reference_image_url ?? prod.reference_image_url ?? prod.image_url) as string | undefined;
  return {
    name: String(prod.name ?? ""),
    brand: typeof prod.brand === "string" ? prod.brand : (prod.brand as { name?: string } | undefined)?.name,
    variantSize: [prod.variant, prod.size].filter(Boolean).join(" · ") || undefined,
    imageUrl: image,
    regulatory: reg,
    batch: batch && { number: batch.batch_number, manufactured: batch.manufacture_date, expiry: batch.expiry },
    support: (raw.support_contact ?? prod.support_contact) as PreviewData["support"],
  };
}

function Preview({ id }: { id: string }) {
  const req = useApi(() => catalogueApi.consumerPreview(id), [id]);
  if (req.loading && !req.data) return <LoadingSpinner />;
  if (req.error) {
    const notLive = req.error instanceof ApiError && req.error.status === 404;
    return notLive
      ? <section className={card}><EmptyState title="Nothing to preview yet" body="Consumers only see a product once it has been approved. This shows exactly what a check would return." /></section>
      : <ErrorState message={errorMessage(req.error, "We couldn't load the preview.")} onRetry={req.reload} />;
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <ConsumerPreview data={toPreview(req.data!)} />
      <section className={card}>
        <h2 className="text-base font-semibold">Exact response</h2>
        <p className="mt-1 text-sm text-muted">This is the last approved version, as the public check returns it. Hidden fields are left out, not blank.</p>
        <pre className="mt-3 max-h-96 overflow-auto rounded-xl bg-background p-4 font-mono text-xs">{JSON.stringify(req.data, null, 2)}</pre>
      </section>
    </div>
  );
}

function CorrectionDialog({ product, onClose, onDone }: { product: Product; onClose: () => void; onDone: () => void }) {
  const [field, setField] = useState<"sku" | "gtin">("sku");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!value.trim() || !reason.trim()) return setError("Enter the corrected value and a reason.");
    setBusy(true);
    try {
      await catalogueApi.requestCorrection(product.id, { field, requested_value: value.trim(), reason: reason.trim() });
      onDone();
    } catch (e) {
      setError(Object.values(fieldErrors(e))[0] || errorMessage(e));
      setBusy(false);
    }
  }
  return (
    <Modal title="Request a correction" onClose={onClose}>
      <p className="text-sm text-muted">SKU and GTIN are locked after approval. A reviewer checks the request, applies it and records the old and new values.</p>
      <div className="mt-4 space-y-3">
        <FormError message={error} />
        <Select label="Field" value={field} onChange={(e) => setField(e.target.value as "sku" | "gtin")}>
          <option value="sku">SKU (now {product.sku})</option>
          <option value="gtin">GTIN (now {product.gtin ?? "none"})</option>
        </Select>
        <Field label="Corrected value" className="font-mono" value={value} onChange={(e) => setValue(e.target.value)} />
        <div>
          <label htmlFor="why" className="mb-1.5 block text-sm font-medium">Reason</label>
          <textarea id="why" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Button className="!w-auto" loading={busy} onClick={go}>Send request</Button>
        </div>
      </div>
    </Modal>
  );
}
