"use client";

import { useState } from "react";

type Question = {
  questionId: string;
  title: string;
  prompt: string;
  questionType: string;
  topic: { code: string; label: string };
  competency: { id: string; name: string };
  difficulty: string | null;
  starterCode: string | null;
  visibleExample: string | null;
};

type Message = {
  role: "candidate" | "interviewer";
  text: string;
};

const TOPICS = [
  ["javascript", "JavaScript"],
  ["typescript", "TypeScript"],
  ["react", "React"],
  ["nextjs", "Next.js"],
  ["html_css", "HTML/CSS"],
  ["testing", "Testing"],
  ["performance", "Performance"],
  ["accessibility", "Accessibility"],
  ["frontend_architecture", "Frontend architecture"],
  ["design_systems", "Design systems"],
  ["backend_awareness", "Backend awareness"],
  ["frontend_system_design", "Frontend system design"],
];

async function readApiResponse<T>(response: Response): Promise<T> {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `Request failed (${response.status})`,
    );
  }

  return payload?.data ?? payload;
}

export default function InterviewPage() {
  const [topic, setTopic] = useState("javascript");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [error, setError] = useState("");

  const currentQuestion = questions[questionIndex];

  async function loadQuestions() {
    setLoadingQuestions(true);
    setError("");
    setQuestions([]);
    setMessages([]);
    setAnswer("");

    try {
      const response = await fetch(
        `/api/questions?assessmentDomain=practice&topic=${encodeURIComponent(topic)}`,
        { credentials: "same-origin" },
      );

      const data = await readApiResponse<Question[]>(response);

      setQuestions(data);
      setQuestionIndex(0);

      if (!data.length) {
        setError("No practice questions are available for this topic yet.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load questions.",
      );
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function submitAnswer() {
    if (!currentQuestion || !answer.trim()) return;

    setSendingAnswer(true);
    setError("");

    try {
      const response = await fetch("/api/interviews/respond", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: currentQuestion.questionId,
          candidateResponse: answer.trim(),
        }),
      });

      const data = await readApiResponse<{
        questionId: string;
        followUp: string;
        isComplete: boolean;
      }>(response);

      setMessages((previous) => [
        ...previous,
        { role: "candidate", text: answer.trim() },
        { role: "interviewer", text: data.followUp },
      ]);
      setAnswer("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not submit your answer.",
      );
    } finally {
      setSendingAnswer(false);
    }
  }

  function nextQuestion() {
    setQuestionIndex((index) => index + 1);
    setMessages([]);
    setAnswer("");
    setError("");
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">AI Interview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Practise with real questions and receive an AI-generated follow-up
          based on your answer.
        </p>
      </header>

      <section className="rounded-xl border bg-card p-5">
        <label
          htmlFor="interview-topic"
          className="mb-2 block text-sm font-medium"
        >
          Choose a practice topic
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <select
            id="interview-topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            className="min-h-10 flex-1 rounded-md border bg-background px-3 text-sm"
            disabled={loadingQuestions || sendingAnswer}
          >
            {TOPICS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadQuestions}
            disabled={loadingQuestions || sendingAnswer}
            className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {loadingQuestions ? "Loading questions..." : "Load questions"}
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm"
        >
          {error}
        </div>
      )}

      {currentQuestion && (
        <section className="flex flex-col gap-5 rounded-xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-muted-foreground">
              Question {questionIndex + 1} of {questions.length}
            </span>

            <span className="rounded-full border px-3 py-1 text-xs">
              {currentQuestion.topic.label}
              {currentQuestion.difficulty
                ? ` · ${currentQuestion.difficulty}`
                : ""}
            </span>
          </div>

          <div>
            <h2 className="text-xl font-semibold">{currentQuestion.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7">
              {currentQuestion.prompt}
            </p>
          </div>

          {currentQuestion.visibleExample && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Example
              </p>
              <pre className="whitespace-pre-wrap text-sm">
                {currentQuestion.visibleExample}
              </pre>
            </div>
          )}

          {currentQuestion.starterCode && (
            <div className="rounded-lg bg-muted p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Starter code
              </p>
              <pre className="overflow-x-auto text-sm">
                <code>{currentQuestion.starterCode}</code>
              </pre>
            </div>
          )}

          {messages.length > 0 && (
            <div className="flex flex-col gap-3 border-t pt-4">
              <h3 className="font-medium">Interview conversation</h3>

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`rounded-lg p-3 text-sm leading-6 ${
                    message.role === "candidate"
                      ? "ml-6 bg-primary/10"
                      : "mr-6 bg-muted"
                  }`}
                >
                  <p className="mb-1 text-xs font-medium text-muted-foreground">
                    {message.role === "candidate" ? "Your answer" : "Interviewer"}
                  </p>
                  <p className="whitespace-pre-wrap">{message.text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t pt-4">
            <label htmlFor="candidate-answer" className="text-sm font-medium">
              Your answer
            </label>

            <textarea
              id="candidate-answer"
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Take your time and explain your thinking..."
              rows={6}
              maxLength={12000}
              disabled={sendingAnswer}
              className="w-full rounded-md border bg-background p-3 text-sm leading-6"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {answer.length} / 12,000 characters
              </span>

              <div className="flex gap-2">
                {questionIndex < questions.length - 1 && (
                  <button
                    type="button"
                    onClick={nextQuestion}
                    disabled={sendingAnswer}
                    className="min-h-10 rounded-md border px-4 text-sm disabled:opacity-50"
                  >
                    Next question
                  </button>
                )}

                <button
                  type="button"
                  onClick={submitAnswer}
                  disabled={!answer.trim() || sendingAnswer}
                  className="min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {sendingAnswer ? "Thinking..." : "Submit answer"}
                </button>
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}