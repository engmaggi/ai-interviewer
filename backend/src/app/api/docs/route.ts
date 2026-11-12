import { route } from "@/lib/http/handler";
import { assertDocsEnabled } from "@/lib/openapi/enabled";

// Swagger UI is loaded from a CDN, pinned to an exact version, so the project needs no extra
// dependency. (It needs internet access in the browser; to work offline, install `swagger-ui-dist`
// and serve its files from /public instead.)
const SWAGGER_UI_VERSION = "5.33.1";
const CDN = `https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}`;

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Orbit API docs</title>
    <link rel="stylesheet" href="${CDN}/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="${CDN}/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        tryItOutEnabled: true,
        // Send the session cookies with "Try it out" requests (log in first with POST /api/auth/login).
        requestInterceptor: (req) => { req.credentials = "include"; return req; },
      });
    </script>
  </body>
</html>`;

// GET /api/docs — interactive documentation.
export const GET = route(async () => {
  assertDocsEnabled();
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
});
