import type { NextRequest } from "next/server";
import type { ZodType } from "zod";
import { ForbiddenError, ValidationError } from "@/lib/errors";
import { publicEnv } from "@/lib/env";
import { errorResponse } from "./responses";

type RouteHandler<Ctx> = (req: NextRequest, ctx: Ctx) => Promise<Response>;

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * Basic CSRF defence for cookie-authenticated requests: browsers always send an
 * Origin header on cross-site POST/PATCH/DELETE, so if it is present it must be us.
 * (Tools such as curl send no Origin and pass.)
 */
function assertSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(publicEnv().NEXT_PUBLIC_APP_URL).origin) {
    throw new ForbiddenError("Cross-origin requests are not allowed.", "BAD_ORIGIN");
  }
}

/**
 * Wrap every route handler with this. It gives us ONE place that converts thrown
 * errors into consistent JSON, so handlers can simply `throw`.
 */
export function route<Ctx = unknown>(handler: RouteHandler<Ctx>): RouteHandler<Ctx> {
  return async (req, ctx) => {
    try {
      if (STATE_CHANGING.has(req.method)) assertSameOrigin(req);
      return await handler(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

/** Read the JSON body and validate it with a Zod schema. Throws a 400 on any problem. */
export async function parseBody<T>(req: NextRequest, schema: ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON.", "INVALID_JSON");
  }
  return schema.parse(raw); // ZodError is converted to a 400 by errorResponse
}

/** Validate query-string parameters. */
export function parseQuery<T>(req: NextRequest, schema: ZodType<T>): T {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams));
}
