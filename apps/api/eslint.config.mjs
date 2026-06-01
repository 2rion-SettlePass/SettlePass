import base from "@settlepass/eslint-config/base";

export default [
  ...base,
  {
    ignores: ["dist/**", "node_modules/**", "**/*.spec.ts", "**/tests/**"],
  },
];
