import { ok } from "@/lib/http/responses";
import { parseBody, route } from "@/lib/http/handler";
import { resetPasswordSchema } from "@/modules/auth/auth.schemas";
import { authService } from "@/modules/auth/auth.service";

// POST /api/auth/reset-password — requires the recovery session created by the emailed link.
export const POST = route(async (req) => {
  const input = await parseBody(req, resetPasswordSchema);
  return ok(await authService.resetPassword(input));
});
