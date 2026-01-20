import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Hash, Plus, Users, MessageSquare, Send } from "lucide-react"
import { PostComposer } from "./post-composer"
import { PostFeed } from "./post-feed"

export const dynamic = "force-dynamic"

export default async function MemberCommunityPage() {
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!member || !org) {
    redirect("/login")
  }

  // Get membership with tier
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
    include: { tier: true },
  })

  if (!membership || membership.status !== "ACTIVE") {
    redirect("/signup")
  }

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get communities and channels
  const communities = await db.community.findMany({
    where: { organizationId: org.id },
    include: {
      channels: {
        where: {
          OR: [
            { isPublic: true },
            { accessTierIds: { hasSome: memberTierIds } },
          ],
        },
        orderBy: { position: "asc" },
        include: {
          _count: {
            select: { posts: true },
          },
        },
      },
    },
  })

  // Get the first channel as default
  const defaultChannel = communities[0]?.channels[0]
  const allChannels = communities.flatMap((c) => c.channels)

  // Get recent posts from all accessible channels
  const channelIds = allChannels.map((ch) => ch.id)
  const recentPosts = await db.post.findMany({
    where: {
      channelId: { in: channelIds },
      isPublished: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      _count: {
        select: { comments: true, reactions: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })

  // Get member count
  const memberCount = await db.membership.count({
    where: {
      organizationId: org.id,
      status: "ACTIVE",
    },
  })

  // Check if user can post (based on community settings)
  const communitySettings = (communities[0]?.settings as Record<string, unknown>) || {}
  const allowMemberPosts = communitySettings.allowMemberPosts !== false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-tight">
            Community
          </h1>
          <p className="text-white/60 mt-1 flex items-center gap-2">
            <Users className="h-4 w-4" />
            {memberCount} members
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Sidebar - Channels */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10">
            <div className="p-4 border-b border-white/10">
              <h2 className="font-display text-sm text-white uppercase tracking-wide">
                Channels
              </h2>
            </div>
            <div className="divide-y divide-white/5">
              {allChannels.length === 0 ? (
                <div className="p-4 text-center">
                  <Hash className="h-8 w-8 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40 text-sm">No channels yet</p>
                </div>
              ) : (
                allChannels.map((channel) => (
                  <Link
                    key={channel.id}
                    href={`/member/community/${channel.slug}`}
                    className="flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
                  >
                    <Hash className="h-4 w-4 text-white/40" />
                    <span className="text-white/80 text-sm flex-1 truncate">
                      {channel.name}
                    </span>
                    {channel._count.posts > 0 && (
                      <span className="text-white/40 text-xs">
                        {channel._count.posts}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main content - Feed */}
        <div className="lg:col-span-3 space-y-6">
          {/* Post Composer */}
          {allowMemberPosts && defaultChannel && (
            <PostComposer
              memberId={member.id}
              memberName={member.name || "Member"}
              memberAvatar={member.avatar}
              channels={allChannels.map((ch) => ({ id: ch.id, name: ch.name }))}
              defaultChannelId={defaultChannel.id}
              primaryColor={primaryColor}
            />
          )}

          {/* Posts Feed */}
          <PostFeed
            posts={recentPosts}
            primaryColor={primaryColor}
            currentUserId={member.id}
          />
        </div>
      </div>
    </div>
  )
}
