import { EcosystemConfig } from "pm2";

const config: EcosystemConfig = {
  apps: [
    {
      name: "api-gateway",
      cwd: "./api-gateway",
      script: "npm",
      args: "run start:prod",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "auth-service",
      cwd: "./auth-service",
      script: "npm",
      args: "run start:prod",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
    {
      name: "product-service",
      cwd: "./product-service",
      script: "npm",
      args: "run start:prod",
      env: {
        NODE_ENV: "development",
      },
      env_production: {
        NODE_ENV: "production",
      },
    },
  ],
};

export default config;
