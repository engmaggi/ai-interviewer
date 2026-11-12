/**
 * Creates the FIRST administrator (or promotes an existing user to admin).
 * Run by a human, on their own machine, with the secret key in .env.local:
 *
 *   ADMIN_BOOTSTRAP_EMAIL=you@example.com ADMIN_BOOTSTRAP_PASSWORD='Str0ngPass!' npm run admin:bootstrap
 *
 * This is the only way to create an admin out of thin air. It is not an HTTP
 * endpoint, so nobody on the internet can reach it. Further admins are created
 * from the API by an existing admin (PATCH /api/admin/users/{id}/account-type).
 */
import { createClient } from "@supabase/supabase-js";
import { createPrismaClient } from "../src/db/create-prisma-client";

function need(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. See docs/SETUP_GUIDE.md.`);
    process.exit(1);
  }
  return value;
}

async function main() {
  const email = need("ADMIN_BOOTSTRAP_EMAIL").trim().toLowerCase();
  const prisma = createPrismaClient(need("DATABASE_URL"), process.env.DATABASE_SSL_CA || undefined);

  try {
    const existing = await prisma.$queryRaw<{ id: string }[]>`SELECT id FROM auth.users WHERE email = ${email}`;
    let userId = existing[0]?.id;

    if (userId) {
      console.log(`User ${email} already exists — promoting to admin.`);
    } else {
      const password = need("ADMIN_BOOTSTRAP_PASSWORD");
      const supabase = createClient(need("NEXT_PUBLIC_SUPABASE_URL"), need("SUPABASE_SECRET_KEY"), {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // no confirmation email needed for the bootstrap admin
        user_metadata: {
          display_name: process.env.ADMIN_BOOTSTRAP_NAME ?? "Platform Admin",
          developer_role: "software_engineer",
          target_seniority: "senior",
          years_of_experience: 0,
        },
      });
      if (error || !data.user) {
        console.error("Could not create the user:", error?.message);
        process.exit(1);
      }
      userId = data.user.id;
      console.log(`Created user ${email}.`);
    }

    // The signup trigger created the profile as a normal user; now elevate it.
    // We connect as the database owner, which the profiles guard-trigger allows.
    await prisma.$transaction([
      prisma.profile.update({ where: { id: userId }, data: { accountType: "admin" } }),
      prisma.auditLog.create({
        data: { actorId: null, action: "admin_bootstrapped", targetUserId: userId, metadata: { email } },
      }),
    ]);

    console.log(`✔ ${email} is now an administrator.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
