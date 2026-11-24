import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

import { MAX_SKILL_LEVEL } from "../data";
import type { SkillLevel } from "../types";

/** Skills at level 3+ are shown as strengths (green); lower levels are growth areas (orange). */
const STRENGTH_THRESHOLD = 3;

export function SkillProfileCard({ skills }: { skills: SkillLevel[] }) {
  return (
    <Card padding="lg" className="gap-5">
      <CardHeader>
        <CardTitle>Skill profile</CardTitle>
        <CardDescription className="text-body-sm">
          Your demonstrated strengths and growth areas
        </CardDescription>
      </CardHeader>

      <ul className="flex flex-col gap-4">
        {skills.map((skill) => (
          <li
            key={skill.name}
            className="grid grid-cols-[6.5rem_minmax(0,1fr)_2rem] items-center gap-3 sm:grid-cols-[9rem_minmax(0,1fr)_2.5rem] sm:gap-4"
          >
            <span className="truncate text-body-sm">{skill.name}</span>
            <Progress
              value={skill.level}
              max={MAX_SKILL_LEVEL}
              label={`${skill.name} level`}
              tone={skill.level >= STRENGTH_THRESHOLD ? "success" : "warning"}
            />
            <span className="text-right text-label-sm text-muted-foreground">
              {skill.level}/{MAX_SKILL_LEVEL}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
