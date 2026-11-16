import { getAccessToken, tryRefresh, redirectToLogin } from "@/lib/auth/store";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    public status: number,
    public error: { code: string; message: string; details?: unknown; request_id?: string },
    /** Seconds from a `Retry-After` header (429 responses). */
    public retryAfter?: number
  ) {
    super(error.message);
  }
}

// Public auth endpoints: a 401 here means bad credentials, not an expired session.
const NO_REFRESH_PATHS = ["/auth/refresh", "/auth/login", "/auth/register", "/auth/mfa/verify"];

function isRefreshPath(path: string) {
  return NO_REFRESH_PATHS.some((p) => path.startsWith(p));
}

/** Build a query string; arrays repeat the key, empty values are dropped. */
export function qs(params: Record<string, string | number | boolean | undefined | null | (string | number)[]>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    if (Array.isArray(v)) v.forEach((x) => sp.append(k, String(x)));
    else sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
}

/** Field-level messages from a `validation_error`. Nested objects flatten to dotted keys (`support_contact.email`). */
export function fieldErrors(e: unknown): Record<string, string> {
  if (!(e instanceof ApiError) || typeof e.error.details !== "object" || e.error.details === null) return {};
  const out: Record<string, string> = {};
  const walk = (obj: Record<string, unknown>, prefix: string) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (Array.isArray(v)) out[key] = v.map((x) => (typeof x === "string" ? x : "")).join(" ").trim();
      else if (typeof v === "string") out[key] = v;
      else if (v && typeof v === "object") walk(v as Record<string, unknown>, key);
    }
  };
  walk(e.error.details as Record<string, unknown>, "");
  return out;
}

export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  return e instanceof ApiError ? e.error.message : fallback;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // multipart bodies need the browser to set the Content-Type (with boundary)
  const isForm = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include", // refresh cookie is set on login
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      "X-Requested-With": "XMLHttpRequest",
      ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}),
      ...init?.headers,
    },
  });

  if (res.status === 401 && !isRefreshPath(path)) {
    const refreshed = await tryRefresh();
    if (refreshed) return apiFetch(path, init);
    redirectToLogin();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const retry = Number(res.headers.get("Retry-After"));
    throw new ApiError(res.status, body.error ?? { code: "unknown", message: res.statusText }, Number.isFinite(retry) && retry > 0 ? retry : undefined);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Download a file the API serves behind auth (a bearer header can't go on a plain link). */
export async function apiDownload(path: string, filename: string): Promise<void> {
  const send = () =>
    fetch(`${API_BASE}${path}`, {
      credentials: "include",
      headers: { "X-Requested-With": "XMLHttpRequest", ...(getAccessToken() ? { Authorization: `Bearer ${getAccessToken()}` } : {}) },
    });
  let res = await send();
  if (res.status === 401 && (await tryRefresh())) res = await send();
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? { code: "unknown", message: res.statusText });
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
