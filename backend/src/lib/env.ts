import { z } from "zod";

/**
 * Environment variables, validated once and typed.
 *
 * Why functions instead of top-level constants? `next build` imports every route
 * file; with lazy functions the build still works on a machine that has no
 * secrets, and we only fail (loudly, with a readable message) when a value is
 * actually needed.
 *
 * NOTE: Next.js only inlines NEXT_PUBLIC_* variables into browser code when they
 * are written out literally as `process.env.NEXT_PUBLIC_X`, hence the explicit list.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const databaseSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DATABASE_SSL_CA: z.string().optional(),
});

const secretSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
});

function formatIssues(error: z.ZodError): string {
  return error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
}

let publicCache: z.infer<typeof publicSchema> | undefined;
export function publicEnv() {
  if (!publicCache) {
    const parsed = publicSchema.safeParse({
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    if (!parsed.success) {
      throw new Error(`Invalid public environment variables:\n${formatIssues(parsed.error)}\nSee .env.example`);
    }
    publicCache = parsed.data;
  }
  return publicCache;
}

/** Variables needed only to talk to the database. */
let databaseCache: z.infer<typeof databaseSchema> | undefined;
export function databaseEnv() {
  if (!databaseCache) {
    const parsed = databaseSchema.safeParse({
      DATABASE_URL: process.env.DATABASE_URL,
      DATABASE_SSL_CA: process.env.DATABASE_SSL_CA || undefined,
    });
    if (!parsed.success) {
      throw new Error(`Invalid database environment variables:\n${formatIssues(parsed.error)}\nSee .env.example`);
    }
    databaseCache = parsed.data;
  }
  return databaseCache;
}

/** The Supabase secret key. SERVER ONLY — see src/lib/supabase/admin.ts. */
export function supabaseSecretKey() {
  const parsed = secretSchema.safeParse({ SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY });
  if (!parsed.success) {
    throw new Error(`Invalid server environment variables:\n${formatIssues(parsed.error)}\nSee .env.example`);
  }
  return parsed.data.SUPABASE_SECRET_KEY;
}
