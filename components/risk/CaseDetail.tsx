"use client";

import Link from "next/link";
import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { Icon } from "@/components/ui/Icons";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAuthStore } from "@/lib/auth/store";
import { OWNERS, useInvestigations, type OutcomeKind } from "@/lib/mock/investigations";
import { CaseStatusBadge } from "./CaseStatusBadge";
import { CaseStatusSelect } from "./CaseStatusSelect";
import { FlagSeverityBadge } from "./FlagSeverityBadge";

const OUTCOMES: { kind: OutcomeKind; title: string; body: string }[] = [
  { kind: "no_issue", title: "No issue found", body: "Activity looks genuine, for example a pack re-scanned by buyers. No action on codes." },
  { kind: "monitor", title: "Inconclusive · keep monitoring", body: "Not enough to act on. Keep the batch under watch." },
  { kind: "action", title: "Action needed", body: "Deactivate codes, or recall or withdraw the batch." },
];

export function CaseDetail({ id }: { id: string }) {
  const c = useInvestigations((s) => s.cases.find((x) => x.id === id));
  const allFlags = useInvestigations((s) => s.flags);
  const { setStatus, setOwner, addNote, setOutcome } = useInvestigations.getState();
  const author = useAuthStore((s) => s.user?.full_name) ?? "You";
  const [note, setNote] = useState("");

  if (!c) {
    return (
      <>
        <Topbar />
        <div className="px-4 py-10 sm:px-8">
          <h1 className="text-2xl font-semibold">Case not found</h1>
          <p className="mt-2 text-muted">
            We couldn&apos;t find <span className="font-mono">{id}</span>.{" "}
            <Link href="/risk/cases" className="font-medium text-primary underline">Back to investigations</Link>
          </p>
        </div>
      </>
    );
  }

  const flags = allFlags.filter((f) => c.flagIds.includes(f.id));
  const done = c.status === "closed" || c.status === "resolved";
  const checklist: [string, boolean][] = [
    ["Owner assigned", !!c.owner],
    ["Notes added", c.notes.length > 0],
    ["Outcome chosen", !!c.outcome.kind],
    ["Outcome summary written", c.outcome.summary.trim().length > 0],
  ];
  const ready = checklist.every(([, ok]) => ok);

  return (
    <>
      <Topbar />
      <div className="px-4 py-6 sm:px-8 sm:py-8">
        <nav aria-label="Breadcrumb" className="text-sm text-muted">
          <Link href="/risk/cases" className="text-primary underline underline-offset-2">Investigations</Link>
          {" / "}
          <span className="font-mono">{c.id}</span>
        </nav>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{c.title}</h1>
          <CaseStatusBadge status={c.status} />
          <span className="rounded-full bg-[#fbf0d6] px-2 py-0.5 text-xs font-semibold text-[#8a5a00]">Sample data</span>
        </div>
        <p className="mt-1 text-muted">
          <span className="font-mono">{c.id}</span> · opened {c.opened} · last updated {c.updated}
        </p>

        <div className="mt-5 flex gap-3 rounded-2xl border border-[#ecd9a6] bg-[#fdf3dc] p-4 text-sm">
          <Icon name="warn" className="mt-0.5 size-5 shrink-0 text-[#8a5a00]" />
          <p>
            <b>This is a lead for review, not proof of counterfeiting.</b> Cases, flags and check events are internal. They are never shown to consumers, and we never show who checked a code.
          </p>
        </div>

        <div className="mt-2 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <SectionCard label="1 · Summary">
              <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
                {[
                  ["Product", c.product],
                  ["Code / scope", c.scope],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs text-muted">{k}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{v}</dd>
                  </div>
                ))}
                <div>
                  <dt className="text-xs text-muted">Batch</dt>
                  <dd className="mt-0.5 font-mono text-sm font-medium">
                    <Link href={`/issuance/batches/${c.batchId}`} className="text-primary underline underline-offset-2">{c.batchId}</Link>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Severity</dt>
                  <dd className="mt-1"><FlagSeverityBadge severity={c.severity} /></dd>
                </div>
              </dl>
              {c.summary && <p className="mt-5 text-sm leading-relaxed text-foreground/85">{c.summary}</p>}
            </SectionCard>

            <SectionCard label={`2 · Linked flags (${flags.length})`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                      {["Flag", "Rule", "Severity", "Age"].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {flags.map((f) => (
                      <tr key={f.id} className="border-b border-border/70 last:border-0">
                        <td className="py-3 pr-4 font-mono text-xs">{f.id}</td>
                        <td className="py-3 pr-4">{f.rule}</td>
                        <td className="py-3 pr-4"><FlagSeverityBadge severity={f.severity} /></td>
                        <td className="py-3 text-muted">{f.age}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>

            <SectionCard label="3 · Check events">
              <p className="mb-3 text-sm text-muted">Read-only. Times in WAT. Region is approximate and for internal review only.</p>
              {c.events.length === 0 ? (
                <p className="rounded-xl bg-background p-4 text-sm text-muted">No check events are linked to this case yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                        {["Time", "Code", "Result", "Region", "Channel"].map((h) => <th key={h} className="py-2 pr-4 font-semibold">{h}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {c.events.map((e, i) => (
                        <tr key={i} className="border-b border-border/70 last:border-0">
                          <td className="py-3 pr-4">{e.at}</td>
                          <td className="py-3 pr-4 font-mono text-xs">{e.code}</td>
                          <td className="py-3 pr-4">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.result === "first" ? "bg-primary-soft text-primary" : "bg-[#fbf0d6] text-[#8a5a00]"}`}>
                              {e.result === "first" ? "First check" : "Repeat check"}
                            </span>
                          </td>
                          <td className="py-3 pr-4">{e.region}</td>
                          <td className="py-3 text-muted">{e.channel}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>

            <SectionCard label="4 · Notes">
              {c.notes.length > 0 && (
                <ul className="mb-4 space-y-3">
                  {c.notes.map((n, i) => (
                    <li key={i} className="rounded-xl bg-background p-3.5 text-sm">
                      <p className="text-xs text-muted"><b className="text-foreground">{n.author}</b> · {n.at}</p>
                      <p className="mt-1">{n.text}</p>
                    </li>
                  ))}
                </ul>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!note.trim()) return;
                  addNote(c.id, author, note.trim());
                  setNote("");
                }}
                className="space-y-3"
              >
                <label className="block text-sm font-medium">
                  Add a note
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="What did you check, and who did you speak to?"
                    className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </label>
                <p className="text-xs text-muted">Don&apos;t put personal data (names, phone numbers of members of the public) in notes.</p>
                <button type="submit" disabled={!note.trim()} className="h-10 rounded-xl border border-border px-4 text-sm font-medium hover:bg-background disabled:opacity-50">
                  Add note
                </button>
              </form>
            </SectionCard>

            <SectionCard label="5 · Outcome">
              <div role="radiogroup" aria-label="Outcome" className="grid gap-3 sm:grid-cols-3">
                {OUTCOMES.map((o) => {
                  const on = c.outcome.kind === o.kind;
                  return (
                    <button
                      key={o.kind}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setOutcome(c.id, { kind: o.kind })}
                      className={`rounded-xl border p-4 text-left text-sm ${on ? "border-2 border-primary bg-primary-soft/40" : "border-border hover:bg-background"}`}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span className={`grid size-4 place-items-center rounded-full border ${on ? "border-primary" : "border-border"}`}>
                          {on && <span className="size-2 rounded-full bg-primary" />}
                        </span>
                        {o.title}
                      </span>
                      <span className="mt-1.5 block text-muted">{o.body}</span>
                    </button>
                  );
                })}
              </div>

              {c.outcome.kind === "action" && (
                <p className="mt-4 rounded-xl bg-background p-3.5 text-sm">
                  Next step:{" "}
                  <Link href={`/issuance/batches/${c.batchId}`} className="font-medium text-primary underline underline-offset-2">
                    open batch {c.batchId}
                  </Link>{" "}
                  to deactivate codes or recall the batch.
                </p>
              )}

              <label className="mt-4 block text-sm font-medium">
                Outcome summary <span className="text-danger">*</span>
                <textarea
                  value={c.outcome.summary}
                  onChange={(e) => setOutcome(c.id, { summary: e.target.value })}
                  rows={3}
                  placeholder="What did you conclude, and why?"
                  className="mt-1.5 w-full rounded-lg border border-border px-3.5 py-2.5 text-sm font-normal outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </SectionCard>

            <section className="mt-5 rounded-2xl border border-border bg-white p-5 sm:p-6">
              <p className="text-sm text-muted">Closing a case records your name, the time and the outcome in the audit log.</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {done ? (
                  <button type="button" onClick={() => setStatus(c.id, "investigating")} className="h-11 rounded-xl border border-border px-5 text-sm font-medium hover:bg-background">
                    Reopen case
                  </button>
                ) : (
                  <button type="button" disabled={!ready} onClick={() => setStatus(c.id, "closed")} className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                    Close case
                  </button>
                )}
                <Link href="/risk/cases" className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm font-medium hover:bg-background">
                  Back to cases
                </Link>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:mt-5">
            <div className="rounded-2xl border border-border bg-white p-5">
              <h2 className="text-base font-semibold">Case status</h2>
              <div className="mt-3 space-y-3">
                <label className="block text-sm font-medium">
                  Status
                  <div className="mt-1.5"><CaseStatusSelect value={c.status} onChange={(s) => setStatus(c.id, s)} /></div>
                </label>
                <label className="block text-sm font-medium">
                  Owner
                  <select
                    value={c.owner ?? ""}
                    onChange={(e) => setOwner(c.id, e.target.value || null)}
                    className="mt-1.5 h-11 w-full rounded-lg border border-border bg-white px-3 text-sm font-normal outline-none focus:border-primary"
                  >
                    <option value="">Unassigned</option>
                    {OWNERS.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-5">
              <h2 className="text-base font-semibold">Ready to close?</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {checklist.map(([label, ok]) => (
                  <li key={label} className="flex items-center gap-2.5">
                    <Icon name={ok ? "check" : "alert"} className={`size-[18px] ${ok ? "text-primary" : "text-caution"}`} />
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
