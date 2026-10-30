import { ROLES } from "./roles";

export function RolesPanel() {
  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <h2 className="text-base font-semibold">What each role can do</h2>
      <dl className="mt-3 divide-y divide-border/70">
        {ROLES.map((r) => (
          <div key={r.key} className="grid gap-1 py-3 sm:grid-cols-[120px_1fr]">
            <dt className="text-sm font-medium">{r.label}</dt>
            <dd className="text-sm text-muted">{r.summary}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
