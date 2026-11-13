import type { Metadata } from "next";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icons";
import { CheckForm } from "@/components/verify/CheckForm";
import { ScanButton } from "@/components/verify/QrScanner";
import { PublicShell } from "@/components/verify/PublicShell";

export const metadata: Metadata = {
  title: "Check a product code · AuthentiCheck",
  description: "Scan the QR code on the pack, or type the code printed beside it. No app or account needed.",
};

export default function Home() {
  return (
    <PublicShell>
      <div className="mx-auto grid max-w-md gap-8 lg:max-w-4xl lg:grid-cols-2 lg:items-start lg:gap-14 lg:pt-6">
        <section>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Verify it. Trust it.</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight lg:text-5xl">Check a product code</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">Scan the QR code on the pack, or type the code printed beside it. No app or account needed.</p>

          <section className="mt-6 rounded-2xl border border-border bg-white p-4 text-[15px] leading-relaxed lg:mt-10">
            <h2 className="font-semibold">What a check can tell you</h2>
            <ul className="mt-3 space-y-3">
              <li className="flex gap-3"><Icon name="checkCircle" className="mt-0.5 size-6 shrink-0 text-primary" />Whether the code matches a record the manufacturer registered, and whether it has been checked before.</li>
              <li className="flex gap-3"><Icon name="info" className="mt-0.5 size-6 shrink-0 text-caution-ink" />It can&apos;t prove the item in your hand is genuine. Codes can be copied, so also check the seal, the printing and where you bought it.</li>
            </ul>
          </section>
        </section>

        <section className="space-y-5 lg:rounded-2xl lg:border lg:border-border lg:bg-white lg:p-6">
          <ScanButton />
          <div className="flex items-center gap-3 text-sm text-muted" aria-hidden>
            <span className="h-px flex-1 bg-border" />or type the code<span className="h-px flex-1 bg-border" />
          </div>
          <Suspense fallback={<div className="h-48" />}>
            <CheckForm />
          </Suspense>
        </section>
      </div>
    </PublicShell>
  );
}
