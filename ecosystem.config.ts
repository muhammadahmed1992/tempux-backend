// ecosystem.config.ts

export default {
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
        AUTH_SERVICE_BASE_URL: "AUTH_SERVICE_BASE_URL",
        ORDER_SERVICE_BASE_URL: "ORDER_SERVICE_BASE_URL",
        PRODUCT_SERVICE_BASE_URL: "PRODUCT_SERVICE_BASE_URL",
        SELLER_SERVICE_BASE_URL: "SELLER_SERVICE_BASE_URL",
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
        JWT_SECRET: "JWT_SECRET",
        OTP_EXPIRY_DURATION: "OTP_EXPIRY_DURATION",
        MAIL_HOST: "MAIL_HOST",
        MAIL_PORT: "MAIL_PORT",
        MAIL_USERNAME: "MAIL_USERNAME",
        MAIL_PASSWORD: "MAIL_PASSWORD",
        MAIL_FROM: "MAIL_FROM",
        FRONTEND_URL: "FRONTEND_URL",

        GOOGLE_CLIENT_ID: "GOOGLE_CLIENT_ID",
        GOOGLE_CLIENT_SECRET: "GOOGLE_CLIENT_SECRET",
        GOOGLE_CALLBACK_URL: "GOOGLE_CALLBACK_URL",

        FACEBOOK_APP_ID: "FACEBOOK_URL",
        FACEBOOK_APP_SECRET: "FACEBOOK_APP_SECRET",
        FACEBOOK_CALLBACK_URL: "FACEBOOK_CALLBACK_URL",

        EMAIL_ENCRYPTION_KEY: "EMAIL_ENCRYPTION_URL",

        SALT_ROUND: "SALT_ROUND",
        PORT: "AUTH_PORT",
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
        JWT_SECRET: "JWT_SECRET",
        USER_SERVICE_URL: "USER_SERVICE_URL",
      },
    },
  ],
};
