"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { useCompleteLogin } from "@/lib/auth/useCompleteLogin";
import { Button, FormError } from "@/components/ui/Button";
import { Field, PasswordField } from "@/components/ui/Field";
import { MFAChallenge } from "./MFAChallenge";
import { MFASetup } from "./MFASetup";

interface Values {
  email: string;
  password: string;
}

export function LoginForm() {
  const params = useSearchParams();
  const justRegistered = params.get("registered") === "1";
  const joined = params.get("accepted") === "1";
  const completeLogin = useCompleteLogin();
  const [error, setError] = useState<string | null>(null);
  // The challenge token stays in memory only; never persist it.
  const [mfa, setMfa] = useState<{ challenge: string; enroll: boolean } | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ defaultValues: { email: params.get("email") ?? "", password: "" } });

  async function onSubmit(values: Values) {
    setError(null);
    try {
      const res = await authApi.login(values.email.trim(), values.password);
      if (res.mfa_required && res.challenge_token) return setMfa({ challenge: res.challenge_token, enroll: !!res.mfa_enrollment_required });
      if (res.access_token) await completeLogin(res.access_token);
    } catch (e) {
      setError(
        e instanceof ApiError && (e.status === 401 || e.status === 400)
          ? "Email or password is incorrect."
          : e instanceof ApiError && e.status === 429
            ? "Too many attempts. Please wait a few minutes and try again."
            : "We couldn't sign you in. Please try again."
      );
    }
  }

  if (mfa) {
    const back = () => setMfa(null);
    return mfa.enroll
      ? <MFASetup challengeToken={mfa.challenge} onBack={back} />
      : <MFAChallenge challengeToken={mfa.challenge} onBack={back} />;
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-1 text-sm text-muted">Welcome back. Enter your details to continue.</p>

      {justRegistered && (
        <div role="status" className="mt-5 rounded-lg bg-primary-soft px-3.5 py-2.5 text-sm text-primary">
          Account created. Sign in to set up your organisation.
        </div>
      )}

      {joined && (
        <div role="status" className="mt-5 rounded-lg bg-primary-soft px-3.5 py-2.5 text-sm text-primary">
          You&apos;ve joined the company. Sign in to continue.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormError message={error} />
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email", { required: "Enter your email address" })}
        />
        <PasswordField
          label="Password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register("password", { required: "Enter your password" })}
        />
        <Button type="submit" loading={isSubmitting}>Sign in</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to AuthentiCheck?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">Create an account</Link>
      </p>
    </>
  );
}
