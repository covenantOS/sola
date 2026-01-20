import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify channel belongs to organization
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        community: {
          organizationId: organization.id,
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    const { name, slug, description, type, isPublic, accessTierIds } = await request.json()

    // Check for duplicate slug (excluding current channel)
    if (slug !== channel.slug) {
      const existingChannel = await db.channel.findFirst({
        where: {
          communityId: channel.communityId,
          slug,
          id: { not: channelId },
        },
      })

      if (existingChannel) {
        return NextResponse.json({ error: "A channel with this URL already exists" }, { status: 400 })
      }
    }

    const updatedChannel = await db.channel.update({
      where: { id: channelId },
      data: {
        name,
        slug,
        description,
        type,
        isPublic,
        accessTierIds,
      },
    })

    return NextResponse.json({ channel: updatedChannel })
  } catch (error) {
    console.error("Failed to update channel:", error)
    return NextResponse.json({ error: "Failed to update channel" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  try {
    const { channelId } = await params
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify channel belongs to organization
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        community: {
          organizationId: organization.id,
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Delete the channel (posts will cascade delete)
    await db.channel.delete({
      where: { id: channelId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete channel:", error)
    return NextResponse.json({ error: "Failed to delete channel" }, { status: 500 })
  }
}
