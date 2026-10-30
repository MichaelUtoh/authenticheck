"use client";

import { useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { MemberTable } from "@/components/team/MemberTable";
import { RolesPanel } from "@/components/team/RolesPanel";
import { ApiError, errorMessage } from "@/lib/api/client";
import { asList } from "@/lib/api/catalogue";
import { membersApi } from "@/lib/api/members";
import { useTeamRole } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useApi } from "@/lib/hooks/useApi";

export default function TeamPage() {
  const { canView, canChangeRoles } = useTeamRole();
  const myEmail = useAuthStore((s) => s.user?.email);
  const [notice, setNotice] = useState<string | null>(null);
  const members = useApi(() => (canView ? membersApi.list() : Promise.resolve(undefined)), [canView]);
  const rows = asList(members.data);
  const forbidden = members.error instanceof ApiError && members.error.status === 403;

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Team &amp; roles</h1>
          <p className="mt-1 text-muted">Who has access to your company, and what they can do.</p>
        </div>

        <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
          {notice && <div className="mb-4"><ErrorState message={notice} /></div>}
          {!canView || forbidden ? (
            <EmptyState title="Only owners and admins can see the team" body="Ask an owner or admin if you need access changed." />
          ) : members.error ? (
            <ErrorState message={errorMessage(members.error, "We couldn't load your team.")} onRetry={members.reload} />
          ) : members.loading && !members.data ? (
            <LoadingSpinner />
          ) : rows.length === 0 ? (
            <EmptyState title="No team members yet" />
          ) : (
            <MemberTable members={rows} myEmail={myEmail} canChangeRoles={canChangeRoles} onChanged={() => { setNotice(null); members.reload(); }} onError={setNotice} />
          )}
          {canView && !canChangeRoles && rows.length > 0 && (
            <p className="mt-4 text-xs text-muted">Only the owner can change roles. You can allow editors to send products for review.</p>
          )}
        </section>

        <RolesPanel />
      </div>
    </>
  );
}
