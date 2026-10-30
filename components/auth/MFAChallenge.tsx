"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useCompleteLogin } from "@/lib/auth/useCompleteLogin";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

export function MFAChallenge({ onBack }: { onBack: () => void }) {
  const completeLogin = useCompleteLogin();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ code: string }>();

  async function onSubmit({ code }: { code: string }) {
    setError(null);
    try {
      const res = await authApi.mfaVerify(code.trim());
      await completeLogin(res.access_token);
    } catch (e) {
      setError(
        e instanceof ApiError && (e.status === 400 || e.status === 401)
          ? "That code didn't work. Check your authenticator app and try again."
          : "We couldn't verify the code. Please try again."
      );
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Two-step verification</h1>
      <p className="mt-1 text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormError message={error} />
        <Field
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          className="font-mono tracking-[0.4em]"
          error={errors.code?.message}
          {...register("code", { required: "Enter the 6-digit code", pattern: { value: /^\d{6}$/, message: "The code is 6 digits" } })}
        />
        <Button type="submit" loading={isSubmitting}>Verify</Button>
      </form>
      <button type="button" onClick={onBack} className="mt-6 w-full text-center text-sm font-medium text-primary hover:underline">
        Back to sign in
      </button>
    </>
  );
}
