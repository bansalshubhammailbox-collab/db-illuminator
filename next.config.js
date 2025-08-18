 /** @type {import('next').NextConfig} */
  const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    experimental: {
      appDir: false // We're using pages directory
    },
    env: {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
      SNOWFLAKE_USER: process.env.SNOWFLAKE_USER,
      SNOWFLAKE_PASSWORD: process.env.SNOWFLAKE_PASSWORD,
      SNOWFLAKE_ACCOUNT: process.env.SNOWFLAKE_ACCOUNT,
      SNOWFLAKE_WAREHOUSE: process.env.SNOWFLAKE_WAREHOUSE,
      SNOWFLAKE_DATABASE: process.env.SNOWFLAKE_DATABASE,
      SNOWFLAKE_SCHEMA: process.env.SNOWFLAKE_SCHEMA,
    }
  }

  module.exports = nextConfig