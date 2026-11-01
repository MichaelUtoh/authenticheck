"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { GhostButton, Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { invitationsApi, type Invitation, type InvitePayload } from "@/lib/api/invitations";
import { ROLES } from "@/components/team/roles";
import { inviteError } from "./errors";

interface Props {
  initial?: Partial<InvitePayload>;
  canManageAdmins: boolean;
  onClose: () => void;
  onInvited: (invitation: Invitation) => void;
}

export function InviteModal({ initial, canManageAdmins, onClose, onInvited }: Props) {
  const [error, setError] = useState<string | null>(null);
  // Only the owner can invite admins; the owner role is never granted by invitation.
  const roles = ROLES.filter((r) => r.assignable && (canManageAdmins || r.key !== "admin"));
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<InvitePayload>({
    defaultValues: {
      email: initial?.email ?? "",
      role: roles.some((r) => r.key === initial?.role) ? initial?.role : "member",
      can_submit_products: initial?.can_submit_products ?? false,
    },
  });
  const role = useWatch({ control, name: "role" });
  const summary = roles.find((r) => r.key === role)?.summary;

  async function onSubmit(v: InvitePayload) {
    setError(null);
    try {
      const body: InvitePayload = { email: v.email.trim(), role: v.role };
      if (v.role === "editor") body.can_submit_products = !!v.can_submit_products;
      onInvited(await invitationsApi.create(body));
      onClose();
    } catch (e) {
      setError(inviteError(e, "We couldn't send that invitation. Please try again."));
    }
  }

  return (
    <Modal title="Invite a team member" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <FormError message={error} />
        <Field
          label="Email"
          type="email"
          autoComplete="off"
          placeholder="colleague@company.com"
          error={errors.email?.message}
          {...register("email", {
            required: "Enter their email address",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
          })}
        />
        <Select label="Role" {...register("role")}>
          {roles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </Select>
        {summary && <p className="rounded-lg bg-background p-3 text-sm text-muted">{summary}</p>}
        {role === "editor" && (
          <Toggle label="Can send products for review" hint="You can change this later." {...register("can_submit_products")} />
        )}
        <p className="text-xs text-muted">We&apos;ll email them a single-use link. It expires after 7 days.</p>
        <div className="flex gap-2">
          <Button type="submit" className="!w-auto" loading={isSubmitting}>Send invitation</Button>
          <GhostButton onClick={onClose}>Cancel</GhostButton>
        </div>
      </form>
    </Modal>
  );
}
