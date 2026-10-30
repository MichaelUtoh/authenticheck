import { apiFetch } from "./client";

// Field names for POST /tenants/register aren't in ENDPOINT_REFERENCE.md (the spec only says
// "legal name, trading name"); they are assumed here.
export interface TenantRegisterPayload {
  legal_name: string;
  trading_name?: string;
}

export const tenantsApi = {
  register: (body: TenantRegisterPayload) =>
    apiFetch<unknown>("/tenants/register", { method: "POST", body: JSON.stringify(body) }),
};
