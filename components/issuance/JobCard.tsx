import { num } from "@/lib/format";

interface Issuance {
  requested: number;
  generated: number;
  failed: number;
  exported: number;
  cancelled: number;
  deactivated: number;
}

export function JobCard({
  job,
  issuance,
  onResume,
}: {
  job: { id: string; startedAt: string; startedBy: string; key: string };
  issuance: Issuance;
  onResume: () => void;
}) {
  const pct = Math.min(100, (issuance.generated / issuance.requested) * 100);
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold">
          Issuance job <span className="font-mono">{job.id}</span>
        </h2>
        <p className="text-xs text-muted">
          Started {job.startedAt} by {job.startedBy} · key <span className="font-mono">{job.key}</span>
        </p>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/5" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-sm text-muted">
        <b className="text-foreground">{num(issuance.generated)}</b> of {num(issuance.requested)} generated
        {issuance.failed > 0 && <span className="ml-3">{num(issuance.failed)} failed</span>}
      </p>

      {issuance.failed > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#fdf1d8] p-4 text-sm">
          <p>
            <b>{num(issuance.failed)} codes failed to generate.</b> Resuming is safe: it only creates the missing codes and never duplicates ones already made.
          </p>
          <button type="button" onClick={onResume} className="h-11 rounded-xl bg-foreground px-5 text-sm font-semibold text-white hover:bg-black">
            Resume {num(issuance.failed)} codes
          </button>
        </div>
      )}
    </section>
  );
}

export function IssuanceStats({ issuance }: { issuance: Issuance }) {
  const tiles: [string, number][] = [
    ["Requested", issuance.requested],
    ["Generated", issuance.generated],
    ["Failed", issuance.failed],
    ["Exported", issuance.exported],
    ["Cancelled", issuance.cancelled],
    ["Deactivated", issuance.deactivated],
  ];
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold">Code issuance</h2>
      <p className="text-sm text-muted">Recorded by AuthentiCheck</p>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map(([label, value]) => (
          <div key={label} className="rounded-xl bg-background p-3.5">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{num(value)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
