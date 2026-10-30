import Link from "next/link";
import { Suspense } from "react";
import { ProductForm } from "@/components/catalogue/ProductForm";
import { Topbar } from "@/components/layout/Topbar";

export default function NewProductPage() {
  return (
    <>
      <Topbar />
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <Link href="/catalogue/products" className="text-sm text-muted hover:underline">← Products</Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Register a product</h1>
        <p className="mb-6 mt-1 text-muted">Save a draft any time. Required fields are checked when you submit for review.</p>
        <Suspense fallback={null}>
          <ProductForm />
        </Suspense>
      </div>
    </>
  );
}
