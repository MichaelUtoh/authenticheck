"use client";

import Link from "next/link";
import { Topbar } from "@/components/layout/Topbar";
import { ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { asList, catalogueApi } from "@/lib/api/catalogue";
import { errorMessage } from "@/lib/api/client";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { useApi } from "@/lib/hooks/useApi";
import { ProductForm } from "./ProductForm";

export function ProductEdit({ id }: { id: string }) {
  const { canEdit } = useCatalogueRole();
  const req = useApi(async () => {
    const [product, refs] = await Promise.all([catalogueApi.getProduct(id), catalogueApi.listRefs(id).catch(() => null)]);
    return { product, ref: asList(refs)[0] ?? null };
  }, [id]);
  const product = req.data?.product;

  return (
    <>
      <Topbar />
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <Link href={`/catalogue/products/${id}`} className="text-sm text-muted hover:underline">← Back to product</Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Edit product</h1>
        <div className="mt-6">
          {req.error ? (
            <ErrorState message={errorMessage(req.error, "We couldn't load this product.")} onRetry={req.reload} />
          ) : !product ? (
            <LoadingSpinner />
          ) : product.status === "in_review" ? (
            <ErrorState message="This product is in review and can't be edited. Withdraw it from the product page first." />
          ) : !canEdit ? (
            <ErrorState message="Your role can't edit products." />
          ) : (
            <ProductForm product={product} regRef={req.data?.ref} />
          )}
        </div>
      </div>
    </>
  );
}
