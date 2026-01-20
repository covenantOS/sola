import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import Link from "next/link"
import {
  Hash,
  Users,
  Palette,
  Settings,
  Plus,
  ChevronRight,
  MessageSquare,
  TrendingUp,
  Eye,
  ExternalLink,
} from "lucide-react"

export default async function CommunityAdminPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return <div>Organization not found</div>
  }

  // Get community with stats
  const community = await db.community.findFirst({
    where: { organizationId: organization.id, isDefault: true },
    include: {
      channels: {
        orderBy: { position: "asc" },
        include: {
          _count: { select: { posts: true } },
        },
      },
    },
  })

  // Get member count
  const memberCount = await db.membership.count({
    where: { organizationId: organization.id, status: "ACTIVE" },
  })

  // Get recent posts count (last 7 days)
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentPostsCount = community
    ? await db.post.count({
        where: {
          channel: { communityId: community.id },
          createdAt: { gte: weekAgo },
        },
      })
    : 0

  const communityUrl = `https://${organization.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "solaplus.ai"}/community`

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Community
          </h1>
          <p className="text-white/60 mt-1">
            Manage your community channels, members, and appearance.
          </p>
        </div>
        <a
          href={communityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-sola-gold hover:text-sola-gold/80 transition-colors"
        >
          <Eye className="h-4 w-4" />
          View Public Page
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <p className="text-2xl font-display text-white">{memberCount}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Members</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <p className="text-2xl font-display text-white">{community?.channels.length || 0}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Channels</p>
            </div>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <p className="text-2xl font-display text-white">{recentPostsCount}</p>
              <p className="text-xs text-white/40 uppercase tracking-wide">Posts This Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Link
          href="/dashboard/community/channels"
          className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
                <Hash className="h-5 w-5 text-sola-gold" />
              </div>
              <div>
                <h3 className="font-display text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors">
                  Channels
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Create, edit, and organize discussion channels
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-sola-gold transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/community/members"
          className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-sola-gold" />
              </div>
              <div>
                <h3 className="font-display text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors">
                  Members
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  View and manage community members
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-sola-gold transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/community/appearance"
          className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
                <Palette className="h-5 w-5 text-sola-gold" />
              </div>
              <div>
                <h3 className="font-display text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors">
                  Appearance
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Customize your public community page
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-sola-gold transition-colors" />
          </div>
        </Link>

        <Link
          href="/dashboard/community/settings"
          className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all group"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
                <Settings className="h-5 w-5 text-sola-gold" />
              </div>
              <div>
                <h3 className="font-display text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors">
                  Settings
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Community rules and access settings
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-white/20 group-hover:text-sola-gold transition-colors" />
          </div>
        </Link>
      </div>

      {/* Channels List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Channels
          </h2>
          <Link
            href="/dashboard/community/channels/new"
            className="inline-flex items-center gap-2 text-sm text-sola-gold hover:text-sola-gold/80 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Channel
          </Link>
        </div>

        {!community || community.channels.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-8 text-center">
            <Hash className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-4">No channels yet</p>
            <Link
              href="/dashboard/community/channels/new"
              className="inline-flex items-center gap-2 bg-sola-gold text-sola-black px-4 py-2 font-display font-semibold uppercase tracking-widest text-xs"
            >
              <Plus className="h-4 w-4" />
              Create First Channel
            </Link>
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 divide-y divide-white/5">
            {community.channels.map((channel) => (
              <Link
                key={channel.id}
                href={`/dashboard/community/channels/${channel.id}`}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Hash className="h-5 w-5 text-white/40" />
                  <div>
                    <p className="text-white">{channel.name}</p>
                    <p className="text-xs text-white/40">
                      {channel._count.posts} posts • {channel.type.toLowerCase()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {channel.isPublic ? (
                    <span className="text-xs px-2 py-1 bg-green-500/10 text-green-400">Public</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-white/5 text-white/40">Members Only</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-white/20" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
