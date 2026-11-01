"use client";

import { useAuthStore } from "./store";

// Mirrors the auth levels in ENDPOINT_REFERENCE.md. The backend enforces these;
// the frontend only uses them to hide actions the user can't take.
const ADMIN = ["owner", "admin"];
const EDIT = [...ADMIN, "editor"];

export function useCatalogueRole() {
  const tenant = useAuthStore((s) => s.activeTenant);
  const role = tenant?.role;
  return {
    role,
    isStaff: useAuthStore((s) => !!s.user?.is_staff),
    /** ✏️ create/edit drafts, upload images, add regulatory refs */
    canEdit: !!role && EDIT.includes(role),
    /** 👑 archive, brands, API keys */
    canAdminister: !!role && ADMIN.includes(role),
    /** 📤 editors need `can_submit_products`; until /auth/me exposes it we assume yes and let the API answer 403 */
    canSubmit: !!role && (ADMIN.includes(role) || (role === "editor" && tenant?.can_submit_products !== false)),
  };
}

export function useTeamRole() {
  const tenant = useAuthStore((s) => s.activeTenant);
  const role = tenant?.role;
  return {
    /** 👑 can read the member list and toggle submit rights */
    canView: !!role && ADMIN.includes(role),
    /** Only the owner changes roles; the API answers 403 otherwise. */
    canChangeRoles: role === "owner",
    /** Owners and admins invite people; only the owner can invite or manage admins. */
    canInvite: !!role && ADMIN.includes(role),
    canManageAdmins: role === "owner",
  };
}
