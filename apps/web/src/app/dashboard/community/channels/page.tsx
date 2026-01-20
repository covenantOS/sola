import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import Link from "next/link"
import { Hash, Plus, ChevronRight, ArrowLeft, GripVertical, Megaphone, Calendar, BookOpen } from "lucide-react"

const channelTypeIcons = {
  DISCUSSION: Hash,
  ANNOUNCEMENTS: Megaphone,
  EVENTS: Calendar,
  RESOURCES: BookOpen,
}

const channelTypeLabels = {
  DISCUSSION: "Discussion",
  ANNOUNCEMENTS: "Announcements",
  EVENTS: "Events",
  RESOURCES: "Resources",
}

export default async function ChannelsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return <div>Organization not found</div>
  }

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

  const tiers = await db.membershipTier.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: { position: "asc" },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/community"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-white uppercase tracking-wide">
              Channels
            </h1>
            <p className="text-white/60 mt-1">
              Create and manage discussion channels for your community.
            </p>
          </div>
          <Link
            href="/dashboard/community/channels/new"
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black px-4 py-2 font-display font-semibold uppercase tracking-widest text-xs"
          >
            <Plus className="h-4 w-4" />
            New Channel
          </Link>
        </div>
      </div>

      {/* Channels List */}
      {!community || community.channels.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Hash className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h3 className="font-display text-lg text-white uppercase tracking-wide mb-2">
            No Channels Yet
          </h3>
          <p className="text-white/60 mb-6 max-w-md mx-auto">
            Channels are discussion spaces for your community. Create different channels for different topics.
          </p>
          <Link
            href="/dashboard/community/channels/new"
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black px-6 py-3 font-display font-semibold uppercase tracking-widest text-xs"
          >
            <Plus className="h-4 w-4" />
            Create Your First Channel
          </Link>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10">
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-white/10 text-xs text-white/40 uppercase tracking-wide">
            <div className="col-span-1"></div>
            <div className="col-span-4">Channel</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-2">Access</div>
            <div className="col-span-2">Posts</div>
            <div className="col-span-1"></div>
          </div>
          {community.channels.map((channel) => {
            const Icon = channelTypeIcons[channel.type as keyof typeof channelTypeIcons] || Hash
            const typeLabel = channelTypeLabels[channel.type as keyof typeof channelTypeLabels] || channel.type

            // Determine access text
            let accessText = "Members Only"
            if (channel.isPublic) {
              accessText = "Public"
            } else if (channel.accessTierIds.length > 0) {
              const tierNames = tiers
                .filter(t => channel.accessTierIds.includes(t.id))
                .map(t => t.name)
              accessText = tierNames.length > 0 ? tierNames.join(", ") : "Specific Tiers"
            }

            return (
              <Link
                key={channel.id}
                href={`/dashboard/community/channels/${channel.id}`}
                className="grid grid-cols-12 gap-4 px-4 py-4 items-center hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              >
                <div className="col-span-1">
                  <GripVertical className="h-4 w-4 text-white/20 cursor-grab" />
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <Icon className="h-5 w-5 text-sola-gold" />
                  <div>
                    <p className="text-white font-medium">{channel.name}</p>
                    {channel.description && (
                      <p className="text-xs text-white/40 truncate max-w-xs">{channel.description}</p>
                    )}
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="text-white/60 text-sm">{typeLabel}</span>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-1 ${
                    channel.isPublic ? "bg-green-500/10 text-green-400" : "bg-white/5 text-white/60"
                  }`}>
                    {accessText}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-white/60">{channel._count.posts}</span>
                </div>
                <div className="col-span-1 text-right">
                  <ChevronRight className="h-4 w-4 text-white/20 inline-block" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Tips */}
      <div className="bg-sola-gold/5 border border-sola-gold/20 p-4">
        <h4 className="text-sola-gold font-display uppercase tracking-wide text-sm mb-2">
          Channel Types
        </h4>
        <ul className="text-white/60 text-sm space-y-1">
          <li><strong className="text-white">Discussion</strong> — Open conversation for all members</li>
          <li><strong className="text-white">Announcements</strong> — Only you can post, members can comment</li>
          <li><strong className="text-white">Events</strong> — Schedule and manage community events</li>
          <li><strong className="text-white">Resources</strong> — Share files, links, and resources</li>
        </ul>
      </div>
    </div>
  )
}
