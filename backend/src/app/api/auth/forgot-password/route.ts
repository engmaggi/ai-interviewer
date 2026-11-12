import { accepted } from "@/lib/http/responses";
import { parseBody, route } from "@/lib/http/handler";
import { forgotPasswordSchema } from "@/modules/auth/auth.schemas";
import { authService } from "@/modules/auth/auth.service";

// POST /api/auth/forgot-password — public. Always 202 (never reveals whether the email exists).
export const POST = route(async (req) => {
  const input = await parseBody(req, forgotPasswordSchema);
  return accepted(await authService.forgotPassword(input));
});
