import { defineConfig } from "prisma/config";

// Prisma CLI reads connection info from here (not from schema.prisma) in Prisma 7.
// The CLI uses DIRECT_URL (needed for migrations); the app itself uses
// DATABASE_URL at runtime (see src/db/prisma.ts).
// Environment variables must be loaded by Node: scripts in package.json use
// `--env-file`, and for plain `npx prisma ...` commands we load .env.local below.
try {
  process.loadEnvFile(".env.local");
} catch {
  // File may not exist in CI / production where variables come from the platform.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: {
    // `prisma generate` doesn't need a real DB, so fall back to a placeholder.
    url: process.env.DIRECT_URL ?? "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
