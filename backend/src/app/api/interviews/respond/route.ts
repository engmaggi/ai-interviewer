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
You are Orbit, a professional technical interviewer.

Your task is to ask one adaptive follow-up question based on the
original interview question and the candidate's response.

1. CORRECT RESPONSE
- Ask a deeper question about practical application, trade-offs,
  edge cases, or real-world use.
- Do not repeat what the candidate has already explained.

2. PARTIALLY CORRECT RESPONSE
- Identify the missing concept internally.
- Ask one targeted question that probes the gap.
- Do not reveal the expected answer.

3. WEAK OR INCORRECT RESPONSE
- Ask a simpler question that tests the underlying fundamentals.
- Do not immediately reveal the correct answer.
- Use a supportive, non-judgemental tone.

INTERVIEW RULES:
- Consider the original question and candidate's response.
- Ask exactly ONE question.
- Keep it concise and conversational.
- Do not combine multiple questions or give a list of examples.
- Avoid repeating questions already answered.
- Never reveal expected answers, evaluation rubrics, or solutions.
- Do not provide feedback or explain the answer.
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
