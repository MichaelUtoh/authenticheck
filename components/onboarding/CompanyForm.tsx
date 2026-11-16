"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Select } from "@/components/ui/Select";
import { useApi } from "@/lib/hooks/useApi";
import { authApi } from "@/lib/api/auth";
import { errorMessage, fieldErrors } from "@/lib/api/client";
import { tenantsApi } from "@/lib/api/tenants";
import { useAuthStore } from "@/lib/auth/store";

interface Values {
  legal_name: string;
  trading_name: string;
  industry: string;
  rc_number: string;
  city: string;
}

export function CompanyForm() {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm<Values>();
  const industries = useApi(async () => {
    const r = await tenantsApi.industries();
    return Array.isArray(r) ? r : r.results;
  }, []);

  async function onSubmit(v: Values) {
    setError(null);
    try {
      await tenantsApi.register({ legal_name: v.legal_name.trim(), trading_name: v.trading_name.trim() || undefined,
        industry: v.industry,
        rc_number: v.rc_number.trim(),
        city: v.city.trim(),
      });
      // The new membership shows up in /auth/me as `pending`; the page then switches to the waiting screen.
      const me = await authApi.me();
      const { setUser, setActiveTenant } = useAuthStore.getState();
      setUser(me);
      if (me.memberships[0]) setActiveTenant(me.memberships[0]);
    } catch (e) {
      const fields = fieldErrors(e);
      let shown = false;
      for (const k of ["legal_name", "trading_name", "industry", "rc_number", "city"] as const) {
        if (!fields[k]) continue;
        setFieldError(k, { message: fields[k] });
        shown = true;
      }
      if (!shown) setError(errorMessage(e, "We couldn't register your company. Please try again."));
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Tell us about your company</h1>
      <p className="mt-1 text-sm text-muted">
        We review every new company before codes can be issued. This usually takes one working day.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormError message={error} />
        <Field
          label="Legal company name"
          autoComplete="organization"
          placeholder="Enyi Naturals Limited"
          hint="As it appears on your CAC registration."
          error={errors.legal_name?.message}
          {...register("legal_name", { required: "Enter your legal company name", minLength: { value: 2, message: "Use at least 2 characters" } })}
        />
        <Field
          label="Trading name (optional)"
          placeholder="Enyi"
          hint="If you sell under a different name."
          error={errors.trading_name?.message}
          {...register("trading_name")}
        />
        <Select
          label="Industry"
          error={errors.industry?.message}
          hint={industries.error ? "We couldn't load industries. Refresh to try again." : undefined}
          disabled={industries.loading || !!industries.error}
          defaultValue=""
          {...register("industry", { required: "Choose your industry" })}
        >
          <option value="" disabled>{industries.loading ? "Loading…" : "Select an industry"}</option>
          {(industries.data ?? []).map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
        </Select>
        <Field
          label="CAC registration number"
          placeholder="RC 1234567"
          hint="The RC number on your CAC certificate."
          error={errors.rc_number?.message}
          {...register("rc_number", { required: "Enter your CAC registration number" })}
        />
        <Field
          label="City"
          autoComplete="address-level2"
          placeholder="Lagos"
          error={errors.city?.message}
          {...register("city", { required: "Enter the city your company operates from" })}
        />
        <Button type="submit" loading={isSubmitting}>Submit for review</Button>
      </form>
    </>
  );
}
