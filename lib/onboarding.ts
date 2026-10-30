import type { AuthUser } from "@/lib/auth/store";

/** Where a signed-in user is in setup. Derived from `/auth/me`, so a refresh or new device lands correctly. */
export type OnboardingState = "company" | "pending" | "info_requested" | "rejected" | "suspended" | "approved";

export function onboardingState(user: AuthUser): OnboardingState {
  const m = user.memberships[0];
  if (!m) return "company";
  switch (m.tenant_status) {
    case "approved":
    case "pending":
    case "info_requested":
    case "rejected":
    case "suspended":
      return m.tenant_status;
    default:
      return "pending";
  }
}

/** Route for a user outside setup: staff to the platform, approved tenants to the app. */
export function homeFor(user: AuthUser): string {
  if (user.is_staff) return "/platform/tenants";
  return onboardingState(user) === "approved" ? "/dashboard" : "/onboarding";
}
