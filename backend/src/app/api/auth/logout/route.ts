import { noContent } from "@/lib/http/responses";
import { route } from "@/lib/http/handler";
import { authService } from "@/modules/auth/auth.service";

// POST /api/auth/logout — clears the session cookies. Idempotent.
export const POST = route(async () => {
  await authService.logout();
  return noContent();
});
