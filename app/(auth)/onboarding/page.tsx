"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { CompanyForm } from "@/components/onboarding/CompanyForm";
import { PendingApproval } from "@/components/onboarding/PendingApproval";
import { Stepper } from "@/components/onboarding/Stepper";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuthStore } from "@/lib/auth/store";
import { homeFor, onboardingState } from "@/lib/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const state = user ? onboardingState(user) : null;

  // Approved users and staff don't belong here.
  useEffect(() => {
    if (user && (user.is_staff || state === "approved")) router.replace(homeFor(user));
  }, [user, state, router]);

  if (!user || user.is_staff || state === "approved") {
    return (
      <AuthShell>
        <LoadingSpinner />
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Stepper current={state === "company" ? 2 : 3} />
      {state === "company" ? <CompanyForm /> : <PendingApproval tenant={user.memberships[0]} />}
    </AuthShell>
  );
}
