import Link from "next/link";
import type { JobRow } from "@/lib/mock/dashboard";
import { JobStatusBadge } from "./JobStatusBadge";

export function RecentJobsTable({ jobs }: { jobs: JobRow[] }) {
  const num = (n: number) => n.toLocaleString("en-US");
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold">Recent issuance jobs</h2>
        <Link href="/issuance/batches" className="text-sm font-medium text-primary underline underline-offset-2">All batches</Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="py-2.5 pr-4 font-semibold">Job</th>
              <th className="py-2.5 pr-4 font-semibold">Batch</th>
              <th className="py-2.5 pr-4 font-semibold">Product</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Requested</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Generated</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Failed</th>
              <th className="py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <tr key={j.id} className="border-b border-border/70 last:border-0">
                <td className="py-3.5 pr-4 font-mono text-xs">
                  <Link href={`/issuance/batches/${j.batch}`} className="text-primary underline underline-offset-2">{j.id}</Link>
                </td>
                <td className="py-3.5 pr-4 font-mono text-xs">{j.batch}</td>
                <td className="py-3.5 pr-4">{j.product}</td>
                <td className="py-3.5 pr-4 text-right tabular-nums">{num(j.requested)}</td>
                <td className="py-3.5 pr-4 text-right tabular-nums">{num(j.generated)}</td>
                <td className="py-3.5 pr-4 text-right tabular-nums">{j.failed}</td>
                <td className="py-3.5"><JobStatusBadge status={j.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
