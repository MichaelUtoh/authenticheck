import { fmtDateTime } from "@/lib/format";
import type { CheckOutcome } from "@/lib/api/verify";
import { fmtDate } from "@/lib/format";
import { Banner, Card, Note, OutlineLink, PrimaryLink, ProductCard, ResultGrid, StateCard, SupportLine, contactHref, primaryBtn, reportHref } from "./parts";

const wat = (iso?: string) => (iso ? `${fmtDateTime(iso)} WAT` : "");
const again = <PrimaryLink href="/">Check another code</PrimaryLink>;

export function FirstCheck({ o }: { o: CheckOutcome }) {
  const p = o.product!;
  return (
    <ResultGrid
      status={
        <>
          <Banner tone="ok" icon="checkCircle" badge="First check" title="This code is registered" />
          <Card title="What this result means" tone="caution">
            <p>The code is registered. On its own, that doesn&apos;t prove this pack is genuine — a real code can be copied onto a fake one. Also check:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>The seal is unbroken</li>
              <li>Printing is sharp and spelling is correct</li>
              <li>You bought it from a seller you trust</li>
            </ul>
          </Card>
        </>
      }
      product={<><ProductCard product={p} /><SupportLine product={p} /></>}
      actions={<><OutlineLink href={reportHref(o.code)}>Something looks wrong? Report it</OutlineLink>{again}</>}
    />
  );
}

export function RepeatCheck({ o }: { o: CheckOutcome }) {
  const p = o.product!;
  return (
    <ResultGrid
      status={
        <>
          <Banner tone="caution" icon="clock" badge="Checked before" title="This code is registered, and it has been checked before">
            <dl className="space-y-2 border-t border-caution/40 bg-white p-4 text-sm">
              {o.firstCheckedAt && <div className="flex justify-between gap-4"><dt className="text-muted">First recorded check</dt><dd className="font-semibold">{wat(o.firstCheckedAt)}</dd></div>}
              <div className="flex justify-between gap-4"><dt className="text-muted">This check</dt><dd className="font-semibold">{wat(o.checkedAt)}</dd></div>
            </dl>
          </Banner>
          <h2 className="pt-1 font-semibold">Which sounds like you?</h2>
          <Card title="You or the seller checked it earlier"><p className="text-muted">That&apos;s expected. A repeat check on its own isn&apos;t a problem.</p></Card>
          <section className="rounded-2xl border border-caution/60 bg-white p-4">
            <h3 className="font-semibold">It&apos;s a sealed pack you&apos;ve just bought</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-muted">The code may have been copied onto another pack. Look closely at the seal and printing, and tell us — it helps the manufacturer investigate.</p>
          </section>
        </>
      }
      product={<><ProductCard product={p} code={o.code} /><SupportLine product={p} /></>}
      actions={<><PrimaryLink href={reportHref(o.code)}>Report a concern</PrimaryLink><OutlineLink href="/">Check another code</OutlineLink></>}
    />
  );
}

export function Withdrawn({ o }: { o: CheckOutcome }) {
  const p = o.product!;
  return (
    <ResultGrid
      status={
        <>
          <Banner tone="danger" icon="warn" badge="Withdrawn" title="The manufacturer has withdrawn this batch">
            {o.effectiveAt && <p className="-mt-2 bg-danger px-5 pb-5 text-white">Effective {wat(o.effectiveAt)}</p>}
          </Banner>
          <Card title="MANUFACTURER'S INSTRUCTIONS" tone="danger">
            <p className="text-lg font-semibold leading-snug">{o.instructions ?? "Do not use this pack. Return it to the pharmacy or shop where you bought it."}</p>
            {o.approvedBy && <p className="mt-3 text-sm text-muted">Approved by {o.approvedBy}{o.effectiveAt ? ` · ${o.effectiveAt.slice(0, 10)}` : ""}</p>}
          </Card>
          {p.isMedicine && (
            <Card tone="info">
              <p className="font-semibold">Already taken this medicine?</p>
              <p className="mt-1 text-info-ink/90">Speak to a pharmacist or doctor if you feel unwell or have questions. AuthentiCheck can&apos;t give medical advice.</p>
            </Card>
          )}
        </>
      }
      product={
        <>
          <ProductCard product={p} code={o.code} />
          <SupportLine product={p} label="Get help:" />
        </>
      }
      actions={<><OutlineLink href={reportHref(o.code)}>Report a concern</OutlineLink>{again}</>}
    />
  );
}

export function Deactivated({ o }: { o: CheckOutcome }) {
  const p = o.product;
  const s = p?.support;
  const href = contactHref(p);
  const contact = [s?.phone, s?.email].filter(Boolean).join(" · ");
  return (
    <StateCard
      tone="danger" badge="Deactivated" icon="ban" title="This code is no longer active"
      actions={
        <>
          <a href={href ?? "/how-to-contact"} className={primaryBtn}>Contact manufacturer</a>
          <OutlineLink href={reportHref(o.code)}>Report a concern</OutlineLink>
        </>
      }
    >
      <p>The manufacturer has blocked this code, so it can&apos;t be used to check this pack. Contact them before using the product.</p>
      <Note>
        <p className="text-muted">Manufacturer</p>
        <p className="font-semibold text-foreground">{[p?.manufacturer ?? p?.brand, contact].filter(Boolean).join(" · ") || "See the pack for their details"}</p>
      </Note>
    </StateCard>
  );
}

export function Expired({ o }: { o: CheckOutcome }) {
  const b = o.product?.batch;
  const expiry = b?.expiry ? fmtDate(b.expiry.length === 7 ? `${b.expiry}-01` : b.expiry) : undefined;
  return (
    <StateCard tone="caution" badge="Expired" icon="calendarX" title="This product is past its expiry date" actions={again}>
      {(expiry || b?.number) && (
        <dl className="flex gap-10 text-[15px]">
          {expiry && <div><dt className="text-muted">Expired</dt><dd className="font-bold text-foreground">{expiry}</dd></div>}
          {b?.number && <div><dt className="text-muted">Batch</dt><dd className="font-mono font-semibold text-foreground">{b.number}</dd></div>}
        </dl>
      )}
      <p>The code is registered, but the batch is out of date. Don&apos;t use it — return it to the seller. For a medicine, ask a pharmacist.</p>
    </StateCard>
  );
}

export function NotRecognised({ o }: { o: CheckOutcome }) {
  return (
    <StateCard
      tone="info" badge="Not recognised" icon="searchX" title="We couldn't find this code"
      actions={<><PrimaryLink href={`/?code=${o.code}`}>Edit the code</PrimaryLink><OutlineLink href="/how-to-contact">How to contact a manufacturer</OutlineLink></>}
    >
      <p>Check it&apos;s typed exactly as printed — 0 (zero) and O look alike. If it still doesn&apos;t match, contact the manufacturer before you use the product.</p>
      <p className="text-muted">This doesn&apos;t mean the product is fake.</p>
    </StateCard>
  );
}

export function Unavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <StateCard
      tone="neutral" badge="Unavailable" icon="wifiOff" title="We can't check codes right now"
      actions={<button onClick={onRetry} className={primaryBtn}>Try again</button>}
    >
      <p>Our service didn&apos;t respond, so there&apos;s no result. This is not a pass or a fail. Please try again in a few minutes.</p>
      <Note>Offline? Checks need an internet connection — earlier results aren&apos;t shown as current.</Note>
    </StateCard>
  );
}
