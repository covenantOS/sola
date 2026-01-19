import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

const LOGTO_WEBHOOK_SECRET = process.env.LOGTO_WEBHOOK_SECRET || ""

interface LogtoUser {
  id: string
  username?: string
  primaryEmail?: string
  primaryPhone?: string
  name?: string
  avatar?: string
  customData?: Record<string, unknown>
  identities?: Record<string, unknown>
  lastSignInAt?: string
  createdAt?: string
  applicationId?: string
  isSuspended?: boolean
}

interface LogtoWebhookEvent {
  hookId: string
  event: string
  createdAt: string
  sessionId?: string
  userAgent?: string
  ip?: string
  data?: {
    user?: LogtoUser
  }
}

function verifySignature(payload: string, signature: string, secret: string): boolean {
  if (!secret || !signature) return true // Skip if not configured

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get("logto-signature-sha-256") || ""

  // Verify signature if secret is configured
  if (LOGTO_WEBHOOK_SECRET) {
    const isValid = verifySignature(body, signature, LOGTO_WEBHOOK_SECRET)
    if (!isValid) {
      console.error("Logto webhook signature verification failed")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  let event: LogtoWebhookEvent

  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  console.log(`Logto webhook received: ${event.event}`)

  try {
    switch (event.event) {
      // User registered
      case "User.Created": {
        await handleUserCreated(event.data?.user)
        break
      }

      // User updated their profile
      case "User.Data.Updated": {
        await handleUserUpdated(event.data?.user)
        break
      }

      // User deleted
      case "User.Deleted": {
        await handleUserDeleted(event.data?.user)
        break
      }

      // User suspended
      case "User.SuspensionStatus.Updated": {
        await handleUserSuspensionUpdated(event.data?.user)
        break
      }

      // Sign in events (for analytics)
      case "PostSignIn": {
        await handlePostSignIn(event.data?.user)
        break
      }

      default:
        console.log(`Unhandled Logto event type: ${event.event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing Logto webhook ${event.event}:`, error)
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    )
  }
}

// ============ HANDLER FUNCTIONS ============

async function handleUserCreated(user: LogtoUser | undefined) {
  if (!user?.id) return

  console.log(`Creating user from Logto: ${user.id}`)

  // Check if user already exists
  const existingUser = await db.user.findUnique({
    where: { logtoId: user.id },
  })

  if (existingUser) {
    console.log(`User ${user.id} already exists`)
    return
  }

  // Check if email already exists
  if (user.primaryEmail) {
    const userByEmail = await db.user.findUnique({
      where: { email: user.primaryEmail },
    })

    if (userByEmail) {
      // Link Logto account to existing user
      await db.user.update({
        where: { id: userByEmail.id },
        data: {
          logtoId: user.id,
          name: user.name || userByEmail.name,
          avatar: user.avatar || userByEmail.avatar,
        },
      })
      console.log(`Linked Logto user ${user.id} to existing user ${userByEmail.id}`)
      return
    }
  }

  // Create new user
  await db.user.create({
    data: {
      logtoId: user.id,
      email: user.primaryEmail || `${user.id}@logto.user`,
      name: user.name,
      avatar: user.avatar,
    },
  })

  console.log(`Created new user for Logto user ${user.id}`)
}

async function handleUserUpdated(user: LogtoUser | undefined) {
  if (!user?.id) return

  console.log(`Updating user from Logto: ${user.id}`)

  const existingUser = await db.user.findUnique({
    where: { logtoId: user.id },
  })

  if (!existingUser) {
    // User doesn't exist yet, create them
    await handleUserCreated(user)
    return
  }

  // Update user info
  await db.user.update({
    where: { id: existingUser.id },
    data: {
      email: user.primaryEmail || existingUser.email,
      name: user.name !== undefined ? user.name : existingUser.name,
      avatar: user.avatar !== undefined ? user.avatar : existingUser.avatar,
    },
  })

  console.log(`Updated user ${existingUser.id}`)
}

async function handleUserDeleted(user: LogtoUser | undefined) {
  if (!user?.id) return

  console.log(`User deleted in Logto: ${user.id}`)

  // We don't delete users, just unlink the Logto account
  // This preserves their content and allows for data export
  const existingUser = await db.user.findUnique({
    where: { logtoId: user.id },
  })

  if (existingUser) {
    await db.user.update({
      where: { id: existingUser.id },
      data: {
        logtoId: null,
      },
    })
    console.log(`Unlinked Logto account from user ${existingUser.id}`)
  }
}

async function handleUserSuspensionUpdated(user: LogtoUser | undefined) {
  if (!user?.id) return

  console.log(`User suspension updated in Logto: ${user.id}, suspended: ${user.isSuspended}`)

  // Could implement suspension logic here
  // For now, just log it
}

async function handlePostSignIn(user: LogtoUser | undefined) {
  if (!user?.id) return

  // Ensure user exists in our database
  const existingUser = await db.user.findUnique({
    where: { logtoId: user.id },
  })

  if (!existingUser) {
    await handleUserCreated(user)
  }

  // Could track sign-in analytics here
  console.log(`User ${user.id} signed in`)
}
