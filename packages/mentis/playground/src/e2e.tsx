import React from "react";
import { createRoot } from "react-dom/client";
import { E2EHarness } from "./E2EHarness.tsx";
import "./e2e.css";

// Deliberately not wrapped in StrictMode: double-invoked effects would make the
// contentEditable reconciliation non-deterministic, and the e2e suite exists to
// pin down deterministic behaviour.
createRoot(document.querySelector("#app")!).render(<E2EHarness />);
