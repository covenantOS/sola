import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()
    const org = await getOrganizationByDomain()

    if (!member || !org) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify membership
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: member.id,
          organizationId: org.id,
        },
      },
    })

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const { channelId, content } = await request.json()

    if (!channelId || !content) {
      return NextResponse.json({ error: "Channel ID and content are required" }, { status: 400 })
    }

    // Get channel and verify access
    const channel = await db.channel.findFirst({
      where: {
        id: channelId,
        community: {
          organizationId: org.id,
        },
      },
    })

    if (!channel) {
      return NextResponse.json({ error: "Channel not found" }, { status: 404 })
    }

    // Check if member has access to post
    const memberTierIds = membership.tierId ? [membership.tierId] : []
    const hasAccess =
      channel.isPublic ||
      channel.accessTierIds.some((id) => memberTierIds.includes(id)) ||
      channel.accessTierIds.length === 0

    if (!hasAccess) {
      return NextResponse.json({ error: "No access to this channel" }, { status: 403 })
    }

    // Check if member can post in this channel type
    const canPost =
      channel.type === "DISCUSSION" ||
      membership.role === "OWNER" ||
      membership.role === "ADMIN"

    if (!canPost) {
      return NextResponse.json({ error: "Cannot post in this channel" }, { status: 403 })
    }

    // Create post
    const post = await db.post.create({
      data: {
        channelId,
        authorId: member.id,
        content,
        isPublished: true,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({ post })
  } catch (error) {
    console.error("Failed to create post:", error)
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 })
  }
}
