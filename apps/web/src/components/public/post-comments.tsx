"use client"

import { useState, useTransition } from "react"
import { Send, CornerDownRight, Trash2 } from "lucide-react"
import { createPublicComment, deletePublicComment } from "@/app/actions/public-community"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"

interface Comment {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    avatar: string | null
  }
  replies?: Comment[]
}

interface Props {
  postId: string
  comments: Comment[]
  currentUserId: string | undefined
  canModerate: boolean
  organizationOwnerId: string
}

export function PostComments({
  postId,
  comments,
  currentUserId,
  canModerate,
  organizationOwnerId,
}: Props) {
  const [showComments, setShowComments] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleSubmitComment = () => {
    if (!newComment.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set("postId", postId)
      formData.set("content", newComment)

      const result = await createPublicComment(formData)
      if (result.success) {
        setNewComment("")
        router.refresh()
      }
    })
  }

  const handleSubmitReply = (parentId: string) => {
    if (!replyContent.trim()) return

    startTransition(async () => {
      const formData = new FormData()
      formData.set("postId", postId)
      formData.set("content", replyContent)
      formData.set("parentId", parentId)

      const result = await createPublicComment(formData)
      if (result.success) {
        setReplyContent("")
        setReplyingTo(null)
        router.refresh()
      }
    })
  }

  const handleDeleteComment = (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    startTransition(async () => {
      const result = await deletePublicComment(commentId)
      if (result.success) {
        router.refresh()
      }
    })
  }

  const canDeleteComment = (authorId: string) => {
    return canModerate || authorId === currentUserId
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div
      key={comment.id}
      className={`flex gap-3 ${isReply ? "pl-10 mt-3" : "mt-4"}`}
    >
      {comment.author.avatar ? (
        <img
          src={comment.author.avatar}
          alt={comment.author.name || "User"}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-8 h-8 bg-sola-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sola-gold text-xs">
            {(comment.author.name || "U")[0].toUpperCase()}
          </span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">
            {comment.author.name || "Anonymous"}
          </span>
          {comment.author.id === organizationOwnerId && (
            <span className="bg-sola-gold/20 text-sola-gold text-[10px] px-1.5 py-0.5 uppercase tracking-wide">
              Creator
            </span>
          )}
          <span className="text-white/30 text-xs">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-white/70 text-sm mt-1">{comment.content}</p>

        <div className="flex items-center gap-3 mt-2">
          {currentUserId && !isReply && (
            <button
              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
              className="text-xs text-white/40 hover:text-sola-gold transition-colors"
            >
              Reply
            </button>
          )}
          {canDeleteComment(comment.author.id) && (
            <button
              onClick={() => handleDeleteComment(comment.id)}
              className="text-xs text-white/40 hover:text-sola-red transition-colors"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Reply Input */}
        {replyingTo === comment.id && (
          <div className="flex gap-2 mt-3">
            <CornerDownRight className="h-4 w-4 text-white/30 mt-2" />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitReply(comment.id)}
                placeholder="Write a reply..."
                className="flex-1 bg-white/5 border border-white/10 px-3 py-2 text-white text-sm placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
              />
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={isPending || !replyContent.trim()}
                className="px-3 bg-sola-gold text-sola-black disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Nested Replies */}
        {comment.replies?.map((reply) => renderComment(reply, true))}
      </div>
    </div>
  )

  return (
    <div className="mt-4">
      {/* Toggle Comments */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-xs text-white/40 hover:text-white transition-colors"
      >
        {showComments ? "Hide comments" : `View ${comments.length} comment${comments.length !== 1 ? "s" : ""}`}
      </button>

      {showComments && (
        <div className="mt-4 border-t border-white/5 pt-4">
          {/* Comment Input */}
          {currentUserId && (
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitComment()}
                placeholder="Write a comment..."
                className="flex-1 bg-white/5 border border-white/10 px-4 py-2 text-white text-sm placeholder:text-white/30 focus:border-sola-gold focus:outline-none"
              />
              <button
                onClick={handleSubmitComment}
                disabled={isPending || !newComment.trim()}
                className="px-4 bg-sola-gold text-sola-black disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-white/30 text-sm mt-4">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-0">
              {comments.map((comment) => renderComment(comment))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
