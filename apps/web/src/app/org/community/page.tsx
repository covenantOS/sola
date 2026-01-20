import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  Hash,
  Megaphone,
  Calendar,
  BookOpen,
  Lock,
  MessageSquare,
  Heart,
  Users,
  TrendingUp,
  Clock,
  ChevronRight,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

const channelIcons = {
  DISCUSSION: Hash,
  ANNOUNCEMENTS: Megaphone,
  EVENTS: Calendar,
  RESOURCES: BookOpen,
}

const channelColors = {
  DISCUSSION: "#3B82F6",
  ANNOUNCEMENTS: "#F59E0B",
  EVENTS: "#8B5CF6",
  RESOURCES: "#10B981",
}

export default async function CommunityPage() {
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!org) {
    return <div>Organization not found</div>
  }

  if (!member) {
    redirect("/login?redirect=/community")
  }

  // Get membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
    include: { tier: true },
  })

  if (!membership) {
    redirect("/signup?redirect=/community")
  }

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get community with channels
  const community = await db.community.findFirst({
    where: { organizationId: org.id, isDefault: true },
    include: {
      channels: {
        orderBy: { position: "asc" },
        include: {
          _count: { select: { posts: true } },
        },
      },
    },
  })

  if (!community) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center animate-fade-in">
        <Users className="h-16 w-16 text-white/20 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-white uppercase tracking-tight mb-2">
          Community Coming Soon
        </h1>
        <p className="text-white/60">
          The community hasn't been set up yet. Check back soon!
        </p>
      </div>
    )
  }

  // Get member count
  const memberCount = await db.membership.count({
    where: { organizationId: org.id },
  })

  // Get accessible channels
  const accessibleChannels = community.channels.filter(
    (ch) =>
      ch.isPublic ||
      ch.accessTierIds.some((id) => memberTierIds.includes(id)) ||
      ch.accessTierIds.length === 0
  )

  // Get recent posts from accessible channels
  const accessibleChannelIds = accessibleChannels.map((ch) => ch.id)

  const recentPosts = await db.post.findMany({
    where: {
      channelId: { in: accessibleChannelIds },
      isPublished: true,
    },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      channel: {
        select: { id: true, name: true, slug: true, type: true },
      },
      _count: { select: { comments: true, reactions: true } },
      reactions: {
        where: { userId: member.id },
        select: { emoji: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  // Get pinned posts
  const pinnedPosts = await db.post.findMany({
    where: {
      channelId: { in: accessibleChannelIds },
      isPublished: true,
      isPinned: true,
    },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      channel: {
        select: { id: true, name: true, slug: true, type: true },
      },
    },
    take: 3,
  })

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div
        className="border-b border-white/10 py-8 mb-8"
        style={{ backgroundColor: `${primaryColor}05` }}
      >
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="animate-fade-in-up">
              <h1 className="font-display text-3xl text-white uppercase tracking-tight mb-2">
                {community.name}
              </h1>
              <p className="text-white/60 flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {memberCount.toLocaleString()} members
                </span>
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  {recentPosts.length} recent posts
                </span>
              </p>
            </div>
            {membership.tier && (
              <div
                className="px-4 py-2 text-sm font-display uppercase tracking-wide animate-fade-in"
                style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
              >
                {membership.tier.name}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Channels */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-24 space-y-6">
              {/* Channels Card */}
              <div className="bg-white/5 border border-white/10 p-4 animate-slide-in-left">
                <h2 className="font-display text-sm text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <Hash className="h-4 w-4" style={{ color: primaryColor }} />
                  Channels
                </h2>
                <div className="space-y-1">
                  {community.channels.map((channel, idx) => {
                    const Icon = channelIcons[channel.type as keyof typeof channelIcons] || Hash
                    const color = channelColors[channel.type as keyof typeof channelColors] || primaryColor
                    const hasAccess =
                      channel.isPublic ||
                      channel.accessTierIds.some((id) => memberTierIds.includes(id)) ||
                      channel.accessTierIds.length === 0

                    return (
                      <Link
                        key={channel.id}
                        href={hasAccess ? `/community/${channel.slug}` : "#"}
                        className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          hasAccess
                            ? "hover:bg-white/10"
                            : "opacity-50 cursor-not-allowed"
                        }`}
                        style={{
                          animationDelay: `${idx * 0.05}s`,
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          {hasAccess ? (
                            <Icon className="h-4 w-4" style={{ color }} />
                          ) : (
                            <Lock className="h-4 w-4 text-white/40" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white/80 text-sm truncate group-hover:text-white transition-colors">
                            {channel.name}
                          </p>
                        </div>
                        <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
                          {channel._count.posts}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white/5 border border-white/10 p-4 animate-slide-in-left" style={{ animationDelay: "0.1s" }}>
                <h3 className="font-display text-sm text-white uppercase tracking-wide mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" style={{ color: primaryColor }} />
                  Activity
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Posts today</span>
                    <span className="text-white font-medium">
                      {recentPosts.filter((p) => {
                        const postDate = new Date(p.createdAt)
                        const today = new Date()
                        return postDate.toDateString() === today.toDateString()
                      }).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Active channels</span>
                    <span className="text-white font-medium">{accessibleChannels.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Pinned Posts */}
            {pinnedPosts.length > 0 && (
              <div className="mb-8 animate-fade-in-up">
                <h2 className="font-display text-sm text-white/60 uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span>Pinned</span>
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {pinnedPosts.map((post) => {
                    const ChannelIcon = channelIcons[post.channel.type as keyof typeof channelIcons] || Hash
                    const channelColor = channelColors[post.channel.type as keyof typeof channelColors] || primaryColor

                    return (
                      <Link
                        key={post.id}
                        href={`/community/${post.channel.slug}#post-${post.id}`}
                        className="group block p-4 border transition-all duration-300 hover:scale-[1.02]"
                        style={{
                          backgroundColor: `${primaryColor}08`,
                          borderColor: `${primaryColor}30`,
                        }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <ChannelIcon className="h-3 w-3" style={{ color: channelColor }} />
                          <span className="text-xs text-white/40">{post.channel.name}</span>
                        </div>
                        <p className="text-white text-sm line-clamp-2 group-hover:text-white/90">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-white/30">
                          {post.author.avatar ? (
                            <img
                              src={post.author.avatar}
                              alt=""
                              className="w-4 h-4 rounded-full"
                            />
                          ) : (
                            <div
                              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] text-white"
                              style={{ backgroundColor: primaryColor }}
                            >
                              {(post.author.name || "?")[0]}
                            </div>
                          )}
                          <span>{post.author.name}</span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Feed Header */}
            <div className="flex items-center justify-between mb-6 animate-fade-in-up">
              <h2 className="font-display text-xl text-white uppercase tracking-tight flex items-center gap-2">
                <Clock className="h-5 w-5" style={{ color: primaryColor }} />
                Recent Posts
              </h2>
            </div>

            {recentPosts.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-12 text-center animate-fade-in">
                <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
                <p className="text-white/60">No posts yet.</p>
                <p className="text-white/40 text-sm mt-2">Be the first to share something!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentPosts.map((post, idx) => {
                  const ChannelIcon = channelIcons[post.channel.type as keyof typeof channelIcons] || Hash
                  const channelColor = channelColors[post.channel.type as keyof typeof channelColors] || primaryColor
                  const hasLiked = post.reactions.some((r) => r.emoji === "❤️")

                  return (
                    <div
                      key={post.id}
                      className="group bg-white/5 border border-white/10 p-6 hover:border-white/20 transition-all duration-300 animate-fade-in-up"
                      style={{ animationDelay: `${idx * 0.05}s` }}
                    >
                      {/* Channel Badge */}
                      <Link
                        href={`/community/${post.channel.slug}`}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4 transition-all hover:scale-105"
                        style={{
                          backgroundColor: `${channelColor}15`,
                          color: channelColor,
                        }}
                      >
                        <ChannelIcon className="h-3 w-3" />
                        {post.channel.name}
                        <ChevronRight className="h-3 w-3 opacity-50" />
                      </Link>

                      {/* Author */}
                      <div className="flex items-center gap-3 mb-4">
                        {post.author.avatar ? (
                          <img
                            src={post.author.avatar}
                            alt={post.author.name || ""}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10"
                          />
                        ) : (
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-display ring-2 ring-white/10"
                            style={{ backgroundColor: primaryColor }}
                          >
                            {(post.author.name || "?")[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{post.author.name || "Anonymous"}</p>
                          <p className="text-white/40 text-xs flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Content */}
                      <p className="text-white/80 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-6 mt-5 pt-4 border-t border-white/5">
                        <button
                          className={`flex items-center gap-2 transition-all text-sm ${
                            hasLiked
                              ? "text-red-400"
                              : "text-white/40 hover:text-red-400"
                          }`}
                        >
                          <Heart
                            className={`h-4 w-4 transition-transform hover:scale-125 ${
                              hasLiked ? "fill-current" : ""
                            }`}
                          />
                          <span>{post._count.reactions > 0 ? post._count.reactions : ""}</span>
                        </button>
                        <Link
                          href={`/community/${post.channel.slug}#post-${post.id}`}
                          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>{post._count.comments > 0 ? post._count.comments : ""}</span>
                          <span className="text-white/30">Reply</span>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
