import type { CaseStatus } from "@/lib/types";

const styles: Record<CaseStatus, string> = {
  open: "bg-[#fbf0d6] text-[#8a5a00]",
  investigating: "bg-[#e3ebf4] text-[#2f4a68]",
  resolved: "bg-primary-soft text-primary",
  closed: "bg-black/5 text-muted",
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status]}`}>{status}</span>;
}
