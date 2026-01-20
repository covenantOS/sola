"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Send, Image, Loader2 } from "lucide-react"

interface PostComposerProps {
  memberId: string
  memberName: string
  memberAvatar: string | null
  channels: { id: string; name: string }[]
  defaultChannelId: string
  primaryColor: string
}

export function PostComposer({
  memberId,
  memberName,
  memberAvatar,
  channels,
  defaultChannelId,
  primaryColor,
}: PostComposerProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [channelId, setChannelId] = useState(defaultChannelId)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          channelId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to create post")
      }

      setContent("")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4">
          {/* Avatar */}
          {memberAvatar ? (
            <img
              src={memberAvatar}
              alt={memberName}
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {memberName.charAt(0)}
            </div>
          )}

          {/* Input area */}
          <div className="flex-1 space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share something with the community..."
              rows={3}
              className="w-full bg-transparent border-0 text-white placeholder:text-white/40 focus:outline-none resize-none"
            />

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/10">
              <div className="flex items-center gap-3">
                {/* Channel selector */}
                {channels.length > 1 && (
                  <select
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    className="bg-white/5 border border-white/20 text-white text-sm px-3 py-1.5 focus:outline-none focus:border-white/40"
                  >
                    {channels.map((ch) => (
                      <option key={ch.id} value={ch.id} className="bg-gray-900">
                        # {ch.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <button
                type="submit"
                disabled={!content.trim() || isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-display uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{
                  backgroundColor: content.trim() ? primaryColor : "rgba(255,255,255,0.1)",
                  color: content.trim() ? "#000" : "rgba(255,255,255,0.4)",
                }}
              >
                {isSubmitting ? (
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
    </div>
  )
}
