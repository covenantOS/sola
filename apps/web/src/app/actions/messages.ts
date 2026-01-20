"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function startConversation(recipientId: string, content: string) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await getUserByLogtoId(claims.sub)
  if (!user) {
    return { error: "User not found" }
  }

  if (!content || content.trim().length < 1) {
    return { error: "Message content is required" }
  }

  try {
    // Check if conversation already exists between these users
    const existingConversation = await db.conversation.findFirst({
      where: {
        type: "DIRECT",
        AND: [
          { participants: { some: { userId: user.id } } },
          { participants: { some: { userId: recipientId } } },
        ],
      },
    })

    if (existingConversation) {
      // Add message to existing conversation
      await db.message.create({
        data: {
          content: content.trim(),
          authorId: user.id,
          conversationId: existingConversation.id,
        },
      })

      await db.conversation.update({
        where: { id: existingConversation.id },
        data: { updatedAt: new Date() },
      })

      return { success: true, conversationId: existingConversation.id }
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        type: "DIRECT",
        participants: {
          create: [
            { userId: user.id },
            { userId: recipientId },
          ],
        },
        messages: {
          create: {
            content: content.trim(),
            authorId: user.id,
          },
        },
      },
    })

    return { success: true, conversationId: conversation.id }
  } catch (error) {
    console.error("Failed to start conversation:", error)
    return { error: "Failed to start conversation" }
  }
}

export async function sendMessage(conversationId: string, content: string) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await getUserByLogtoId(claims.sub)
  if (!user) {
    return { error: "User not found" }
  }

  if (!content || content.trim().length < 1) {
    return { error: "Message content is required" }
  }

  // Verify user is a participant
  const participant = await db.conversationParticipant.findUnique({
    where: {
      userId_conversationId: {
        userId: user.id,
        conversationId,
      },
    },
  })

  if (!participant) {
    return { error: "Not a participant in this conversation" }
  }

  try {
    const message = await db.message.create({
      data: {
        content: content.trim(),
        authorId: user.id,
        conversationId,
      },
    })

    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    return { success: true, message }
  } catch (error) {
    console.error("Failed to send message:", error)
    return { error: "Failed to send message" }
  }
}

export async function getConversations() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated", conversations: [] }
  }

  const user = await getUserByLogtoId(claims.sub)
  if (!user) {
    return { error: "User not found", conversations: [] }
  }

  const conversations = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: {
      conversation: {
        updatedAt: "desc",
      },
    },
  })

  return { conversations: conversations.map((c) => c.conversation) }
}
