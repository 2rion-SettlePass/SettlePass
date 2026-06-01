// @settlepass/eslint-config — shared ESLint flat config (ESLint v9)
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

/** Base config shared across workspace TypeScript packages. */
export default [
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/*.config.*"],
  },
  js.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { sourceType: "module", ecmaVersion: 2022 },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      // TypeScript's own checker handles undefined references; core rule
      // false-positives on Node/DOM globals under flat config.
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-empty-function": "off",
    },
  },
];
