import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      // e2e/ belongs to Playwright and runs under `yarn e2e`. Vitest's default
      // glob collects those files too, and then blows up inside Playwright's
      // `test.beforeEach` — which is why `yarn test` used to come back red even
      // though every unit test passed.
      exclude: [...configDefaults.exclude, "e2e/**"],
    },
  }),
);
