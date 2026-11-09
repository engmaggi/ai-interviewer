import type { OverviewData } from "./types";

export const MAX_SKILL_LEVEL = 4;

/** Mock data matching the Figma Dashboard. Replace with a real query once results are persisted. */
export function getOverviewData(): OverviewData {
  return {
    assessedLevel: "Junior+ Frontend Developer",
    targetLevel: "Mid-level",
    stats: [
      {
        label: "Assessments",
        value: "04",
        hint: "+1 this month",
        tone: "brand",
      },
      {
        label: "Skills at level 3+",
        value: "02",
        hint: "of 6 assessed competencies",
        tone: "success",
      },
      {
        label: "Priority gaps",
        value: "03",
        hint: "Skills to strengthen next",
        tone: "warning",
      },
    ],
    skills: [
      { name: "JavaScript", level: 4 },
      { name: "React", level: 3 },
      { name: "TypeScript", level: 2 },
      { name: "Next.js", level: 2 },
      { name: "Testing", level: 1 },
      { name: "Architecture", level: 1 },
    ],
    nextSteps: [
      {
        title: "Practice React testing",
        description: "Close your biggest gap",
        tone: "brand",
      },
      {
        title: "Build a Next.js project",
        description: "Apply server-side patterns",
        tone: "success",
      },
      {
        title: "Retake skill check",
        description: "Measure your progress",
        tone: "warning",
      },
    ],
  };
}
