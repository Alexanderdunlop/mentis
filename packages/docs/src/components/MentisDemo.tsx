import { MentisDemoClient } from "./MentisDemoClient";
import { DemoFallback } from "./DemoFallback";
import { Suspense } from "react";

// TODO: Replace any with MentionInputProps when type is exported
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function MentisDemo(props: any) {
  return (
    <Suspense fallback={<DemoFallback />}>
      <MentisDemoClient {...props} />
    </Suspense>
  );
}
