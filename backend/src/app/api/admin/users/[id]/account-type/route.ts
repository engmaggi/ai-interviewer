import { requireAdmin } from "@/lib/auth/guards";
import { ok } from "@/lib/http/responses";
import { parseBody, route } from "@/lib/http/handler";
import { changeAccountTypeSchema, userIdParamSchema } from "@/modules/admin/admin.schemas";
import { adminUsersService } from "@/modules/admin/admin-users.service";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/admin/users/{id}/account-type — admin only. Body: { "accountType": "admin" | "user" }
export const PATCH = route<Ctx>(async (req, { params }) => {
  const admin = await requireAdmin();
  const { id } = userIdParamSchema.parse(await params);
  const { accountType } = await parseBody(req, changeAccountTypeSchema);
  return ok(await adminUsersService.changeAccountType(admin.id, id, accountType));
});
