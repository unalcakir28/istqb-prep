import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./styles/index.css";
import "./lib/i18n";
import { App } from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("#root bulunamadi — index.html bozuk.");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
