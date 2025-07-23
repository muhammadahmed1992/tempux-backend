// ecosystem.config.ts

module.exports = {
  apps: [
    {
      name: "api-gateway",
      cwd: "./api-gateway",
      script: "./dist/main.js",
      autorestart: true,
      env: {
        NODE_ENV: "development",
        AUTH_SERVICE_BASE_URL: "http://localhost:3001",
        ORDER_SERVICE_BASE_URL: "http://localhost:3002",
        PRODUCT_SERVICE_BASE_URL: "http://localhost:3003",
        SELLER_SERVICE_BASE_URL: "http://localhost:3004",
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: "production",
        AUTH_SERVICE_BASE_URL: "INJECT_AUTH_SERVICE_BASE_URL",
        PRODUCT_SERVICE_BASE_URL: "INJECT_PRODUCT_SERVICE_BASE_URL",
        PORT: "INJECT_GATEWAY_PORT",
      },
    },
    {
      name: "auth-service",
      cwd: "./auth-service",
      script: "./dist/main.js",
      autorestart: true,
      env: {
        NODE_ENV: "development",
        PORT: 3001,
      },
      env_production: {
        NODE_ENV: "production",
        JWT_SECRET: "INJECT_JWT_SECRET",
        OTP_EXPIRY_DURATION: "INJECT_OTP_EXPIRY_DURATION",
        MAIL_HOST: "INJECT_MAIL_HOST",
        MAIL_PORT: "INJECT_MAIL_PORT",
        MAIL_USERNAME: "INJECT_MAIL_USERNAME",
        MAIL_PASSWORD: "INJECT_MAIL_PASSWORD",
        MAIL_FROM: "INJECT_MAIL_FROM",
        FRONTEND_URL: "INJECT_FRONTEND_URL",

        GOOGLE_CLIENT_ID: "INJECT_GOOGLE_CLIENT_ID",
        GOOGLE_CLIENT_SECRET: "INJECT_GOOGLE_CLIENT_SECRET",
        GOOGLE_CALLBACK_URL: "INJECT_GOOGLE_CALLBACK_URL",

        FACEBOOK_APP_ID: "INJECT_FACEBOOK_APP_ID",
        FACEBOOK_APP_SECRET: "INJECT_FACEBOOK_APP_SECRET",
        FACEBOOK_CALLBACK_URL: "INJECT_FACEBOOK_CALLBACK_URL",

        EMAIL_ENCRYPTION_KEY: "INJECT_EMAIL_ENCRYPTION_KEY",

        SALT_ROUND: "INJECT_SALT_ROUND",
        PORT: "INJECT_AUTH_PORT",
      },
    },
    {
      name: "product-service",
      cwd: "./product-service",
      script: "./dist/main.js",
      autorestart: true,
      env: {
        NODE_ENV: "development",
        PORT: 3003,
      },
      env_production: {
        NODE_ENV: "production",
        JWT_SECRET: "INJECT_JWT_SECRET",
        USER_SERVICE_URL: "INJECT_USER_SERVICE_URL",
        PORT: "INJECT_PRODUCT_PORT",
      },
    },
  ],
};
