export interface OverviewStat {
  label: string;
  value: string;
  hint: string;
  tone: "brand" | "success" | "warning";
}

export interface SkillLevel {
  name: string;
  /** Assessed level, 0–4 (Basic → Advanced). */
  level: number;
}

export interface NextStep {
  title: string;
  description: string;
  tone: "brand" | "success" | "warning";
}

export interface OverviewData {
  assessedLevel: string;
  targetLevel: string;
  stats: OverviewStat[];
  skills: SkillLevel[];
  nextSteps: NextStep[];
}
