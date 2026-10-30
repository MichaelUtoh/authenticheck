"use client";

import { useState } from "react";
import { membersApi, type Member } from "@/lib/api/members";
import { errorMessage } from "@/lib/api/client";
import { fmtDate } from "@/lib/format";
import { RoleChangeModal } from "./RoleChangeModal";
import { roleLabel } from "./roles";

interface Props {
  members: Member[];
  myEmail?: string;
  canChangeRoles: boolean;
  onChanged: () => void;
  onError: (message: string) => void;
}

export function MemberTable({ members, myEmail, canChangeRoles, onChanged, onError }: Props) {
  const [editing, setEditing] = useState<Member | null>(null);
  // Optimistic overrides for the submit switch, rolled back if the API refuses.
  const [submit, setSubmit] = useState<Record<string, boolean>>({});

  async function toggleSubmit(m: Member, value: boolean) {
    setSubmit((s) => ({ ...s, [m.id]: value }));
    try {
      await membersApi.update(m.id, { can_submit_products: value });
      onChanged();
    } catch (e) {
      setSubmit((s) => Object.fromEntries(Object.entries(s).filter(([id]) => id !== m.id)));
      onError(errorMessage(e, "We couldn't update that permission."));
    }
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="py-2.5 pr-4 font-semibold">Person</th>
              <th className="py-2.5 pr-4 font-semibold">Role</th>
              <th className="py-2.5 pr-4 font-semibold">Can send products for review</th>
              <th className="py-2.5 font-semibold"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const name = m.full_name ?? m.name ?? m.email ?? "Unnamed";
              const isMe = !!myEmail && m.email?.toLowerCase() === myEmail.toLowerCase();
              const isEditor = m.role === "editor";
              const checked = submit[m.id] ?? !!m.can_submit_products;
              return (
                <tr key={m.id} className="border-b border-border/70 last:border-0">
                  <td className="py-3 pr-4">
                    <p className="font-medium">{name}{isMe && <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted">You</span>}</p>
                    <p className="text-xs text-muted">{m.email}{m.created_at ? ` · joined ${fmtDate(m.created_at.slice(0, 10))}` : ""}</p>
                  </td>
                  <td className="py-3 pr-4"><span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{roleLabel(m.role)}</span></td>
                  <td className="py-3 pr-4">
                    {isEditor ? (
                      <label className="inline-flex cursor-pointer items-center gap-2">
                        <input type="checkbox" role="switch" checked={checked} onChange={(e) => toggleSubmit(m, e.target.checked)} className="size-4 accent-primary" />
                        <span className="text-xs text-muted">{checked ? "Allowed" : "Not allowed"}</span>
                      </label>
                    ) : (
                      <span className="text-xs text-muted">{m.role === "owner" || m.role === "admin" ? "Always" : "—"}</span>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    {canChangeRoles && m.role !== "owner" && (
                      <button type="button" onClick={() => setEditing(m)} className="text-sm font-medium text-primary hover:underline">Change role</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editing && <RoleChangeModal member={editing} onClose={() => setEditing(null)} onSaved={onChanged} />}
    </>
  );
}
