import { getOrganizationWithCommunity, getUserMembership, canAccessChannel, canPostInChannel } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  Hash,
  Megaphone,
  Calendar,
  BookOpen,
  Lock,
  MessageSquare,
  Users,
  Pin,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { CommunityPostComposer } from "@/components/public/community-post-composer"
import { PostReactions } from "@/components/public/post-reactions"
import { getPermissionContext, hasRole, getRoleBadgeStyle, canModifyPost } from "@/lib/permissions"

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ channel?: string }>
}

const channelIcons = {
  DISCUSSION: Hash,
  ANNOUNCEMENTS: Megaphone,
  EVENTS: Calendar,
  RESOURCES: BookOpen,
  LIVESTREAM: Hash,
}

export default async function CommunityPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { channel: selectedChannelSlug } = await searchParams

  const { organization, community, channels } = await getOrganizationWithCommunity(slug)

  if (!organization || !community) {
    notFound()
  }

  // Check authentication
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  let user = null
  let membership = null
  const isOwner = false

  if (isAuthenticated && claims?.sub) {
    user = await getUserByLogtoId(claims.sub)
    if (user) {
      membership = await getUserMembership(user.id, organization.id)
    }
  }

  // If not a member, redirect to join page
  if (!user || !membership) {
    redirect(`/${slug}/join`)
  }

  const isOrgOwner = organization.ownerId === user.id

  // Get permission context for moderation
  const permissionContext = await getPermissionContext(user.id, organization.id)
  const canModerate = hasRole(permissionContext, "MODERATOR")

  // Filter channels by access
  const accessibleChannels = channels.filter((channel) =>
    canAccessChannel(channel, membership, isOrgOwner)
  )

  // Get selected channel or default to first accessible
  const currentChannel = selectedChannelSlug
    ? channels.find((c) => c.slug === selectedChannelSlug)
    : accessibleChannels[0]

  // Check if user can access this channel
  const hasChannelAccess = currentChannel
    ? canAccessChannel(currentChannel, membership, isOrgOwner)
    : false

  // Get posts for current channel
  let posts: any[] = []
  if (currentChannel && hasChannelAccess) {
    posts = await db.post.findMany({
      where: { channelId: currentChannel.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        _count: {
          select: { comments: true, reactions: true },
        },
        reactions: user
          ? {
              where: { userId: user.id },
              select: { emoji: true },
            }
          : undefined,
      },
    })
  }

  // Can user post in this channel?
  const canPost = currentChannel
    ? canPostInChannel(currentChannel, membership, isOrgOwner)
    : false

  // Get online members (simplified - just show recent members)
  const recentMembers = await db.membership.findMany({
    where: { organizationId: organization.id },
    take: 10,
    orderBy: { joinedAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
  })

  return (
    <div className="flex h-[calc(100vh-180px)] -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Channel Sidebar */}
      <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-white/10">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Channels
          </h2>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto">
          {channels.map((channel) => {
            const Icon = channelIcons[channel.type]
            const isSelected = currentChannel?.id === channel.id
            const hasAccess = canAccessChannel(channel, membership, isOrgOwner)

            return (
              <Link
                key={channel.id}
                href={hasAccess ? `/${slug}/community?channel=${channel.slug}` : `/${slug}/join`}
                className={`flex items-center justify-between px-4 py-2 transition-colors ${
                  isSelected
                    ? "bg-sola-gold/10 border-l-2 border-sola-gold"
                    : hasAccess
                    ? "hover:bg-white/5"
                    : "opacity-50"
                }`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {hasAccess ? (
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isSelected ? "text-sola-gold" : "text-white/40"}`} />
                  ) : (
                    <Lock className="h-4 w-4 flex-shrink-0 text-white/30" />
                  )}
                  <span className={`text-sm truncate ${isSelected ? "text-white" : "text-white/60"}`}>
                    {channel.name}
                  </span>
                  {channel._count.posts > 0 && (
                    <span className="text-xs text-white/30">{channel._count.posts}</span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>

        {/* Online Members */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-2 text-white/50 text-sm mb-3">
            <Users className="h-4 w-4" />
            <span>Members ({recentMembers.length})</span>
          </div>
          <div className="space-y-2">
            {recentMembers.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center gap-2">
                <div className="relative">
                  {m.user.avatar ? (
                    <img
                      src={m.user.avatar}
                      alt={m.user.name || "User"}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 bg-sola-gold/20 rounded-full flex items-center justify-center">
                      <span className="text-sola-gold text-xs">
                        {(m.user.name || "U")[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-sola-black" />
                </div>
                <span className="text-white/60 text-sm truncate">{m.user.name || "Member"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {currentChannel ? (
          hasChannelAccess ? (
            <>
              {/* Channel Header */}
              <div className="px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {(() => {
                    const Icon = channelIcons[currentChannel.type]
                    return <Icon className="h-5 w-5 text-sola-gold" />
                  })()}
                  <div>
                    <h2 className="font-display text-xl text-white uppercase tracking-wide">
                      {currentChannel.name}
                    </h2>
                    {currentChannel.description && (
                      <p className="text-sm text-white/60">{currentChannel.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Post Composer */}
              {canPost && user && (
                <CommunityPostComposer
                  channelId={currentChannel.id}
                  userAvatar={user.avatar || undefined}
                  userName={user.name || undefined}
                  slug={slug}
                />
              )}

              {/* Posts */}
              <div className="flex-1 overflow-y-auto">
                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-white/20 mb-4" />
                    <p className="text-white/40">This channel is quiet. Be the first to post!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {posts.map((post) => {
                      const userReactions = post.reactions?.map((r: { emoji: string }) => r.emoji) || []
                      const canDeletePost = canModifyPost(permissionContext, post)

                      return (
                        <div key={post.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                          {post.isPinned && (
                            <div className="flex items-center gap-1 text-sola-gold text-xs mb-2">
                              <Pin className="h-3 w-3" />
                              <span>Pinned</span>
                            </div>
                          )}
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
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-display text-white text-sm uppercase tracking-wide">
                                  {post.author.name || "Anonymous"}
                                </span>
                                {post.author.id === organization.ownerId && (
                                  <span className="bg-sola-gold text-sola-black text-xs px-2 py-0.5 uppercase tracking-wide">
                                    Creator
                                  </span>
                                )}
                                <span className="text-white/30 text-xs">
                                  {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-white/80 mt-2 whitespace-pre-wrap">{post.content}</p>
                              <PostReactions
                                postId={post.id}
                                reactionCount={post._count.reactions}
                                commentCount={post._count.comments}
                                userReactions={userReactions}
                                canDelete={canDeletePost}
                                canPin={canModerate}
                                isPinned={post.isPinned}
                                slug={slug}
                              />
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          ) : (
            // No access to channel
            <div className="flex-1 flex flex-col items-center justify-center">
              <Lock className="h-16 w-16 text-white/20 mb-4" />
              <h2 className="font-display text-xl text-white uppercase tracking-wide mb-2">
                Premium Content
              </h2>
              <p className="text-white/60 mb-6">
                This channel requires a higher membership tier
              </p>
              <Link
                href={`/${slug}/join`}
                className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
              >
                Upgrade Membership
              </Link>
            </div>
          )
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Hash className="h-16 w-16 text-white/10 mb-4" />
            <p className="text-white/40">Select a channel to view posts</p>
          </div>
        )}
      </div>
    </div>
  )
}
