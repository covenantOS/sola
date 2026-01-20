"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageSquare, Share2, Bookmark, Hash, MoreHorizontal, ChevronDown, Send } from "lucide-react"

const REACTION_EMOJIS = ["❤️", "🙏", "🔥", "👏", "💯"]

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    avatar: string | null
  }
}

interface Reaction {
  emoji: string
  userId: string
}

interface Post {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    avatar: string | null
  }
  channel: {
    id: string
    name: string
    slug: string
  } | null
  reactions: Reaction[]
  comments: Comment[]
  _count: {
    comments: number
    reactions: number
  }
}

interface PostFeedProps {
  posts: Post[]
  primaryColor: string
  currentUserId: string
}

export function PostFeed({ posts, primaryColor, currentUserId }: PostFeedProps) {
  if (posts.length === 0) {
    return (
      <div className="bg-white/5 border border-white/10 p-12 text-center">
        <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
        <h3 className="font-display text-white uppercase tracking-wide mb-2">
          No posts yet
        </h3>
        <p className="text-white/40 text-sm">
          Be the first to share something with the community!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          primaryColor={primaryColor}
          currentUserId={currentUserId}
        />
      ))}
    </div>
  )
}

function PostCard({
  post,
  primaryColor,
  currentUserId,
}: {
  post: Post
  primaryColor: string
  currentUserId: string
}) {
  // Group reactions by emoji
  const reactionGroups = post.reactions.reduce((acc, reaction) => {
    acc[reaction.emoji] = acc[reaction.emoji] || { count: 0, hasUserReacted: false }
    acc[reaction.emoji].count++
    if (reaction.userId === currentUserId) {
      acc[reaction.emoji].hasUserReacted = true
    }
    return acc
  }, {} as Record<string, { count: number; hasUserReacted: boolean }>)

  const [reactions, setReactions] = useState(reactionGroups)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localComments, setLocalComments] = useState(post.comments)

  const totalReactions = Object.values(reactions).reduce((sum, r) => sum + r.count, 0)

  const handleReact = async (emoji: string) => {
    const hasReacted = reactions[emoji]?.hasUserReacted

    // Optimistic update
    setReactions((prev) => {
      const newReactions = { ...prev }
      if (hasReacted) {
        if (newReactions[emoji]) {
          newReactions[emoji].count--
          newReactions[emoji].hasUserReacted = false
          if (newReactions[emoji].count === 0) {
            delete newReactions[emoji]
          }
        }
      } else {
        if (!newReactions[emoji]) {
          newReactions[emoji] = { count: 0, hasUserReacted: false }
        }
        newReactions[emoji].count++
        newReactions[emoji].hasUserReacted = true
      }
      return newReactions
    })

    setShowReactionPicker(false)

    try {
      await fetch(`/api/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      })
    } catch {
      // Revert on error
      setReactions(reactionGroups)
    }
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText }),
      })

      if (response.ok) {
        const newComment = await response.json()
        setLocalComments((prev) => [newComment, ...prev])
        setCommentText("")
      }
    } catch (error) {
      console.error("Failed to post comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const hasUserReactedWithHeart = reactions["❤️"]?.hasUserReacted

  return (
    <div className="bg-white/5 border border-white/10 hover:border-white/20 transition-all duration-200 group">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.name || ""}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium text-black"
              style={{ backgroundColor: primaryColor }}
            >
              {post.author.name?.charAt(0).toUpperCase() || "?"}
            </div>
          )}
          <div>
            <p className="text-white font-medium">{post.author.name || "Anonymous"}</p>
            <div className="flex items-center gap-2 text-white/40 text-xs">
              <span>
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </span>
              {post.channel && (
                <>
                  <span>•</span>
                  <Link
                    href={`/member/community/${post.channel.slug}`}
                    className="flex items-center gap-1 hover:text-white/60 transition-colors"
                  >
                    <Hash className="h-3 w-3" />
                    {post.channel.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        <button className="text-white/30 hover:text-white/60 transition-colors p-2 opacity-0 group-hover:opacity-100">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 pb-4">
        <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
      </div>

      {/* Reaction Bar - shown when there are reactions */}
      {totalReactions > 0 && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <div className="flex -space-x-1">
            {Object.keys(reactions).slice(0, 3).map((emoji) => (
              <span
                key={emoji}
                className="text-sm bg-white/10 rounded-full w-6 h-6 flex items-center justify-center"
              >
                {emoji}
              </span>
            ))}
          </div>
          <span className="text-white/40 text-sm">
            {totalReactions} {totalReactions === 1 ? "reaction" : "reactions"}
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
        <div className="flex items-center gap-1">
          {/* Quick React (Heart) */}
          <button
            onClick={() => handleReact("❤️")}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              hasUserReactedWithHeart
                ? "text-red-400"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <Heart
              className={`h-5 w-5 transition-transform duration-200 ${
                hasUserReactedWithHeart ? "fill-current scale-110" : "hover:scale-110"
              }`}
            />
            <span>{reactions["❤️"]?.count || ""}</span>
          </button>

          {/* More Reactions */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-2 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all duration-200"
            >
              <ChevronDown className="h-4 w-4" />
            </button>

            {showReactionPicker && (
              <div className="absolute left-0 bottom-full mb-2 bg-[#1a1a1a] border border-white/20 rounded-lg p-2 flex gap-1 shadow-xl z-10">
                {REACTION_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`p-2 rounded-lg hover:bg-white/10 transition-all duration-150 text-lg hover:scale-125 ${
                      reactions[emoji]?.hasUserReacted ? "bg-white/10" : ""
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Comments */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
              showComments
                ? "text-white bg-white/10"
                : "text-white/50 hover:text-white/80 hover:bg-white/5"
            }`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>{post._count.comments || ""}</span>
          </button>

          {/* Share */}
          <button className="p-2 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all duration-200">
            <Share2 className="h-5 w-5" />
          </button>

          {/* Bookmark */}
          <button className="p-2 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-all duration-200">
            <Bookmark className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="border-t border-white/5 p-4 space-y-4">
          {/* Comment Input */}
          <form onSubmit={handleComment} className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-black shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              You
            </div>
            <div className="flex-1 relative">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmitting}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 disabled:opacity-30"
                style={{ color: primaryColor }}
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Recent Comments */}
          {localComments.length > 0 && (
            <div className="space-y-3 pt-2">
              {localComments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  {comment.author.avatar ? (
                    <img
                      src={comment.author.avatar}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-black shrink-0"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {comment.author.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/5 rounded-lg px-3 py-2">
                      <p className="text-white text-sm font-medium">
                        {comment.author.name || "Anonymous"}
                      </p>
                      <p className="text-white/70 text-sm">{comment.content}</p>
                    </div>
                    <p className="text-white/30 text-xs mt-1">
                      {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}

              {post._count.comments > localComments.length && (
                <Link
                  href={`/member/community/${post.channel?.slug || "general"}?post=${post.id}`}
                  className="text-sm hover:underline transition-colors block"
                  style={{ color: primaryColor }}
                >
                  View all {post._count.comments} comments
                </Link>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
