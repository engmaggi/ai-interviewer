"use client";

import { useState } from "react";
import {
  SandpackCodeEditor,
  SandpackConsole,
  SandpackLayout,
  SandpackPreview,
  SandpackProvider,
  useSandpack,
} from "@codesandbox/sandpack-react";

import { Button } from "@/components/ui/button";

import { toSandpackFiles } from "../lib/to-sandpack-files";
import type { CodingQuestion } from "../types";
import { QuestionPrompt } from "./question-prompt";

export type CodeIdeProps = {
  question: CodingQuestion;
  /** Props passed into the solution component inside the preview (e.g. sample items). */
  previewProps?: Record<string, unknown>;
  onSubmit?: (files: Record<string, string>) => void;
};

/** Browser IDE: prompt + Sandpack editor/preview/console for one coding question. */
export function CodeIde({ question, previewProps, onSubmit }: CodeIdeProps) {
  const files = toSandpackFiles(question, { previewProps });
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <QuestionPrompt question={question} />

      <SandpackProvider
        key={resetKey}
        template="react"
        theme="light"
        files={files}
        options={{
          autorun: true,
          recompileMode: "delayed",
          recompileDelay: 400,
        }}
      >
        <div className="overflow-hidden rounded-control border border-border">
          <SandpackLayout>
            <SandpackCodeEditor
              showLineNumbers
              showInlineErrors
              style={{ height: 420 }}
            />
            <SandpackPreview
              showOpenInCodeSandbox={false}
              showRefreshButton
              style={{ height: 420 }}
            />
          </SandpackLayout>
        </div>

        <div className="mt-3 overflow-hidden rounded-control border border-border bg-card">
          <SandpackConsole style={{ height: 140 }} />
        </div>

        <IdeActions
          onReset={() => setResetKey((key) => key + 1)}
          onSubmit={onSubmit}
        />
      </SandpackProvider>
    </div>
  );
}

function IdeActions({
  onReset,
  onSubmit,
}: {
  onReset: () => void;
  onSubmit?: (files: Record<string, string>) => void;
}) {
  const { sandpack } = useSandpack();
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit() {
    const files: Record<string, string> = {};
    for (const [path, file] of Object.entries(sandpack.files)) {
      files[path] = file.code;
    }

    onSubmit?.(files);
    setSubmitted(true);
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={onReset}>
        Reset
      </Button>
      <Button type="button" onClick={handleSubmit}>
        Submit solution
      </Button>
      {submitted && (
        <p className="text-body-sm text-success">
          Solution captured locally (playground — no server submit yet).
        </p>
      )}
    </div>
  );
}
