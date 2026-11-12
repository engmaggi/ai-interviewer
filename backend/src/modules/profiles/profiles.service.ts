import "server-only";
import { UnauthorizedError } from "@/lib/errors";
import { developerRolesService } from "@/modules/developer-roles/developer-roles.service";
import { profilesRepository, type ProfileRecord } from "./profiles.repository";
import type { UpdateProfileInput } from "./profiles.schemas";
import type { ProfileDto } from "./profiles.types";

export function toProfileDto(profile: ProfileRecord, email: string | null): ProfileDto {
  return {
    id: profile.id,
    email,
    displayName: profile.displayName,
    accountType: profile.accountType,
    developerRole: profile.role,
    targetSeniority: profile.targetSeniority,
    yearsOfExperience: profile.yearsOfExperience,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}

export const profilesService = {
  async getOwn(userId: string, email: string | null): Promise<ProfileDto> {
    const profile = await profilesRepository.findOwn(userId);
    // A valid session whose profile no longer exists = the account was deleted.
    if (!profile) throw new UnauthorizedError("This account no longer exists.", "ACCOUNT_NOT_FOUND");
    return toProfileDto(profile, email);
  },

  async updateOwn(userId: string, email: string | null, input: UpdateProfileInput): Promise<ProfileDto> {
    if (input.developerRole) await developerRolesService.assertActive(input.developerRole);
    const profile = await profilesRepository.updateOwn(userId, input);
    if (!profile) throw new UnauthorizedError("This account no longer exists.", "ACCOUNT_NOT_FOUND");
    return toProfileDto(profile, email);
  },
};
