import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()

    if (!member) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { conversationId, content } = await request.json()

    if (!conversationId || !content) {
      return NextResponse.json(
        { error: "Conversation ID and content are required" },
        { status: 400 }
      )
    }

    // Verify member is participant
    const participation = await db.conversationParticipant.findFirst({
      where: {
        userId: member.id,
        conversationId,
      },
    })

    if (!participation) {
      return NextResponse.json({ error: "Not a participant" }, { status: 403 })
    }

    // Create message
    const message = await db.message.create({
      data: {
        conversationId,
        authorId: member.id,
        content,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    // Update conversation timestamp
    await db.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    })

    // Update sender's last read
    await db.conversationParticipant.update({
      where: { id: participation.id },
      data: { lastReadAt: new Date() },
    })

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Failed to send message:", error)
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
