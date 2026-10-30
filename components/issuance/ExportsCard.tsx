import { num } from "@/lib/format";
import type { ExportRow } from "@/lib/mock/batches";

export function ExportsCard({
  exports,
  onNew,
  onDownload,
}: {
  exports: ExportRow[];
  onNew: () => void;
  onDownload: (id: string) => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Print exports</h2>
          <p className="text-sm text-muted">Re-downloading returns the same file and codes. Every download is logged against your name.</p>
        </div>
        <button type="button" onClick={onNew} className="h-10 shrink-0 rounded-xl border border-border px-3.5 text-sm font-medium hover:bg-background">New export</button>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="py-2.5 pr-4 font-semibold">Export</th>
              <th className="py-2.5 pr-4 font-semibold">Format</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Codes</th>
              <th className="py-2.5 pr-4 font-semibold">Created</th>
              <th className="py-2.5 pr-4 font-semibold">SHA-256</th>
              <th className="py-2.5 pr-4 text-right font-semibold">Downloads</th>
              <th className="py-2.5" />
            </tr>
          </thead>
          <tbody>
            {exports.map((e) => (
              <tr key={e.id} className="border-b border-border/70 last:border-0">
                <td className="py-3.5 pr-4 font-mono text-xs">{e.id}</td>
                <td className="py-3.5 pr-4">{e.format}</td>
                <td className="py-3.5 pr-4 text-right tabular-nums">{num(e.codes)}</td>
                <td className="py-3.5 pr-4">{e.created} · {e.by}</td>
                <td className="py-3.5 pr-4 font-mono text-xs text-muted">{e.sha}</td>
                <td className="py-3.5 pr-4 text-right tabular-nums">{e.downloads}</td>
                <td className="py-3.5 text-right">
                  <button type="button" onClick={() => onDownload(e.id)} title="Sample data: no file is downloaded" className="h-9 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background">
                    Re-download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
