import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { ListQuestionsQuery } from "./questions.schemas";

/**
 * Explicit allow-list of columns. Server-only columns (expected answer, rubric,
 * validation notes, access rule) are not listed here AND are not granted to the
 * `authenticated` database role, so they cannot be read even by mistake.
 */
const candidateVisible = {
  questionId: true,
  version: true,
  questionType: true,
  assessmentDomain: true,
  topic: true,
  title: true,
  questionPrompt: true,
  starterCode: true,
  visibleExample: true,
  difficulty: true,
  targetProficiency: true,
  tags: true,
  competency: { select: { competencyId: true, competencyName: true } },
} satisfies Prisma.QuestionSelect;

export type QuestionRow = Prisma.QuestionGetPayload<{ select: typeof candidateVisible }>;

export const questionsRepository = {
  /**
   * Must run on a transaction from `withUserContext`, so Row Level Security applies
   * (only `published` rows are visible). Voice follow-up templates are AI prompt
   * patterns, not questions a candidate answers, so they are left out.
   */
  list(tx: Prisma.TransactionClient, query: ListQuestionsQuery): Promise<QuestionRow[]> {
    return tx.question.findMany({
      where: {
        assessmentDomain: query.assessmentDomain,
        topic: query.topic,
        difficulty: query.difficulty,
        questionType: { not: "voice_followup_template" },
      },
      orderBy: [{ questionId: "asc" }, { version: "desc" }],
      select: candidateVisible,
    });
  },
};
