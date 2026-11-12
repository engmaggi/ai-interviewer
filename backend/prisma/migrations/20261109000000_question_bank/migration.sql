-- Question bank: competencies + questions.
-- Enum values are lowercase "slugs" (e.g. html_css); the human label ("HTML/CSS")
-- lives in application code (src/modules/questions/questions.constants.ts).

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Enums
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE "public"."assessment_domain" AS ENUM ('practice', 'behavioural', 'official');

CREATE TYPE "public"."question_topic" AS ENUM (
  'javascript', 'typescript', 'react', 'nextjs', 'html_css', 'testing', 'performance',
  'accessibility', 'frontend_architecture', 'design_systems', 'backend_awareness',
  'frontend_system_design', 'collaboration', 'ownership', 'feedback_and_learning',
  'prioritisation', 'problem_solving'
);

CREATE TYPE "public"."question_type" AS ENUM (
  'technical_knowledge', 'coding_challenge', 'behavioural', 'voice_followup_template', 'system_design'
);

CREATE TYPE "public"."question_difficulty" AS ENUM ('easy', 'medium', 'hard', 'adaptive');

-- Matches the "Proficiency Rubric" sheet (1 Basic … 4 Advanced); all_levels = behavioural questions.
CREATE TYPE "public"."proficiency_level" AS ENUM ('basic', 'developing', 'proficient', 'advanced', 'all_levels');

CREATE TYPE "public"."authoring_status" AS ENUM ('draft', 'in_review', 'published');

CREATE TYPE "public"."competency_category" AS ENUM ('frontend', 'behavioural');

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. competencies (parent table)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "public"."competencies" (
  "competency_id"   text PRIMARY KEY,
  "competency_name" text NOT NULL,
  "category"        "public"."competency_category" NOT NULL,
  "created_at"      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "competencies_id_format" CHECK ("competency_id" ~ '^[A-Z]{2}-[0-9]{2}$'),
  CONSTRAINT "competencies_name_not_blank" CHECK (length(btrim("competency_name")) > 0)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. questions (a question can have several versions: key = question_id + version)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE "public"."questions" (
  "question_id"                 text NOT NULL,
  "version"                     integer NOT NULL DEFAULT 1,
  "question_type"               "public"."question_type" NOT NULL,
  "assessment_domain"           "public"."assessment_domain" NOT NULL,
  "topic"                       "public"."question_topic" NOT NULL,
  "competency_id"               text NOT NULL REFERENCES "public"."competencies"("competency_id") ON UPDATE CASCADE,
  "title"                       text NOT NULL,
  "question_prompt"             text NOT NULL,
  "starter_code"                text,
  "visible_example"             text,
  -- Server-only columns (never granted to client roles, never returned by the API):
  "expected_answer_or_evidence" text,
  "evaluation_rubric"           text,
  "validation_notes"            text,
  "access_rule"                 text,
  -- ──
  "target_proficiency"          "public"."proficiency_level",
  "difficulty"                  "public"."question_difficulty",
  "authoring_status"            "public"."authoring_status" NOT NULL DEFAULT 'draft',
  "tags"                        text[] NOT NULL DEFAULT '{}',
  "created_at"                  timestamptz NOT NULL DEFAULT now(),
  "updated_at"                  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "questions_pkey" PRIMARY KEY ("question_id", "version"),
  CONSTRAINT "questions_version_positive" CHECK ("version" >= 1),
  CONSTRAINT "questions_id_format" CHECK ("question_id" ~ '^[A-Z]+-[0-9]+$')
);

CREATE INDEX "questions_domain_topic_idx" ON "public"."questions" ("assessment_domain", "topic");
CREATE INDEX "questions_competency_idx"   ON "public"."questions" ("competency_id");

CREATE TRIGGER "questions_set_updated_at"
  BEFORE UPDATE ON "public"."questions"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Privileges and Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────
REVOKE ALL ON "public"."competencies" FROM "anon", "authenticated";
REVOKE ALL ON "public"."questions"    FROM "anon", "authenticated";

-- Signed-in users may read competencies, and ONLY the candidate-visible columns of
-- questions. The answers, rubric, validation notes and access rule are not granted,
-- so even a bug in our code cannot leak them through a user-context query.
GRANT SELECT ON "public"."competencies" TO "authenticated";
GRANT SELECT (
  "question_id", "version", "question_type", "assessment_domain", "topic", "competency_id",
  "title", "question_prompt", "starter_code", "visible_example",
  "target_proficiency", "difficulty", "tags", "authoring_status"
) ON "public"."questions" TO "authenticated";

ALTER TABLE "public"."competencies" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competencies_select_authenticated" ON "public"."competencies"
  FOR SELECT TO "authenticated" USING (true);

ALTER TABLE "public"."questions" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_select_published" ON "public"."questions"
  FOR SELECT TO "authenticated" USING ("authoring_status" = 'published');
-- No INSERT/UPDATE/DELETE policies or grants: only the server (owner role) and the
-- import script write to these tables.
