"use client";

import { Topbar } from "@/components/layout/Topbar";
import { FlagsList } from "@/components/risk/FlagsList";
import { InvestigationsHeader } from "@/components/risk/InvestigationsHeader";

export default function FlagsPage() {
  return (
    <>
      <Topbar />
      <div className="space-y-6 px-4 py-6 sm:px-8 sm:py-8">
        <InvestigationsHeader />
        <FlagsList />
      </div>
    </>
  );
}
