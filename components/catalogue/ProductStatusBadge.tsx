import type { Product, ProductStatus } from "@/lib/types";

const styles: Record<ProductStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-black/5 text-foreground/80" },
  in_review: { label: "In review", cls: "bg-[#e6eef7] text-[#2b5a8a]" },
  approved: { label: "Approved", cls: "bg-primary-soft text-primary" },
  changes_requested: { label: "Changes requested", cls: "bg-[#fbf0d6] text-[#8a5a00]" },
  rejected: { label: "Rejected", cls: "bg-danger-soft text-danger" },
};

const pill = "inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold";

export const STATUS_LABEL = Object.fromEntries(Object.entries(styles).map(([k, v]) => [k, v.label])) as Record<ProductStatus, string>;

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const s = styles[status] ?? styles.draft;
  return <span className={`${pill} ${s.cls}`}>{s.label}</span>;
}

/** Status plus the secondary states that matter on a list row. */
export function ProductBadges({ product }: { product: Pick<Product, "status" | "is_active" | "public_suspended" | "pending_revision"> }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ProductStatusBadge status={product.status} />
      {product.pending_revision && product.status === "in_review" && (
        <span className={`${pill} bg-[#e6eef7] text-[#2b5a8a]`}>Revision pending</span>
      )}
      {product.public_suspended && <span className={`${pill} bg-foreground text-white`}>Suspended</span>}
      {!product.is_active && <span className={`${pill} bg-black/5 text-muted`}>Archived</span>}
    </div>
  );
}
