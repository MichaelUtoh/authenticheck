import { fmtDate } from "@/lib/format";
import type { RefVerification, SupportContact } from "@/lib/types";

export interface PreviewData {
  name: string;
  brand?: string;
  variantSize?: string;
  imageUrl?: string | null;
  regulatory?: { authority: string; number: string; verification?: RefVerification; method?: string; checked_at?: string };
  batch?: { number?: string; manufactured?: string; expiry?: string };
  support?: SupportContact | null;
}

const row = "flex justify-between gap-4 border-t border-border/70 py-2 text-sm";

/** What a consumer sees after a first successful check. Hidden fields are omitted, never blank. */
export function ConsumerPreview({ data, sample }: { data: PreviewData; sample?: boolean }) {
  const { regulatory: reg, batch, support } = data;
  const hasSupport = support && (support.email || support.phone || support.url);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white">
      <div className="bg-primary-soft px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">First check</p>
        <p className="mt-0.5 text-sm text-foreground/80">This code is registered and hasn&apos;t been checked before.</p>
      </div>
      <div className="p-4">
        <div className="flex gap-3">
          {data.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- remote CDN/signed URL, size unknown
            <img src={data.imageUrl} alt="" className="size-16 shrink-0 rounded-lg border border-border object-cover" />
          ) : null}
          <div className="min-w-0">
            <p className="break-words font-semibold">{data.name || "Product name"}</p>
            {data.brand && <p className="text-sm text-muted">{data.brand}</p>}
            {data.variantSize && <p className="text-sm text-muted">{data.variantSize}</p>}
          </div>
        </div>

        <div className="mt-3">
          {batch?.number && (
            <div className={row}><span className="text-muted">Batch</span><span className="font-mono text-xs">{batch.number}</span></div>
          )}
          {batch?.manufactured && (
            <div className={row}><span className="text-muted">Manufactured</span><span>{fmtDate(batch.manufactured)}</span></div>
          )}
          {batch?.expiry && (
            <div className={row}><span className="text-muted">Best before</span><span>{fmtDate(batch.expiry)}</span></div>
          )}
          {reg && (
            <div className={row}>
              <span className="text-muted">{reg.authority}</span>
              <span className="text-right">
                <span className="font-mono text-xs">{reg.number}</span>
                <span className="block text-xs text-muted">
                  {reg.verification === "verified"
                    ? `Checked by AuthentiCheck${reg.method ? ` · ${reg.method}` : ""}${reg.checked_at ? ` · ${reg.checked_at.slice(0, 10)}` : ""}`
                    : "Provided by the manufacturer · not independently checked"}
                </span>
              </span>
            </div>
          )}
          {hasSupport && (
            <div className={row}>
              <span className="text-muted">Questions?</span>
              <span className="space-y-0.5 text-right text-xs">
                {support.email && <span className="block">{support.email}</span>}
                {support.phone && <span className="block">{support.phone}</span>}
                {support.url && <span className="block break-all">{support.url}</span>}
              </span>
            </div>
          )}
        </div>

        <p className="mt-3 text-xs text-muted">A registered code does not, on its own, prove a product is genuine. If anything looks wrong, contact the manufacturer.</p>
      </div>
      {sample && <p className="border-t border-border bg-background px-4 py-2 text-xs text-muted">Preview with a sample batch. Real values come from the batch scanned.</p>}
    </div>
  );
}
