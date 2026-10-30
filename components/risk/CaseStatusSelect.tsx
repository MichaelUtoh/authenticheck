import type { CaseStatus } from "@/lib/types";

const STATUSES: CaseStatus[] = ["open", "investigating", "resolved", "closed"];

export function CaseStatusSelect({ value, onChange }: { value: CaseStatus; onChange: (s: CaseStatus) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as CaseStatus)}
      aria-label="Case status"
      className="h-11 w-full rounded-lg border border-border bg-white px-3 text-sm capitalize outline-none focus:border-primary"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  );
}
