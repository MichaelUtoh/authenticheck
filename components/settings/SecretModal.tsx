"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

/** One-time secret (API key, webhook secret). Can't be closed until the user confirms they saved it. */
export function SecretModal({ title, secret, warning, onClose }: { title: string; secret: string; warning: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setCopied(false); // clipboard blocked: the secret is selectable below
    }
  }

  return (
    <Modal title={title} onClose={() => saved && onClose()}>
      <div className="space-y-4">
        <p role="alert" className="rounded-lg bg-[#fbf0d6] px-3.5 py-2.5 text-sm text-[#8a5a00]">{warning}</p>
        <div className="flex items-stretch gap-2">
          <code className="min-w-0 flex-1 select-all break-all rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-xs">{secret || "No secret was returned"}</code>
          <button type="button" onClick={copy} className="shrink-0 rounded-lg border border-border bg-white px-3 text-sm font-semibold hover:bg-background">{copied ? "Copied" : "Copy"}</button>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="mt-0.5 size-4 accent-primary" />
          I have saved this somewhere safe
        </label>
        <Button type="button" disabled={!saved} onClick={onClose}>Done</Button>
      </div>
    </Modal>
  );
}
