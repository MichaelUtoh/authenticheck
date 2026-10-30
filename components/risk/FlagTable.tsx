import Link from "next/link";
import type { FlagRow } from "@/lib/mock/dashboard";
import { FlagSeverityBadge } from "./FlagSeverityBadge";

export function FlagTable({ flags }: { flags: FlagRow[] }) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Flags needing review</h2>
          <p className="mt-0.5 text-sm text-muted">A flag is a lead for review, not proof of counterfeiting. Flags are never shown to consumers.</p>
        </div>
        <Link href="/risk/cases" className="text-sm font-medium text-primary underline underline-offset-2">Open investigations</Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              {["Flag", "Rule", "Code / scope", "Product", "Severity", "Age", "Status"].map((h) => (
                <th key={h} className="py-2.5 pr-4 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {flags.map((f) => (
              <tr key={f.id} className="border-b border-border/70 last:border-0">
                <td className="py-3.5 pr-4 font-mono text-xs">
                  <Link href="/risk/flags" className="text-primary underline underline-offset-2">{f.id}</Link>
                </td>
                <td className="py-3.5 pr-4">{f.rule}</td>
                <td className="py-3.5 pr-4 font-mono text-xs">{f.scope}</td>
                <td className="py-3.5 pr-4">{f.product}</td>
                <td className="py-3.5 pr-4"><FlagSeverityBadge severity={f.severity} /></td>
                <td className="py-3.5 pr-4 text-muted">{f.age}</td>
                <td className="py-3.5">{f.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
