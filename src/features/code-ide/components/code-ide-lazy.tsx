"use client";

import dynamic from "next/dynamic";

import type { CodeIdeProps } from "./code-ide";

const CodeIdeDynamic = dynamic(
  () => import("./code-ide").then((mod) => mod.CodeIde),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[520px] items-center justify-center rounded-control border border-border bg-card text-body-sm text-muted-foreground"
        role="status"
      >
        Loading editor…
      </div>
    ),
  },
);

/** Loads Sandpack only on the client to avoid SSR/hydration issues and keep the initial bundle smaller. */
export function CodeIdeLazy(props: CodeIdeProps) {
  return <CodeIdeDynamic {...props} />;
}
