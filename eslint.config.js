import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist", "coverage", "public/data"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // TypeScript's compiler already catches undefined references (and knows
      // about ambient globals like vitest's `describe`/`it`/`expect`).
      "no-undef": "off",
    },
  },
  {
    files: ["*.config.{js,ts}", "src/test/**/*.ts"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  eslintConfigPrettier,
);
