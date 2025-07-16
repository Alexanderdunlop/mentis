import { MentisAlertDemoClient } from "./MentisAlertDemoClient";
import { DemoFallback } from "./DemoFallback";
import { Suspense } from "react";

export function MentisAlertDemo() {
  return (
    <Suspense fallback={<DemoFallback />}>
      <MentisAlertDemoClient />
    </Suspense>
  );
}
