import Link from "next/link";
import { Icon, type IconName } from "@/components/ui/Icons";
import { fmtDate } from "@/lib/format";
import type { ProductInfo } from "@/lib/api/verify";

export const primaryBtn = "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";
export const outlineBtn = "inline-flex h-12 w-full items-center justify-center rounded-xl border border-primary bg-white px-4 font-semibold text-primary transition hover:bg-primary-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export const reportHref = (code?: string) => (code ? `/report?code=${code}` : "/report");

export function PrimaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className={primaryBtn}>{children}</Link>;
}
export function OutlineLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className={outlineBtn}>{children}</Link>;
}

/**
 * Mobile: banner, guidance, product, actions in one column.
 * Desktop: status + actions on the left, product details beside them.
 */
export function ResultGrid({ status, product, actions }: { status: React.ReactNode; product?: React.ReactNode; actions: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-md gap-4 lg:max-w-4xl lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-x-8">
      <div className="space-y-4 lg:col-start-1">{status}</div>
      {product && <div className="space-y-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">{product}</div>}
      <div className="space-y-3 lg:col-start-1">{actions}</div>
    </div>
  );
}

const tones = {
  ok: { box: "bg-primary-soft", ink: "text-primary", pill: "bg-primary text-white", ring: "border-primary/25" },
  caution: { box: "bg-caution-soft", ink: "text-caution-ink", pill: "bg-caution-ink text-white", ring: "border-caution/50" },
  danger: { box: "bg-danger text-white", ink: "text-white", pill: "bg-white text-danger", ring: "border-danger" },
  info: { box: "bg-info-soft", ink: "text-info-ink", pill: "bg-info-soft text-info-ink", ring: "border-border" },
  neutral: { box: "bg-background", ink: "text-muted", pill: "bg-background text-muted", ring: "border-border" },
} as const;
export type Tone = keyof typeof tones;

/** Coloured result headline. */
export function Banner({ tone, icon, badge, title, children }: { tone: Tone; icon: IconName; badge: string; title: string; children?: React.ReactNode }) {
  const t = tones[tone];
  return (
    <section className={`overflow-hidden rounded-2xl border ${t.ring}`} aria-live="polite">
      <div className={`${t.box} p-5`}>
        <div className="flex items-center gap-2.5">
          <Icon name={icon} className={`size-7 ${t.ink}`} />
          <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${t.pill}`}>{badge}</span>
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{title}</h1>
      </div>
      {children}
    </section>
  );
}

export function Card({ title, tone = "plain", children }: { title?: string; tone?: "plain" | "caution" | "info" | "danger"; children: React.ReactNode }) {
  const cls = { plain: "border-border bg-white", caution: "border-caution/40 bg-caution-soft", info: "border-transparent bg-info-soft", danger: "border-danger/30 bg-white" }[tone];
  return (
    <section className={`rounded-2xl border p-4 ${cls}`}>
      {title && <h2 className={`font-semibold ${tone === "danger" ? "text-xs uppercase tracking-widest text-danger" : ""}`}>{title}</h2>}
      <div className={title ? "mt-2 text-[15px] leading-relaxed" : "text-[15px] leading-relaxed"}>{children}</div>
    </section>
  );
}

const row = "flex items-baseline justify-between gap-4 border-t border-border py-2.5 text-sm first:border-t-0";

export function ProductCard({ product, code }: { product: ProductInfo; code?: string }) {
  const { batch, regulatory } = product;
  return (
    <section className="rounded-2xl border border-border bg-white p-4">
      <div className="flex gap-3">
        {product.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- remote CDN/signed URL, size unknown
          <img src={product.imageUrl} alt="" className="size-16 shrink-0 rounded-xl border border-border object-cover" />
        )}
        <div className="min-w-0">
          {product.brand && <p className="text-sm text-muted">{product.brand}</p>}
          <p className="break-words text-lg font-semibold leading-snug">{product.name}</p>
          {product.variantSize && <p className="text-sm text-muted">{product.variantSize}</p>}
        </div>
      </div>
      <div className="mt-3">
        {batch?.number && <div className={row}><span className="text-muted">Batch</span><span className="font-mono">{batch.number}</span></div>}
        {batch?.manufactured && <div className={row}><span className="text-muted">Production date</span><span className="font-medium">{fmtDate(batch.manufactured)}</span></div>}
        {batch?.expiry && <div className={row}><span className="text-muted">Expiry date</span><span className="font-medium">{fmtDate(batch.expiry.length === 7 ? `${batch.expiry}-01` : batch.expiry)}</span></div>}
        {code && <div className={row}><span className="text-muted">Code</span><span className="font-mono">{code}</span></div>}
        {regulatory && (
          <div className="border-t border-border py-2.5 text-sm">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-muted">{regulatory.authority}</span>
              <span className="font-mono">{regulatory.number}</span>
            </div>
            <p className="mt-1.5 rounded-md bg-background px-2 py-1 text-xs text-muted">
              {regulatory.verified ? "Checked by AuthentiCheck" : "Provided by the manufacturer · not independently checked"}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

/** "Questions about this product? Contact X on …", only with details the manufacturer chose to show. */
export function SupportLine({ product, label = "Questions about this product?" }: { product?: ProductInfo; label?: string }) {
  const s = product?.support;
  const ways = [s?.phone, s?.email, s?.url].filter(Boolean);
  if (!ways.length) return null;
  return (
    <p className="text-sm text-muted">
      {label} Contact {product?.manufacturer ?? "the manufacturer"} on {ways.join(" or ")}.
    </p>
  );
}

const cardTones = {
  info: { ring: "border-border", pill: "bg-info-soft text-info-ink", icon: "text-info-ink" },
  neutral: { ring: "border-border", pill: "bg-background text-foreground/80", icon: "text-foreground/80" },
  danger: { ring: "border-danger/30", pill: "bg-danger-soft text-danger", icon: "text-danger" },
  caution: { ring: "border-caution/60", pill: "bg-caution-soft text-caution-ink", icon: "text-caution-ink" },
} as const;

/** The "other result states" card: one white card, tinted pill, icon, title, content, actions pinned to the bottom. */
export function StateCard({ tone, badge, icon, title, children, actions }: { tone: keyof typeof cardTones; badge: string; icon: IconName; title: string; children?: React.ReactNode; actions?: React.ReactNode }) {
  const t = cardTones[tone];
  return (
    <section aria-live="polite" className={`mx-auto flex min-h-[32rem] w-full max-w-md flex-col rounded-3xl border bg-white p-6 ${t.ring}`}>
      <span className={`w-fit rounded-full px-3 py-1 text-sm font-bold uppercase tracking-wider ${t.pill}`}>{badge}</span>
      <Icon name={icon} className={`mt-5 size-9 ${t.icon}`} />
      <h1 className="mt-4 text-2xl font-bold leading-tight">{title}</h1>
      <div className="mt-4 flex flex-1 flex-col text-base leading-relaxed text-foreground/85">
        <div className="space-y-4">{children}</div>
        {actions && <div className="mt-auto space-y-2.5 pt-8 [&>a]:h-14 [&>a]:text-[17px] [&>button]:h-14 [&>button]:text-[17px]">{actions}</div>}
      </div>
    </section>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl bg-background p-4 text-[15px] leading-relaxed">{children}</div>;
}

/** tel:/mailto:/web link for the manufacturer, best channel first. */
export function contactHref(product?: ProductInfo) {
  const s = product?.support;
  if (s?.phone) return `tel:${s.phone.replace(/\s/g, "")}`;
  if (s?.email) return `mailto:${s.email}`;
  return s?.url;
}
