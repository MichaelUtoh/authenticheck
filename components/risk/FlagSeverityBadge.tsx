import type { FlagSeverity } from "@/lib/types";

const styles: Record<FlagSeverity, string> = {
  critical: "bg-danger text-white",
  high: "bg-danger-soft text-danger",
  medium: "bg-[#fbf0d6] text-[#8a5a00]",
  low: "bg-black/5 text-muted",
};

export function FlagSeverityBadge({ severity }: { severity: FlagSeverity }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[severity]}`}>
      {severity}
    </span>
  );
}
