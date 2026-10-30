export function LoadingSpinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2.5 py-12 text-sm text-muted">
      <span className="size-4 animate-spin rounded-full border-2 border-border border-t-primary" />
      {label}
    </div>
  );
}
