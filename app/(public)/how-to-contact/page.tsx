import type { Metadata } from "next";
import { OutlineLink, PrimaryLink } from "@/components/verify/parts";
import { PublicShell } from "@/components/verify/PublicShell";

export const metadata: Metadata = { title: "How to contact a manufacturer · AuthentiCheck" };

export default function HowToContact() {
  return (
    <PublicShell newCheck>
      <div className="mx-auto max-w-md space-y-4">
        <h1 className="text-2xl font-bold">How to contact a manufacturer</h1>
        <ul className="list-disc space-y-2 pl-5 text-[17px] leading-relaxed">
          <li>Look on the pack, label or leaflet for the manufacturer&apos;s name, phone number or email.</li>
          <li>If the pack has no details, ask the seller who supplied it.</li>
          <li>Have the product name, batch number and the code you checked ready.</li>
        </ul>
        <p className="text-muted">A code we can&apos;t find doesn&apos;t mean the product is fake, but ask before you use it.</p>
        <div className="space-y-2.5 pt-4">
          <PrimaryLink href="/">Check another code</PrimaryLink>
          <OutlineLink href="/report">Report a concern</OutlineLink>
        </div>
      </div>
    </PublicShell>
  );
}
