import { accepted } from "@/lib/http/responses";
import { parseBody, route } from "@/lib/http/handler";
import { registerSchema } from "@/modules/auth/auth.schemas";
import { authService } from "@/modules/auth/auth.service";

// POST /api/auth/register — public. 202: "we accepted it, now confirm your email".
export const POST = route(async (req) => {
  const input = await parseBody(req, registerSchema);
  return accepted(await authService.register(input));
});
