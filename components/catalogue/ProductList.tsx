"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KpiCard } from "@/components/analytics/KpiCard";
import { Topbar } from "@/components/layout/Topbar";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Pagination } from "@/components/shared/Pagination";
import { errorMessage } from "@/lib/api/client";
import { asList, catalogueApi, type ProductListParams } from "@/lib/api/catalogue";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { fmtDateTime } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import type { Industry, ProductStatus } from "@/lib/types";
import { ProductBadges, STATUS_LABEL } from "./ProductStatusBadge";

const PAGE_SIZE = 20;
const STATUSES: ProductStatus[] = ["draft", "in_review", "changes_requested", "approved", "rejected"];
const ORDERINGS: { value: NonNullable<ProductListParams["ordering"]>; label: string }[] = [
  { value: "-updated_at", label: "Recently updated" },
  { value: "-created_at", label: "Newest" },
  { value: "name", label: "Name A–Z" },
  { value: "-name", label: "Name Z–A" },
  { value: "sku", label: "SKU A–Z" },
  { value: "-sku", label: "SKU Z–A" },
];

const control = "h-11 rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

/** Counts for the KPI row. Uses `status_counts` when the API sends it, else one cheap call per status. */
function useStatusCounts() {
  return useApi(async () => {
    const first = await catalogueApi.listProducts({ page_size: 1, is_active: true });
    if (first.status_counts) return { total: first.count, counts: first.status_counts };
    const wanted: ProductStatus[] = ["draft", "in_review", "changes_requested"];
    const rest = await Promise.all(wanted.map((status) => catalogueApi.listProducts({ status: [status], page_size: 1, is_active: true })));
    return { total: first.count, counts: Object.fromEntries(wanted.map((s, i) => [s, rest[i].count])) as Partial<Record<ProductStatus, number>> };
  }, []);
}

export function ProductList() {
  const { canEdit } = useCatalogueRole();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statuses, setStatuses] = useState<ProductStatus[]>([]);
  const [brandId, setBrandId] = useState("");
  const [industry, setIndustry] = useState<Industry | "">("");
  const [archived, setArchived] = useState(false);
  const [ordering, setOrdering] = useState<NonNullable<ProductListParams["ordering"]>>("-updated_at");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const brands = useApi(() => catalogueApi.listBrands(), []);
  const stats = useStatusCounts();
  const list = useApi(
    () =>
      catalogueApi.listProducts({
        q: debouncedQ || undefined,
        status: statuses.length ? statuses : undefined,
        brand_id: brandId || undefined,
        industry: industry || undefined,
        is_active: !archived,
        ordering,
        page,
        page_size: PAGE_SIZE,
      }),
    [debouncedQ, statuses, brandId, industry, archived, ordering, page]
  );

  const filtered = !!(debouncedQ || statuses.length || brandId || industry || archived);
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  const toggleStatus = (s: ProductStatus) => reset(setStatuses)(statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s]);

  const rows = list.data?.results ?? [];
  const counts = stats.data?.counts ?? {};

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Products</h1>
            <p className="mt-1 text-muted">Register products, send them for review, and manage what consumers see when they check a code.</p>
          </div>
          {canEdit && (
            <Link href="/catalogue/products/new" className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
              Register a product
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Active products" value={stats.data?.total ?? "—"} note="Archived hidden" />
          <KpiCard label="Drafts" value={counts.draft ?? "—"} note="Not yet submitted" />
          <KpiCard label="In review" value={counts.in_review ?? "—"} note="With AuthentiCheck" />
          <KpiCard label="Changes requested" value={counts.changes_requested ?? "—"} note="Waiting on you" />
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <label className="min-w-[220px] flex-1">
              <span className="sr-only">Search products</span>
              <input type="search" value={q} onChange={(e) => reset(setQ)(e.target.value)} placeholder="Search by name, SKU or brand" className={`${control} w-full bg-background`} />
            </label>
            <label className="sr-only" htmlFor="brand-filter">Brand</label>
            <select id="brand-filter" value={brandId} onChange={(e) => reset(setBrandId)(e.target.value)} className={control}>
              <option value="">All brands</option>
              {asList(brands.data).map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="industry-filter">Industry</label>
            <select id="industry-filter" value={industry} onChange={(e) => reset(setIndustry)(e.target.value as Industry | "")} className={control}>
              <option value="">All industries</option>
              <option value="cosmetics">Cosmetics</option>
              <option value="pharmaceuticals">Pharmaceuticals</option>
            </select>
            <label className="sr-only" htmlFor="ordering">Sort by</label>
            <select id="ordering" value={ordering} onChange={(e) => reset(setOrdering)(e.target.value as typeof ordering)} className={control}>
              {ORDERINGS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <label className="flex h-11 items-center gap-2 rounded-xl border border-border px-3.5 text-sm">
              <input type="checkbox" checked={archived} onChange={(e) => reset(setArchived)(e.target.checked)} className="size-4 accent-[var(--primary)]" />
              Archived
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {STATUSES.map((s) => {
              const on = statuses.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleStatus(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${on ? "border-primary bg-primary-soft text-primary" : "border-border text-muted hover:bg-background"}`}
                >
                  {STATUS_LABEL[s]}
                </button>
              );
            })}
          </div>

          <div className="mt-4 overflow-x-auto">
            {list.error ? (
              <ErrorState message={errorMessage(list.error, "We couldn't load products.")} onRetry={list.reload} />
            ) : list.loading && !list.data ? (
              <LoadingSpinner label="Loading products…" />
            ) : rows.length === 0 ? (
              <EmptyState
                title={filtered ? "No products match these filters" : "No products yet"}
                body={filtered ? "Try clearing a filter or searching for something else." : "Register your first product. You can save a draft and finish it later."}
                action={!filtered && canEdit ? <Link href="/catalogue/products/new" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white">Register a product</Link> : undefined}
              />
            ) : (
              <table className={`w-full min-w-[820px] text-left text-sm transition-opacity ${list.loading ? "opacity-60" : ""}`}>
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                    <th className="py-2.5 pr-4 font-semibold">Product</th>
                    <th className="py-2.5 pr-4 font-semibold">Brand</th>
                    <th className="py-2.5 pr-4 font-semibold">SKU</th>
                    <th className="py-2.5 pr-4 font-semibold">Status</th>
                    <th className="py-2.5 pr-4 text-right font-semibold">Batches</th>
                    <th className="py-2.5 font-semibold">Updated (WAT)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id} className="border-b border-border/70 last:border-0 hover:bg-background/60">
                      <td className="py-3.5 pr-4">
                        <Link href={`/catalogue/products/${p.id}`} className="font-medium text-primary underline-offset-2 hover:underline">{p.name || "Untitled draft"}</Link>
                        <span className="block text-xs text-muted">{[p.variant, p.size].filter(Boolean).join(" · ") || "—"}</span>
                      </td>
                      <td className="py-3.5 pr-4">{p.brand_name ?? p.brand ?? "—"}</td>
                      <td className="py-3.5 pr-4 font-mono text-xs">{p.sku || "—"}</td>
                      <td className="py-3.5 pr-4"><ProductBadges product={p} /></td>
                      <td className="py-3.5 pr-4 text-right tabular-nums">{p.batch_count ?? "—"}</td>
                      <td className="py-3.5 text-muted">{fmtDateTime(p.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {list.data && <Pagination page={page} pageSize={PAGE_SIZE} count={list.data.count} onChange={setPage} />}
        </section>
      </div>
    </>
  );
}
