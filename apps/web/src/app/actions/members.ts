"use server"

import { db } from "@/lib/db"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { revalidatePath } from "next/cache"

// Get organization's membership tiers
export async function getMembershipTiers() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated", tiers: [] }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization", tiers: [] }
  }

  const tiers = await db.membershipTier.findMany({
    where: { organizationId: user.ownedOrganizations[0].id },
    include: { _count: { select: { memberships: true } } },
    orderBy: { position: "asc" },
  })

  return {
    tiers: tiers.map((t) => ({
      ...t,
      price: Number(t.price),
      memberCount: t._count.memberships,
    })),
  }
}

// Create a membership tier
export async function createMembershipTier({
  name,
  description,
  price,
  interval,
  features,
}: {
  name: string
  description?: string
  price: number
  interval: string
  features: string[]
}) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization" }
  }

  const org = user.ownedOrganizations[0]

  // Get next position
  const maxPosition = await db.membershipTier.aggregate({
    where: { organizationId: org.id },
    _max: { position: true },
  })

  const tier = await db.membershipTier.create({
    data: {
      name,
      description,
      price,
      interval,
      features: JSON.stringify(features),
      organizationId: org.id,
      position: (maxPosition._max.position || 0) + 1,
    },
  })

  revalidatePath("/dashboard/members")
  return { tier: { ...tier, price: Number(tier.price) } }
}

// Update a membership tier
export async function updateMembershipTier({
  id,
  name,
  description,
  price,
  interval,
  features,
  isActive,
}: {
  id: string
  name?: string
  description?: string
  price?: number
  interval?: string
  features?: string[]
  isActive?: boolean
}) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization" }
  }

  // Verify ownership
  const tier = await db.membershipTier.findFirst({
    where: { id, organizationId: user.ownedOrganizations[0].id },
  })

  if (!tier) {
    return { error: "Tier not found" }
  }

  const updated = await db.membershipTier.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(price !== undefined && { price }),
      ...(interval && { interval }),
      ...(features && { features: JSON.stringify(features) }),
      ...(isActive !== undefined && { isActive }),
    },
  })

  revalidatePath("/dashboard/members")
  return { tier: { ...updated, price: Number(updated.price) } }
}

// Delete a membership tier
export async function deleteMembershipTier(id: string) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization" }
  }

  const tier = await db.membershipTier.findFirst({
    where: { id, organizationId: user.ownedOrganizations[0].id },
  })

  if (!tier) {
    return { error: "Tier not found" }
  }

  // Check if tier has members
  const memberCount = await db.membership.count({
    where: { tierId: id },
  })

  if (memberCount > 0) {
    return { error: `Cannot delete tier with ${memberCount} active members` }
  }

  await db.membershipTier.delete({ where: { id } })

  revalidatePath("/dashboard/members")
  return { success: true }
}

// Get organization members
export async function getMembers() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated", members: [] }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization", members: [] }
  }

  const members = await db.membership.findMany({
    where: { organizationId: user.ownedOrganizations[0].id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      tier: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  return { members }
}

// Update member role/status
export async function updateMember({
  membershipId,
  role,
  status,
  tierId,
}: {
  membershipId: string
  role?: string
  status?: string
  tierId?: string | null
}) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization" }
  }

  const membership = await db.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: user.ownedOrganizations[0].id,
    },
  })

  if (!membership) {
    return { error: "Member not found" }
  }

  const updated = await db.membership.update({
    where: { id: membershipId },
    data: {
      ...(role && { role: role as any }),
      ...(status && { status: status as any }),
      ...(tierId !== undefined && { tierId }),
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
      tier: true,
    },
  })

  revalidatePath("/dashboard/members")
  return { member: updated }
}

// Remove a member
export async function removeMember(membershipId: string) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization" }
  }

  const membership = await db.membership.findFirst({
    where: {
      id: membershipId,
      organizationId: user.ownedOrganizations[0].id,
    },
  })

  if (!membership) {
    return { error: "Member not found" }
  }

  await db.membership.delete({ where: { id: membershipId } })

  revalidatePath("/dashboard/members")
  return { success: true }
}

// Update channel access tiers
export async function updateChannelAccess({
  channelId,
  accessTierIds,
  isPublic,
}: {
  channelId: string
  accessTierIds: string[]
  isPublic: boolean
}) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization" }
  }

  // Verify channel belongs to user's org
  const channel = await db.channel.findFirst({
    where: {
      id: channelId,
      community: { organizationId: user.ownedOrganizations[0].id },
    },
  })

  if (!channel) {
    return { error: "Channel not found" }
  }

  const updated = await db.channel.update({
    where: { id: channelId },
    data: { accessTierIds, isPublic },
  })

  revalidatePath("/dashboard/community")
  return { channel: updated }
}
