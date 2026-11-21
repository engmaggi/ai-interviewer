"use client";

import { CodeIdeLazy } from "@/features/code-ide/components/code-ide-lazy";
import {
  PLAYGROUND_ITEMS,
  PLAYGROUND_QUESTION,
} from "@/features/code-ide/lib/playground-fixture";

/** Local Sandpack playground for COD-04. No API submit yet. */
export default function AssessmentsPlaygroundPage() {
  return (
    <CodeIdeLazy
      question={PLAYGROUND_QUESTION}
      previewProps={{ items: PLAYGROUND_ITEMS }}
      onSubmit={(files) => {
        // Playground only: confirm the IDE can read the candidate's files.
        console.info("[playground submit]", files["/Solution.js"]);
      }}
    />
  );
}
