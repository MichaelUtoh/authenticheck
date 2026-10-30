"use client";

import { useState } from "react";
import { Button, FormError } from "@/components/ui/Button";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { errorMessage } from "@/lib/api/client";

export function ReasonDialog({
  title, body, action, label = "Reason", required = true, onClose, onSubmit,
}: {
  title: string;
  body: string;
  action: string;
  label?: string;
  required?: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function go() {
    if (required && !reason.trim()) return setError("This is required. It's recorded in the audit log.");
    setBusy(true);
    try {
      await onSubmit(reason.trim());
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-muted">{body}</p>
      <div className="mt-4 space-y-3">
        <FormError message={error} />
        <div>
          <label htmlFor="reason" className="mb-1.5 block text-sm font-medium">{label}</label>
          <textarea id="reason" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-lg border border-border px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <div className="flex justify-end gap-2">
          <GhostButton onClick={onClose}>Cancel</GhostButton>
          <Button className="!w-auto" loading={busy} onClick={go}>{action}</Button>
        </div>
      </div>
    </Modal>
  );
}
