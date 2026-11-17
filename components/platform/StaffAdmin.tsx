"use client";

import { useState } from "react";
import { ReasonDialog } from "@/components/catalogue/ReasonDialog";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { ApiError, errorMessage } from "@/lib/api/client";
import { platformStaffApi, type StaffUser } from "@/lib/api/platformOps";
import { useApi } from "@/lib/hooks/useApi";

export function StaffAdmin() {
  const list = useApi(() => platformStaffApi.list(), []);
  const [target, setTarget] = useState<StaffUser | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const rows = list.data ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Staff</h1>
        <p className="mt-1 text-muted">People with access to this console. Every reset is recorded with your name and reason.</p>
      </div>

      {notice && <p role="status" className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary">{notice}</p>}

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        {list.error ? (
          <ErrorState message={errorMessage(list.error, "We couldn't load staff.")} onRetry={list.reload} />
        ) : !list.data ? (
          <LoadingSpinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No staff found" body="Staff users are created by an existing staff user or with createsuperuser." />
        ) : (
          <ul className="divide-y divide-border/70">
            {rows.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium">
                    {u.name}
                    {u.isYou && <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">You</span>}
                  </p>
                  {u.email && u.email !== u.name && <p className="text-sm text-muted">{u.email}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.mfaEnabled ? "bg-primary-soft text-primary" : "bg-caution-soft text-caution"}`}>
                    {u.mfaEnabled ? "MFA on" : "No authenticator"}
                  </span>
                  {!u.isYou && u.mfaEnabled && (
                    <button type="button" onClick={() => { setTarget(u); setNotice(null); }} className="text-sm font-semibold text-danger hover:underline">Reset MFA</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-muted">You can&apos;t reset your own MFA. Ask a colleague to do it.</p>
      </section>

      {target && (
        <ReasonDialog
          title={`Reset MFA for ${target.name}`}
          body="Their authenticator is removed and they are signed out everywhere. At their next sign-in they set up a new authenticator."
          action="Reset MFA"
          onClose={() => setTarget(null)}
          onSubmit={async (reason) => {
            try {
              await platformStaffApi.resetMfa(target.id, reason);
            } catch (e) {
              if (e instanceof ApiError && e.error.code === "cannot_reset_own_mfa") throw new Error("You can't reset your own MFA.");
              throw e;
            }
            setNotice(`MFA reset for ${target.name}. They will set up a new authenticator at their next sign-in.`);
            setTarget(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}
