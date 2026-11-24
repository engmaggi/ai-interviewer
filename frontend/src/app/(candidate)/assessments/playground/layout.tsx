import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Code IDE Playground" };

export default function PlaygroundLayout({ children }: { children: ReactNode }) {
  return children;
}
