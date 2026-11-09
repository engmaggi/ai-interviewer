import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const ADMIN_NOT_CONFIGURED_MESSAGE =
  "Admin access isn't configured. Add SUPABASE_SERVICE_ROLE_KEY to .env.local and restart the dev server.";

/** Returns the service-role client, or null when the keys are missing. */
export function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch {
    return null;
  }
}
