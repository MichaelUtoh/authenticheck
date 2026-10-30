export function Pagination({
  page,
  pageSize,
  count,
  onChange,
}: {
  page: number;
  pageSize: number;
  count: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (count === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, count);
  const btn = "h-9 rounded-lg border border-border px-3 text-sm font-medium hover:bg-background disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <span>Showing {from}–{to} of {count.toLocaleString("en-US")}</span>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
        <span className="tabular-nums">Page {page} of {pages}</span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}
