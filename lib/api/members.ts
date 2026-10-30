import { apiFetch } from "./client";

// Response shape of GET /tenants/me/members isn't spelled out in ENDPOINT_REFERENCE.md (it says
// the list "includes `role`, `can_submit_products`"). Everything else here is assumed.
export interface Member {
  id: string;
  full_name?: string;
  name?: string;
  email?: string;
  role: string;
  can_submit_products?: boolean;
  created_at?: string;
}

export type MemberPatch = { role?: string; can_submit_products?: boolean };

export const membersApi = {
  list: () => apiFetch<Member[] | { results: Member[] }>("/tenants/me/members"),
  update: (id: string, body: MemberPatch) =>
    apiFetch<Member>(`/tenants/me/members/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
};
