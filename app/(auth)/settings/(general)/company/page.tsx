"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { EmptyState, ErrorState } from "@/components/shared/EmptyState";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { tenantApi } from "@/lib/api/catalogue";
import { errorMessage, fieldErrors } from "@/lib/api/client";
import { useCatalogueRole } from "@/lib/auth/permissions";
import { useAuthStore } from "@/lib/auth/store";
import { useApi } from "@/lib/hooks/useApi";

interface Values {
  email: string;
  phone: string;
  url: string;
}

export default function CompanySettingsPage() {
  const { canAdminister } = useCatalogueRole();
  const tenant = useAuthStore((s) => s.activeTenant);
  const contact = useApi(() => tenantApi.supportContact(), []);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values>({ defaultValues: { email: "", phone: "", url: "" } });

  useEffect(() => {
    if (contact.data) reset({ email: contact.data.email ?? "", phone: contact.data.phone ?? "", url: contact.data.url ?? "" });
  }, [contact.data, reset]);

  async function onSubmit(v: Values) {
    setError(null);
    setSaved(false);
    const t = (s: string) => (s.trim() === "" ? null : s.trim());
    try {
      const next = await tenantApi.updateSupportContact({ email: t(v.email), phone: t(v.phone), url: t(v.url) });
      reset({ email: next.email ?? "", phone: next.phone ?? "", url: next.url ?? "" });
      setSaved(true);
    } catch (e) {
      const f = fieldErrors(e);
      const map: Record<string, keyof Values> = { support_email: "email", support_phone: "phone", support_url: "url", email: "email", phone: "phone", url: "url" };
      let shown = false;
      for (const [k, msg] of Object.entries(f)) {
        if (!map[k]) continue;
        setFieldError(map[k], { message: msg });
        shown = true;
      }
      if (!shown) setError(errorMessage(e, "We couldn't save your support contact. Please try again."));
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Support contact</h2>
        <p className="mt-1 text-sm text-muted">Consumers see this when they check a code, so they know who to ask. A product can show its own contact instead.</p>

        {contact.error ? (
          <div className="mt-4"><ErrorState message={errorMessage(contact.error, "We couldn't load your support contact.")} onRetry={contact.reload} /></div>
        ) : contact.loading && !contact.data ? (
          <LoadingSpinner />
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4" noValidate>
            <FormError message={error} />
            {saved && <div role="status" className="rounded-lg bg-primary-soft px-3.5 py-2.5 text-sm text-primary">Saved. Consumers will see the new contact straight away.</div>}
            <Field
              label="Support email"
              type="email"
              disabled={!canAdminister}
              placeholder="support@company.com"
              hint="Required before your company goes live."
              error={errors.email?.message}
              {...register("email", { pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" } })}
            />
            <Field label="Support phone (optional)" type="tel" disabled={!canAdminister} placeholder="+234 800 000 0000" error={errors.phone?.message} {...register("phone")} />
            <Field
              label="Support website (optional)"
              type="url"
              disabled={!canAdminister}
              placeholder="https://company.com/help"
              error={errors.url?.message}
              {...register("url", { pattern: { value: /^https?:\/\/\S+$/, message: "Start with https://" } })}
            />
            {canAdminister ? (
              <div className="max-w-xs"><Button type="submit" loading={isSubmitting} disabled={!isDirty}>Save changes</Button></div>
            ) : (
              <p className="text-xs text-muted">Only owners and admins can change this.</p>
            )}
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold">Company</h2>
        {tenant ? (
          <dl className="mt-3 divide-y divide-border/70 text-sm">
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted">Name</dt><dd className="text-right font-medium">{tenant.tenant_name}</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted">Status</dt><dd className="font-medium capitalize">{tenant.tenant_status.replace("_", " ")}</dd></div>
            <div className="flex justify-between gap-4 py-3"><dt className="text-muted">Your role</dt><dd className="font-medium capitalize">{tenant.role}</dd></div>
          </dl>
        ) : (
          <EmptyState title="No company loaded" />
        )}
        <p className="mt-3 text-xs text-muted">To change your company name, contact AuthentiCheck support.</p>
      </section>
    </div>
  );
}
