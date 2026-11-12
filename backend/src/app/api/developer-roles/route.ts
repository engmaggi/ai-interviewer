import { ok } from "@/lib/http/responses";
import { route } from "@/lib/http/handler";
import { developerRolesService } from "@/modules/developer-roles/developer-roles.service";

// GET /api/developer-roles — public; feeds the dropdown on the registration form.
export const GET = route(async () => ok(await developerRolesService.listActive()));
