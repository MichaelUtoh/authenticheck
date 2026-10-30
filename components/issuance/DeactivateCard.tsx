"use client";

import { useState } from "react";
import { num } from "@/lib/format";

export type Scope = "selected" | "range" | "batch";

const REASONS = ["Damaged during printing", "Exposed or leaked", "Misprinted", "Applied to the wrong pack", "Other"];

export function DeactivateCard({
  scope,
  onScope,
  selectedCount,
  batchCount,
}: {
  scope: Scope;
  onScope: (s: Scope) => void;
  selectedCount: number;
  batchCount: number;
}) {
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [sent, setSent] = useState<string | null>(null);

  const scopes: [Scope, string][] = [
    ["selected", `Selected codes (${num(selectedCount)})`],
    ["range", "A range from an export"],
    ["batch", `Whole batch (${num(batchCount)})`],
  ];
  const empty = scope === "selected" && selectedCount === 0;

  return (
    <section id="deactivate" className="scroll-mt-6 rounded-2xl border border-danger/30 bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold">Deactivate codes</h2>
      <p className="mt-0.5 text-sm text-muted">
        Use for exposed, misprinted or misapplied codes. Deactivated codes are never reused — replacements get new codes linked to the originals.
      </p>

      {sent ? (
        <div role="status" className="mt-4 rounded-xl bg-primary-soft p-4 text-sm text-primary">
          <b>Request sent.</b> {sent} A second approver (Owner or Quality lead) must confirm before any code is deactivated.
          <button type="button" onClick={() => setSent(null)} className="ml-3 font-semibold underline">Make another request</button>
        </div>
      ) : (
        <>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-medium">Scope</legend>
            <div className="flex flex-wrap gap-2">
              {scopes.map(([value, label]) => (
                <label
                  key={value}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm ${scope === value ? "border-primary bg-primary-soft/50 font-medium" : "border-border"}`}
                >
                  <input type="radio" name="scope" checked={scope === value} onChange={() => onScope(value)} className="accent-[var(--primary)]" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] md:items-end">
            <label className="text-sm font-medium">
              Reason <span className="text-danger">*</span>
              <select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal outline-none focus:border-primary">
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </label>
            <label className="text-sm font-medium">
              Note for the audit log
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Roll 14 jammed on line 2" className="mt-1.5 h-11 w-full rounded-lg border border-border px-3 text-sm font-normal outline-none focus:border-primary" />
            </label>
            <button
              type="button"
              disabled={empty}
              onClick={() => setSent(`${scope === "batch" ? "Whole batch" : scope === "range" ? "Export range" : `${num(selectedCount)} selected codes`} · ${reason}.`)}
              className="h-11 rounded-xl bg-danger px-5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Request deactivation
            </button>
          </div>
          <p className="mt-3 text-xs text-muted">
            A second approver (Owner or Quality lead) must confirm. Consumers checking these codes will see &ldquo;This code is no longer active&rdquo;.
          </p>
        </>
      )}
    </section>
  );
}
