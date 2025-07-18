import { MentisDemoClient } from "./MentisDemoClient";
import { DemoFallback } from "./DemoFallback";
import { Suspense } from "react";
import type { MentionInputProps } from "mentis";

export function MentisDemo(props: MentionInputProps) {
  return (
    <Suspense fallback={<DemoFallback />}>
      <MentisDemoClient {...props} />
    </Suspense>
  );
}
