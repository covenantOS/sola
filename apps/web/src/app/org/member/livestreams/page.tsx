import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Video, Calendar, Clock, Play, ArrowLeft, Users } from "lucide-react"
import { format, formatDistanceToNow, isPast, isFuture } from "date-fns"

export const dynamic = "force-dynamic"

export default async function LivestreamsPage() {
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!org) {
    return <div>Organization not found</div>
  }

  if (!member) {
    redirect("/login?redirect=/member/livestreams")
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
    redirect("/signup?redirect=/member/livestreams")
  }

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get accessible livestreams
  const livestreams = await db.livestream.findMany({
    where: {
      organizationId: org.id,
      OR: [
        { isPublic: true },
        { accessTierIds: { hasSome: memberTierIds } },
        { accessTierIds: { isEmpty: true } },
      ],
    },
    orderBy: [
      { status: "asc" }, // LIVE first
      { scheduledAt: "asc" },
    ],
  })

  // Group livestreams by status
  const liveNow = livestreams.filter((l) => l.status === "LIVE")
  const upcoming = livestreams.filter(
    (l) => l.status === "SCHEDULED" && l.scheduledAt && isFuture(new Date(l.scheduledAt))
  )
  const past = livestreams.filter(
    (l) => l.status === "ENDED" || (l.status === "SCHEDULED" && l.scheduledAt && isPast(new Date(l.scheduledAt)))
  )

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/member"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 flex items-center justify-center"
            style={{ backgroundColor: `${primaryColor}20` }}
          >
            <Video className="h-6 w-6" style={{ color: primaryColor }} />
          </div>
          <div>
            <h1 className="font-display text-2xl text-white uppercase tracking-tight">
              Livestreams
            </h1>
            <p className="text-white/60 mt-1">Watch live and recorded streams</p>
          </div>
        </div>
      </div>

      {/* Live Now */}
      {liveNow.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Live Now
          </h2>
          <div className="space-y-4">
            {liveNow.map((stream) => (
              <Link
                key={stream.id}
                href={`/member/livestreams/${stream.id}`}
                className="block bg-red-500/10 border border-red-500/30 p-6 hover:border-red-500/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl text-white uppercase tracking-wide">
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p className="text-white/60 mt-2 line-clamp-2">{stream.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4 text-sm text-white/40">
                      {stream.startedAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Started {formatDistanceToNow(new Date(stream.startedAt), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="flex items-center gap-2 font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs"
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    <Play className="h-4 w-4" />
                    Watch Live
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="mb-8">
          <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: primaryColor }} />
            Upcoming
          </h2>
          <div className="space-y-4">
            {upcoming.map((stream) => (
              <div
                key={stream.id}
                className="bg-white/5 border border-white/10 p-6"
              >
                <h3 className="font-display text-lg text-white uppercase tracking-wide">
                  {stream.title}
                </h3>
                {stream.description && (
                  <p className="text-white/60 mt-2 line-clamp-2">{stream.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-white/40">
                  {stream.scheduledAt && (
                    <>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(stream.scheduledAt), "MMM d, yyyy")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(stream.scheduledAt), "h:mm a")}
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Streams */}
      {past.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
            Past Streams
          </h2>
          <div className="space-y-4">
            {past.map((stream) => (
              <Link
                key={stream.id}
                href={`/member/livestreams/${stream.id}`}
                className="block bg-white/5 border border-white/10 p-6 hover:border-white/30 transition-colors"
              >
                <h3 className="font-display text-lg text-white uppercase tracking-wide">
                  {stream.title}
                </h3>
                {stream.description && (
                  <p className="text-white/60 mt-2 line-clamp-2">{stream.description}</p>
                )}
                <div className="flex items-center gap-4 mt-4 text-sm text-white/40">
                  {stream.endedAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDistanceToNow(new Date(stream.endedAt), { addSuffix: true })}
                    </span>
                  )}
                  {stream.muxAssetId && (
                    <span className="flex items-center gap-1 text-green-400">
                      <Play className="h-4 w-4" />
                      Recording Available
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {livestreams.length === 0 && (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Video className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No livestreams available yet.</p>
          <p className="text-white/40 text-sm mt-2">Check back later for upcoming streams!</p>
        </div>
      )}
    </div>
  )
}
