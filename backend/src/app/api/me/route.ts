import { requireUser } from "@/lib/auth/guards";
import { ok } from "@/lib/http/responses";
import { parseBody, route } from "@/lib/http/handler";
import { updateProfileSchema } from "@/modules/profiles/profiles.schemas";
import { profilesService } from "@/modules/profiles/profiles.service";

// GET /api/me — the logged-in user's profile.
export const GET = route(async () => {
  const user = await requireUser();
  return ok(await profilesService.getOwn(user.id, user.email));
});

// PATCH /api/me — edit displayName, developerRole, targetSeniority, yearsOfExperience.
export const PATCH = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, updateProfileSchema);
  return ok(await profilesService.updateOwn(user.id, user.email, input));
});
