import { requireUser } from "@/lib/auth/guards";
import { parseQuery, route } from "@/lib/http/handler";
import { ok } from "@/lib/http/responses";
import { listQuestionsQuerySchema } from "@/modules/questions/questions.schemas";
import { questionsService } from "@/modules/questions/questions.service";

// GET /api/questions?assessmentDomain=practice&topic=react — signed-in users only.
export const GET = route(async (req) => {
  const user = await requireUser();
  const query = parseQuery(req, listQuestionsQuerySchema);
  return ok(await questionsService.list(user.id, query));
});
