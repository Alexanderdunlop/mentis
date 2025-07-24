import { MentisDemoClient, MentisDemoProps } from "./MentisDemoClient";
import { DemoFallback } from "./DemoFallback";
import { Suspense } from "react";

export function MentisDemo(props: MentisDemoProps) {
  return (
    <Suspense fallback={<DemoFallback />}>
      <MentisDemoClient {...props} />
    </Suspense>
  );
}
