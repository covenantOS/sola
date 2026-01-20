"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getLivestreams() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Organization not found", livestreams: [] }
  }

  const livestreams = await db.livestream.findMany({
    where: { organizationId: organization.id },
    orderBy: [
      { status: "asc" },
      { scheduledAt: "desc" },
    ],
  })

  return { livestreams }
}

export async function createLivestream(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string | undefined
  const scheduledAtStr = formData.get("scheduledAt") as string | undefined
  const isPublic = formData.get("isPublic") === "true"

  if (!title || title.trim().length < 2) {
    return { error: "Title must be at least 2 characters" }
  }

  try {
    const livestream = await db.livestream.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        organizationId: organization.id,
        scheduledAt: scheduledAtStr ? new Date(scheduledAtStr) : null,
        isPublic,
        status: "SCHEDULED",
      },
    })

    revalidatePath("/dashboard/livestreams")
    return { success: true, livestream }
  } catch (error) {
    console.error("Failed to create livestream:", error)
    return { error: "Failed to create livestream" }
  }
}

export async function deleteLivestream(livestreamId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    await db.livestream.delete({
      where: { id: livestreamId },
    })

    revalidatePath("/dashboard/livestreams")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete livestream:", error)
    return { error: "Failed to delete livestream" }
  }
}

export async function startLivestream(livestreamId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    // Generate a unique room name
    const roomName = `live-${livestreamId}-${Date.now()}`

    // In production, you would create a Mux live stream here
    // For now, we'll just update the status and return placeholder details
    const livestream = await db.livestream.update({
      where: { id: livestreamId },
      data: {
        status: "LIVE",
        startedAt: new Date(),
        livekitRoomName: roomName,
      },
    })

    revalidatePath("/dashboard/livestreams")

    // Return stream details (would come from Mux in production)
    return {
      success: true,
      streamDetails: {
        rtmpUrl: "rtmps://global-live.mux.com:443/app",
        streamKey: `sk-${roomName}`,
      },
    }
  } catch (error) {
    console.error("Failed to start livestream:", error)
    return { error: "Failed to start livestream" }
  }
}

export async function endLivestream(livestreamId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    await db.livestream.update({
      where: { id: livestreamId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    })

    revalidatePath("/dashboard/livestreams")
    return { success: true }
  } catch (error) {
    console.error("Failed to end livestream:", error)
    return { error: "Failed to end livestream" }
  }
}
