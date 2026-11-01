import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { AcceptInvite } from "@/components/invitations/AcceptInvite";

export default function AcceptInvitePage() {
  return (
    <AuthShell>
      <Suspense fallback={null}>
        <AcceptInvite />
      </Suspense>
    </AuthShell>
  );
}
