# 🔧 Setup Credentials

## Quick Setup Guide

Open `src/config/credentials.ts` and replace the placeholder values:

### 1. Snowflake Credentials
```typescript
snowflake: {
  user: "your_actual_username", // Replace this
  password: "your_actual_password", // Replace this
  // Other fields are already configured from Spider2 repo
}
```

### 2. Gemini API Key
```typescript
gemini: {
  apiKey: "your_actual_gemini_api_key", // Replace this
  // Other fields are already configured
}
```

## Getting Your Credentials

### Snowflake (Spider2 Database)
- **Account**: Already configured as `RSRSBDK-YDB67606`
- **Username & Password**: You mentioned you have these - just replace the placeholder values

### Gemini API Key  
- Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
- Create a new API key
- Copy and paste it in the credentials file

## Verification
The app will show credential status on the main page so you can verify everything is working.

---
**Note**: This is for proof of concept only. For production, use proper secret management.
