/**
 * Loads the Competencies and Question Bank sheets of the question workbook into the database.
 *
 *   npm run questions:import                          (uses data/orbit_question_corpus.xlsx)
 *   npm run questions:import -- path/to/file.xlsx
 *   npm run questions:import -- --dry-run             (checks the file, writes nothing, needs no database)
 *   npm run questions:import -- --status=draft        (default is `published`)
 *
 * Safe to run again: rows are matched by competency_id / (question_id, version) and updated.
 * Any value that does not fit an enum stops the import before anything is written.
 */
import ExcelJS from "exceljs";
import { createPrismaClient } from "../src/db/create-prisma-client";
import { TOPIC_LABELS } from "../src/modules/questions/questions.constants";

type Cell = string | null;
type Raw = Record<string, Cell | undefined>;

const TOPIC_BY_LABEL = new Map(Object.entries(TOPIC_LABELS).map(([code, label]) => [label.toLowerCase(), code]));
const TYPES = ["technical_knowledge", "coding_challenge", "behavioural", "voice_followup_template", "system_design"];
const DOMAINS = ["practice", "behavioural", "official"];
const DIFFICULTIES = ["easy", "medium", "hard", "adaptive"];
const PROFICIENCIES: Record<string, string> = {
  basic: "basic", developing: "developing", proficient: "proficient", advanced: "advanced", "all levels": "all_levels",
};

function cellText(v: ExcelJS.CellValue): Cell {
  if (v === null || v === undefined) return null;
  let text: string;
  if (typeof v === "object") {
    if ("richText" in v) text = v.richText.map((t) => t.text).join("");
    else if ("text" in v) text = String(v.text);
    else if ("result" in v) text = String(v.result ?? "");
    else text = String(v);
  } else text = String(v);
  text = text.trim();
  return text === "" || text === "None" ? null : text;
}

function readSheet(wb: ExcelJS.Workbook, name: string): Raw[] {
  const ws = wb.getWorksheet(name);
  if (!ws) throw new Error(`Sheet "${name}" not found in the workbook.`);
  const header = (ws.getRow(1).values as ExcelJS.CellValue[]).slice(1).map((h) => String(cellText(h)));
  const rows: Raw[] = [];
  ws.eachRow((row, n) => {
    if (n === 1) return;
    const values = (row.values as ExcelJS.CellValue[]).slice(1);
    const raw: Raw = {};
    header.forEach((h, i) => (raw[h] = cellText(values[i] ?? null)));
    if (Object.values(raw).some((v) => v !== null)) rows.push(raw);
  });
  return rows;
}

function pick<T extends string>(value: Cell | undefined, allowed: readonly T[], what: string, id: string): T {
  if (!value || !(allowed as readonly string[]).includes(value)) {
    throw new Error(`${id}: invalid ${what} "${value}" (allowed: ${allowed.join(", ")}).`);
  }
  return value as T;
}

/**
 * In the source sheet the coding_challenge rows are complete, but every other row has no
 * starter code and its values sit one column to the left. We detect that (the `difficulty`
 * cell is not a difficulty word) and shift them back. The two answer texts are kept together
 * in the server-only expected_answer_or_evidence column, so nothing is shown to candidates.
 */
function mapQuestion(r: Raw, status: string) {
  const id = r.question_id ?? "(no id)";
  const aligned = !!r.difficulty && DIFFICULTIES.includes(r.difficulty);
  let f: Raw;
  if (aligned) {
    f = r;
  } else {
    if (r.validation_notes) throw new Error(`${id}: row layout is not recognised (unexpected validation_notes).`);
    f = {
      starter_code: null,
      visible_example: null,
      expected_answer_or_evidence: [r.starter_code, r.visible_example].filter(Boolean).join("\n\n") || null,
      evaluation_rubric: r.expected_answer_or_evidence,
      target_proficiency: r.evaluation_rubric,
      difficulty: r.target_proficiency,
      validation_notes: r.difficulty,
    };
  }

  const prof = f.target_proficiency ? PROFICIENCIES[f.target_proficiency.toLowerCase()] : undefined;
  if (f.target_proficiency && !prof) throw new Error(`${id}: invalid target_proficiency "${f.target_proficiency}".`);
  const difficulty = f.difficulty && f.difficulty !== "N/A" ? pick(f.difficulty, DIFFICULTIES, "difficulty", id) : null;
  const topic = TOPIC_BY_LABEL.get((r.topic ?? "").toLowerCase());
  if (!topic) throw new Error(`${id}: unknown topic "${r.topic}".`);

  return {
    questionId: id,
    version: Number(r.version ?? 1),
    questionType: pick(r.question_type, TYPES, "question_type", id),
    assessmentDomain: pick(r.assessment_domain, DOMAINS, "assessment_domain", id),
    topic,
    competencyId: r.competency_id ?? "",
    title: r.title ?? "",
    questionPrompt: r.question_prompt ?? "",
    starterCode: aligned ? r.starter_code : null,
    visibleExample: aligned ? r.visible_example : null,
    expectedAnswerOrEvidence: f.expected_answer_or_evidence,
    evaluationRubric: f.evaluation_rubric,
    validationNotes: f.validation_notes,
    accessRule: r.access_rule,
    targetProficiency: prof ?? null,
    difficulty,
    authoringStatus: status,
    tags: [...(r.tags ?? "").matchAll(/'([^']*)'/g)].map((m) => m[1]),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const status = args.find((a) => a.startsWith("--status="))?.split("=")[1] ?? "published";
  if (!["draft", "in_review", "published"].includes(status)) throw new Error(`Invalid --status "${status}".`);
  const file = args.find((a) => !a.startsWith("--")) ?? "data/orbit_question_corpus.xlsx";

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);

  const competencies = readSheet(wb, "Competencies").map((r) => {
    const id = r.competency_id ?? "";
    if (!/^(FE|BW)-\d{2}$/.test(id)) throw new Error(`Competency "${id}": id must look like FE-01 or BW-01.`);
    const category = id.startsWith("FE") ? ("frontend" as const) : ("behavioural" as const);
    return { competencyId: id, competencyName: r.competency_name ?? "", category };
  });
  const questions = readSheet(wb, "Question Bank").map((r) => mapQuestion(r, status));

  const known = new Set(competencies.map((c) => c.competencyId));
  for (const q of questions) {
    if (!known.has(q.competencyId)) throw new Error(`${q.questionId}: competency "${q.competencyId}" is not in the Competencies sheet.`);
  }

  console.log(`File: ${file}\nCompetencies: ${competencies.length}\nQuestions: ${questions.length} (status: ${status})`);
  const counts = new Map<string, number>();
  for (const q of questions) counts.set(`${q.assessmentDomain}/${q.topic}`, (counts.get(`${q.assessmentDomain}/${q.topic}`) ?? 0) + 1);
  for (const [k, n] of [...counts].sort()) console.log(`  ${k}: ${n}`);
  if (dryRun) return void console.log("Dry run: nothing was written.");

  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL. See docs/SETUP_GUIDE.md.");
  const prisma = createPrismaClient(url, process.env.DATABASE_SSL_CA || undefined);
  try {
    await prisma.$transaction(async (tx) => {
      for (const c of competencies) {
        await tx.competency.upsert({ where: { competencyId: c.competencyId }, create: c, update: { competencyName: c.competencyName, category: c.category } });
      }
      for (const q of questions) {
        const data = q as never as Parameters<typeof tx.question.create>[0]["data"];
        await tx.question.upsert({ where: { questionId_version: { questionId: q.questionId, version: q.version } }, create: data, update: data });
      }
    });
    console.log("✔ Import finished.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
