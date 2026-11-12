/** What the API returns for a user's profile. Never expose raw database rows. */
export interface ProfileDto {
  id: string;
  email: string | null;
  displayName: string;
  accountType: "user" | "admin";
  developerRole: { code: string; label: string };
  targetSeniority: "junior" | "mid" | "senior";
  yearsOfExperience: number;
  createdAt: string;
  updatedAt: string;
}
