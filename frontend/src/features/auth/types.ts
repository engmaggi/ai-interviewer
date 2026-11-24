import type { Profile } from "@/types/user";

/** The signed-in user as the UI needs it. Always loaded from `GET /api/me`, never from token metadata. */
export type SessionUser = Profile;
