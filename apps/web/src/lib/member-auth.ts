/**
 * Member Authentication System
 *
 * Simple email/password authentication for members (not creators).
 * Creators use Logto for auth.
 */

import { db } from "@/lib/db"
import { cookies } from "next/headers"
import crypto from "crypto"

const SESSION_COOKIE_NAME = "member_session"
const SESSION_EXPIRY_DAYS = 30

/**
 * Hash a password using crypto.pbkdf2
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err)
      resolve(derivedKey.toString("hex"))
    })
  })
  return `${salt}:${hash}`
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, hash] = storedHash.split(":")
  if (!salt || !hash) return false

  const verifyHash = await new Promise<string>((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err)
      resolve(derivedKey.toString("hex"))
    })
  })

  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(verifyHash))
}

/**
 * Generate a secure session token
 */
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/**
 * Create a new member session
 */
export async function createSession(
  userId: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> {
  const token = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS)

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress,
    },
  })

  // Update last login
  await db.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })

  return token
}

/**
 * Get session from token
 */
export async function getSessionByToken(token: string) {
  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          avatar: true,
          isCreator: true,
        },
      },
    },
  })

  if (!session) return null

  // Check if session is expired
  if (session.expiresAt < new Date()) {
    await db.session.delete({ where: { id: session.id } })
    return null
  }

  return session
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(token: string): Promise<void> {
  await db.session.delete({ where: { token } }).catch(() => {
    // Ignore if session doesn't exist
  })
}

/**
 * Delete all sessions for a user
 */
export async function deleteAllUserSessions(userId: string): Promise<void> {
  await db.session.deleteMany({ where: { userId } })
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await db.session.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  })
  return result.count
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    path: "/",
  })
}

/**
 * Get session cookie
 */
export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(SESSION_COOKIE_NAME)?.value
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}

/**
 * Get current member from session cookie
 */
export async function getCurrentMember() {
  const token = await getSessionCookie()
  if (!token) return null

  const session = await getSessionByToken(token)
  return session?.user || null
}

/**
 * Register a new member
 */
export async function registerMember(
  email: string,
  password: string,
  name?: string
): Promise<{ user?: { id: string; email: string; name: string | null }; error?: string }> {
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { error: "Invalid email address" }
  }

  // Validate password
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters" }
  }

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (existingUser) {
    // If user exists as a creator (with Logto), they can't register as member
    if (existingUser.logtoId) {
      return { error: "This email is already registered as a creator account" }
    }
    // If user exists but no password (incomplete registration), update them
    if (!existingUser.passwordHash) {
      const passwordHash = await hashPassword(password)
      const user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          passwordHash,
          name: name || existingUser.name,
          isCreator: false,
        },
      })
      return { user: { id: user.id, email: user.email, name: user.name } }
    }
    return { error: "An account with this email already exists" }
  }

  // Create new user
  const passwordHash = await hashPassword(password)
  const user = await db.user.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      isCreator: false,
    },
  })

  return { user: { id: user.id, email: user.email, name: user.name } }
}

/**
 * Login a member
 */
export async function loginMember(
  email: string,
  password: string
): Promise<{ user?: { id: string; email: string; name: string | null }; error?: string }> {
  const user = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  })

  if (!user) {
    return { error: "Invalid email or password" }
  }

  // Check if this is a creator account (uses Logto)
  if (user.logtoId && !user.passwordHash) {
    return { error: "This email is registered as a creator account. Please use creator login." }
  }

  // Verify password
  if (!user.passwordHash) {
    return { error: "Invalid email or password" }
  }

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) {
    return { error: "Invalid email or password" }
  }

  return { user: { id: user.id, email: user.email, name: user.name } }
}

/**
 * Join an organization as a member
 */
export async function joinOrganization(
  userId: string,
  organizationSlug: string,
  tierId?: string
): Promise<{ membership?: { id: string; role: string }; error?: string }> {
  // Find the organization
  const organization = await db.organization.findUnique({
    where: { slug: organizationSlug },
    include: {
      tiers: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        take: 1, // Get the first (free) tier
      },
    },
  })

  if (!organization) {
    return { error: "Organization not found" }
  }

  // Check if already a member
  const existingMembership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: organization.id,
      },
    },
  })

  if (existingMembership) {
    return { membership: { id: existingMembership.id, role: existingMembership.role } }
  }

  // Use provided tier or default to first tier (usually free)
  const targetTierId = tierId || organization.tiers[0]?.id

  // Create membership
  const membership = await db.membership.create({
    data: {
      userId,
      organizationId: organization.id,
      tierId: targetTierId,
      role: "MEMBER",
      status: "ACTIVE",
    },
  })

  return { membership: { id: membership.id, role: membership.role } }
}
