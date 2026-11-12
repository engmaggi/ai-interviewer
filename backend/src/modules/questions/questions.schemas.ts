import { z } from "zod";
import { ASSESSMENT_DOMAINS, DIFFICULTIES, TOPIC_CODES } from "./questions.constants";
/** Query string of GET /api/questions. Both filters are required; unknown parameters are rejected. */
export const listQuestionsQuerySchema = z.strictObject({
  assessmentDomain: z.enum(ASSESSMENT_DOMAINS),
  topic: z.enum(TOPIC_CODES),
  difficulty: z.enum(DIFFICULTIES).optional(),
});

export type ListQuestionsQuery = z.infer<typeof listQuestionsQuerySchema>;
