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
        AUTH_SERVICE_BASE_URL: process.env.AUTH_SERVICE_BASE_URL,
        PRODUCT_SERVICE_BASE_URL: process.env.PRODUCT_SERVICE_BASE_URL,
        PORT: process.env.GATEWAY_PORT,
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
        JWT_SECRET: process.env.JWT_SECRET,
        OTP_EXPIRY_DURATION: process.env.OTP_EXPIRY_DURATION,
        MAIL_HOST: process.env.MAIL_HOST,
        MAIL_PORT: process.env.MAIL_PORT,
        MAIL_USERNAME: process.env.MAIL_USERNAME,
        MAIL_PASSWORD: process.env.MAIL_PASSWORD,
        MAIL_FROM: process.env.MAIL_FROM,
        FRONTEND_URL: process.env.FRONTEND_URL,

        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
        GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL,

        FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
        FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
        FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL,

        EMAIL_ENCRYPTION_KEY: process.env.EMAIL_ENCRYPTION_KEY,
        SALT_ROUND: process.env.SALT_ROUND,
        PORT: process.env.AUTH_PORT,
        DATABASE_URL_DEV_USERS: process.env.DATABASE_URL_DEV_USERS,
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
        JWT_SECRET: process.env.JWT_SECRET,
        USER_SERVICE_URL: process.env.USER_SERVICE_URL,
        PORT: process.env.PRODUCT_PORT,
        DATABASE_URL_DEV_PRODUCT: process.env.DATABASE_URL_DEV_PRODUCT,
      },
    },
  ],
};
