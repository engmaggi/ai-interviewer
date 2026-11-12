import { NextResponse } from "next/server";
import { publicEnv } from "@/lib/env";
import { route } from "@/lib/http/handler";
import { assertDocsEnabled } from "@/lib/openapi/enabled";
import { buildOpenApiSpec } from "@/lib/openapi/spec";

// GET /api/openapi.json — the machine-readable API description (OpenAPI 3.1).
// Import this URL into Postman, Insomnia, or a code generator.
export const GET = route(async () => {
  assertDocsEnabled();
  // Use the configured public URL: behind Render's proxy the request's own origin
  // can be the internal address (http://localhost:10000).
  const serverUrl = new URL(publicEnv().NEXT_PUBLIC_APP_URL).origin;
  return NextResponse.json(buildOpenApiSpec(serverUrl), { headers: { "Cache-Control": "no-store" } });
});