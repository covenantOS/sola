import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Send, MoreVertical } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { MessageInput } from "./message-input"

export const dynamic = "force-dynamic"

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!org) {
    return <div>Organization not found</div>
  }

  if (!member) {
    redirect(`/login?redirect=/member/messages/${id}`)
  }

  // Get membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
  })

  if (!membership) {
    redirect(`/signup?redirect=/member/messages/${id}`)
  }

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Verify member is participant in this conversation
  const participation = await db.conversationParticipant.findFirst({
    where: {
      userId: member.id,
      conversationId: id,
    },
  })

  if (!participation) {
    notFound()
  }

  // Get conversation with messages
  const conversation = await db.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
      },
      messages: {
        where: { isDeleted: false },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
      },
    },
  })

  if (!conversation) {
    notFound()
  }

  // Update last read
  await db.conversationParticipant.update({
    where: { id: participation.id },
    data: { lastReadAt: new Date() },
  })

  // Get other participants for header
  const otherParticipants = conversation.participants.filter(
    (p) => p.userId !== member.id
  )

  const displayName =
    conversation.type === "GROUP"
      ? conversation.name || "Group Chat"
      : otherParticipants[0]?.user.name || "Unknown"

  const avatar = otherParticipants[0]?.user.avatar

  return (
    <div className="h-[calc(100vh-80px)] flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-white/10">
        <Link
          href="/member/messages"
          className="text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>

        {avatar ? (
          <img
            src={avatar}
            alt={displayName}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display"
            style={{ backgroundColor: primaryColor }}
          >
            {displayName[0]?.toUpperCase() || "?"}
          </div>
        )}

        <div className="flex-1">
          <h1 className="font-display text-lg text-white uppercase tracking-wide">
            {displayName}
          </h1>
          {conversation.type === "GROUP" && (
            <p className="text-white/40 text-sm">
              {conversation.participants.length} members
            </p>
          )}
        </div>

        <button className="text-white/40 hover:text-white transition-colors">
          <MoreVertical className="h-5 w-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversation.messages.map((message, idx) => {
          const isOwn = message.authorId === member.id
          const showAvatar =
            idx === 0 ||
            conversation.messages[idx - 1].authorId !== message.authorId

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              {!isOwn && (
                <div className="w-8 flex-shrink-0">
                  {showAvatar && (
                    <>
                      {message.author.avatar ? (
                        <img
                          src={message.author.avatar}
                          alt={message.author.name || ""}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-display"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {(message.author.name || "?")[0].toUpperCase()}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Message bubble */}
              <div
                className={`max-w-[70%] ${
                  isOwn
                    ? "rounded-l-lg rounded-tr-lg"
                    : "rounded-r-lg rounded-tl-lg"
                } px-4 py-2 ${
                  isOwn ? "bg-white/20" : "bg-white/5"
                }`}
                style={isOwn ? { backgroundColor: `${primaryColor}30` } : {}}
              >
                {!isOwn && showAvatar && conversation.type === "GROUP" && (
                  <p className="text-xs font-medium mb-1" style={{ color: primaryColor }}>
                    {message.author.name}
                  </p>
                )}
                <p className="text-white/90 whitespace-pre-wrap">{message.content}</p>
                <p className="text-white/30 text-xs mt-1">
                  {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                  {message.isEdited && " (edited)"}
                </p>
              </div>
            </div>
          )
        })}

        {conversation.messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-white/40">No messages yet. Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Input */}
      <MessageInput conversationId={id} primaryColor={primaryColor} />
    </div>
  )
}
