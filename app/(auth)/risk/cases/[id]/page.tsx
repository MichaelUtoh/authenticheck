import { Suspense } from "react";
import { CaseDetail } from "@/components/risk/CaseDetail";

async function Detail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseDetail id={decodeURIComponent(id)} />;
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={null}>
      <Detail params={params} />
    </Suspense>
  );
}
