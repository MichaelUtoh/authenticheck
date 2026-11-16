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
  { key: "production_quality", label: "Production / Quality", summary: "Create and edit product drafts and batches, and create and resume code issuance jobs. Can send products for review only when allowed.", assignable: true },
  { key: "investigator", label: "Investigator", summary: "View products, batches, codes and checks. Flags and cases will be added later.", assignable: true },
  { key: "viewer", label: "Viewer", summary: "Read-only access.", assignable: true },
];

const LEGACY: Record<string, string> = { editor: "production_quality", member: "production_quality" };
export const normalizeRole = (key: string) => LEGACY[key] ?? key;
export const roleLabel = (key: string) => ROLES.find((r) => r.key === normalizeRole(key))?.label ?? key;
