import type { JobRow } from "@/lib/mock/dashboard";

const styles: Record<JobRow["status"], { label: string; cls: string }> = {
  partial: { label: "Partial · resume available", cls: "bg-[#fbf0d6] text-[#8a5a00]" },
  exported: { label: "Exported", cls: "bg-primary-soft text-primary" },
  generated: { label: "Generated · not exported", cls: "bg-black/5 text-foreground/80" },
};

export function JobStatusBadge({ status }: { status: JobRow["status"] }) {
  const { label, cls } = styles[status];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
