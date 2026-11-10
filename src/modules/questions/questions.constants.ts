import type { QuestionTopic } from "@/generated/prisma/client";

/**
 * The database stores topics as lowercase "slugs" (html_css). People should see the
 * friendly label (HTML/CSS). This is the single place that maps one to the other.
 * `satisfies Record<QuestionTopic, string>` makes TypeScript fail the build if a
 * topic is added to the database enum and forgotten here.
 */
export const TOPIC_LABELS = {
  javascript: "JavaScript",
  typescript: "TypeScript",
  react: "React",
  nextjs: "Next.js",
  html_css: "HTML/CSS",
  testing: "Testing",
  performance: "Performance",
  accessibility: "Accessibility",
  frontend_architecture: "Frontend architecture",
  design_systems: "Design systems",
  backend_awareness: "Backend awareness",
  frontend_system_design: "Frontend system design",
  collaboration: "Collaboration",
  ownership: "Ownership",
  feedback_and_learning: "Feedback and learning",
  prioritisation: "Prioritisation",
  problem_solving: "Problem-solving",
} as const satisfies Record<QuestionTopic, string>;

export const DIFFICULTIES = ["easy", "medium", "hard", "adaptive"] as const;
export const TOPIC_CODES = Object.keys(TOPIC_LABELS) as [QuestionTopic, ...QuestionTopic[]];
export const ASSESSMENT_DOMAINS = ["practice", "behavioural", "official"] as const;
