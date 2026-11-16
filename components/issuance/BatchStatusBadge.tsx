import type { Attention, BatchStatus } from "@/lib/api/batches";

const status: Record<BatchStatus, string> = {
  active: "bg-primary-soft text-primary",
  recalled: "bg-danger-soft text-danger",
  expired: "bg-black/5 text-muted",
};

export function BatchStatusBadge({ status: s }: { status: BatchStatus }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${status[s]}`}>{s}</span>;
}

const attention: Record<Attention, { label: string; cls: string }> = {
  partial: { label: "Partial · resume available", cls: "bg-[#fbf0d6] text-[#8a5a00]" },
  unreconciled: { label: "Unreconciled", cls: "bg-black/5 text-foreground/80" },
  expiring: { label: "Expires soon", cls: "bg-[#fbf0d6] text-[#8a5a00]" },
  approval: { label: "Approval pending", cls: "bg-danger-soft text-danger" },
};

export function AttentionChip({ kind }: { kind: Attention }) {
  const { label, cls } = attention[kind];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>;
}
