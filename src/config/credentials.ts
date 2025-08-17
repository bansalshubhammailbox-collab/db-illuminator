// Configuration file for API credentials
// Add your credentials here for the proof of concept

export const config = {
  // Snowflake connection details (from Spider2 repository)
  snowflake: {
    account: "RSRSBDK-YDB67606", // Fixed account from Spider2
    user: "BANSALSHUBHAM", // ✏️ Replace with your Snowflake username
    password: "rY4D9TETvTqu6zW", // ✏️ Replace with your Snowflake password
    warehouse: "COMPUTE_WH",
    database: "SPIDER2", // Default database name from Spider2
    schema: "PUBLIC"
  },

  // Gemini AI API configuration
  gemini: {
    apiKey: "AIzaSyAVrII_LicWrfPeijbdiah2Pkei-hGLWh0", // ✏️ Replace with your Gemini API key
    model: "gemini-pro", // Default model
    baseUrl: "https://generativelanguage.googleapis.com/v1beta"
  },

  // Spider evaluation settings
  spider: {
    evaluationUrl: "https://spider2-sql.github.io/",
    snowflakeUrl: "https://app.snowflake.com/rsrsbdk/ydb67606/"
  }
};

// Validation helper to check if credentials are configured
export const validateCredentials = () => {
  const errors: string[] = [];

  if (config.snowflake.user === "your_username") {
    errors.push("Snowflake username not configured");
  }
  
  if (config.snowflake.password === "your_password") {
    errors.push("Snowflake password not configured");
  }

  if (config.gemini.apiKey === "your_gemini_api_key") {
    errors.push("Gemini API key not configured");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};