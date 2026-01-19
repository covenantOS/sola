"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Hash,
  Megaphone,
  Calendar,
  BookOpen,
  Plus,
  MessageSquare,
  Heart,
  MoreVertical,
  Send,
  Trash2,
  Users
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { getChannels, createChannel, deleteChannel, getPosts, createPost, deletePost, toggleReaction } from "@/app/actions/community"

type Channel = {
  id: string
  name: string
  slug: string
  description: string | null
  type: "DISCUSSION" | "ANNOUNCEMENTS" | "EVENTS" | "RESOURCES"
  isPublic: boolean
  position: number
  _count: {
    posts: number
  }
}

type Post = {
  id: string
  content: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    avatar: string | null
  }
  _count: {
    comments: number
    reactions: number
  }
  reactions: { emoji: string }[]
}

const channelIcons = {
  DISCUSSION: Hash,
  ANNOUNCEMENTS: Megaphone,
  EVENTS: Calendar,
  RESOURCES: BookOpen,
}

export default function CommunityPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(false)
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState("")
  const [newChannelType, setNewChannelType] = useState<string>("DISCUSSION")
  const [newPostContent, setNewPostContent] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Load channels on mount
  useEffect(() => {
    async function loadChannels() {
      const result = await getChannels()
      if (result.channels) {
        setChannels(result.channels as Channel[])
        if (result.channels.length > 0 && !selectedChannel) {
          setSelectedChannel(result.channels[0] as Channel)
        }
      }
      setLoading(false)
    }
    loadChannels()
  }, [])

  // Load posts when channel changes
  useEffect(() => {
    async function loadPosts() {
      if (!selectedChannel) return
      setPostsLoading(true)
      const result = await getPosts(selectedChannel.id)
      if (result.posts) {
        setPosts(result.posts as Post[])
      }
      setPostsLoading(false)
    }
    loadPosts()
  }, [selectedChannel])

  const handleCreateChannel = useCallback(async () => {
    if (!newChannelName.trim()) return
    setSubmitting(true)

    const formData = new FormData()
    formData.set("name", newChannelName)
    formData.set("type", newChannelType)

    const result = await createChannel(formData)
    if (result.success && result.channel) {
      setChannels(prev => [...prev, { ...result.channel, _count: { posts: 0 } } as Channel])
      setNewChannelName("")
      setShowNewChannel(false)
    }
    setSubmitting(false)
  }, [newChannelName, newChannelType])

  const handleDeleteChannel = useCallback(async (channelId: string) => {
    if (!confirm("Are you sure you want to delete this channel?")) return

    const result = await deleteChannel(channelId)
    if (result.success) {
      setChannels(prev => prev.filter(c => c.id !== channelId))
      if (selectedChannel?.id === channelId) {
        setSelectedChannel(channels[0] || null)
      }
    }
  }, [selectedChannel, channels])

  const handleCreatePost = useCallback(async () => {
    if (!newPostContent.trim() || !selectedChannel) return
    setSubmitting(true)

    const formData = new FormData()
    formData.set("channelId", selectedChannel.id)
    formData.set("content", newPostContent)

    const result = await createPost(formData)
    if (result.success && result.post) {
      setPosts(prev => [{ ...result.post, _count: { comments: 0, reactions: 0 }, reactions: [] } as Post, ...prev])
      setNewPostContent("")
    }
    setSubmitting(false)
  }, [newPostContent, selectedChannel])

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return

    const result = await deletePost(postId)
    if (result.success) {
      setPosts(prev => prev.filter(p => p.id !== postId))
    }
  }, [])

  const handleReaction = useCallback(async (postId: string, emoji: string) => {
    const result = await toggleReaction(postId, null, emoji)
    if (result.success) {
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p
        const hasReaction = p.reactions.some(r => r.emoji === emoji)
        return {
          ...p,
          reactions: hasReaction
            ? p.reactions.filter(r => r.emoji !== emoji)
            : [...p.reactions, { emoji }],
          _count: {
            ...p._count,
            reactions: p._count.reactions + (hasReaction ? -1 : 1)
          }
        }
      }))
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sola-gold"></div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-120px)]" data-tour="community-page">
      {/* Channel Sidebar */}
      <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-white uppercase tracking-wide">Channels</h2>
            <button
              onClick={() => setShowNewChannel(!showNewChannel)}
              className="p-1 text-white/60 hover:text-sola-gold transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* New Channel Form */}
        {showNewChannel && (
          <div className="p-4 border-b border-white/10 space-y-3">
            <input
              type="text"
              placeholder="Channel name"
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm focus:border-sola-gold focus:outline-none"
            />
            <select
              value={newChannelType}
              onChange={(e) => setNewChannelType(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm focus:border-sola-gold focus:outline-none"
            >
              <option value="DISCUSSION">Discussion</option>
              <option value="ANNOUNCEMENTS">Announcements</option>
              <option value="EVENTS">Events</option>
              <option value="RESOURCES">Resources</option>
            </select>
            <button
              onClick={handleCreateChannel}
              disabled={submitting || !newChannelName.trim()}
              className="w-full bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
            >
              {submitting ? "Creating..." : "Create Channel"}
            </button>
          </div>
        )}

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {channels.length === 0 ? (
            <div className="p-4 text-center text-white/40 text-sm">
              No channels yet. Create your first channel!
            </div>
          ) : (
            channels.map((channel) => {
              const Icon = channelIcons[channel.type]
              const isSelected = selectedChannel?.id === channel.id
              return (
                <div
                  key={channel.id}
                  className={`group flex items-center justify-between px-4 py-2 cursor-pointer transition-colors ${
                    isSelected ? "bg-sola-gold/10 border-l-2 border-sola-gold" : "hover:bg-white/5"
                  }`}
                  onClick={() => setSelectedChannel(channel)}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-sola-gold" : "text-white/40"}`} />
                    <span className={`text-sm truncate ${isSelected ? "text-white" : "text-white/60"}`}>
                      {channel.name}
                    </span>
                    {channel._count.posts > 0 && (
                      <span className="text-xs text-white/30">{channel._count.posts}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteChannel(channel.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-white/40 hover:text-sola-red transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {selectedChannel ? (
          <>
            {/* Channel Header */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = channelIcons[selectedChannel.type]
                  return <Icon className="h-5 w-5 text-sola-gold" />
                })()}
                <div>
                  <h2 className="font-display text-xl text-white uppercase tracking-wide">
                    {selectedChannel.name}
                  </h2>
                  {selectedChannel.description && (
                    <p className="text-sm text-white/60">{selectedChannel.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Post Composer */}
            <div className="px-6 py-4 border-b border-white/10">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-sola-gold" />
                </div>
                <div className="flex-1">
                  <textarea
                    placeholder="Share something with your community..."
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder:text-white/30 focus:border-sola-gold focus:outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={handleCreatePost}
                      disabled={submitting || !newPostContent.trim()}
                      className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
                    >
                      <Send className="h-3 w-3" />
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="flex-1 overflow-y-auto">
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-sola-gold"></div>
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <p className="text-white/40">No posts yet. Be the first to post!</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {posts.map((post) => (
                    <div key={post.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                      <div className="flex gap-4">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.name || "User"}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sola-gold font-display text-sm">
                              {(post.author.name || "U")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-display text-white text-sm uppercase tracking-wide">
                                {post.author.name || "Anonymous"}
                              </span>
                              <span className="text-white/30 text-xs">
                                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 text-white/30 hover:text-sola-red transition-colors"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="text-white/80 mt-2 whitespace-pre-wrap">{post.content}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <button
                              onClick={() => handleReaction(post.id, "❤️")}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                post.reactions.some(r => r.emoji === "❤️")
                                  ? "text-sola-red"
                                  : "text-white/40 hover:text-sola-red"
                              }`}
                            >
                              <Heart className={`h-4 w-4 ${post.reactions.some(r => r.emoji === "❤️") ? "fill-current" : ""}`} />
                              {post._count.reactions > 0 && post._count.reactions}
                            </button>
                            <button className="flex items-center gap-1 text-xs text-white/40 hover:text-sola-gold transition-colors">
                              <MessageSquare className="h-4 w-4" />
                              {post._count.comments > 0 && post._count.comments}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Hash className="h-16 w-16 text-white/10 mx-auto mb-4" />
              <p className="text-white/40">Select a channel to view posts</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
