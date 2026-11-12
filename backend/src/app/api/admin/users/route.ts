import { requireAdmin } from "@/lib/auth/guards";
import { ok } from "@/lib/http/responses";
import { parseQuery, route } from "@/lib/http/handler";
import { listUsersQuerySchema } from "@/modules/admin/admin.schemas";
import { adminUsersService } from "@/modules/admin/admin-users.service";

// GET /api/admin/users?page=1&pageSize=20&search=ali — admin only.
export const GET = route(async (req) => {
  await requireAdmin();
  const query = parseQuery(req, listUsersQuerySchema);
  return ok(await adminUsersService.list(query));
});
