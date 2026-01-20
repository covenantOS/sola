"use server"

import { db } from "@/lib/db"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { revalidatePath } from "next/cache"

// Get all livestreams for the organization
export async function getLivestreams() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated", livestreams: [] }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization", livestreams: [] }
  }

  const org = user.ownedOrganizations[0]

  const livestreams = await db.livestream.findMany({
    where: { organizationId: org.id },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }, { createdAt: "desc" }],
  })

  return { livestreams }
}

// Create a new livestream
export async function createLivestream({
  title,
  description,
  scheduledAt,
  isPublic,
}: {
  title: string
  description?: string
  scheduledAt?: string
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

  const org = user.ownedOrganizations[0]

  // Generate a unique room name for LiveKit
  const roomName = `${org.slug}-${Date.now()}-${Math.random().toString(36).substring(7)}`

  const livestream = await db.livestream.create({
    data: {
      title,
      description,
      organizationId: org.id,
      livekitRoomName: roomName,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      isPublic,
      status: scheduledAt ? "SCHEDULED" : "SCHEDULED",
    },
  })

  revalidatePath("/dashboard/livestreams")
  return { livestream }
}

// Update a livestream
export async function updateLivestream({
  id,
  title,
  description,
  scheduledAt,
  isPublic,
}: {
  id: string
  title?: string
  description?: string
  scheduledAt?: string
  isPublic?: boolean
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
  const livestream = await db.livestream.findFirst({
    where: {
      id,
      organizationId: user.ownedOrganizations[0].id,
    },
  })

  if (!livestream) {
    return { error: "Livestream not found" }
  }

  const updated = await db.livestream.update({
    where: { id },
    data: {
      ...(title && { title }),
      ...(description !== undefined && { description }),
      ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
      ...(isPublic !== undefined && { isPublic }),
    },
  })

  revalidatePath("/dashboard/livestreams")
  return { livestream: updated }
}

// Start a livestream
export async function startLivestream(id: string) {
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

  const livestream = await db.livestream.findFirst({
    where: {
      id,
      organizationId: user.ownedOrganizations[0].id,
    },
  })

  if (!livestream) {
    return { error: "Livestream not found" }
  }

  const updated = await db.livestream.update({
    where: { id },
    data: {
      status: "LIVE",
      startedAt: new Date(),
    },
  })

  revalidatePath("/dashboard/livestreams")
  return { livestream: updated }
}

// End a livestream
export async function endLivestream(id: string) {
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

  const livestream = await db.livestream.findFirst({
    where: {
      id,
      organizationId: user.ownedOrganizations[0].id,
    },
  })

  if (!livestream) {
    return { error: "Livestream not found" }
  }

  const updated = await db.livestream.update({
    where: { id },
    data: {
      status: "ENDED",
      endedAt: new Date(),
    },
  })

  revalidatePath("/dashboard/livestreams")
  return { livestream: updated }
}

// Delete a livestream
export async function deleteLivestream(id: string) {
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

  const livestream = await db.livestream.findFirst({
    where: {
      id,
      organizationId: user.ownedOrganizations[0].id,
    },
  })

  if (!livestream) {
    return { error: "Livestream not found" }
  }

  await db.livestream.delete({ where: { id } })

  revalidatePath("/dashboard/livestreams")
  return { success: true }
}
