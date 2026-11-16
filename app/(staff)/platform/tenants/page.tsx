import { Suspense } from "react";
import { TenantApplications } from "@/components/platform/TenantApplications";

export default function PlatformTenantsPage() {
  return (
    <Suspense fallback={null}>
      <TenantApplications />
    </Suspense>
  );
}
