import { getOrganizationBySlug, getUserMembership } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Video, Calendar, Clock, Play, Lock, Bell } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function LivePage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Check authentication
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  let user = null
  let membership = null

  if (isAuthenticated && claims?.sub) {
    user = await getUserByLogtoId(claims.sub)
    if (user) {
      membership = await getUserMembership(user.id, organization.id)
    }
  }

  // Get livestreams
  const now = new Date()
  const [liveStreams, upcomingStreams, pastStreams] = await Promise.all([
    db.livestream.findMany({
      where: { organizationId: organization.id, status: "LIVE" },
      orderBy: { startedAt: "desc" },
    }),
    db.livestream.findMany({
      where: {
        organizationId: organization.id,
        status: "SCHEDULED",
        scheduledAt: { gte: now },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    db.livestream.findMany({
      where: {
        organizationId: organization.id,
        status: "ENDED",
        muxPlaybackId: { not: null },
      },
      orderBy: { endedAt: "desc" },
      take: 10,
    }),
  ])

  const canAccessStream = (stream: { isPublic: boolean; accessTierIds: string[] }) => {
    if (stream.isPublic) return true
    if (!membership) return false
    if (stream.accessTierIds.length === 0) return true
    if (!membership.tierId) return false
    return stream.accessTierIds.includes(membership.tierId)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
          Live
        </h1>
        <p className="text-white/60 mt-2">
          Watch live streams and recordings
        </p>
      </div>

      {/* Currently Live */}
      {liveStreams.length > 0 && (
        <div>
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-sola-red rounded-full animate-pulse" />
            Live Now
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {liveStreams.map((stream) => {
              const hasAccess = canAccessStream(stream)

              return (
                <div
                  key={stream.id}
                  className="bg-white/5 border border-sola-red/50 overflow-hidden"
                >
                  <div className="relative aspect-video bg-sola-dark-navy">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-16 w-16 text-white/20" />
                    </div>
                    <div className="absolute top-2 left-2 bg-sola-red px-2 py-1 text-xs font-display uppercase tracking-wide text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      Live
                    </div>
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-sola-black/70 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-white/50" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-lg text-white uppercase tracking-wide">
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p className="text-white/60 text-sm mt-1 line-clamp-2">
                        {stream.description}
                      </p>
                    )}
                    <div className="mt-4">
                      {hasAccess ? (
                        <Link
                          href={`/${slug}/live/${stream.id}`}
                          className="w-full flex items-center justify-center gap-2 bg-sola-red text-white font-display font-semibold uppercase tracking-widest px-4 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(237,28,36,0.4)]"
                        >
                          <Play className="h-4 w-4" />
                          Watch Now
                        </Link>
                      ) : (
                        <Link
                          href={`/${slug}/join`}
                          className="w-full flex items-center justify-center gap-2 border-2 border-white/30 text-white font-display font-semibold uppercase tracking-widest px-4 py-3 text-sm"
                        >
                          <Lock className="h-4 w-4" />
                          Upgrade to Watch
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming Streams */}
      {upcomingStreams.length > 0 && (
        <div>
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-4">
            Upcoming
          </h2>
          <div className="space-y-4">
            {upcomingStreams.map((stream) => {
              const hasAccess = canAccessStream(stream)

              return (
                <div
                  key={stream.id}
                  className="bg-white/5 border border-white/10 p-4 flex items-center gap-4"
                >
                  <div className="w-16 h-16 bg-sola-gold/10 flex flex-col items-center justify-center">
                    <Calendar className="h-6 w-6 text-sola-gold" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-white uppercase tracking-wide truncate">
                      {stream.title}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-white/50">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {stream.scheduledAt && format(new Date(stream.scheduledAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {stream.scheduledAt && format(new Date(stream.scheduledAt), "h:mm a")}
                      </span>
                    </div>
                  </div>
                  {hasAccess ? (
                    <button className="flex items-center gap-2 border border-white/30 text-white/60 font-display uppercase tracking-widest px-4 py-2 text-xs hover:border-sola-gold hover:text-sola-gold transition-colors">
                      <Bell className="h-3 w-3" />
                      Remind Me
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-white/30 text-sm">
                      <Lock className="h-4 w-4" />
                      Premium
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Past Streams / Recordings */}
      {pastStreams.length > 0 && (
        <div>
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-4">
            Recordings
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastStreams.map((stream) => {
              const hasAccess = canAccessStream(stream)

              return (
                <div
                  key={stream.id}
                  className="bg-white/5 border border-white/10 overflow-hidden"
                >
                  <div className="relative aspect-video bg-sola-dark-navy">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Video className="h-12 w-12 text-white/20" />
                    </div>
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-sola-black/70 flex items-center justify-center">
                        <Lock className="h-8 w-8 text-white/50" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-display text-white uppercase tracking-wide truncate">
                      {stream.title}
                    </h3>
                    <p className="text-white/50 text-sm mt-1">
                      {stream.endedAt &&
                        formatDistanceToNow(new Date(stream.endedAt), { addSuffix: true })}
                    </p>
                    {hasAccess ? (
                      <Link
                        href={`/${slug}/live/${stream.id}`}
                        className="mt-3 flex items-center gap-2 text-sola-gold text-sm hover:underline"
                      >
                        <Play className="h-4 w-4" />
                        Watch Recording
                      </Link>
                    ) : (
                      <Link
                        href={`/${slug}/join`}
                        className="mt-3 flex items-center gap-2 text-white/50 text-sm hover:text-sola-gold"
                      >
                        <Lock className="h-4 w-4" />
                        Upgrade to Watch
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {liveStreams.length === 0 && upcomingStreams.length === 0 && pastStreams.length === 0 && (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Video className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No Livestreams Yet
          </h2>
          <p className="text-white/60">
            Check back soon for live content!
          </p>
        </div>
      )}
    </div>
  )
}
