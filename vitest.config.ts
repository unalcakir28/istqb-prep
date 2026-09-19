import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
      // e2e/ Playwright'a aittir ve `yarn e2e` ile kosar. Vitest'in
      // varsayilan glob'u o dosyalari da topluyor, sonra Playwright'in
      // `test.beforeEach` cagrisinda patliyordu — `yarn test` bu yuzden
      // birim testlerin hepsi gectigi halde kirmizi doniyordu.
      exclude: [...configDefaults.exclude, "e2e/**"],
    },
  }),
);
