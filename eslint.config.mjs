import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierPlugin from "eslint-plugin-prettier";

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: [
          "./tsconfig.base.json",
          "./api-gateway/tsconfig.json",
          "./auth-service/tsconfig.json",
          "./buyer-service/tsconfig.json",
          "./product-service/tsconfig.json",
          "./seller-service/tsconfig.json",
        ],
        sourceType: "module",
        ecmaVersion: 2020,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      prettier: prettierPlugin,
    },
    rules: {
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "prettier/prettier": ["error", { endOfLine: "lf" }],
      "no-console": "warn",
    },
  },
  {
    ignores: ["**/dist/**", "**/node_modules/**", "**/build/**"],
  },
];
