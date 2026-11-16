"use client";

import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { authApi, type MfaEnrollResponse } from "@/lib/api/auth";
import { FormError } from "@/components/ui/Button";
import { mfaError, CodeForm } from "./MFAChallenge";

export function MFASetup({ challengeToken, onBack }: { challengeToken: string; onBack: () => void }) {
  const [enroll, setEnroll] = useState<MfaEnrollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Enrolling again issues a new secret, so call exactly once (strict mode runs effects twice in dev).
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    authApi.mfaEnroll(challengeToken).then(setEnroll, (e) => {
      const { message, expired } = mfaError(e);
      if (expired) onBack();
      else setError(message === "We couldn't verify the code. Please try again." ? "We couldn't start setup. Please try again." : message);
    });
  }, [challengeToken, onBack]);

  // The secret is shown in groups of four for manual entry.
  const spaced = enroll?.secret.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();

  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">Set up two-step verification</h1>
      <p className="mt-1 text-sm text-muted">
        Scan this code with Google Authenticator, Authy or 1Password, then enter the 6-digit code it shows.
      </p>
      <div className="mt-5"><FormError message={error} /></div>
      {enroll && (
        <>
          <div className="mt-5 flex justify-center rounded-lg border border-border bg-white p-4">
            {/* Rendered locally: the URI contains the secret, so it must never go to a QR service. */}
            <QRCodeSVG value={enroll.provisioning_uri} size={176} role="img" aria-label="Authenticator QR code" />
          </div>
          <div className="mt-3 text-center text-xs text-muted">
            Can&apos;t scan? Enter this key instead
            <div className="mt-1 select-all font-mono text-sm tracking-wider text-foreground">{spaced}</div>
          </div>
          <CodeForm submit={(t) => authApi.mfaEnrollConfirm(challengeToken, t)} label="6-digit code" action="Confirm" onExpired={onBack} />
        </>
      )}
      <button type="button" onClick={onBack} className="mt-6 w-full text-center text-sm font-medium text-primary hover:underline">
        Back to sign in
      </button>
    </>
  );
}
