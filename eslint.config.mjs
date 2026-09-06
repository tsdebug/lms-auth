import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import convexPlugin from "@convex-dev/eslint-plugin";

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  ...convexPlugin.configs.recommended,
  {
    rules: {
      // Several Convex response shapes are enriched dynamically by queries;
      // their generated client types cannot represent those fields yet.
      "@typescript-eslint/no-explicit-any": "off",
      // TanStack Table intentionally exposes an API React Compiler cannot memoize.
      "react-hooks/incompatible-library": "off",
    },
  },
]);
