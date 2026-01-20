import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  Hash,
  Megaphone,
  Calendar,
  BookOpen,
  ArrowLeft,
  MessageSquare,
  Heart,
  Send,
  Lock,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { PostComposer } from "./post-composer"

export const dynamic = "force-dynamic"

const channelIcons = {
  DISCUSSION: Hash,
  ANNOUNCEMENTS: Megaphone,
  EVENTS: Calendar,
  RESOURCES: BookOpen,
}

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ channelSlug: string }>
}) {
  const { channelSlug } = await params
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!org) {
    return <div>Organization not found</div>
  }

  if (!member) {
    redirect(`/login?redirect=/community/${channelSlug}`)
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
    redirect(`/signup?redirect=/community/${channelSlug}`)
  }

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get community with this channel
  const community = await db.community.findFirst({
    where: { organizationId: org.id, isDefault: true },
    include: {
      channels: {
        where: { slug: channelSlug },
        take: 1,
      },
    },
  })

  if (!community || community.channels.length === 0) {
    notFound()
  }

  const channel = community.channels[0]

  // Check access
  const hasAccess =
    channel.isPublic ||
    channel.accessTierIds.some((id) => memberTierIds.includes(id)) ||
    channel.accessTierIds.length === 0

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Lock className="h-16 w-16 text-white/20 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-white uppercase tracking-tight mb-2">
          Channel Locked
        </h1>
        <p className="text-white/60 mb-6">
          Upgrade your membership to access this channel.
        </p>
        <Link
          href="/member/upgrade"
          className="inline-flex items-center gap-2 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
          style={{ backgroundColor: primaryColor, color: "#000" }}
        >
          Upgrade Now
        </Link>
      </div>
    )
  }

  const Icon = channelIcons[channel.type as keyof typeof channelIcons] || Hash

  // Get posts for this channel
  const posts = await db.post.findMany({
    where: {
      channelId: channel.id,
      isPublished: true,
    },
    include: {
      author: {
        select: { id: true, name: true, avatar: true },
      },
      _count: { select: { comments: true, reactions: true } },
      reactions: {
        where: { userId: member.id },
        select: { emoji: true },
      },
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  })

  // Can post only in discussion channels or if admin
  const canPost =
    channel.type === "DISCUSSION" ||
    membership.role === "OWNER" ||
    membership.role === "ADMIN"

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Icon className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="font-display text-2xl text-white uppercase tracking-tight">
              {channel.name}
            </h1>
            {channel.description && (
              <p className="text-white/60 mt-1">{channel.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Post Composer */}
      {canPost && (
        <PostComposer
          channelId={channel.id}
          channelType={channel.type}
          memberAvatar={member.avatar}
          memberName={member.name}
          primaryColor={primaryColor}
        />
      )}

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No posts in this channel yet.</p>
          {canPost && <p className="text-white/40 text-sm mt-2">Be the first to post!</p>}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const hasLiked = post.reactions.some((r) => r.emoji === "❤️")

            return (
              <div
                key={post.id}
                id={`post-${post.id}`}
                className={`bg-white/5 border p-6 ${
                  post.isPinned ? "border-sola-gold/30" : "border-white/10"
                }`}
              >
                {post.isPinned && (
                  <div className="text-xs text-sola-gold mb-3 uppercase tracking-wide">
                    📌 Pinned
                  </div>
                )}

                {/* Author */}
                <div className="flex items-center gap-3 mb-4">
                  {post.author.avatar ? (
                    <img
                      src={post.author.avatar}
                      alt={post.author.name || ""}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {(post.author.name || "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{post.author.name || "Anonymous"}</p>
                    <p className="text-white/40 text-xs">
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <p className="text-white/80 whitespace-pre-wrap">{post.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-white/5">
                  <button
                    className={`flex items-center gap-2 transition-colors text-sm ${
                      hasLiked ? "text-red-400" : "text-white/40 hover:text-red-400"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
                    {post._count.reactions > 0 && post._count.reactions}
                  </button>
                  <button className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-sm">
                    <MessageSquare className="h-4 w-4" />
                    {post._count.comments > 0 && post._count.comments}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
