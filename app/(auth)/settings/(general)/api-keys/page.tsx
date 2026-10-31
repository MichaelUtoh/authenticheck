"use client";

import { useState } from "react";
import { SecretModal } from "@/components/settings/SecretModal";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { apiKeysApi, type ApiKey } from "@/lib/api/apiKeys";
import { errorMessage } from "@/lib/api/client";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (secret: string) => void }) {
  const [name, setName] = useState("");
  const [expires, setExpires] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    if (!name.trim()) return setError("Give the key a name so you can recognise it later.");
    setSaving(true);
    setError(null);
    try {
      const { secret } = await apiKeysApi.create({ name: name.trim(), expires_at: expires || undefined });
      onCreated(secret);
    } catch (e) {
      setError(errorMessage(e, "We couldn't create the key. Please try again."));
      setSaving(false);
    }
  }

  return (
    <Modal title="Create an API key" onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <Field label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Packaging line ERP" hint="Where this key will be used." />
        <Field label="Expiry date (optional)" type="date" value={expires} onChange={(e) => setExpires(e.target.value)} hint="After this date the key stops working. Leave empty for no expiry." />
        <div className="flex gap-2">
          <Button type="button" className="!w-auto" loading={saving} onClick={create}>Create key</Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </Modal>
  );
}

function RevokeModal({ apiKey, onClose, onDone }: { apiKey: ApiKey; onClose: () => void; onDone: () => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    setSaving(true);
    try {
      await apiKeysApi.revoke(apiKey.id);
      onDone();
    } catch (e) {
      setError(errorMessage(e, "We couldn't revoke the key. Please try again."));
      setSaving(false);
    }
  }

  return (
    <Modal title={`Revoke “${apiKey.name}”?`} onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <p className="text-sm text-muted">Anything using this key stops working immediately. This can&apos;t be undone; you would need to create a new key.</p>
        <div className="flex gap-2">
          <Button type="button" className="!w-auto !bg-danger" loading={saving} onClick={revoke}>Revoke key</Button>
          <GhostButton onClick={onClose}>Keep key</GhostButton>
        </div>
      </div>
    </Modal>
  );
}

export default function ApiKeysPage() {
  const { canAdminister } = useCatalogueRole();
  const keys = useApi(() => (canAdminister ? apiKeysApi.list() : Promise.resolve([] as ApiKey[])), [canAdminister]);
  const [creating, setCreating] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);
  const rows = keys.data ?? [];

  if (!canAdminister) {
    return (
      <section className="rounded-2xl border border-border bg-white">
        <EmptyState title="Only owners and admins can manage API keys" body="Ask an owner or admin if you need a key for an integration." />
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">API keys</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">API keys let your systems issue and read codes without a person signing in. Treat them like passwords.</p>
        </div>
        <Button type="button" className="!w-auto" onClick={() => setCreating(true)}>Create key</Button>
      </div>

      <div className="mt-4">
        {keys.error ? (
          <ErrorState message={errorMessage(keys.error, "We couldn't load your API keys.")} onRetry={keys.reload} />
        ) : keys.loading && !keys.data ? (
          <LoadingSpinner />
        ) : rows.length === 0 ? (
          <EmptyState title="No API keys yet" body="Create a key when you're ready to connect a system." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
                  <th className="py-2.5 pr-4 font-semibold">Name</th>
                  <th className="py-2.5 pr-4 font-semibold">Key</th>
                  <th className="py-2.5 pr-4 font-semibold">Last used</th>
                  <th className="py-2.5 pr-4 font-semibold">Expires</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((k) => {
                  const expired = !!k.expires_at && new Date(k.expires_at) < new Date();
                  return (
                    <tr key={k.id} className="border-b border-border/70 last:border-0">
                      <td className="py-3 pr-4 font-medium">{k.name}<span className="block text-xs font-normal text-muted">{k.created_at ? `Created ${fmtDate(k.created_at.slice(0, 10))}` : ""}</span></td>
                      <td className="py-3 pr-4 font-mono text-xs">{k.prefix}…</td>
                      <td className="py-3 pr-4 text-muted">{k.last_used_at ? fmtDateTime(k.last_used_at) : "Never"}</td>
                      <td className="py-3 pr-4 text-muted">{k.expires_at ? fmtDate(k.expires_at.slice(0, 10)) : "No expiry"}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${k.revoked ? "bg-danger-soft text-danger" : expired ? "bg-background text-muted" : "bg-primary-soft text-primary"}`}>
                          {k.revoked ? "Revoked" : expired ? "Expired" : "Active"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {!k.revoked && <button type="button" onClick={() => setRevoking(k)} className="text-sm font-medium text-danger hover:underline">Revoke</button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {creating && <CreateModal onClose={() => setCreating(false)} onCreated={(s) => { setCreating(false); setSecret(s); keys.reload(); }} />}
      {secret !== null && (
        <SecretModal title="Your new API key" secret={secret} warning="Copy this key now. For your security we can't show it again." onClose={() => setSecret(null)} />
      )}
      {revoking && <RevokeModal apiKey={revoking} onClose={() => setRevoking(null)} onDone={() => { setRevoking(null); keys.reload(); }} />}
    </section>
  );
}
