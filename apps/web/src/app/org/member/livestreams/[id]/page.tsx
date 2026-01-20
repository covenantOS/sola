import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { Video, ArrowLeft, Clock, Calendar, Lock } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

export const dynamic = "force-dynamic"

export default async function LivestreamPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!org) {
    return <div>Organization not found</div>
  }

  if (!member) {
    redirect(`/login?redirect=/member/livestreams/${id}`)
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
    redirect(`/signup?redirect=/member/livestreams/${id}`)
  }

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get livestream
  const livestream = await db.livestream.findFirst({
    where: {
      id,
      organizationId: org.id,
    },
  })

  if (!livestream) {
    notFound()
  }

  // Check access
  const hasAccess =
    livestream.isPublic ||
    livestream.accessTierIds.some((tid) => memberTierIds.includes(tid)) ||
    livestream.accessTierIds.length === 0

  if (!hasAccess) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <Lock className="h-16 w-16 text-white/20 mx-auto mb-4" />
        <h1 className="font-display text-2xl text-white uppercase tracking-tight mb-2">
          Access Restricted
        </h1>
        <p className="text-white/60 mb-6">
          Upgrade your membership to watch this livestream.
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

  // Determine playback ID
  const playbackId =
    livestream.status === "LIVE"
      ? livestream.muxPlaybackId
      : livestream.recordingPlaybackId

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/member/livestreams"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Livestreams
        </Link>
      </div>

      {/* Video Player */}
      <div className="aspect-video bg-black mb-6 relative">
        {playbackId ? (
          <iframe
            src={`https://stream.mux.com/${playbackId}.m3u8`}
            className="w-full h-full"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : livestream.status === "SCHEDULED" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Video className="h-16 w-16 text-white/20 mb-4" />
            <p className="text-white/60 text-lg">Stream not started yet</p>
            {livestream.scheduledAt && (
              <p className="text-white/40 mt-2">
                Scheduled for {format(new Date(livestream.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
              </p>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Video className="h-16 w-16 text-white/20 mb-4" />
            <p className="text-white/60">No recording available</p>
          </div>
        )}

        {/* Live badge */}
        {livestream.status === "LIVE" && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 px-3 py-1">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white font-display uppercase text-sm tracking-wide">Live</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="font-display text-2xl text-white uppercase tracking-tight">
              {livestream.title}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-white/40">
              {livestream.status === "LIVE" && livestream.startedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Started {formatDistanceToNow(new Date(livestream.startedAt), { addSuffix: true })}
                </span>
              )}
              {livestream.status === "SCHEDULED" && livestream.scheduledAt && (
                <>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(livestream.scheduledAt), "MMM d, yyyy")}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {format(new Date(livestream.scheduledAt), "h:mm a")}
                  </span>
                </>
              )}
              {livestream.status === "ENDED" && livestream.endedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Ended {formatDistanceToNow(new Date(livestream.endedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          </div>
          <div
            className={`px-3 py-1 text-xs uppercase tracking-wide font-display ${
              livestream.status === "LIVE"
                ? "bg-red-500/20 text-red-400"
                : livestream.status === "SCHEDULED"
                  ? "bg-blue-500/20 text-blue-400"
                  : "bg-white/10 text-white/60"
            }`}
          >
            {livestream.status}
          </div>
        </div>

        {livestream.description && (
          <p className="text-white/70 whitespace-pre-wrap">{livestream.description}</p>
        )}
      </div>
    </div>
  )
}
