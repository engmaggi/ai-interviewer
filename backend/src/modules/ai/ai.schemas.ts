import { z } from "zod";

export const interviewResponseSchema = z.strictObject({
  questionId: z.string().trim().min(1).max(100),
  candidateResponse: z.string().trim().min(1).max(12000),
});

export type InterviewResponseInput = z.infer<
  typeof interviewResponseSchema
>;