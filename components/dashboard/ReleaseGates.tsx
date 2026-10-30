import { Icon } from "@/components/ui/Icons";

const pharma = [
  ["Qualified NAFDAC / GS1 review", "In progress"],
  ["Identifier & data-carrier decision", "Not started"],
  ["Source of truth vs existing system", "Not started"],
  ["Recall workflow & consumer copy", "Not started"],
  ["Reporting & retention confirmed", "Not started"],
] as const;

export function ReleaseGates() {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold">Release gates</h2>

      <div className="mt-4 rounded-xl bg-background p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Cosmetics pilot</h3>
          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">Live</span>
        </div>
        <p className="mt-2 text-sm text-muted">
          Product data, label artwork and consumer wording approved · print/scan tests passed for 3 pack formats · support and investigation owner named.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-border p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Pharmaceuticals</h3>
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-xs font-semibold text-white">
            <Icon name="lock" className="size-3" /> Locked
          </span>
        </div>
        <ul className="mt-3 space-y-1.5 text-sm">
          {pharma.map(([item, state]) => (
            <li key={item} className="flex justify-between gap-3">
              <span>{item}</span>
              <span className={`shrink-0 ${state === "In progress" ? "font-medium text-caution" : "text-muted"}`}>{state}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Live medicine checks stay off until every item is complete.</p>
      </div>
    </section>
  );
}
