"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// ==================== CHANNELS ====================

export async function getChannels() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Organization not found", channels: [] }
  }

  const community = await db.community.findFirst({
    where: { organizationId: organization.id, isDefault: true },
    include: {
      channels: {
        orderBy: { position: "asc" },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      },
    },
  })

  return { channels: community?.channels || [], community }
}

export async function createChannel(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user, organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization || !user) {
    return { error: "Not authorized" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string | undefined
  const type = (formData.get("type") as string) || "DISCUSSION"

  if (!name || name.trim().length < 2) {
    return { error: "Channel name must be at least 2 characters" }
  }

  const community = await db.community.findFirst({
    where: { organizationId: organization.id, isDefault: true },
  })

  if (!community) {
    return { error: "Community not found" }
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Get max position
  const maxPosition = await db.channel.aggregate({
    where: { communityId: community.id },
    _max: { position: true },
  })

  try {
    const channel = await db.channel.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim(),
        type: type as "DISCUSSION" | "ANNOUNCEMENTS" | "EVENTS" | "RESOURCES",
        communityId: community.id,
        isPublic: true,
        position: (maxPosition._max.position || 0) + 1,
      },
    })

    revalidatePath("/dashboard/community")
    return { success: true, channel }
  } catch (error) {
    console.error("Failed to create channel:", error)
    return { error: "Failed to create channel" }
  }
}

export async function deleteChannel(channelId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    await db.channel.delete({
      where: { id: channelId },
    })

    revalidatePath("/dashboard/community")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete channel:", error)
    return { error: "Failed to delete channel" }
  }
}

// ==================== POSTS ====================

export async function getPosts(channelId: string, limit = 20, cursor?: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user } = await getUserWithOrganization(claims?.sub || "")

  if (!user) {
    return { error: "Not authenticated", posts: [] }
  }

  const posts = await db.post.findMany({
    where: { channelId },
    take: limit + 1,
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      _count: {
        select: {
          comments: true,
          reactions: true,
        },
      },
      reactions: {
        where: { userId: user.id },
        select: { emoji: true },
      },
    },
  })

  const hasMore = posts.length > limit
  const items = hasMore ? posts.slice(0, -1) : posts
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined

  return { posts: items, hasMore, nextCursor }
}

export async function createPost(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user, organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization || !user) {
    return { error: "Not authorized" }
  }

  const channelId = formData.get("channelId") as string
  const content = formData.get("content") as string

  if (!content || content.trim().length < 1) {
    return { error: "Post content is required" }
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

    revalidatePath(`/dashboard/community`)
    return { success: true, post }
  } catch (error) {
    console.error("Failed to create post:", error)
    return { error: "Failed to create post" }
  }
}

export async function deletePost(postId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user, organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization || !user) {
    return { error: "Not authorized" }
  }

  // Check if user owns the post or is admin
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  })

  if (!post) {
    return { error: "Post not found" }
  }

  // Check if user is author or organization owner
  if (post.authorId !== user.id && organization.ownerId !== user.id) {
    return { error: "Not authorized to delete this post" }
  }

  try {
    await db.post.delete({
      where: { id: postId },
    })

    revalidatePath("/dashboard/community")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete post:", error)
    return { error: "Failed to delete post" }
  }
}

// ==================== COMMENTS ====================

export async function getComments(postId: string) {
  const comments = await db.comment.findMany({
    where: { postId, parentId: null },
    orderBy: { createdAt: "asc" },
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
      _count: {
        select: { reactions: true },
      },
    },
  })

  return { comments }
}

export async function createComment(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user } = await getUserWithOrganization(claims?.sub || "")

  if (!user) {
    return { error: "Not authenticated" }
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

    revalidatePath("/dashboard/community")
    return { success: true, comment }
  } catch (error) {
    console.error("Failed to create comment:", error)
    return { error: "Failed to create comment" }
  }
}

// ==================== REACTIONS ====================

export async function toggleReaction(postId: string | null, commentId: string | null, emoji: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user } = await getUserWithOrganization(claims?.sub || "")

  if (!user) {
    return { error: "Not authenticated" }
  }

  try {
    // Check if reaction exists
    const existing = await db.reaction.findFirst({
      where: {
        userId: user.id,
        postId: postId || undefined,
        commentId: commentId || undefined,
        emoji,
      },
    })

    if (existing) {
      // Remove reaction
      await db.reaction.delete({
        where: { id: existing.id },
      })
      return { success: true, added: false }
    } else {
      // Add reaction
      await db.reaction.create({
        data: {
          userId: user.id,
          postId,
          commentId,
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
