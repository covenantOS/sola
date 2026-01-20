"use server"

import { db } from "@/lib/db"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { revalidatePath } from "next/cache"

// Get current user's conversations
export async function getConversations() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated", conversations: [] }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
  })

  if (!user) {
    return { error: "User not found", conversations: [] }
  }

  const conversations = await db.conversation.findMany({
    where: {
      participants: {
        some: {
          userId: user.id,
        },
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
              email: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  })

  // Format conversations for the client
  const formattedConversations = conversations.map((conv) => {
    const otherParticipants = conv.participants.filter(
      (p) => p.userId !== user.id
    )
    const lastMessage = conv.messages[0]

    return {
      id: conv.id,
      type: conv.type,
      name: conv.type === "GROUP" ? conv.name : otherParticipants[0]?.user.name,
      avatar: conv.type === "DIRECT" ? otherParticipants[0]?.user.avatar : null,
      participants: otherParticipants.map((p) => ({
        id: p.user.id,
        name: p.user.name,
        avatar: p.user.avatar,
      })),
      lastMessage: lastMessage
        ? {
            content: lastMessage.content,
            createdAt: lastMessage.createdAt,
          }
        : null,
      updatedAt: conv.updatedAt,
    }
  })

  return { conversations: formattedConversations }
}

// Get messages for a conversation
export async function getMessages(conversationId: string) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated", messages: [] }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
  })

  if (!user) {
    return { error: "User not found", messages: [] }
  }

  // Verify user is a participant
  const participant = await db.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId: user.id,
    },
  })

  if (!participant) {
    return { error: "Not authorized", messages: [] }
  }

  const messages = await db.message.findMany({
    where: {
      conversationId,
      isDeleted: false,
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
    orderBy: { createdAt: "asc" },
  })

  // Update last read
  await db.conversationParticipant.update({
    where: { id: participant.id },
    data: { lastReadAt: new Date() },
  })

  return {
    messages: messages.map((m) => ({
      id: m.id,
      content: m.content,
      author: m.author,
      isOwn: m.authorId === user.id,
      createdAt: m.createdAt,
      isEdited: m.isEdited,
    })),
    currentUserId: user.id,
  }
}

// Send a message
export async function sendMessage({
  conversationId,
  content,
}: {
  conversationId: string
  content: string
}) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
  })

  if (!user) {
    return { error: "User not found" }
  }

  // Verify user is a participant
  const participant = await db.conversationParticipant.findFirst({
    where: {
      conversationId,
      userId: user.id,
    },
  })

  if (!participant) {
    return { error: "Not authorized" }
  }

  const message = await db.message.create({
    data: {
      content: content.trim(),
      authorId: user.id,
      conversationId,
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

  // Update conversation's updatedAt
  await db.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  revalidatePath("/dashboard/messages")
  return {
    message: {
      id: message.id,
      content: message.content,
      author: message.author,
      isOwn: true,
      createdAt: message.createdAt,
      isEdited: false,
    },
  }
}

// Start a new conversation
export async function startConversation({
  participantId,
  initialMessage,
}: {
  participantId: string
  initialMessage: string
}) {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
  })

  if (!user) {
    return { error: "User not found" }
  }

  // Check if direct conversation already exists
  const existingConversation = await db.conversation.findFirst({
    where: {
      type: "DIRECT",
      AND: [
        { participants: { some: { userId: user.id } } },
        { participants: { some: { userId: participantId } } },
      ],
    },
  })

  if (existingConversation) {
    // Just send a message to existing conversation
    await sendMessage({
      conversationId: existingConversation.id,
      content: initialMessage,
    })
    return { conversationId: existingConversation.id }
  }

  // Create new conversation
  const conversation = await db.conversation.create({
    data: {
      type: "DIRECT",
      participants: {
        create: [{ userId: user.id }, { userId: participantId }],
      },
      messages: {
        create: {
          content: initialMessage.trim(),
          authorId: user.id,
        },
      },
    },
  })

  revalidatePath("/dashboard/messages")
  return { conversationId: conversation.id }
}

// Get organization members for starting new conversations
export async function getOrganizationMembers() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated", members: [] }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: {
      ownedOrganizations: true,
    },
  })

  if (!user) {
    return { error: "User not found", members: [] }
  }

  // Get the user's organization
  const org = user.ownedOrganizations[0]
  if (!org) {
    return { members: [] }
  }

  // Get all members of the organization
  const memberships = await db.membership.findMany({
    where: {
      organizationId: org.id,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true,
          email: true,
        },
      },
    },
  })

  return {
    members: memberships
      .filter((m) => m.userId !== user.id)
      .map((m) => m.user),
  }
}
