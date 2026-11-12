import "server-only";
import { ValidationError } from "@/lib/errors";
import { developerRolesRepository } from "./developer-roles.repository";

export const developerRolesService = {
  listActive() {
    return developerRolesRepository.listActive();
  },

  /** Throws a 400 unless `code` is an existing, active developer role. */
  async assertActive(code: string) {
    const role = await developerRolesRepository.findActiveByCode(code);
    if (!role) {
      throw new ValidationError("Unknown developer role.", "INVALID_DEVELOPER_ROLE");
    }
  },
};
