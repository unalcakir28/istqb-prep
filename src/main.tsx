import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import "./lib/i18n";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("#root not found — index.html is broken.");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
