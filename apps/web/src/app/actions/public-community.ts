"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createPublicPost(formData: FormData) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await getUserByLogtoId(claims.sub)
  if (!user) {
    return { error: "User not found" }
  }

  const channelId = formData.get("channelId") as string
  const content = formData.get("content") as string

  if (!content || content.trim().length < 1) {
    return { error: "Post content is required" }
  }

  // Get channel and verify user has access
  const channel = await db.channel.findUnique({
    where: { id: channelId },
    include: {
      community: {
        include: {
          organization: true,
        },
      },
    },
  })

  if (!channel) {
    return { error: "Channel not found" }
  }

  // Check if user is a member
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: channel.community.organizationId,
      },
    },
  })

  if (!membership) {
    return { error: "Not a member of this community" }
  }

  // Check if user can post in this channel type
  const isOwner = channel.community.organization.ownerId === user.id
  if (channel.type === "ANNOUNCEMENTS" && !isOwner && membership.role !== "ADMIN") {
    return { error: "Only admins can post in announcement channels" }
  }

  try {
    const post = await db.post.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        channelId,
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

    revalidatePath(`/${channel.community.organization.slug}/community`)
    return { success: true, post }
  } catch (error) {
    console.error("Failed to create post:", error)
    return { error: "Failed to create post" }
  }
}

export async function togglePublicReaction(postId: string, emoji: string) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await getUserByLogtoId(claims.sub)
  if (!user) {
    return { error: "User not found" }
  }

  try {
    // Check if reaction exists
    const existing = await db.reaction.findFirst({
      where: {
        userId: user.id,
        postId,
        emoji,
      },
    })

    if (existing) {
      await db.reaction.delete({
        where: { id: existing.id },
      })
      return { success: true, added: false }
    } else {
      await db.reaction.create({
        data: {
          userId: user.id,
          postId,
          emoji,
        },
      })
      return { success: true, added: true }
    }
  } catch (error) {
    console.error("Failed to toggle reaction:", error)
    return { error: "Failed to toggle reaction" }
  }
}

export async function createPublicComment(formData: FormData) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await getUserByLogtoId(claims.sub)
  if (!user) {
    return { error: "User not found" }
  }

  const postId = formData.get("postId") as string
  const content = formData.get("content") as string
  const parentId = formData.get("parentId") as string | null

  if (!content || content.trim().length < 1) {
    return { error: "Comment content is required" }
  }

  try {
    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        postId,
        parentId: parentId || null,
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

    return { success: true, comment }
  } catch (error) {
    console.error("Failed to create comment:", error)
    return { error: "Failed to create comment" }
  }
}
