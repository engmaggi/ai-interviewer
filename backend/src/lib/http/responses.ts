import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

// API responses can contain personal data and depend on cookies: never cache them.
const headers = { "Cache-Control": "no-store" };

/** Success shape: { data: ... } */
export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status, headers });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function accepted<T>(data: T) {
  return ok(data, 202);
}

export function noContent() {
  return new NextResponse(null, { status: 204, headers });
}

/** Error shape: { error: { code, message, details? } } */
export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request is invalid.",
          details: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 400, headers },
    );
  }

  if (err instanceof AppError) {
    return NextResponse.json(
      { error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) } },
      { status: err.status, headers },
    );
  }

  // Unknown error: log it for us, tell the client nothing about internals.
  console.error("[unhandled error]", err);
  return NextResponse.json(
    { error: { code: "INTERNAL_ERROR", message: "Something went wrong on our side." } },
    { status: 500, headers },
  );
}
