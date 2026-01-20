import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const member = await getCurrentMember()
    const org = await getOrganizationByDomain()

    if (!member || !org) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { emoji = "❤️" } = await request.json()

    // Verify post exists and is accessible
    const post = await db.post.findFirst({
      where: {
        id: postId,
        channel: {
          community: {
            organizationId: org.id,
          },
        },
      },
    })

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    // Check if already reacted with this emoji
    const existingReaction = await db.reaction.findFirst({
      where: {
        postId,
        userId: member.id,
        emoji,
      },
    })

    if (existingReaction) {
      // Remove reaction (toggle)
      await db.reaction.delete({
        where: { id: existingReaction.id },
      })
      return NextResponse.json({ removed: true })
    }

    // Add reaction
    const reaction = await db.reaction.create({
      data: {
        postId,
        userId: member.id,
        emoji,
      },
    })

    return NextResponse.json({ reaction })
  } catch (error) {
    console.error("Failed to react to post:", error)
    return NextResponse.json({ error: "Failed to react to post" }, { status: 500 })
  }
}
