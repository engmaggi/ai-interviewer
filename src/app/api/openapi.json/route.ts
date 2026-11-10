import { NextResponse } from "next/server";
import { route } from "@/lib/http/handler";
import { assertDocsEnabled } from "@/lib/openapi/enabled";
import { buildOpenApiSpec } from "@/lib/openapi/spec";

// GET /api/openapi.json — the machine-readable API description (OpenAPI 3.1).
// Import this URL into Postman, Insomnia, or a code generator.
export const GET = route(async (req) => {
  assertDocsEnabled();
  return NextResponse.json(buildOpenApiSpec(req.nextUrl.origin), { headers: { "Cache-Control": "no-store" } });
});
