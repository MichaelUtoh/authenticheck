import { ApiError, errorMessage } from "@/lib/api/client";

/** Invitation actions are rate-limited (429 `throttled`, with `Retry-After`); everything else uses the API's own message. */
export function inviteError(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.status === 429) {
    const mins = e.retryAfter ? Math.max(1, Math.ceil(e.retryAfter / 60)) : null;
    return `You've sent a lot of invitations. Try again ${mins ? `in about ${mins} minute${mins === 1 ? "" : "s"}` : "a little later"}.`;
  }
  return errorMessage(e, fallback);
}
