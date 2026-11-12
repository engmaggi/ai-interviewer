import { requireAdmin } from "@/lib/auth/guards";
import { noContent } from "@/lib/http/responses";
import { route } from "@/lib/http/handler";
import { userIdParamSchema } from "@/modules/admin/admin.schemas";
import { adminUsersService } from "@/modules/admin/admin-users.service";

type Ctx = { params: Promise<{ id: string }> };

// DELETE /api/admin/users/{id} — admin only. Permanently deletes the account.
export const DELETE = route<Ctx>(async (_req, { params }) => {
  const admin = await requireAdmin();
  const { id } = userIdParamSchema.parse(await params);
  await adminUsersService.deleteUser(admin.id, id);
  return noContent();
});
