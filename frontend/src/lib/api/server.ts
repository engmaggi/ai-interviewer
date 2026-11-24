import "server-only";

import { cookies } from "next/headers";

import { apiFetch } from "./client";

/** Locally the backend runs on its own port; when deployed it shares the app's domain. */
function getBackendUrl() {
  const url = process.env.BACKEND_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    throw new Error(
      "Set BACKEND_URL (local) or NEXT_PUBLIC_APP_URL (deployed) so the server can reach the API.",
    );
  }

  return url;
}

/** Forwards the visitor's session cookies, so the backend sees the same user as the browser. */
async function withSessionCookies(init: RequestInit = {}): Promise<RequestInit> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");

  const headers = new Headers(init.headers);
  if (cookieHeader) headers.set("Cookie", cookieHeader);

  return { ...init, headers, cache: "no-store" };
}

/** Server Components only. Mutations go through the browser so the backend can set cookies. */
export const serverApi = {
  get: async <T>(path: string) =>
    apiFetch<T>(
      `${getBackendUrl()}${path}`,
      await withSessionCookies({ method: "GET" }),
    ),
};
