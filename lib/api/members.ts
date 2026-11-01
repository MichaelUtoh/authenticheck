import { apiFetch } from "./client";

// GET /tenants/me/members returns `email`, `full_name`, `role` and `can_submit_products`; the rest is assumed.
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
