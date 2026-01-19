import { db } from "./db"

interface LogtoUserClaims {
  sub: string
  email?: string
  name?: string
  picture?: string
}

/**
 * Sync a Logto user to our database
 * Creates user if not exists, updates if changed
 */
export async function syncUserFromLogto(claims: LogtoUserClaims) {
  if (!claims.sub) {
    throw new Error("Missing user ID (sub) in claims")
  }

  // Check if user exists by logtoId
  const existingUser = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: {
      ownedOrganizations: true,
      memberships: {
        include: { organization: true },
      },
    },
  })

  if (existingUser) {
    // Update user if email or name changed
    if (
      existingUser.email !== claims.email ||
      existingUser.name !== claims.name ||
      existingUser.avatar !== claims.picture
    ) {
      return db.user.update({
        where: { id: existingUser.id },
        data: {
          email: claims.email || existingUser.email,
          name: claims.name || existingUser.name,
          avatar: claims.picture || existingUser.avatar,
        },
        include: {
          ownedOrganizations: true,
          memberships: {
            include: { organization: true },
          },
        },
      })
    }
    return existingUser
  }

  // Create new user
  // First check if email already exists (user might have been created by different auth method)
  if (claims.email) {
    const userByEmail = await db.user.findUnique({
      where: { email: claims.email },
    })

    if (userByEmail) {
      // Link this Logto account to existing user
      return db.user.update({
        where: { id: userByEmail.id },
        data: {
          logtoId: claims.sub,
          name: claims.name || userByEmail.name,
          avatar: claims.picture || userByEmail.avatar,
        },
        include: {
          ownedOrganizations: true,
          memberships: {
            include: { organization: true },
          },
        },
      })
    }
  }

  // Create brand new user
  return db.user.create({
    data: {
      logtoId: claims.sub,
      email: claims.email || `${claims.sub}@logto.user`,
      name: claims.name,
      avatar: claims.picture,
    },
    include: {
      ownedOrganizations: true,
      memberships: {
        include: { organization: true },
      },
    },
  })
}

/**
 * Get user by Logto ID
 */
export async function getUserByLogtoId(logtoId: string) {
  return db.user.findUnique({
    where: { logtoId },
    include: {
      ownedOrganizations: true,
      memberships: {
        include: { organization: true },
      },
    },
  })
}

/**
 * Get user with their primary organization
 */
export async function getUserWithOrganization(logtoId: string) {
  const user = await db.user.findUnique({
    where: { logtoId },
    include: {
      ownedOrganizations: {
        orderBy: { createdAt: "asc" },
        take: 1,
      },
    },
  })

  return {
    user,
    organization: user?.ownedOrganizations[0] || null,
  }
}
