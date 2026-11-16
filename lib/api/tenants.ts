import { apiFetch } from "./client";

export interface TenantIndustry {
  key: string;
  label: string;
}

export interface TenantRegisterPayload {
  legal_name: string;
  trading_name?: string;
  /** A key from `GET /tenants/industries`. */
  industry: string;
  /** CAC registration number. */
  rc_number: string;
  city: string;
}

export const tenantsApi = {
  /** Works before the user has a company, unlike `/catalogue/industries`. */
  industries: () => apiFetch<TenantIndustry[] | { results: TenantIndustry[] }>("/tenants/industries"),
  register: (body: TenantRegisterPayload) =>
    apiFetch<unknown>("/tenants/register", { method: "POST", body: JSON.stringify(body) }),
};
