"use client"

import { useState, useTransition } from "react"
import { Heart, MessageSquare, Pin, Trash2, MoreHorizontal } from "lucide-react"
import { togglePublicReaction, deletePublicPost, pinPost } from "@/app/actions/public-community"
import { useRouter } from "next/navigation"

interface Props {
  postId: string
  reactionCount: number
  commentCount: number
  userReactions: string[]
  canDelete: boolean
  canPin: boolean
  isPinned: boolean
  slug: string
}

const EMOJI_OPTIONS = ["❤️", "🙏", "🔥", "👏", "💯", "😂"]

export function PostReactions({
  postId,
  reactionCount,
  commentCount,
  userReactions,
  canDelete,
  canPin,
  isPinned,
  slug,
}: Props) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [reactions, setReactions] = useState(userReactions)
  const [count, setCount] = useState(reactionCount)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleReaction = (emoji: string) => {
    setShowEmojiPicker(false)
    startTransition(async () => {
      const result = await togglePublicReaction(postId, emoji)
      if (result.success) {
        if (result.added) {
          setReactions([...reactions, emoji])
          setCount(count + 1)
        } else {
          setReactions(reactions.filter((r) => r !== emoji))
          setCount(Math.max(0, count - 1))
        }
      }
    })
  }

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this post?")) return
    setShowMenu(false)
    startTransition(async () => {
      const result = await deletePublicPost(postId, slug)
      if (result.success) {
        router.refresh()
      }
    })
  }

  const handlePin = () => {
    setShowMenu(false)
    startTransition(async () => {
      const result = await pinPost(postId, slug)
      if (result.success) {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex items-center gap-4 mt-3 relative">
      {/* Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className={`flex items-center gap-1 text-xs transition-colors ${
            reactions.length > 0
              ? "text-sola-red"
              : "text-white/40 hover:text-sola-red"
          }`}
          disabled={isPending}
        >
          <Heart className={`h-4 w-4 ${reactions.length > 0 ? "fill-current" : ""}`} />
          {count > 0 && count}
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowEmojiPicker(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 bg-sola-dark-navy border border-white/10 p-2 flex gap-1 z-50">
              {EMOJI_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className={`p-2 hover:bg-white/10 rounded transition-colors ${
                    reactions.includes(emoji) ? "bg-sola-gold/20" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Comment Button */}
      <button className="flex items-center gap-1 text-xs text-white/40 hover:text-sola-gold transition-colors">
        <MessageSquare className="h-4 w-4" />
        {commentCount > 0 && commentCount}
      </button>

      {/* Pin indicator */}
      {isPinned && (
        <span className="flex items-center gap-1 text-xs text-sola-gold">
          <Pin className="h-3 w-3" />
          Pinned
        </span>
      )}

      {/* Actions Menu */}
      {(canDelete || canPin) && (
        <div className="relative ml-auto">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-white/30 hover:text-white transition-colors"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-full mt-1 bg-sola-dark-navy border border-white/10 py-1 z-50 min-w-[150px]">
                {canPin && (
                  <button
                    onClick={handlePin}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors"
                  >
                    <Pin className="h-4 w-4" />
                    {isPinned ? "Unpin" : "Pin"} post
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-sola-red hover:bg-sola-red/10 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete post
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
