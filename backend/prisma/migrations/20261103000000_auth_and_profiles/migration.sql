-- Orbit — Migration 1: authentication & user management
-- Applied with `npx prisma migrate deploy`. Hand-written on purpose: Prisma cannot
-- express triggers, RLS policies or foreign keys into Supabase's `auth` schema.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Types
-- ─────────────────────────────────────────────────────────────────────────────
-- Closed sets the application code branches on, so a real PostgreSQL ENUM fits.
-- Adding a value later: ALTER TYPE ... ADD VALUE 'company';
CREATE TYPE "public"."account_type" AS ENUM ('user', 'admin');
CREATE TYPE "public"."target_seniority" AS ENUM ('junior', 'mid', 'senior');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. developer_roles — lookup table (open set; extend with a plain INSERT)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "public"."developer_roles" (
  "code"       text        PRIMARY KEY,
  "label"      text        NOT NULL,
  "sort_order" integer     NOT NULL DEFAULT 0,
  "is_active"  boolean     NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "developer_roles_code_format" CHECK ("code" ~ '^[a-z][a-z0-9_]*$')
);

INSERT INTO "public"."developer_roles" ("code", "label", "sort_order") VALUES
  ('frontend_developer',   'Frontend Developer',   10),
  ('backend_developer',    'Backend Developer',    20),
  ('full_stack_developer', 'Full Stack Developer', 30),
  ('mobile_developer',     'Mobile Developer',     40),
  ('devops_engineer',      'DevOps Engineer',      50),
  ('qa_engineer',          'QA Engineer',          60),
  ('software_engineer',    'Software Engineer',    70),
  ('data_engineer',        'Data Engineer',        80),
  ('other',                'Other',                999);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. profiles — one row per auth.users row (1:1). No credentials live here.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "public"."profiles" (
  "id"                  uuid                       PRIMARY KEY
                        REFERENCES "auth"."users"("id") ON DELETE CASCADE,
  "display_name"        text                       NOT NULL,
  "account_type"        "public"."account_type"    NOT NULL DEFAULT 'user',
  "developer_role"      text                       NOT NULL
                        REFERENCES "public"."developer_roles"("code") ON UPDATE CASCADE,
  "target_seniority"    "public"."target_seniority" NOT NULL,
  "years_of_experience" smallint                   NOT NULL,
  "created_at"          timestamptz                NOT NULL DEFAULT now(),
  "updated_at"          timestamptz                NOT NULL DEFAULT now(),
  CONSTRAINT "profiles_display_name_length"
    CHECK (char_length(btrim("display_name")) BETWEEN 2 AND 80),
  CONSTRAINT "profiles_years_of_experience_range"
    CHECK ("years_of_experience" BETWEEN 0 AND 60)
);

