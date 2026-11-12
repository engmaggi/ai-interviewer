/**
 * Sanity-checks that the migration was applied correctly and that database
 * security behaves as designed. Safe to run any time: it only reads, and every
 * check runs inside a transaction that is rolled back.
 *
 *   npm run db:verify
 */
import { createPrismaClient } from "../src/db/create-prisma-client";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Did you create .env.local? See docs/SETUP_GUIDE.md.");
  process.exit(1);
}
const prisma = createPrismaClient(url, process.env.DATABASE_SSL_CA || undefined);

let failures = 0;
async function check(name: string, fn: () => Promise<boolean>) {
  try {
    const passed = await fn();
    console.log(`${passed ? "✔" : "✘"} ${name}`);
    if (!passed) failures++;
  } catch (err) {
    console.log(`✘ ${name}\n    ${(err as Error).message}`);
    failures++;
  }
}

/** True when the callback throws a Postgres "permission denied" error. */
async function isDenied(fn: () => Promise<unknown>) {
  try {
    await fn();
    return false;
  } catch (err) {
    return /permission denied/i.test((err as Error).message);
  }
}

const ROLLBACK = Symbol("rollback");
/** Runs `fn` in a transaction that is always rolled back. */
async function sandbox<T>(fn: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>): Promise<T> {
  let result!: T;
  try {
    await prisma.$transaction(async (tx) => {
      result = await fn(tx);
      throw ROLLBACK;
    });
  } catch (err) {
    if (err !== ROLLBACK) throw err;
  }
  return result;
}

async function main() {
  await check("database connection works", async () => {
    const rows = await prisma.$queryRaw<{ ok: number }[]>`SELECT 1 AS ok`;
    return rows[0]?.ok === 1;
  });

  await check("tables profiles, developer_roles, audit_logs exist", async () => {
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('profiles', 'developer_roles', 'audit_logs')`;
    return Number(rows[0]?.n) === 3;
  });

  await check("Row Level Security is enabled on all three tables", async () => {
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM pg_class c JOIN pg_namespace ns ON ns.oid = c.relnamespace
      WHERE ns.nspname = 'public' AND c.relname IN ('profiles', 'developer_roles', 'audit_logs') AND c.relrowsecurity`;
    return Number(rows[0]?.n) === 3;
  });

  await check("signup trigger exists on auth.users", async () => {
    const rows = await prisma.$queryRaw<{ n: bigint }[]>`
      SELECT count(*) AS n FROM pg_trigger WHERE tgname = 'on_auth_user_created' AND NOT tgisinternal`;
    return Number(rows[0]?.n) === 1;
  });

  await check("developer roles are seeded", async () => (await prisma.developerRole.count()) >= 9);

  await check("the app can switch to the 'authenticated' role (needed for RLS)", () =>
    sandbox(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE authenticated`;
      const rows = await tx.$queryRaw<{ r: string }[]>`SELECT current_user::text AS r`;
      return rows[0]?.r === "authenticated";
    }));

  await check("a signed-in user with no profile sees 0 profiles (RLS filters rows)", () =>
    sandbox(async (tx) => {
      await tx.$executeRaw`SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true)`;
      await tx.$executeRaw`SET LOCAL ROLE authenticated`;
      const rows = await tx.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM public.profiles`;
      return Number(rows[0]?.n) === 0;
    }));

  await check("a signed-in user cannot UPDATE profiles.account_type", () =>
    sandbox(async (tx) => {
      await tx.$executeRaw`SELECT set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111"}', true)`;
      await tx.$executeRaw`SET LOCAL ROLE authenticated`;
      return isDenied(() => tx.$executeRaw`UPDATE public.profiles SET account_type = 'admin'`);
    }));

  await check("a signed-in user cannot INSERT or DELETE profiles", async () => {
    const insertDenied = await sandbox(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE authenticated`;
      return isDenied(
        () => tx.$executeRaw`INSERT INTO public.profiles (id, display_name, developer_role, target_seniority, years_of_experience)
                              VALUES (gen_random_uuid(), 'x y', 'other', 'mid', 1)`,
      );
    });
    const deleteDenied = await sandbox(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE authenticated`;
      return isDenied(() => tx.$executeRaw`DELETE FROM public.profiles`);
    });
    return insertDenied && deleteDenied;
  });

  await check("anonymous visitors cannot read profiles", () =>
    sandbox(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE anon`;
      return isDenied(() => tx.$queryRaw`SELECT * FROM public.profiles`);
    }));

  await check("anonymous visitors can read active developer roles", () =>
    sandbox(async (tx) => {
      await tx.$executeRaw`SET LOCAL ROLE anon`;
      const rows = await tx.$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM public.developer_roles`;
      return Number(rows[0]?.n) >= 9;
    }));

  console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) FAILED.`);
}

main()
  .catch((err) => {
    console.error(err);
    failures++;
  })
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(failures === 0 ? 0 : 1);
  });
