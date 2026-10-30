import { Suspense } from "react";
import { BatchDetail } from "@/components/issuance/BatchDetail";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BatchDetail id={decodeURIComponent(id)} />;
}

export default function BatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  );
}
