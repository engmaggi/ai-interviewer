import { queryOptions } from "@tanstack/react-query";

import { api } from "@/lib/api/client";
import type { DeveloperRole } from "@/types/user";

/** Active roles for the registration and admin forms. They rarely change, so cache them for the session. */
export const developerRolesQueryOptions = queryOptions({
  queryKey: ["developer-roles"],
  queryFn: () => api.get<DeveloperRole[]>("/api/developer-roles"),
  staleTime: Infinity,
});
