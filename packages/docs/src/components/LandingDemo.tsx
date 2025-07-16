import fs from "node:fs/promises";
import { format } from "prettier";
import { Suspense } from "react";
import { LandingDemoClient } from "./LandingDemoClient";
import { DynamicCodeBlock } from "fumadocs-ui/components/dynamic-codeblock";

export async function LandingDemo() {
  const demoFilePath = process.cwd() + "/src/components/LandingDemoClient.tsx";
  const demoFile = await fs.readFile(demoFilePath, "utf8");

  const demoCode = demoFile.replace(/slotsProps=\{\{[\s\S]*?\}\}/g, "");

  const formattedCode = await format(demoCode, {
    parser: "typescript",
  });
  return (
    <>
      <Suspense
        fallback={
          <div className="h-[136px] animate-pulse rounded bg-zinc-50 dark:bg-zinc-900 sm:h-10" />
        }
      >
        <LandingDemoClient />
      </Suspense>
      <div className="text-left mt-4">
        <DynamicCodeBlock lang="tsx" code={formattedCode} />
      </div>
    </>
  );
}
