import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"

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

    const { content } = await request.json()

    if (!content?.trim()) {
      return NextResponse.json({ error: "Comment content is required" }, { status: 400 })
    }

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

    // Create comment
    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        postId,
        authorId: member.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("Failed to create comment:", error)
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 })
  }
}

export async function GET(
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

    const comments = await db.comment.findMany({
      where: { postId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Failed to fetch comments:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}