CREATE INDEX "profiles_account_type_idx"   ON "public"."profiles" ("account_type");
CREATE INDEX "profiles_developer_role_idx" ON "public"."profiles" ("developer_role");

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. audit_logs — who did what (written only by the server)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "public"."audit_logs" (
  "id"             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id"       uuid        REFERENCES "public"."profiles"("id") ON DELETE SET NULL,
  "action"         text        NOT NULL,
  -- No FK on purpose: the log must outlive a deleted target user.
  "target_user_id" uuid,
  "metadata"       jsonb       NOT NULL DEFAULT '{}'::jsonb,
  "created_at"     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX "audit_logs_created_at_idx"     ON "public"."audit_logs" ("created_at" DESC);
CREATE INDEX "audit_logs_actor_id_idx"       ON "public"."audit_logs" ("actor_id");
CREATE INDEX "audit_logs_target_user_id_idx" ON "public"."audit_logs" ("target_user_id");

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Functions & triggers
-- ─────────────────────────────────────────────────────────────────────────────

-- 5a. Keep updated_at fresh.
CREATE FUNCTION "public"."set_updated_at"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER "profiles_set_updated_at"
  BEFORE UPDATE ON "public"."profiles"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- 5b. Create the profile automatically when Supabase Auth creates a user.
-- SECURITY: signup metadata is controlled by the caller, so `account_type` is
-- NEVER read from it — every new profile is a plain 'user'.
CREATE FUNCTION "public"."handle_new_user"() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  meta jsonb := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO "public"."profiles"
    ("id", "display_name", "developer_role", "target_seniority", "years_of_experience")
  VALUES (
    NEW.id,
    CASE
      WHEN char_length(btrim(COALESCE(meta ->> 'display_name', ''))) >= 2 THEN btrim(meta ->> 'display_name')
      WHEN char_length(split_part(COALESCE(NEW.email, ''), '@', 1)) >= 2 THEN split_part(NEW.email, '@', 1)
      ELSE 'New User'
    END,
    COALESCE(NULLIF(meta ->> 'developer_role', ''), 'other'),
    COALESCE(NULLIF(meta ->> 'target_seniority', ''), 'junior')::"public"."target_seniority",
    COALESCE(NULLIF(meta ->> 'years_of_experience', ''), '0')::smallint
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();

-- 5c. Last line of defence against privilege escalation. Requests made through
-- the `authenticated` / `anon` roles can never change account_type or id,
-- whatever the application code (or a future bug) does.
CREATE FUNCTION "public"."protect_profile_privileged_columns"() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated')
     AND (NEW.account_type IS DISTINCT FROM OLD.account_type OR NEW.id IS DISTINCT FROM OLD.id) THEN
    RAISE EXCEPTION 'account_type and id cannot be changed by this role'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "profiles_protect_privileged_columns"
  BEFORE UPDATE ON "public"."profiles"
  FOR EACH ROW EXECUTE FUNCTION "public"."protect_profile_privileged_columns"();

-- 5d. is_admin(): used by RLS policies. SECURITY DEFINER so the lookup on
-- `profiles` does not re-trigger the profiles policies (infinite recursion).
-- Reads the database (not a JWT claim), so a demotion takes effect immediately.
CREATE FUNCTION "public"."is_admin"() RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM "public"."profiles"
    WHERE "id" = (SELECT auth.uid()) AND "account_type" = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION "public"."is_admin"()                         FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."handle_new_user"()                  FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."set_updated_at"()                   FROM PUBLIC;
REVOKE ALL ON FUNCTION "public"."protect_profile_privileged_columns"() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION "public"."is_admin"() TO "authenticated";

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Privileges (column-level) and Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase grants broad default privileges on new tables; start from zero.
REVOKE ALL ON "public"."profiles"        FROM "anon", "authenticated";
REVOKE ALL ON "public"."developer_roles" FROM "anon", "authenticated";
REVOKE ALL ON "public"."audit_logs"      FROM "anon", "authenticated";

-- profiles: a signed-in user may read rows (RLS narrows to own / admin) and
-- update ONLY these four columns. account_type is deliberately absent.
GRANT SELECT ON "public"."profiles" TO "authenticated";
GRANT UPDATE ("display_name", "developer_role", "target_seniority", "years_of_experience")
  ON "public"."profiles" TO "authenticated";

ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON "public"."profiles"
  FOR SELECT TO "authenticated"
  USING ("id" = (SELECT auth.uid()));

CREATE POLICY "profiles_select_admin" ON "public"."profiles"
  FOR SELECT TO "authenticated"
  USING ((SELECT "public"."is_admin"()));

CREATE POLICY "profiles_update_own" ON "public"."profiles"
  FOR UPDATE TO "authenticated"
  USING ("id" = (SELECT auth.uid()))
  WITH CHECK ("id" = (SELECT auth.uid()));
-- No INSERT / DELETE policies: profiles are created by the trigger and removed
-- by ON DELETE CASCADE. Changing account_type is done by the server (see docs).

-- developer_roles: public read (needed on the registration form), no client writes.
GRANT SELECT ON "public"."developer_roles" TO "anon", "authenticated";
ALTER TABLE "public"."developer_roles" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "developer_roles_select_anon" ON "public"."developer_roles"
  FOR SELECT TO "anon"
  USING ("is_active");
-- Signed-in users can read EVERY role, including deactivated ones: a profile that
-- still points at a retired role must keep loading (the API hides inactive roles
-- from the registration dropdown by filtering on is_active itself).
CREATE POLICY "developer_roles_select_authenticated" ON "public"."developer_roles"
  FOR SELECT TO "authenticated"
  USING (true);

-- audit_logs: admins may read; nobody writes through the client roles.
GRANT SELECT ON "public"."audit_logs" TO "authenticated";
ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select_admin" ON "public"."audit_logs"
  FOR SELECT TO "authenticated"
  USING ((SELECT "public"."is_admin"()));

-- Prisma's own bookkeeping table must not be reachable through Supabase's Data API.
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
    REVOKE ALL ON "public"."_prisma_migrations" FROM "anon", "authenticated";
  END IF;
END
$$;
