import type { CodingQuestion } from "../types";

/** Title, competency context, prompt text, and the visible example for a coding question. */
export function QuestionPrompt({ question }: { question: CodingQuestion }) {
  return (
    <header className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
        <span>{question.topic.label}</span>
        <span aria-hidden>·</span>
        <span>{question.competency.name}</span>
        {question.difficulty && (
          <>
            <span aria-hidden>·</span>
            <span className="capitalize">{question.difficulty}</span>
          </>
        )}
      </div>

      <h1 className="text-heading-lg">{question.title}</h1>
      <p className="text-body-md text-muted-foreground">{question.prompt}</p>

      {question.visibleExample && (
        <aside className="rounded-control border border-border bg-card px-4 py-3">
          <p className="text-body-sm font-semibold text-foreground">Example</p>
          <pre className="mt-1 overflow-x-auto text-body-sm text-muted-foreground">
            {question.visibleExample}
          </pre>
        </aside>
      )}
    </header>
  );
}
