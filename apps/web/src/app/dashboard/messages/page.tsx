export const dynamic = "force-dynamic"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization, getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { MessageSquare, User, Send } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DashboardMessagesClient } from "@/components/dashboard/dashboard-messages-client"

interface PageProps {
  searchParams: Promise<{ conversation?: string }>
}

export default async function DashboardMessagesPage({ searchParams }: PageProps) {
  const params = await searchParams
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated) {
    redirect("/")
  }

  const user = await getUserByLogtoId(claims?.sub || "")
  if (!user) {
    redirect("/")
  }

  const { organization } = await getUserWithOrganization(claims?.sub || "")
  if (!organization) {
    redirect("/dashboard")
  }

  // Get all conversations for the creator
  const conversations = await db.conversationParticipant.findMany({
    where: { userId: user.id },
    include: {
      conversation: {
        include: {
          participants: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
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

  // Get current conversation messages
  let currentConversation = null
  let messages: any[] = []
  if (params.conversation) {
    const participant = conversations.find(
      (p) => p.conversationId === params.conversation
    )
    if (participant) {
      currentConversation = participant.conversation
      messages = await db.message.findMany({
        where: { conversationId: params.conversation },
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            select: { id: true, name: true, avatar: true },
          },
        },
      })
    }
  }

  return (
    <div className="h-[calc(100vh-120px)] flex -mx-6 -my-6">
      {/* Conversation List */}
      <div className="w-80 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Messages
          </h2>
          <p className="text-white/50 text-sm mt-1">
            {conversations.length} conversation{conversations.length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-6 text-center">
              <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-2" />
              <p className="text-white/40 text-sm">No messages yet</p>
              <p className="text-white/30 text-xs mt-1">
                Messages from members will appear here
              </p>
            </div>
          ) : (
            conversations.map((participant) => {
              const conv = participant.conversation
              const otherParticipant = conv.participants.find(
                (p) => p.userId !== user.id
              )
              const lastMessage = conv.messages[0]
              const isSelected = params.conversation === conv.id

              return (
                <a
                  key={conv.id}
                  href={`/dashboard/messages?conversation=${conv.id}`}
                  className={`block p-4 border-b border-white/5 transition-colors ${
                    isSelected ? "bg-sola-gold/10" : "hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {otherParticipant?.user.avatar ? (
                      <img
                        src={otherParticipant.user.avatar}
                        alt={otherParticipant.user.name || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-sola-gold" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-sm text-white uppercase tracking-wide truncate">
                          {otherParticipant?.user.name || otherParticipant?.user.email || "User"}
                        </span>
                        {lastMessage && (
                          <span className="text-xs text-white/30">
                            {formatDistanceToNow(new Date(lastMessage.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-white/50 text-sm truncate mt-1">
                          {lastMessage.authorId === user.id && "You: "}
                          {lastMessage.content}
                        </p>
                      )}
                    </div>
                  </div>
                </a>
              )
            })
          )}
        </div>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-white/10">
              {(() => {
                const otherParticipant = currentConversation.participants.find(
                  (p) => p.userId !== user.id
                )
                return (
                  <div className="flex items-center gap-3">
                    {otherParticipant?.user.avatar ? (
                      <img
                        src={otherParticipant.user.avatar}
                        alt={otherParticipant.user.name || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-sola-gold" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-display text-white uppercase tracking-wide">
                        {otherParticipant?.user.name || otherParticipant?.user.email || "User"}
                      </h3>
                      {otherParticipant?.user.email && otherParticipant?.user.name && (
                        <p className="text-white/50 text-sm">{otherParticipant.user.email}</p>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => {
                const isOwn = message.authorId === user.id

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}
                  >
                    {!isOwn && (
                      message.author.avatar ? (
                        <img
                          src={message.author.avatar}
                          alt={message.author.name || "User"}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-sola-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sola-gold text-xs">
                            {(message.author.name || "U")[0].toUpperCase()}
                          </span>
                        </div>
                      )
                    )}
                    <div
                      className={`max-w-[70%] ${
                        isOwn ? "bg-sola-gold/20" : "bg-white/5"
                      } px-4 py-2`}
                    >
                      <p className="text-white/80">{message.content}</p>
                      <p className="text-xs text-white/30 mt-1">
                        {formatDistanceToNow(new Date(message.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reply Input */}
            <DashboardMessagesClient conversationId={currentConversation.id} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <MessageSquare className="h-16 w-16 text-white/10 mb-4" />
            <p className="text-white/40">Select a conversation to view messages</p>
          </div>
        )}
      </div>
    </div>
  )
}
