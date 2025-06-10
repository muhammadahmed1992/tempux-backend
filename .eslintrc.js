const fs = require("fs");
const path = require("path");

const baseDir = __dirname;

// Function to find all `tsconfig.json` files inside service-like folders
function findTSConfigs(baseDir) {
  const entries = fs.readdirSync(baseDir, { withFileTypes: true });

  return entries.flatMap((entry) => {
    if (
      entry.isDirectory() &&
      (entry.name.endsWith("-service") || entry.name === "api-gateway")
    ) {
      const configPath = path.join(baseDir, entry.name, "tsconfig.json");
      if (fs.existsSync(configPath)) {
        return [`./${entry.name}/tsconfig.json`];
      }
    }
    return [];
  });
}

const serviceProjects = findTSConfigs(baseDir);
console.log(serviceProjects);
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.base.json", ...serviceProjects],
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
