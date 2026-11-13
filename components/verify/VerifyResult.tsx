"use client";

import { Suspense, useEffect, useState } from "react";
import { checkCode, cleanCode, validateCode, type CheckOutcome } from "@/lib/api/verify";
import { CheckForm } from "./CheckForm";
import { StateCard } from "./parts";
import { Deactivated, Expired, FirstCheck, NotRecognised, RepeatCheck, Unavailable, Withdrawn } from "./ResultViews";

// Each request records a check, so share one in-flight call per code (React strict mode runs effects twice).
const inflight = new Map<string, Promise<CheckOutcome>>();
function run(code: string, fresh = false) {
  if (fresh) inflight.delete(code);
  let p = inflight.get(code);
  if (!p) {
    p = checkCode(code);
    inflight.set(code, p);
    const drop = () => setTimeout(() => inflight.delete(code), 5000);
    p.then(drop, drop);
  }
  return p;
}

type State = { status: "loading" } | { status: "done"; outcome: CheckOutcome } | { status: "unavailable" };

export function VerifyResult({ rawCode }: { rawCode: string }) {
  const problem = validateCode(rawCode);
  const code = cleanCode(rawCode);
  const [state, setState] = useState<State>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (problem) return;
    let live = true;
    run(code, attempt > 0).then(
      (outcome) => live && setState({ status: "done", outcome }),
      () => live && setState({ status: "unavailable" })
    );
    return () => { live = false; };
  }, [code, problem, attempt]);

  if (problem) {
    return (
      <StateCard tone="neutral" badge="Invalid format" icon="keyboard" title="That doesn't look like a product code">
        <Suspense><CheckForm card initial={rawCode} initialError={problem} /></Suspense>
      </StateCard>
    );
  }

  if (state.status === "loading") {
    return (
      <div role="status" aria-live="polite" className="mx-auto max-w-md animate-pulse space-y-4">
        <span className="sr-only">Checking this code…</span>
        <div className="h-40 rounded-2xl bg-white" />
        <div className="h-32 rounded-2xl bg-white" />
      </div>
    );
  }
  if (state.status === "unavailable") {
    return <Unavailable onRetry={() => { setState({ status: "loading" }); setAttempt((n) => n + 1); }} />;
  }

  const o = state.outcome;
  switch (o.kind) {
    case "first": return <FirstCheck o={o} />;
    case "repeat": return <RepeatCheck o={o} />;
    case "withdrawn": return <Withdrawn o={o} />;
    case "deactivated": return <Deactivated o={o} />;
    case "expired": return <Expired o={o} />;
    default: return <NotRecognised o={o} />;
  }
}
