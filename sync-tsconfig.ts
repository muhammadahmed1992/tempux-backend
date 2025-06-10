import fs from "fs";
import path from "path";

const baseConfigPath = path.resolve(__dirname, "tsconfig.base.json");
const baseConfig = JSON.parse(fs.readFileSync(baseConfigPath, "utf-8"));

const projects = [
  "api-gateway",
  "auth-service",
  "product-service",
  "buyer-service",
  "seller-service",
];

projects.forEach((proj) => {
  const projConfigPath = path.resolve(__dirname, proj, "tsconfig.json");
  let projConfig = {};
  if (fs.existsSync(projConfigPath)) {
    projConfig = JSON.parse(fs.readFileSync(projConfigPath, "utf-8"));
  }

  // Merge base config with project config
  const newConfig = {
    ...baseConfig,
    ...projConfig,
    compilerOptions: {
      ...baseConfig.compilerOptions,
      ...(projConfig.compilerOptions || {}),
    },
    include: projConfig.include || ["src/**/*.ts"],
    exclude: projConfig.exclude || ["node_modules", "dist"],
  };

  // Set relative extends path
  newConfig.extends = "../tsconfig.base.json";

  // Remove conflicting top-level keys if needed
  delete newConfig.compilerOptions.project; // avoid conflicts

  fs.writeFileSync(projConfigPath, JSON.stringify(newConfig, null, 2));
  console.log(`Updated ${proj}/tsconfig.json`);
});
