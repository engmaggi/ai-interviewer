/**
 * Thin wrapper around the backend's JSON contract:
 *   success → `{ data }` (or 204 with no body)
 *   failure → `{ error: { code, message, details? } }`
 * Every failure is thrown as an `ApiError`, so callers only handle one error type.
 */

const NETWORK_ERROR_MESSAGE =
  "We couldn't reach the server. Check your connection and try again.";
const UNEXPECTED_ERROR_MESSAGE = "Something went wrong. Please try again.";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    /** Per-field messages from a 400 `VALIDATION_ERROR`, keyed by request field name. */
    readonly fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ErrorBody = {
  error?: { code?: string; message?: string; details?: unknown };
};

function toFieldErrors(details: unknown): Record<string, string> | undefined {
  if (!Array.isArray(details)) return undefined;

  const fieldErrors: Record<string, string> = {};
  for (const issue of details) {
    const field = String(issue?.path ?? "").split(".")[0];
    if (field && !fieldErrors[field]) fieldErrors[field] = String(issue.message);
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

function toApiError(status: number, body: ErrorBody | null): ApiError {
  const error = body?.error;

  return new ApiError(
    status,
    error?.code ?? "UNEXPECTED_RESPONSE",
    error?.message ?? UNEXPECTED_ERROR_MESSAGE,
    toFieldErrors(error?.details),
  );
}

/** Calls the backend and returns the unwrapped `data`. Throws `ApiError` on any failure. */
export async function apiFetch<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  if (init.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", NETWORK_ERROR_MESSAGE);
  }

  if (response.status === 204) return undefined as T;

  const body = await response.json().catch(() => null);
  if (response.ok && body && "data" in body) return body.data as T;

  throw toApiError(response.status, body);
}

export const api = {
  get: <T>(url: string, init?: RequestInit) =>
    apiFetch<T>(url, { ...init, method: "GET" }),
  post: <T>(url: string, body?: unknown, init?: RequestInit) =>
    apiFetch<T>(url, {
      ...init,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T>(url: string, body: unknown, init?: RequestInit) =>
    apiFetch<T>(url, { ...init, method: "PATCH", body: JSON.stringify(body) }),
  delete: <T = void>(url: string, init?: RequestInit) =>
    apiFetch<T>(url, { ...init, method: "DELETE" }),
};
