import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { MessageSquare, ArrowLeft, Search, Plus } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

export default async function MessagesPage() {
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!org) {
    return <div>Organization not found</div>
  }

  if (!member) {
    redirect("/login?redirect=/member/messages")
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
    redirect("/signup?redirect=/member/messages")
  }

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get user's conversations
  const participations = await db.conversationParticipant.findMany({
    where: { userId: member.id },
    include: {
      conversation: {
        include: {
          participants: {
            where: { userId: { not: member.id } },
            include: {
              user: {
                select: { id: true, name: true, avatar: true },
              },
            },
            take: 3,
          },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: {
              author: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
    orderBy: {
      conversation: { updatedAt: "desc" },
    },
  })

  const conversations = participations.map((p) => ({
    ...p.conversation,
    lastReadAt: p.lastReadAt,
    isMuted: p.isMuted,
  }))

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/member"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              <MessageSquare className="h-6 w-6" style={{ color: primaryColor }} />
            </div>
            <div>
              <h1 className="font-display text-2xl text-white uppercase tracking-tight">
                Messages
              </h1>
              <p className="text-white/60 mt-1">Your private conversations</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs"
            style={{ backgroundColor: primaryColor, color: "#000" }}
          >
            <Plus className="h-4 w-4" />
            New Message
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-white/5 border border-white/10 py-3 pl-11 pr-4 text-white placeholder-white/40 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Conversations List */}
      {conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conversation) => {
            const otherParticipants = conversation.participants
            const lastMessage = conversation.messages[0]
            const isUnread =
              lastMessage &&
              conversation.lastReadAt &&
              new Date(lastMessage.createdAt) > new Date(conversation.lastReadAt)

            // Get display name for conversation
            const displayName =
              conversation.type === "GROUP"
                ? conversation.name || "Group Chat"
                : otherParticipants[0]?.user.name || "Unknown"

            // Get avatar(s)
            const avatar = otherParticipants[0]?.user.avatar

            return (
              <Link
                key={conversation.id}
                href={`/member/messages/${conversation.id}`}
                className={`flex items-center gap-4 p-4 transition-colors ${
                  isUnread
                    ? "bg-white/10 border border-white/20"
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                }`}
              >
                {/* Avatar */}
                {avatar ? (
                  <img
                    src={avatar}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-display flex-shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {displayName[0]?.toUpperCase() || "?"}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-medium truncate ${isUnread ? "text-white" : "text-white/80"}`}>
                      {displayName}
                      {conversation.type === "GROUP" && otherParticipants.length > 1 && (
                        <span className="text-white/40 text-sm ml-2">
                          +{otherParticipants.length - 1}
                        </span>
                      )}
                    </h3>
                    {lastMessage && (
                      <span className="text-white/40 text-xs">
                        {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className={`text-sm truncate mt-1 ${isUnread ? "text-white/70" : "text-white/50"}`}>
                      {lastMessage.author.id === member.id ? "You: " : ""}
                      {lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread indicator */}
                {isUnread && (
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: primaryColor }}
                  />
                )}
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No conversations yet.</p>
          <p className="text-white/40 text-sm mt-2">Start a conversation with other members!</p>
        </div>
      )}
    </div>
  )
}
