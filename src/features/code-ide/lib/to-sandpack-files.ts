import type { CodingQuestion, SandpackFiles } from "../types";

type ToSandpackFilesOptions = {
  /** Extra props object injected into the preview wrapper (e.g. sample items). */
  previewProps?: Record<string, unknown>;
};

/**
 * Turns a coding question's `starterCode` into a Sandpack React file map.
 * The candidate edits `/Solution.js`; `/App.js` mounts it for the preview.
 */
export function toSandpackFiles(
  question: CodingQuestion,
  options: ToSandpackFilesOptions = {},
): SandpackFiles {
  const starter =
    question.starterCode?.trim() ||
    "export default function Solution() {\n  return null;\n}";

  const propsLiteral = JSON.stringify(options.previewProps ?? {}, null, 2);

  return {
    "/Solution.js": {
      code: ensureDefaultExport(starter),
      active: true,
    },
    "/App.js": {
      code: `import Solution from "./Solution";

const previewProps = ${propsLiteral};

export default function App() {
  return (
    <main style={{ fontFamily: "system-ui", padding: 16 }}>
      <Solution {...previewProps} />
    </main>
  );
}
`,
      hidden: true,
      readOnly: true,
    },
  };
}

/** Sandpack needs a default export so `/App.js` can import the solution. */
function ensureDefaultExport(code: string): string {
  if (/\bexport\s+default\b/.test(code)) return code;

  const named = code.match(
    /(?:function|const|class)\s+([A-Z][A-Za-z0-9_]*)/,
  );
  if (named) {
    return `${code.trim()}\n\nexport default ${named[1]};\n`;
  }

  return `${code.trim()}\n\nexport default function Solution() {\n  return null;\n}\n`;
}
