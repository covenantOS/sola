"use client"

import { useState } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Heart, MessageSquare, MoreHorizontal, Hash } from "lucide-react"

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
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post._count.reactions)

  const handleLike = async () => {
    // Optimistic update
    setIsLiked(!isLiked)
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1)

    try {
      await fetch(`/api/posts/${post.id}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "LIKE" }),
      })
    } catch {
      // Revert on error
      setIsLiked(isLiked)
      setLikeCount(post._count.reactions)
    }
  }

  return (
    <div className="bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          {post.author.avatar ? (
            <img
              src={post.author.avatar}
              alt={post.author.name || ""}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white"
              style={{ backgroundColor: primaryColor }}
            >
              {post.author.name?.charAt(0) || "?"}
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
                    className="flex items-center gap-1 hover:text-white/60"
                  >
                    <Hash className="h-3 w-3" />
                    {post.channel.name}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-white/90 whitespace-pre-wrap">{post.content}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 px-4 pb-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 text-sm transition-colors ${
            isLiked ? "" : "text-white/40 hover:text-white/60"
          }`}
          style={{ color: isLiked ? primaryColor : undefined }}
        >
          <Heart className={`h-5 w-5 ${isLiked ? "fill-current" : ""}`} />
          <span>{likeCount}</span>
        </button>

        <Link
          href={`/member/community/${post.channel?.slug || "general"}?post=${post.id}`}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors"
        >
          <MessageSquare className="h-5 w-5" />
          <span>{post._count.comments}</span>
        </Link>
      </div>
    </div>
  )
}
