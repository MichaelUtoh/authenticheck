import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicShell } from "@/components/verify/PublicShell";
import { VerifyResult } from "@/components/verify/VerifyResult";

export const metadata: Metadata = { title: "Check result · AuthentiCheck", robots: { index: false } };

async function Result({ params }: { params: PageProps<"/verify/[code]">["params"] }) {
  const { code } = await params;
  let raw = code;
  try { raw = decodeURIComponent(code); } catch {}
  return <VerifyResult key={raw} rawCode={raw} />;
}

export default function VerifyPage({ params }: PageProps<"/verify/[code]">) {
  return (
    <PublicShell newCheck>
      <Suspense fallback={<div className="mx-auto h-40 max-w-md animate-pulse rounded-2xl bg-white" />}>
        <Result params={params} />
      </Suspense>
    </PublicShell>
  );
}
