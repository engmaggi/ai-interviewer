import { ok } from "@/lib/http/responses";
import { parseBody, route } from "@/lib/http/handler";
import { loginSchema } from "@/modules/auth/auth.schemas";
import { authService } from "@/modules/auth/auth.service";

// POST /api/auth/login — public. Sets the session cookies and returns the profile.
export const POST = route(async (req) => {
  const input = await parseBody(req, loginSchema);
  return ok(await authService.login(input));
});
