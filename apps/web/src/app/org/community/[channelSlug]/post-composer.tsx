"use client"

import { useState, useTransition } from "react"
import { Send, Image, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface PostComposerProps {
  channelId: string
  channelType: string
  memberAvatar: string | null
  memberName: string | null
  primaryColor: string
}

export function PostComposer({
  channelId,
  channelType,
  memberAvatar,
  memberName,
  primaryColor,
}: PostComposerProps) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isPending) return

    startTransition(async () => {
      try {
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            channelId,
            content: content.trim(),
          }),
        })

        if (res.ok) {
          setContent("")
          router.refresh()
        }
      } catch (error) {
        console.error("Failed to create post:", error)
      }
    })
  }

  const placeholder =
    channelType === "ANNOUNCEMENTS"
      ? "Share an announcement..."
      : channelType === "EVENTS"
        ? "Share an event..."
        : channelType === "RESOURCES"
          ? "Share a resource..."
          : "What's on your mind?"

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 p-4 mb-6">
      <div className="flex gap-4">
        {memberAvatar ? (
          <img
            src={memberAvatar}
            alt={memberName || ""}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display flex-shrink-0"
            style={{ backgroundColor: primaryColor }}
          >
            {(memberName || "?")[0].toUpperCase()}
          </div>
        )}
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={3}
            className="w-full bg-transparent text-white placeholder-white/40 resize-none focus:outline-none"
          />
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
            <button
              type="button"
              className="text-white/40 hover:text-white transition-colors"
              title="Add image (coming soon)"
            >
              <Image className="h-5 w-5" />
            </button>
            <button
              type="submit"
              disabled={!content.trim() || isPending}
              className="flex items-center gap-2 font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ backgroundColor: primaryColor, color: "#000" }}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Post
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
