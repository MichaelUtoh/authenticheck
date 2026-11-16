"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { authApi, type MfaVerifyResponse } from "@/lib/api/auth";
import { useCompleteLogin } from "@/lib/auth/useCompleteLogin";
import { Button, FormError } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

/** Maps an MFA API failure to a message; `expired` means the sign-in step is over and the user must start again. */
export function mfaError(e: unknown): { message: string; expired: boolean } {
  if (e instanceof ApiError) {
    if (e.error.code === "invalid_mfa_code") return { message: "That code did not work. Use the latest code from your app.", expired: false };
    if (e.error.code === "challenge_invalid") return { message: "This sign-in step expired. Please sign in again.", expired: true };
    if (e.status === 429) return { message: `Too many attempts. Try again ${e.retryAfter ? `in ${Math.ceil(e.retryAfter / 60)} min` : "in a few minutes"}.`, expired: false };
    if (e.status === 400) return { message: "Enter the 6-digit code.", expired: false };
  }
  return { message: "We couldn't verify the code. Please try again.", expired: false };
}

/** 6-digit code form shared by the verify and enrolment screens. */
export function CodeForm({
  submit,
  label = "Verification code",
  action,
  onExpired,
}: {
  submit: (token: string) => Promise<MfaVerifyResponse>;
  label?: string;
  action: string;
  onExpired: () => void;
}) {
  const completeLogin = useCompleteLogin();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<{ token: string }>();

  async function onSubmit({ token }: { token: string }) {
    setError(null);
    try {
      const res = await submit(token.trim()); // keep as a string: leading zeros
      await completeLogin(res.access_token);
    } catch (e) {
      const { message, expired } = mfaError(e);
      if (expired) return onExpired();
      setError(message);
      resetField("token");
      setFocus("token");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
      <FormError message={error} />
      <Field
        label={label}
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        autoFocus
        className="font-mono tracking-[0.4em]"
        error={errors.token?.message}
        {...register("token", { required: "Enter the 6-digit code", pattern: { value: /^\d{6}$/, message: "The code is 6 digits" } })}
      />
      <Button type="submit" loading={isSubmitting}>{action}</Button>
    </form>
  );
}

export function MFAChallenge({ challengeToken, onBack }: { challengeToken: string; onBack: () => void }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Two-step verification</h1>
      <p className="mt-1 text-sm text-muted">Enter the 6-digit code from your authenticator app.</p>
      <CodeForm submit={(t) => authApi.mfaVerify(challengeToken, t)} action="Verify" onExpired={onBack} />
      <button type="button" onClick={onBack} className="mt-6 w-full text-center text-sm font-medium text-primary hover:underline">
        Back to sign in
      </button>
    </>
  );
}
