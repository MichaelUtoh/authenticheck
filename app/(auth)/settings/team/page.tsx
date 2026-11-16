"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Topbar } from "@/components/layout/Topbar";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { InvitationsPanel } from "@/components/invitations/InvitationsPanel";
import { InviteModal } from "@/components/invitations/InviteModal";
import { MemberTable } from "@/components/team/MemberTable";
import { RolesPanel } from "@/components/team/RolesPanel";
import { ApiError, errorMessage } from "@/lib/api/client";
import { asList } from "@/lib/api/catalogue";
import type { InvitePayload } from "@/lib/api/invitations";
import { membersApi } from "@/lib/api/members";
import { useTeamRole } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useApi } from "@/lib/hooks/useApi";

export default function TeamPage() {
  const { canView, canChangeRoles, canInvite, canManageAdmins } = useTeamRole();
  const myEmail = useAuthStore((s) => s.user?.email);
  const [notice, setNotice] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  // `null` = closed; an object (possibly empty) = open, prefilled when inviting someone again.
  const [draft, setDraft] = useState<Partial<InvitePayload> | null>(null);
  const [invitesKey, setInvitesKey] = useState(0);
  const members = useApi(() => (canView ? membersApi.list() : Promise.resolve(undefined)), [canView]);
  const rows = asList(members.data);
  const forbidden = members.error instanceof ApiError && members.error.status === 403;

  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Team &amp; roles</h1>
            <p className="mt-1 text-muted">Who has access to your company, and what they can do.</p>
          </div>
          {canInvite && <Button type="button" className="!w-auto" onClick={() => setDraft({})}>Invite member</Button>}
        </div>

        {flash && <div role="status" className="rounded-lg bg-primary-soft px-3.5 py-2.5 text-sm text-primary">{flash}</div>}

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
            <p className="mt-4 text-xs text-muted">Only the owner can change roles. You can allow production/quality members to send products for review.</p>
          )}
        </section>

        {canInvite && (
          <InvitationsPanel
            canManageAdmins={canManageAdmins}
            refreshKey={invitesKey}
            onNotice={setFlash}
            onInviteAgain={(inv) => setDraft({ email: inv.email, role: inv.role, can_submit_products: inv.can_submit_products })}
          />
        )}

        <RolesPanel />

        {draft && (
          <InviteModal
            initial={draft}
            canManageAdmins={canManageAdmins}
            onClose={() => setDraft(null)}
            onInvited={(inv) => {
              setFlash(`Invitation sent to ${inv.email}.`);
              setInvitesKey((k) => k + 1);
            }}
          />
        )}
      </div>
    </>
  );
}
