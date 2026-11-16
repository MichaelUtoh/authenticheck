"use client";

import { useState } from "react";
import { Button, FormError } from "@/components/ui/Button";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { membersApi, type Member } from "@/lib/api/members";
import { errorMessage } from "@/lib/api/client";
import { ROLES, normalizeRole, roleLabel } from "./roles";

export function RoleChangeModal({ member, onClose, onSaved }: { member: Member; onClose: () => void; onSaved: () => void }) {
  const [role, setRole] = useState(normalizeRole(member.role));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = member.full_name ?? member.name ?? member.email ?? "this person";
  const next = ROLES.find((r) => r.key === role);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await membersApi.update(member.id, { role });
      onSaved();
      onClose();
    } catch (e) {
      setError(errorMessage(e, "We couldn't change that role. Please try again."));
      setSaving(false);
    }
  }

  return (
    <Modal title={`Change role for ${name}`} onClose={onClose}>
      <div className="space-y-4">
        <FormError message={error} />
        <Select label="Role" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.filter((r) => r.assignable).map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </Select>
        {next && <p className="rounded-lg bg-background p-3 text-sm text-muted">{next.summary}</p>}
        <div className="flex gap-2">
          <Button type="button" className="!w-auto" loading={saving} disabled={role === normalizeRole(member.role)} onClick={save}>
            Change to {roleLabel(role)}
          </Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </div>
    </Modal>
  );
}
