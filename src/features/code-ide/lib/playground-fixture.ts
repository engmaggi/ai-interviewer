import type { CodingQuestion } from "../types";

/**
 * Official React coding challenge (COD-04), shaped like `GET /api/questions`.
 * Used only by the playground until the assessments flow is wired up.
 */
export const PLAYGROUND_QUESTION: CodingQuestion = {
  questionId: "COD-04",
  version: 1,
  questionType: "coding_challenge",
  assessmentDomain: "official",
  topic: { code: "react", label: "React" },
  competency: { id: "FE-03", name: "React" },
  title: "Build a searchable list",
  prompt:
    "Build a component accepting items {id,name}; filter case-insensitively, preserve input and show empty state.",
  starterCode: `function SearchableList({ items }) {
  // Filter items by the search query (case-insensitive).
  // Keep the input controlled and show an empty state when nothing matches.
  return null;
}`,
  visibleExample: "Items Alpha, Beta, Gamma; query 'am' shows Gamma.",
  difficulty: "medium",
  targetProficiency: "proficient",
  tags: ["react", "fe-03"],
};

/** Sample data the playground mounts into the preview wrapper. */
export const PLAYGROUND_ITEMS = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
  { id: "3", name: "Gamma" },
  { id: "4", name: "Delta" },
];
