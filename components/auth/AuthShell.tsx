import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-lg bg-primary text-white">
        <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M4.5 10.5l3.5 3.5 7.5-8" />
        </svg>
      </span>
      <span className="text-lg font-semibold tracking-tight">
        Authenti<span className="text-primary">Check</span>
      </span>
    </Link>
  );
}

const points = [
  { title: "Unique codes per unit", body: "Issue and export print-ready code batches for every product run." },
  { title: "Checks you can learn from", body: "See first and repeat checks per day, and review flags as leads, not verdicts." },
  { title: "Careful by design", body: "Consumers are told what we know, what we don't, and what to do next." },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,480px)]">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
            {children}
          </div>
        </div>
        <p className="text-center text-xs text-muted">Times shown in WAT</p>
      </div>

      <aside className="hidden flex-col justify-between bg-primary p-10 text-white lg:flex">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-widest text-white/60">For manufacturers</p>
          <h2 className="text-3xl font-semibold leading-tight">Give every product a code people can check.</h2>
        </div>
        <ul className="space-y-5">
          {points.map((p) => (
            <li key={p.title} className="rounded-xl bg-white/10 p-4">
              <p className="font-medium">{p.title}</p>
              <p className="mt-1 text-sm text-white/75">{p.body}</p>
            </li>
          ))}
        </ul>
        <p className="font-mono text-sm tracking-wider text-white/60">7KQ2-M9XW-4PRT</p>
      </aside>
    </main>
  );
}
