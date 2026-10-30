"use client";

import { useState } from "react";
import { num } from "@/lib/format";
import type { Reconciliation } from "@/lib/mock/batches";

type Counts = Pick<Reconciliation, "printed" | "damaged" | "unused">;

export function ReconciliationCard({
  value,
  exported,
  damagedActive,
  onSave,
  onReview,
}: {
  value: Reconciliation | null;
  exported: number;
  damagedActive: number;
  onSave: (c: Counts) => void;
  onReview: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Counts>({ printed: 0, damaged: 0, unused: 0 });

  const counts = value ?? draft;
  const total = counts.printed + counts.damaged + counts.unused;
  const balanced = !!value && total === exported;

  function startEdit() {
    setDraft(value ? { printed: value.printed, damaged: value.damaged, unused: value.unused } : { printed: 0, damaged: 0, unused: 0 });
    setEditing(true);
  }

  const rows: [string, keyof Counts][] = [
    ["Printed & applied", "printed"],
    ["Damaged in print", "damaged"],
    ["Unused", "unused"],
  ];

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Label reconciliation</h2>
          <p className="text-sm text-muted">
            {value ? `Reported by your team · last updated ${value.updated}` : "Not reported yet"}
          </p>
        </div>
        {editing ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setEditing(false)} className="h-10 rounded-xl border border-border px-3.5 text-sm font-medium">Cancel</button>
            <button type="button" onClick={() => { onSave(draft); setEditing(false); }} className="h-10 rounded-xl bg-primary px-3.5 text-sm font-semibold text-white hover:bg-primary-hover">Save</button>
          </div>
        ) : (
          <button type="button" onClick={startEdit} className="h-10 shrink-0 rounded-xl border border-border px-3.5 text-sm font-medium hover:bg-background">Update counts</button>
        )}
      </div>

      <dl className="mt-4 text-sm">
        {rows.map(([label, key]) => (
          <div key={key} className="flex items-center justify-between border-b border-border/70 py-2.5">
            <dt>{label}</dt>
            <dd className="tabular-nums">
              {editing ? (
                <input
                  type="number"
                  min={0}
                  value={draft[key]}
                  onChange={(e) => setDraft({ ...draft, [key]: Math.max(0, Number(e.target.value) || 0) })}
                  aria-label={label}
                  className="h-9 w-28 rounded-lg border border-border px-2 text-right outline-none focus:border-primary"
                />
              ) : value ? (
                num(counts[key])
              ) : (
                "—"
              )}
            </dd>
          </div>
        ))}
        <div className="flex items-center justify-between py-2.5 font-semibold">
          <dt>Total vs exported ({num(exported)})</dt>
          <dd className={!value && !editing ? "text-muted" : total === exported ? "text-primary" : "text-danger"}>
            {!value && !editing ? "—" : total === exported ? "Balanced" : `Off by ${num(Math.abs(total - exported))}`}
          </dd>
        </div>
      </dl>

      {balanced && damagedActive > 0 && !editing && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-danger-soft p-4 text-sm">
          <p>
            <b className="text-danger">{num(damagedActive)} damaged labels are still active.</b> Deactivate them so they can&apos;t be reused on other packs.
          </p>
          <button type="button" onClick={onReview} className="h-10 rounded-xl border border-danger/40 bg-white px-3.5 text-sm font-semibold text-danger hover:bg-danger-soft">
            Review &amp; deactivate
          </button>
        </div>
      )}
    </section>
  );
}
