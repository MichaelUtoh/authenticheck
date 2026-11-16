import { apiFetch, qs } from "./client";

export type InvitationStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invitation {
  id: string;
  email: string;
  role: string;
  can_submit_products: boolean;
  status: InvitationStatus;
  expires_at: string;
  invited_by: { id: string; name: string } | null;
  accepted_at: string | null;
  created_at: string;
}

export interface InvitePayload {
  email: string;
  role: string;
  /** Production / Quality only. */
  can_submit_products?: boolean;
}

export interface InvitationPreview {
  email: string;
  role: string;
  role_label: string;
  tenant_name: string;
  invited_by: string | null;
  expires_at: string;
  has_account: boolean;
}

export interface AcceptResult {
  detail: string;
  tenant_id: string;
  tenant_name: string;
  role: string;
  account_created: boolean;
}

export type AcceptPayload = { token: string } | { token: string; password: string; full_name: string };

export const invitationsApi = {
  list: (status: InvitationStatus | "all" = "pending") =>
    apiFetch<Invitation[]>(`/tenants/me/invitations${qs({ status })}`),
  create: (body: InvitePayload) =>
    apiFetch<Invitation>("/tenants/me/invitations", { method: "POST", body: JSON.stringify(body) }),
  resend: (id: string) => apiFetch<Invitation>(`/tenants/me/invitations/${id}/resend`, { method: "POST" }),
  revoke: (id: string) => apiFetch<void>(`/tenants/me/invitations/${id}`, { method: "DELETE" }),

  preview: (token: string) => apiFetch<InvitationPreview>(`/invitations/preview${qs({ token })}`),
  accept: (body: AcceptPayload) => apiFetch<AcceptResult>("/invitations/accept", { method: "POST", body: JSON.stringify(body) }),
};
