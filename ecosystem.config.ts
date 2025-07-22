// ecosystem.config.ts

export default {
  apps: [
    {
      name: "api-gateway",
      script: "./api-gateway/dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
    {
      name: "auth-service",
      script: "./auth-service/dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
    },
    {
      name: "product-service",
      script: "./product-service/dist/main.js",
      env: {
        NODE_ENV: "production",
        PORT: 3003,
      },
    },
  ],
};
