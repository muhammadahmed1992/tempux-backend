module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: [
      "./tsconfig.base.json",
      "./api-gateway/tsconfig.json",
      "./buyer-service/tsconfig.json",
    ],
    sourceType: "module",
    ecmaVersion: 2020,
  },
  plugins: ["@typescript-eslint", "prettier"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
  ],
  ignorePatterns: [
    "**/dist/**",
    "**/node_modules/**",
    "**/build/**",
    ".eslintrc.js",
  ],
  rules: {
    "@typescript-eslint/no-var-requires": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "prettier/prettier": ["error", { endOfLine: "lf" }],
    "no-console": "warn",
  },
};
