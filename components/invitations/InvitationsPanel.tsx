"use client";

import { useState } from "react";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { roleLabel } from "@/components/team/roles";
import { isProductionQuality } from "@/lib/auth/permissions";
import { Button, FormError } from "@/components/ui/Button";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { errorMessage } from "@/lib/api/client";
import { invitationsApi, type Invitation, type InvitationStatus } from "@/lib/api/invitations";
import { fmtDateTime } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { inviteError } from "./errors";

type Filter = InvitationStatus | "all";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "expired", label: "Expired" },
  { key: "accepted", label: "Accepted" },
  { key: "revoked", label: "Revoked" },
  { key: "all", label: "All" },
];

const STATUS_STYLE: Record<InvitationStatus, string> = {
  pending: "bg-primary/10 text-primary",
  accepted: "bg-primary-soft text-primary",
  expired: "bg-background text-muted",
  revoked: "bg-background text-muted",
};

interface Props {
  canManageAdmins: boolean;
  /** Bumped by the page after it sends an invitation, so the list refetches. */
  refreshKey: number;
  onInviteAgain: (invitation: Invitation) => void;
  onNotice: (message: string) => void;
}

export function InvitationsPanel({ canManageAdmins, refreshKey, onInviteAgain, onNotice }: Props) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<Invitation | null>(null);
  const list = useApi(() => invitationsApi.list(filter), [filter, refreshKey]);
  const rows = list.data ?? [];

  async function resend(inv: Invitation) {
    setBusyId(inv.id);
    setError(null);
    try {
      await invitationsApi.resend(inv.id);
      onNotice(`A new link was sent to ${inv.email}. The old one no longer works.`);
      list.reload();
    } catch (e) {
      setError(inviteError(e, "We couldn't resend that invitation."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Invitations</h2>
          <p className="mt-1 text-sm text-muted">People you&apos;ve invited by email. Links can&apos;t be copied, only resent.</p>
        </div>
        <div className="w-40">
          <Select label="Show" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            {FILTERS.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </Select>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <FormError message={error} />
        {list.error ? (
          <ErrorState message={errorMessage(list.error, "We couldn't load invitations.")} onRetry={list.reload} />
        ) : list.loading && !list.data ? (
          <LoadingSpinner />
        ) : rows.length === 0 ? (
          <EmptyState title={filter === "pending" ? "No pending invitations" : "Nothing here"} body={filter === "pending" ? "Invite someone to give them access to your company." : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="py-2.5 pr-4 font-semibold">Invited</th>
                  <th className="py-2.5 pr-4 font-semibold">Role</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((inv) => {
                  // Admins can see admin invitations but not act on them.
                  const locked = inv.role === "admin" && !canManageAdmins;
                  return (
                    <tr key={inv.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-4">
                        <p className="font-medium">{inv.email}</p>
                        <p className="text-xs text-muted">{inv.invited_by ? `by ${inv.invited_by.name} · ` : ""}{fmtDateTime(inv.created_at)}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{roleLabel(inv.role)}</span>
                        {isProductionQuality(inv.role) && <p className="mt-1 text-xs text-muted">{inv.can_submit_products ? "Can send for review" : "Cannot send for review"}</p>}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[inv.status]}`}>{inv.status}</span>
                        <p className="mt-1 text-xs text-muted">
                          {inv.status === "pending" ? `Expires ${fmtDateTime(inv.expires_at)}` : inv.status === "accepted" && inv.accepted_at ? fmtDateTime(inv.accepted_at) : inv.status === "expired" ? `Expired ${fmtDateTime(inv.expires_at)}` : ""}
                        </p>
                      </td>
                      <td className="py-3 text-right">
                        {locked ? (
                          (inv.status === "pending" || inv.status === "expired") && <span className="text-xs text-muted">Owner only</span>
                        ) : inv.status === "pending" ? (
                          <span className="inline-flex gap-4">
                            <button type="button" disabled={busyId === inv.id} onClick={() => resend(inv)} className="text-sm font-medium text-primary hover:underline disabled:opacity-60">
                              {busyId === inv.id ? "Sending…" : "Resend"}
                            </button>
                            <button type="button" disabled={busyId === inv.id} onClick={() => setRevoking(inv)} className="text-sm font-medium text-danger hover:underline disabled:opacity-60">Revoke</button>
                          </span>
                        ) : inv.status === "expired" ? (
                          <button type="button" onClick={() => onInviteAgain(inv)} className="text-sm font-medium text-primary hover:underline">Invite again</button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {revoking && (
        <RevokeModal
          invitation={revoking}
          onClose={() => setRevoking(null)}
          onRevoked={() => {
            onNotice(`Invitation to ${revoking.email} revoked.`);
            list.reload();
          }}
        />
      )}
    </section>
  );
}

function RevokeModal({ invitation, onClose, onRevoked }: { invitation: Invitation; onClose: () => void; onRevoked: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    setBusy(true);
    setError(null);
    try {
      await invitationsApi.revoke(invitation.id);
      onRevoked();
      onClose();
    } catch (e) {
      setError(errorMessage(e, "We couldn't revoke that invitation."));
      setBusy(false);
    }
  }

  return (
    <Modal title="Revoke invitation?" onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <p className="text-sm text-muted">The link we emailed to {invitation.email} will stop working. You can invite them again later.</p>
        <div className="flex gap-2">
          <Button type="button" className="!w-auto" loading={busy} onClick={revoke}>Revoke invitation</Button>
          <GhostButton onClick={onClose}>Keep</GhostButton>
        </div>
      </div>
    </Modal>
  );
}
