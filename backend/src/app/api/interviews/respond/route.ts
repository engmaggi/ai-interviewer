import { aiService } from "@/modules/ai/ai.service";
import { interviewResponseSchema } from "@/modules/ai/ai.schemas";
import { questionsService } from "@/modules/questions/questions.service";
import { NotFoundError } from "@/lib/errors";
import { route, parseBody } from "@/lib/http/handler";
import { requireUser } from "@/lib/auth/guards";
import { ok } from "@/lib/http/responses";

export const POST = route(async (req) => {
  const user = await requireUser();
  const input = await parseBody(req, interviewResponseSchema);

  const question = await questionsService.findByQuestionId(
    user.id,input.questionId,
  );

  if (!question) {
    throw new NotFoundError("Published question not found.", "QUESTION_NOT_FOUND");
  }

  const systemPrompt = `
2. PARTIALLY CORRECT RESPONSE
- Identify the concept the candidate understands.
- Probe the missing or incomplete part.
- Ask a targeted question that helps establish deeper understanding.

3. WEAK OR INCORRECT RESPONSE
- Do not immediately reveal the correct answer.
- Ask a simpler question that tests the underlying fundamentals.
- Use a supportive, non-judgemental tone.

INTERVIEW RULES:
- Consider the original question and the candidate's response.
- Ask exactly ONE follow-up question.
- Avoid repeating questions already answered.
- Never reveal expected answers, evaluation rubrics or solutions.
- Do not provide the candidate with the answer.
- Maintain a professional, conversational tone.
- Keep the follow-up concise.
- Return only the follow-up question.
`;
  const conversation = `
Original interview question:
${question.title}

Question details:
${question.prompt}

Candidate's response:
${input.candidateResponse}

Generate one relevant follow-up question.
`;

  const reply = await aiService.generateReply(
    systemPrompt,
    conversation,
  );

  return ok({
    questionId: input.questionId,
    followUp: reply,
    isComplete: false,
  });
});
