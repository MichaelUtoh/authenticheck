"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ApiError } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { Button, FormError } from "@/components/ui/Button";
import { Field, PasswordField } from "@/components/ui/Field";

interface Values {
  full_name: string;
  email: string;
  password: string;
  confirm: string;
}

export function RegistrationForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<Values>();

  async function onSubmit({ full_name, email, password }: Values) {
    setError(null);
    try {
      await authApi.register({ full_name: full_name.trim(), email: email.trim(), password });
      router.push("/login?registered=1");
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.status === 409
            ? "An account with this email already exists. Try signing in."
            : e.error.message
          : "We couldn't create your account. Please try again."
      );
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
      <p className="mt-1 text-sm text-muted">
        Start with your own login. You&apos;ll add your company details next.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
        <FormError message={error} />
        <Field
          label="Full name"
          autoComplete="name"
          placeholder="Funmi Adeyemi"
          error={errors.full_name?.message}
          {...register("full_name", { required: "Enter your full name" })}
        />
        <Field
          label="Work email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register("email", {
            required: "Enter your email address",
            pattern: { value: /^\S+@\S+\.\S+$/, message: "Enter a valid email address" },
          })}
        />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          hint="At least 10 characters."
          error={errors.password?.message}
          {...register("password", {
            required: "Choose a password",
            minLength: { value: 10, message: "Use at least 10 characters" },
          })}
        />
        <PasswordField
          label="Confirm password"
          autoComplete="new-password"
          error={errors.confirm?.message}
          {...register("confirm", {
            required: "Confirm your password",
            validate: (v) => v === getValues("password") || "Passwords don't match",
          })}
        />
        <Button type="submit" loading={isSubmitting}>Create account</Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
      </p>
    </>
  );
}
