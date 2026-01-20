import { db } from "./db"
import type { Prisma } from "@prisma/client"

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug
  let counter = 1

  while (true) {
    const existing = await db.organization.findUnique({
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

/**
 * Create an organization for a user
 */
export async function createOrganization({
  name,
  ownerId,
  description,
}: {
  name: string
  ownerId: string
  description?: string
}) {
  const baseSlug = generateSlug(name)
  const slug = await ensureUniqueSlug(baseSlug)

  const organization = await db.organization.create({
    data: {
      name,
      slug,
      description,
      ownerId,
    },
  })

  // Create owner membership
  await db.membership.create({
    data: {
      userId: ownerId,
      organizationId: organization.id,
      role: "OWNER",
      status: "ACTIVE",
    },
  })

  // Create default community
  const community = await db.community.create({
    data: {
      name: "General",
      slug: "general",
      description: "Welcome to the community!",
      organizationId: organization.id,
      isDefault: true,
    },
  })

  // Create default channels
  await db.channel.createMany({
    data: [
      {
        name: "Announcements",
        slug: "announcements",
        type: "ANNOUNCEMENTS",
        communityId: community.id,
        isPublic: true,
        position: 0,
      },
      {
        name: "General Discussion",
        slug: "general",
        type: "DISCUSSION",
        communityId: community.id,
        isPublic: true,
        position: 1,
      },
    ],
  })

  return organization
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  return db.organization.findUnique({
    where: { slug },
    include: {
      owner: true,
      _count: {
        select: {
          memberships: true,
          courses: true,
          livestreams: true,
        },
      },
    },
  })
}

/**
 * Get organization by ID
 */
export async function getOrganizationById(id: string) {
  return db.organization.findUnique({
    where: { id },
    include: {
      owner: true,
      tiers: {
        where: { isActive: true },
        orderBy: { position: "asc" },
      },
      _count: {
        select: {
          memberships: true,
          courses: true,
          livestreams: true,
        },
      },
    },
  })
}

/**
 * Update organization
 */
export async function updateOrganization(
  id: string,
  data: {
    name?: string
    description?: string
    logo?: string
    banner?: string
    settings?: Prisma.InputJsonValue
  }
) {
  return db.organization.update({
    where: { id },
    data,
  })
}

/**
 * Update organization Stripe account
 */
export async function updateOrganizationStripeAccount(
  organizationId: string,
  data: {
    stripeAccountId?: string
    stripeAccountStatus?: string
    stripeOnboardingComplete?: boolean
  }
) {
  return db.organization.update({
    where: { id: organizationId },
    data,
  })
}

/**
 * Get organization with community and channels
 */
export async function getOrganizationWithCommunity(slug: string) {
  const org = await db.organization.findUnique({
    where: { slug },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      tiers: {
        where: { isActive: true },
        orderBy: { position: "asc" },
      },
      communities: {
        where: { isDefault: true },
        include: {
          channels: {
            orderBy: { position: "asc" },
            include: {
              _count: {
                select: { posts: true },
              },
            },
          },
        },
      },
    },
  })

  return {
    organization: org,
    community: org?.communities[0] || null,
    channels: org?.communities[0]?.channels || [],
  }
}

/**
 * Get user's membership in an organization
 */
export async function getUserMembership(userId: string, organizationId: string) {
  return db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    include: {
      tier: true,
    },
  })
}

/**
 * Check if user can access a channel
 */
export function canAccessChannel(
  channel: { isPublic: boolean; accessTierIds: string[] },
  membership: { tierId: string | null; role: string } | null,
  isOwner: boolean
): boolean {
  // Owners and admins can access everything
  if (isOwner) return true
  if (membership?.role === "OWNER" || membership?.role === "ADMIN") return true

  // Public channels are accessible to everyone
  if (channel.isPublic) return true

  // No membership = no access to private channels
  if (!membership || !membership.tierId) return false

  // Check if user's tier has access
  if (channel.accessTierIds.length === 0) return true // No restrictions
  return channel.accessTierIds.includes(membership.tierId)
}

/**
 * Check if user can post in a channel
 */
export function canPostInChannel(
  channel: { type: string },
  membership: { role: string } | null,
  isOwner: boolean
): boolean {
  // Owners can always post
  if (isOwner) return true

  // Announcement channels are admin/owner only
  if (channel.type === "ANNOUNCEMENTS") {
    return membership?.role === "OWNER" || membership?.role === "ADMIN"
  }

  // Other channels - must be a member
  return !!membership
}
