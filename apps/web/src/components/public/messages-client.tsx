"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Send, User, MessageSquare } from "lucide-react"
import { sendMessage, startConversation } from "@/app/actions/messages"

interface Props {
  userId: string
  creatorId: string
  creatorName: string
  creatorAvatar?: string
  slug: string
  existingConversationId?: string
  isInThread?: boolean
}

export function MessagesClient({
  userId,
  creatorId,
  creatorName,
  creatorAvatar,
  slug,
  existingConversationId,
  isInThread,
}: Props) {
  const [message, setMessage] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSend = () => {
    if (!message.trim()) return

    startTransition(async () => {
      if (existingConversationId) {
        // Send message to existing conversation
        const result = await sendMessage(existingConversationId, message)
        if (result.success) {
          setMessage("")
          router.refresh()
        }
      } else {
        // Start new conversation
        const result = await startConversation(creatorId, message)
        if (result.success && result.conversationId) {
          setMessage("")
          router.push(`/${slug}/messages?conversation=${result.conversationId}`)
        }
      }
    })
  }

  if (isInThread) {
    // Inline message input for thread view
    return (
      <div className="p-4 border-t border-white/10">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={isPending || !message.trim()}
            className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    )
  }

  // New conversation button
  return (
    <button
      onClick={() => {
        if (existingConversationId) {
          router.push(`/${slug}/messages?conversation=${existingConversationId}`)
        } else {
          // Show a modal or inline form to start conversation
          // For simplicity, we'll prompt here
          const content = prompt(`Send a message to ${creatorName}:`)
          if (content) {
            setMessage(content)
            handleSend()
          }
        }
      }}
      disabled={isPending}
      className="w-full flex items-center gap-3 p-3 bg-sola-gold/10 hover:bg-sola-gold/20 border border-sola-gold/30 transition-colors"
    >
      {creatorAvatar ? (
        <img
          src={creatorAvatar}
          alt={creatorName}
          className="w-10 h-10 rounded-full object-cover"
        />
      ) : (
        <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center">
          <User className="h-5 w-5 text-sola-gold" />
        </div>
      )}
      <div className="flex-1 text-left">
        <span className="block font-display text-sm text-white uppercase tracking-wide">
          {creatorName}
        </span>
        <span className="text-xs text-white/50">
          {existingConversationId ? "Continue conversation" : "Start conversation"}
        </span>
      </div>
      <MessageSquare className="h-5 w-5 text-sola-gold" />
    </button>
  )
}
