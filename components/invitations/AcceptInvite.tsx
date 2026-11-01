"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, FormError } from "@/components/ui/Button";
import { Field, PasswordField } from "@/components/ui/Field";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { authApi } from "@/lib/api/auth";
import { ApiError, errorMessage } from "@/lib/api/client";
import { invitationsApi, type InvitationPreview } from "@/lib/api/invitations";
import { tryRefresh, useAuthStore, type AuthUser } from "@/lib/auth/store";
import { useApi } from "@/lib/hooks/useApi";
import { fmtDateTime } from "@/lib/format";

/** The invite page is public, so unlike AppShell it must not bounce signed-out visitors to /login. */
function useSessionUser() {
  const storeUser = useAuthStore((s) => s.user);
  const [checking, setChecking] = useState(!storeUser);

  useEffect(() => {
    if (storeUser) return;
    let alive = true;
    (async () => {
      try {
        if (await tryRefresh()) useAuthStore.getState().setUser(await authApi.me());
      } catch {
        // not signed in
      }
      if (alive) setChecking(false);
    })();
    return () => {
      alive = false;
    };
  }, [storeUser]);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      useAuthStore.getState().clear();
    }
  }, []);

  return { user: storeUser, checking, signOut };
}

function problemFor(e: unknown): string {
  if (!(e instanceof ApiError)) return "We couldn't accept this invitation. Please try again.";
  switch (e.error.code) {
    case "invitation_invalid":
      return "This invitation link isn't valid any more. It may have been used or cancelled. Ask the person who invited you for a new one.";
    case "invitation_expired":
      return "This invitation has expired. Ask the person who invited you to send a new one.";
    case "invitation_email_mismatch":
      return "You're signed in as a different account from the one invited. Sign out and use the invited email.";
    case "already_member":
      return "You're already a member of this company.";
    case "tenant_not_active":
      return "This company isn't active right now, so the invitation can't be accepted yet.";
    default:
      return errorMessage(e, "We couldn't accept this invitation. Please try again.");
  }
}

function Heading({ preview }: { preview: InvitationPreview }) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Join {preview.tenant_name}</h1>
      <p className="mt-1 text-sm text-muted">
        {preview.invited_by ? `${preview.invited_by} invited` : "You're invited"} <span className="font-medium text-foreground">{preview.email}</span> as{" "}
        <span className="font-medium text-foreground">{preview.role_label}</span>.
      </p>
      <p className="mt-1 text-xs text-muted">Link expires {fmtDateTime(preview.expires_at)} WAT.</p>
    </>
  );
}

function NewAccountForm({ token, preview }: { token: string; preview: InvitationPreview }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<{ full_name: string; password: string; confirm: string }>();

  async function onSubmit({ full_name, password }: { full_name: string; password: string }) {
    setError(null);
    try {
      await invitationsApi.accept({ token, password, full_name: full_name.trim() });
      router.replace(`/login?${new URLSearchParams({ accepted: "1", email: preview.email })}`);
    } catch (e) {
      if (e instanceof ApiError && e.error.code === "account_exists") {
        router.replace(`/login?${new URLSearchParams({ email: preview.email, next: `/accept-invite?token=${token}` })}`);
        return;
      }
      setError(problemFor(e));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
      <FormError message={error} />
      <Field label="Email" value={preview.email} readOnly disabled hint="The invitation was sent to this address." />
      <Field label="Full name" autoComplete="name" placeholder="Funmi Adeyemi" error={errors.full_name?.message} {...register("full_name", { required: "Enter your full name" })} />
      <PasswordField
        label="Password"
        autoComplete="new-password"
        hint="At least 10 characters."
        error={errors.password?.message}
        {...register("password", { required: "Choose a password", minLength: { value: 10, message: "Use at least 10 characters" } })}
      />
      <PasswordField
        label="Confirm password"
        autoComplete="new-password"
        error={errors.confirm?.message}
        {...register("confirm", { required: "Repeat your password", validate: (v) => v === getValues("password") || "Passwords don't match" })}
      />
      <Button type="submit" loading={isSubmitting}>Create account and join</Button>
    </form>
  );
}

function SignedInAccept({ token, preview }: { token: string; preview: InvitationPreview }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      const res = await invitationsApi.accept({ token });
      const { setUser, setActiveTenant } = useAuthStore.getState();
      const me = await authApi.me();
      setUser(me);
      // memberships[0] would drop someone who already has another company into that one
      const joined = me.memberships.find((m) => m.tenant_id === res.tenant_id) ?? me.memberships[0];
      if (joined) setActiveTenant(joined);
      router.replace("/dashboard");
    } catch (e) {
      setError(problemFor(e));
      setBusy(false);
    }
  }

  return (
    <div className="mt-6 space-y-4">
      <FormError message={error} />
      <Button type="button" loading={busy} onClick={accept}>Accept and join {preview.tenant_name}</Button>
    </div>
  );
}

function SwitchAccount({ user, preview, signOut }: { user: AuthUser; preview: InvitationPreview; signOut: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-6 space-y-4">
      <p className="rounded-lg bg-background p-3 text-sm text-muted">
        You&apos;re signed in as <span className="font-medium text-foreground">{user.email}</span>, but this invitation is for{" "}
        <span className="font-medium text-foreground">{preview.email}</span>.
      </p>
      <Button type="button" loading={busy} onClick={async () => { setBusy(true); await signOut(); }}>
        Sign out and continue
      </Button>
    </div>
  );
}

export function AcceptInvite() {
  const token = useSearchParams().get("token") ?? "";
  const { user, checking, signOut } = useSessionUser();
  const preview = useApi(() => (token ? invitationsApi.preview(token) : Promise.resolve(undefined)), [token]);

  if (!token) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">Invitation link incomplete</h1>
        <p className="mt-2 text-sm text-muted">Open the link from your invitation email again, or ask for a new invitation.</p>
      </>
    );
  }
  if (preview.error) {
    return (
      <>
        <h1 className="text-2xl font-semibold tracking-tight">We can&apos;t open this invitation</h1>
        <div className="mt-4"><FormError message={problemFor(preview.error)} /></div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-medium text-primary hover:underline">Go to sign in</Link>
        </p>
      </>
    );
  }
  if (!preview.data || checking) return <LoadingSpinner />;

  const p = preview.data;
  const sameAccount = !!user && user.email.toLowerCase() === p.email.toLowerCase();
  const loginHref = `/login?${new URLSearchParams({ email: p.email, next: `/accept-invite?token=${token}` })}`;

  return (
    <>
      <Heading preview={p} />
      {user && !sameAccount ? (
        <SwitchAccount user={user} preview={p} signOut={signOut} />
      ) : !p.has_account ? (
        <NewAccountForm token={token} preview={p} />
      ) : sameAccount ? (
        <SignedInAccept token={token} preview={p} />
      ) : (
        <div className="mt-6 space-y-4">
          <p className="rounded-lg bg-background p-3 text-sm text-muted">This email already has an AuthentiCheck account. Sign in to accept the invitation.</p>
          <Link href={loginHref} className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-hover">
            Sign in to accept
          </Link>
        </div>
      )}
    </>
  );
}
