export function KpiCard({ label, value, note }: { label: string; value: string | number; note: string }) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums">
        {typeof value === "number" ? value.toLocaleString("en-US") : value}
      </p>
      <p className="mt-1 text-xs text-muted">{note}</p>
    </div>
  );
}
