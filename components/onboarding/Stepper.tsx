const STEPS = ["Account", "Company", "Approval"];

/** `current` is 1-based: 2 = company form, 3 = waiting for approval. */
export function Stepper({ current }: { current: 2 | 3 }) {
  return (
    <ol className="mb-6 flex items-center gap-2 text-xs" aria-label="Setup progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n < current;
        const active = n === current;
        return (
          <li key={label} className="flex flex-1 items-center gap-2" aria-current={active ? "step" : undefined}>
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                done ? "bg-primary text-white" : active ? "border-2 border-primary text-primary" : "border border-border text-muted"
              }`}
            >
              {done ? "✓" : n}
            </span>
            <span className={active ? "font-medium" : "text-muted"}>{label}</span>
            {n < STEPS.length && <span className={`h-px flex-1 ${done ? "bg-primary" : "bg-border"}`} aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}
