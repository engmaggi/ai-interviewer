/** Mirrors `QuestionDto` from `backend/src/modules/questions/questions.types.ts`. */
export type CodingQuestion = {
  questionId: string;
  version: number;
  questionType:
    | "technical_knowledge"
    | "coding_challenge"
    | "behavioural"
    | "system_design";
  assessmentDomain: "practice" | "behavioural" | "official";
  topic: { code: string; label: string };
  competency: { id: string; name: string };
  title: string;
  prompt: string;
  starterCode: string | null;
  visibleExample: string | null;
  difficulty: "easy" | "medium" | "hard" | "adaptive" | null;
  targetProficiency:
    | "basic"
    | "developing"
    | "proficient"
    | "advanced"
    | "all_levels"
    | null;
  tags: string[];
};

/** File map Sandpack expects: path → source (or file options). */
export type SandpackFiles = Record<
  string,
  string | { code: string; active?: boolean; hidden?: boolean; readOnly?: boolean }
>;
