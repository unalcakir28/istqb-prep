import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

import { PRODUCT_NAME } from "./src/lib/product";

/**
 * The HTML shell's `<title>` and `og:` tags are rendered before React runs, so
 * they cannot read the constant at runtime. Substituting `%APP_NAME%` at build
 * time keeps them on the same single source as the app (F0-17); a rename stays
 * a one-line change in `src/lib/product.ts`.
 */
function appName() {
  return {
    name: "app-name",
    transformIndexHtml(html: string) {
      return html.replaceAll("%APP_NAME%", PRODUCT_NAME);
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/istqb-prep/" : "/",
  plugins: [react(), tailwindcss(), appName()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
