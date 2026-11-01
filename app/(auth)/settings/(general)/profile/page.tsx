"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { roleLabel } from "@/components/team/roles";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { authApi } from "@/lib/api/auth";
import { errorMessage, fieldErrors } from "@/lib/api/client";
import { useAuthStore, type AuthUser } from "@/lib/auth/store";

function NameForm({ user }: { user: AuthUser }) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<{ full_name: string }>({ defaultValues: { full_name: user.full_name } });

  async function onSubmit({ full_name }: { full_name: string }) {
    setError(null);
    setSaved(false);
    try {
      const next = await authApi.updateMe({ full_name: full_name.trim() });
      useAuthStore.getState().setUser(next);
      reset({ full_name: next.full_name });
      setSaved(true);
    } catch (e) {
      const msg = fieldErrors(e).full_name;
      if (msg) setFieldError("full_name", { message: msg });
      else setError(errorMessage(e, "We couldn't save your name. Please try again."));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
      <FormError message={error} />
      {saved && <div role="status" className="rounded-lg bg-primary-soft px-3.5 py-2.5 text-sm text-primary">Saved.</div>}
      <Field
        label="Full name"
        autoComplete="name"
        error={errors.full_name?.message}
        {...register("full_name", {
          validate: (v) => v.trim().length > 0 || "Enter your full name",
          maxLength: { value: 255, message: "Use 255 characters or fewer" },
        })}
      />
      <Field label="Email" value={user.email} readOnly disabled hint="To change your email, contact AuthentiCheck support." />
      <div className="max-w-xs"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button></div>
    </form>
  );
}

export default function ProfileSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const activeTenant = useAuthStore((s) => s.activeTenant);

  if (!user) return <LoadingSpinner />;

  const initials = user.full_name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-foreground text-lg font-semibold text-white">{initials || "?"}</span>
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold">{user.full_name}</h2>
            <p className="truncate text-sm text-muted">{user.email}</p>
          </div>
        </div>
        <NameForm user={user} />
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Companies</h2>
        {user.memberships.length === 0 ? (
          <EmptyState title="No companies yet" />
        ) : (
          <ul className="mt-3 divide-y divide-border/70 text-sm">
            {user.memberships.map((m) => (
              <li key={m.tenant_id} className="flex items-center justify-between gap-4 py-3">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{m.tenant_name}</span>
                  <span className="block text-xs capitalize text-muted">{m.tenant_status.replace("_", " ")}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {m.tenant_id === activeTenant?.tenant_id && (
                    <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">Active</span>
                  )}
                  <span className="font-medium">{roleLabel(m.role)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
