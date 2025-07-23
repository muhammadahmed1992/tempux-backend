import { execSync } from "node:child_process";

if (process.env.CI || process.env.NODE_ENV === "production") {
  console.log("✅ CI detected — skipping Husky install.");
  process.exit(0);
}

try {
  execSync("npx husky install", { stdio: "inherit" });
} catch (err) {
  console.log("⚠️ Husky install failed or not found — skipping.");
}
