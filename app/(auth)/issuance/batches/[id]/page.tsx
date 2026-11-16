import { Suspense } from "react";
import { BatchDetail } from "@/components/issuance/BatchDetail";
import { LiveBatchDetail } from "@/components/issuance/LiveBatchDetail";
import { getBatchDetail } from "@/lib/mock/batches";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id: raw } = await params;
  const id = decodeURIComponent(raw);
  // Sample batches (EN-2409-117 ...) keep the prototype detail view; real batches are read from the API.
  return getBatchDetail(id) ? <BatchDetail id={id} /> : <LiveBatchDetail id={id} />;
}

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  );
}
