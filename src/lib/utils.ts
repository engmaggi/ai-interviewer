import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Orbit text-style utilities (see globals.css) so tailwind-merge treats them as font sizes, not colors. */
const ORBIT_TEXT_STYLES = [
  "display-lg",
  "heading-lg",
  "heading-md",
  "heading-sm",
  "body-md",
  "body-sm",
  "label-md",
  "label-sm",
  "code-md",
  "code-sm",
];

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ORBIT_TEXT_STYLES }],
    },
  },
});

/** Merges conditional class names and resolves Tailwind conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
