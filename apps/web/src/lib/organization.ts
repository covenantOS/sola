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
