"use client"

import { useState, useTransition } from "react"
import { Send, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface MessageInputProps {
  conversationId: string
  primaryColor: string
}

export function MessageInput({ conversationId, primaryColor }: MessageInputProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isPending) return

    startTransition(async () => {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            content: content.trim(),
          }),
        })

        if (res.ok) {
          setContent("")
          router.refresh()
        }
      } catch (error) {
        console.error("Failed to send message:", error)
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
      <div className="flex items-end gap-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 resize-none focus:outline-none focus:border-white/30"
          style={{ minHeight: "48px", maxHeight: "120px" }}
        />
        <button
          type="submit"
          disabled={!content.trim() || isPending}
          className="flex items-center justify-center w-12 h-12 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ backgroundColor: primaryColor, color: "#000" }}
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
    </form>
  )
}
