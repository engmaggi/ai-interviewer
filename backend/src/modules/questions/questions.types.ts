/** What the API returns for a question. Server-only fields (answers, rubric, notes) are never included. */
export interface QuestionDto {
  questionId: string;
  version: number;
  questionType: "technical_knowledge" | "coding_challenge" | "behavioural" | "system_design";
  assessmentDomain: "practice" | "behavioural" | "official";
  topic: { code: string; label: string };
  competency: { id: string; name: string };
  title: string;
  prompt: string;
  starterCode: string | null;
  visibleExample: string | null;
  difficulty: "easy" | "medium" | "hard" | "adaptive" | null;
  targetProficiency: "basic" | "developing" | "proficient" | "advanced" | "all_levels" | null;
  tags: string[];
}
