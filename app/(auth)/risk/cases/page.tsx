"use client";

import { Topbar } from "@/components/layout/Topbar";
import { CaseTable } from "@/components/risk/CaseTable";
import { InvestigationsHeader } from "@/components/risk/InvestigationsHeader";

export default function CasesPage() {
  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <InvestigationsHeader />
        <CaseTable />
      </div>
    </>
  );
}
