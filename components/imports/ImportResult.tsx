"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ImportJob } from "@/lib/api/imports";
import { IMPORT_TYPES } from "./importTypes";

const SHOWN = 100;

function downloadErrors(job: ImportJob) {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = ["row,column,problem", ...job.errors.map((e) => [e.row, esc(e.column ?? ""), esc(e.message)].join(","))];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `import-errors-${job.id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

const num = (n?: number) => (n === undefined ? "—" : n.toLocaleString("en-US"));

export function ImportResult({ job, onReset }: { job: ImportJob; onReset: () => void }) {
  const [all, setAll] = useState(false);
  const rows = useMemo(() => (all ? job.errors : job.errors.slice(0, SHOWN)), [all, job.errors]);
  const type = IMPORT_TYPES.find((t) => t.key === job.import_type);
  const failedFile = job.status === "failed";
  const problems = job.failed ?? job.errors.length;

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-white p-5 sm:p-6" aria-live="polite">
      <div>
        <h2 className="text-lg font-semibold">
          {failedFile ? "We couldn't import this file" : problems > 0 ? "Imported, with some rows to fix" : "Import complete"}
        </h2>
        {failedFile && <p className="mt-1 text-sm text-muted">{job.message ?? "Nothing was imported. Fix the problems below and upload the file again."}</p>}
      </div>

      {!failedFile && (
        <dl className="grid grid-cols-3 gap-3">
          {[["Created", job.created], ["Skipped", job.skipped], ["Need fixing", problems]].map(([label, v]) => (
            <div key={label as string} className="rounded-xl bg-background p-3">
              <dt className="text-xs text-muted">{label as string}</dt>
              <dd className="mt-0.5 text-2xl font-semibold tabular-nums">{num(v as number | undefined)}</dd>
            </div>
          ))}
        </dl>
      )}

      {job.errors.length > 0 && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Rows that need fixing ({job.errors.length})</h3>
            <button type="button" onClick={() => downloadErrors(job)} className="text-sm font-medium text-primary hover:underline">Download error report</button>
          </div>
          <div className="mt-2 max-h-80 overflow-auto rounded-xl border border-border">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="sticky top-0 bg-background text-xs uppercase tracking-wider text-muted">
                <tr><th className="px-3 py-2 font-semibold">Row</th><th className="px-3 py-2 font-semibold">Column</th><th className="px-3 py-2 font-semibold">Problem</th></tr>
              </thead>
              <tbody>
                {rows.map((e, i) => (
                  <tr key={i} className="border-t border-border/70">
                    <td className="px-3 py-2 tabular-nums">{e.row || "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs">{e.column ?? "—"}</td>
                    <td className="px-3 py-2">{e.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!all && job.errors.length > SHOWN && (
            <button type="button" onClick={() => setAll(true)} className="mt-2 text-sm font-medium text-primary hover:underline">Show all {job.errors.length}</button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {type && !failedFile && <Link href={type.next.href} className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">{type.next.label}</Link>}
        <button type="button" onClick={onReset} className="inline-flex h-11 items-center rounded-xl border border-border bg-white px-5 text-sm font-semibold hover:bg-background">Import another file</button>
      </div>
    </section>
  );
}
