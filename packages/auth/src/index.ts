// Logto authentication integration for Next.js App Router
// Uses @logto/next with server actions

export const logtoConfig = {
  endpoint: process.env.LOGTO_ENDPOINT!,
  appId: process.env.LOGTO_APP_ID!,
  appSecret: process.env.LOGTO_APP_SECRET!,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  cookieSecret: process.env.LOGTO_COOKIE_SECRET!,
  cookieSecure: process.env.NODE_ENV === 'production',
}

export function getLogtoConfig() {
  if (!process.env.LOGTO_ENDPOINT) {
    throw new Error('LOGTO_ENDPOINT is required')
  }
  if (!process.env.LOGTO_APP_ID) {
    throw new Error('LOGTO_APP_ID is required')
  }
  if (!process.env.LOGTO_APP_SECRET) {
    throw new Error('LOGTO_APP_SECRET is required')
  }
  if (!process.env.LOGTO_COOKIE_SECRET) {
    throw new Error('LOGTO_COOKIE_SECRET is required')
  }
  return logtoConfig
}

// Re-export from @logto/next for convenience
export {
  getLogtoContext,
  signIn,
  signOut,
  handleSignIn,
} from '@logto/next/server-actions'
