"use client"

import { useState, useTransition } from "react"
import { Send, Users } from "lucide-react"
import { createPublicPost } from "@/app/actions/public-community"
import { useRouter } from "next/navigation"

interface Props {
  channelId: string
  userAvatar?: string
  userName?: string
  slug: string
}

export function CommunityPostComposer({ channelId, userAvatar, userName, slug }: Props) {
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmit = () => {
    if (!content.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set("channelId", channelId)
      formData.set("content", content)

      const result = await createPublicPost(formData)
      if (result.success) {
        setContent("")
        router.refresh()
      }
    })
  }

  return (
    <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
      <div className="flex gap-4">
        {userAvatar ? (
          <img
            src={userAvatar}
            alt={userName || "User"}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5 text-sola-gold" />
          </div>
        )}
        <div className="flex-1">
          <textarea
            placeholder="Share something with the community..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSubmit}
              disabled={isPending || !content.trim()}
              className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
            >
              <Send className="h-3 w-3" />
              {isPending ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
