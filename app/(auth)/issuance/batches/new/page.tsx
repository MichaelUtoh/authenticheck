import Link from "next/link";
import { Suspense } from "react";
import { BatchForm } from "@/components/catalogue/BatchForm";
import { Topbar } from "@/components/layout/Topbar";

export default function NewBatchPage() {
  return (
    <>
      <Topbar />
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <Link href="/issuance/batches" className="text-sm text-muted hover:underline">← Batches &amp; codes</Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">New batch</h1>
        <p className="mb-6 mt-1 max-w-2xl text-muted">
          Record a production run for an approved product. Creating a batch doesn&apos;t issue codes; that&apos;s a separate step.
        </p>
        <Suspense fallback={null}>
          <BatchForm />
        </Suspense>
      </div>
    </>
  );
}
