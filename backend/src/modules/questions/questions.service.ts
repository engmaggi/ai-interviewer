import "server-only";
import { withUserContext } from "@/db/with-user-context";
import { TOPIC_LABELS } from "./questions.constants";
import type { ListQuestionsQuery } from "./questions.schemas";
import { questionsRepository, type QuestionRow } from "./questions.repository";
import type { QuestionDto } from "./questions.types";

function toDto(row: QuestionRow): QuestionDto {
  return {
    questionId: row.questionId,
    version: row.version,
    questionType: row.questionType as QuestionDto["questionType"],
    assessmentDomain: row.assessmentDomain,
    topic: { code: row.topic, label: TOPIC_LABELS[row.topic] },
    competency: { id: row.competency.competencyId, name: row.competency.competencyName },
    title: row.title,
    prompt: row.questionPrompt,
    starterCode: row.starterCode,
    visibleExample: row.visibleExample,
    difficulty: row.difficulty,
    targetProficiency: row.targetProficiency,
    tags: row.tags,
  };
}

export const questionsService = {
  /**
   * All published questions for a domain + topic (an empty list is a valid answer).
   * If a question has several versions, only the newest published one is returned.
   */
  async list(userId: string, query: ListQuestionsQuery): Promise<QuestionDto[]> {
    const rows = await withUserContext(userId, (tx) => questionsRepository.list(tx, query));
    const seen = new Set<string>();
    // Rows are ordered newest version first within each question id.
    return rows.filter((r) => !seen.has(r.questionId) && seen.add(r.questionId)).map(toDto);
  },
};
