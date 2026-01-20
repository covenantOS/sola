"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getTiers() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Organization not found", tiers: [] }
  }

  const tiers = await db.membershipTier.findMany({
    where: { organizationId: organization.id },
    orderBy: { position: "asc" },
    include: {
      _count: {
        select: { memberships: true },
      },
    },
  })

  return {
    tiers: tiers.map((t) => ({
      ...t,
      price: Number(t.price),
      features: Array.isArray(t.features) ? t.features : [],
    })),
  }
}

export async function createTier(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string | undefined
  const price = formData.get("price") as string
  const interval = formData.get("interval") as string
  const featuresJson = formData.get("features") as string

  if (!name || name.trim().length < 2) {
    return { error: "Tier name must be at least 2 characters" }
  }

  const features = featuresJson ? JSON.parse(featuresJson) : []

  // Get max position
  const maxPosition = await db.membershipTier.aggregate({
    where: { organizationId: organization.id },
    _max: { position: true },
  })

  try {
    const tier = await db.membershipTier.create({
      data: {
        name: name.trim(),
        description: description?.trim(),
        price: parseFloat(price) || 0,
        interval: interval || "month",
        features,
        organizationId: organization.id,
        position: (maxPosition._max.position || 0) + 1,
      },
    })

    revalidatePath("/dashboard/tiers")
    return { success: true, tier }
  } catch (error) {
    console.error("Failed to create tier:", error)
    return { error: "Failed to create tier" }
  }
}

export async function updateTier(tierId: string, formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string | undefined
  const price = formData.get("price") as string
  const interval = formData.get("interval") as string
  const featuresJson = formData.get("features") as string

  const features = featuresJson ? JSON.parse(featuresJson) : []

  try {
    const tier = await db.membershipTier.update({
      where: { id: tierId },
      data: {
        name: name?.trim(),
        description: description?.trim(),
        price: parseFloat(price) || 0,
        interval: interval || "month",
        features,
      },
    })

    revalidatePath("/dashboard/tiers")
    return { success: true, tier }
  } catch (error) {
    console.error("Failed to update tier:", error)
    return { error: "Failed to update tier" }
  }
}

export async function deleteTier(tierId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  // Check if tier has any active memberships
  const memberCount = await db.membership.count({
    where: { tierId },
  })

  if (memberCount > 0) {
    return { error: "Cannot delete tier with active members" }
  }

  try {
    await db.membershipTier.delete({
      where: { id: tierId },
    })

    revalidatePath("/dashboard/tiers")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete tier:", error)
    return { error: "Failed to delete tier" }
  }
}

export async function reorderTiers(tierIds: string[]) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    await Promise.all(
      tierIds.map((id, index) =>
        db.membershipTier.update({
          where: { id },
          data: { position: index },
        })
      )
    )

    revalidatePath("/dashboard/tiers")
    return { success: true }
  } catch (error) {
    console.error("Failed to reorder tiers:", error)
    return { error: "Failed to reorder tiers" }
  }
}
