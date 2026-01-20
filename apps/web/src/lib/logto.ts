// Validate required environment variables
const requiredEnvVars = [
  "LOGTO_ENDPOINT",
  "LOGTO_APP_ID",
  "LOGTO_APP_SECRET",
  "LOGTO_COOKIE_SECRET",
]

const missingVars = requiredEnvVars.filter((v) => !process.env[v])
if (missingVars.length > 0 && process.env.NODE_ENV !== "development") {
  console.warn(`Warning: Missing Logto environment variables: ${missingVars.join(", ")}`)
}

export const logtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT || "",
  appId: process.env.LOGTO_APP_ID || "",
  appSecret: process.env.LOGTO_APP_SECRET || "",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  cookieSecret: process.env.LOGTO_COOKIE_SECRET || "default-dev-secret-change-in-production-32chars",
  cookieSecure: process.env.NODE_ENV === "production",
}
