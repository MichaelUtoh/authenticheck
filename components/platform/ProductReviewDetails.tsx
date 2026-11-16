import type { Product, ProductFields } from "@/lib/types";

const LABEL: Record<string, string> = {
  name: "Name", brand_id: "Brand", variant: "Variant", size_value: "Size", size_unit: "Size unit", category: "Category", sku: "SKU", gtin: "GTIN",
  pack_configuration: "Pack configuration", dosage_form: "Dosage form", strength: "Strength", reference_image_id: "Reference image",
  consumer_visibility: "Consumer visibility", support_contact: "Support contact", description: "Internal notes", industry: "Industry",
};
const VIS: Record<string, string> = {
  brand: "Brand", variant_size: "Variant and size", batch_number: "Batch number", manufacture_date: "Manufacture date",
  expiry: "Expiry / best before", regulatory_reference: "Regulatory reference", product_image: "Product image", support_contact: "Support contact",
};

const show = (v: unknown): string => {
  if (v == null || v === "") return "—";
  if (typeof v !== "object") return String(v);
  const o = v as Record<string, unknown>;
  if ("packs" in o) return `${o.packs} × ${o.per_pack} ${o.unit}`;
  return Object.entries(o).filter(([, x]) => x != null && x !== "").map(([k, x]) => `${VIS[k] ?? k}: ${typeof x === "boolean" ? (x ? "shown" : "hidden") : String(x)}`).join(" · ") || "—";
};

const pack = (c: Product["pack_configuration"]) => (c ? show(c) : "—");

/** What a reviewer needs to decide, read from the queue row (no separate staff detail endpoint yet: PLT-2). */
export function ProductReviewDetails({ p }: { p: Product }) {
  const brand = p.brand_name ?? p.brand;
  const facts: [string, string][] = [
    ["Industry", p.industry ?? "—"],
    ["Brand", brand ?? "—"],
    ["Variant", p.variant ?? "—"],
    ["Size", p.size ?? "—"],
    ["Pack configuration", pack(p.pack_configuration)],
    ...(p.industry === "pharmaceuticals" ? ([["Dosage form", p.dosage_form ?? "—"], ["Strength", p.strength ?? "—"]] as [string, string][]) : []),
    ["Category", p.category ?? "—"],
    ["SKU", p.sku || "—"],
    ["GTIN", p.gtin ?? "—"],
  ];
  const visible = p.consumer_visibility ? Object.entries(p.consumer_visibility).filter(([, on]) => on).map(([k]) => VIS[k] ?? k) : [];
  const contact = p.support_contact ? [p.support_contact.email, p.support_contact.phone, p.support_contact.url].filter(Boolean).join(" · ") : "";
  const changes = p.pending_revision ? (Object.entries(p.pending_revision) as [keyof ProductFields, unknown][]) : [];
  const gtinConflict = p.gtin_conflict && (typeof p.gtin_conflict === "object" ? p.gtin_conflict.name ?? "another product" : "another product");

  return (
    <div className="mt-3 space-y-4 rounded-xl bg-background p-4 text-sm">
      {gtinConflict && (
        <p className="rounded-lg bg-caution-soft px-3 py-2 text-caution">This GTIN is already registered against {gtinConflict}. Approving will ask you to record how the conflict was resolved.</p>
      )}
      {p.correction_request && (
        <p className="rounded-lg bg-black/5 px-3 py-2">
          The manufacturer asked to correct the <b className="uppercase">{p.correction_request.field}</b> to <span className="font-mono">{p.correction_request.requested_value}</span>: {p.correction_request.reason}
        </p>
      )}

      {changes.length > 0 && (
        <div>
          <h3 className="font-semibold">What this revision changes</h3>
          <table className="mt-2 w-full text-left">
            <thead><tr className="text-xs uppercase tracking-wider text-muted"><th className="py-1.5 pr-4 font-semibold">Field</th><th className="py-1.5 pr-4 font-semibold">Live</th><th className="py-1.5 font-semibold">Proposed</th></tr></thead>
            <tbody>
              {changes.map(([k, to]) => (
                <tr key={k} className="border-t border-border/70 align-top">
                  <td className="py-1.5 pr-4">{LABEL[k] ?? k}</td>
                  <td className="py-1.5 pr-4 text-muted">{show((p as unknown as Record<string, unknown>)[k])}</td>
                  <td className="py-1.5 font-medium">{show(to)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dl className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
        {facts.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-1.5">
            <dt className="text-muted">{k}</dt>
            <dd className={`text-right ${k === "SKU" || k === "GTIN" ? "font-mono text-xs" : "capitalize"}`}>{v}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="space-y-1.5">
          <p><span className="text-muted">Shown to consumers: </span>{visible.length ? visible.join(", ") : "nothing optional"}</p>
          <p><span className="text-muted">Support contact override: </span>{contact || "none (uses the company default)"}</p>
          {p.review_note && <p><span className="text-muted">Last review note: </span>{p.review_note}</p>}
          <p className="text-xs text-muted">Regulatory references and the activity history aren&apos;t available to staff yet.</p>
        </div>
        {p.reference_image_url && (
          // eslint-disable-next-line @next/next/no-img-element -- remote CDN/signed URL, size unknown
          <img src={p.reference_image_url} alt="Reference" className="size-28 rounded-xl border border-border object-cover" />
        )}
      </div>
    </div>
  );
}
