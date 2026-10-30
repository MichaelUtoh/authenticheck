"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";
import { tryRefresh, useAuthStore, type Membership } from "@/lib/auth/store";
import { homeFor, onboardingState } from "@/lib/onboarding";

const FIRST_POLL_MS = 5_000;
const MAX_POLL_MS = 30_000;

const COPY = {
  pending: {
    title: "We're reviewing your company",
    body: "You'll get access as soon as we approve it. You can leave this page open or come back later; we'll pick up where you left off.",
  },
  info_requested: {
    title: "We need a bit more information",
    body: "Our review team has asked for more details about your company. Check your email for what to send, then reply to that message.",
  },
  rejected: {
    title: "We couldn't approve this company",
    body: "Your registration wasn't approved. If you think this is a mistake, contact support and we'll look again.",
  },
  suspended: {
    title: "This company is suspended",
    body: "Access is paused. Contact support to find out why and how to restore it.",
  },
} as const;

export function PendingApproval({ tenant }: { tenant: Membership }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const delay = useRef(FIRST_POLL_MS);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const me = await authApi.me();
      const { setUser, setActiveTenant } = useAuthStore.getState();
      setUser(me);
      if (me.memberships[0]) setActiveTenant(me.memberships[0]);
      setLastChecked(new Date());
      if (onboardingState(me) === "approved") {
        // Reissue the token so it carries the now-approved tenant before the app's calls start.
        await tryRefresh();
        router.replace(homeFor(me));
      }
    } catch {
      // Transient failure: the next poll tries again. A 401 already redirects to /login.
    } finally {
      setChecking(false);
    }
  }, [router]);

  const status = tenant.tenant_status === "pending" ? "pending" : (tenant.tenant_status as keyof typeof COPY);
  const polling = status === "pending" || status === "info_requested";

  useEffect(() => {
    if (!polling) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      timer = setTimeout(async () => {
        if (!document.hidden) await check();
        delay.current = Math.min(delay.current * 1.5, MAX_POLL_MS);
        tick();
      }, delay.current);
    };
    tick();
    return () => clearTimeout(timer);
  }, [polling, check]);

  const copy = COPY[status] ?? COPY.pending;

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
      <p className="mt-2 text-sm text-muted">{copy.body}</p>

      <dl className="mt-6 space-y-2 rounded-xl bg-background p-4 text-sm">
        <div className="flex justify-between gap-4"><dt className="text-muted">Company</dt><dd className="text-right font-medium">{tenant.tenant_name}</dd></div>
        <div className="flex justify-between gap-4"><dt className="text-muted">Status</dt><dd className="font-medium capitalize">{status.replace("_", " ")}</dd></div>
      </dl>

      {polling && (
        <>
          <Button type="button" loading={checking} onClick={check} className="mt-6">Check status</Button>
          <p className="mt-3 text-center text-xs text-muted" aria-live="polite">
            {lastChecked ? `Last checked ${lastChecked.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })}` : "Checking automatically"}
          </p>
        </>
      )}
    </>
  );
}
