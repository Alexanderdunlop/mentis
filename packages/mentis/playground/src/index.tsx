import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import "./style.css";

createRoot(document.querySelector("#app")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
