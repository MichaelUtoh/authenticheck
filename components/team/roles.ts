/** Roles the API accepts on `PATCH /tenants/me/members/{id}`. New roles (see BACKEND_API_REQUIREMENTS AUTH-2) are one entry here. */
export interface RoleInfo {
  key: string;
  label: string;
  summary: string;
  /** Whether the role can be assigned from the UI; the owner role is fixed. */
  assignable: boolean;
}

export const ROLES: RoleInfo[] = [
  { key: "owner", label: "Owner", summary: "Everything an admin can do, and the only role that can change other people's roles. Cannot be changed.", assignable: false },
  { key: "admin", label: "Admin", summary: "Manage brands, API keys and team settings. Issue and deactivate codes, recall batches.", assignable: true },
  { key: "editor", label: "Editor", summary: "Create and edit product drafts and batches. Can send products for review only when allowed.", assignable: true },
  { key: "member", label: "Member", summary: "View products, batches, codes and checks.", assignable: true },
  { key: "viewer", label: "Viewer", summary: "Read-only access.", assignable: true },
];

export const roleLabel = (key: string) => ROLES.find((r) => r.key === key)?.label ?? key;
