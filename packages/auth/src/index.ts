// Logto authentication integration
// Configure in apps/web with environment variables

export interface LogtoConfig {
  endpoint: string
  appId: string
  appSecret: string
  baseUrl: string
  cookieSecret: string
}

export function getLogtoConfig(): LogtoConfig {
  const endpoint = process.env.LOGTO_ENDPOINT
  const appId = process.env.LOGTO_APP_ID
  const appSecret = process.env.LOGTO_APP_SECRET
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL
  const cookieSecret = process.env.LOGTO_COOKIE_SECRET

  if (!endpoint || !appId || !appSecret || !baseUrl || !cookieSecret) {
    throw new Error('Missing Logto environment variables')
  }

  return {
    endpoint,
    appId,
    appSecret,
    baseUrl,
    cookieSecret,
  }
}

// Re-export Logto Next.js utilities when configured
export { handleSignIn, handleSignOut, handleSignInCallback } from '@logto/next'
