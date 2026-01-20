import { getOrganizationBySlug, getUserMembership } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Lock, Users, MessageSquare, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import MuxPlayer from "@mux/mux-player-react"
import { LiveChat } from "@/components/public/live-chat"

interface PageProps {
  params: Promise<{ slug: string; streamId: string }>
}

export default async function StreamViewerPage({ params }: PageProps) {
  const { slug, streamId } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Get the stream
  const stream = await db.livestream.findUnique({
    where: { id: streamId },
  })

  if (!stream || stream.organizationId !== organization.id) {
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

  // Check access
  const hasAccess = (() => {
    if (stream.isPublic) return true
    if (!membership) return false
    if (stream.accessTierIds.length === 0) return true
    if (!membership.tierId) return false
    return stream.accessTierIds.includes(membership.tierId)
  })()

  if (!hasAccess) {
    redirect(`/${slug}/join`)
  }

  const isLive = stream.status === "LIVE"
  const playbackId = stream.muxPlaybackId

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/${slug}/live`}
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Livestreams
      </Link>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video bg-sola-dark-navy border border-white/10 overflow-hidden relative">
            {playbackId ? (
              <MuxPlayer
                streamType={isLive ? "live" : "on-demand"}
                playbackId={playbackId}
                autoPlay={isLive}
                muted={false}
                className="w-full h-full"
                accentColor="#D4A84B"
                metadata={{
                  video_title: stream.title,
                }}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Clock className="h-12 w-12 text-white/20 mb-4" />
                <p className="text-white/60 text-center">
                  {stream.status === "SCHEDULED"
                    ? "This stream hasn't started yet"
                    : "No video available"}
                </p>
              </div>
            )}

            {/* Live indicator */}
            {isLive && (
              <div className="absolute top-4 left-4 bg-sola-red px-3 py-1 text-sm font-display uppercase tracking-wide text-white flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Live
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div className="bg-white/5 border border-white/10 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl text-white uppercase tracking-tight">
                  {stream.title}
                </h1>
                {stream.description && (
                  <p className="text-white/60 mt-2">{stream.description}</p>
                )}
              </div>
              {isLive && (
                <div className="flex items-center gap-2 text-sola-gold">
                  <Users className="h-4 w-4" />
                  <span className="text-sm">Watching</span>
                </div>
              )}
            </div>

            {!isLive && stream.endedAt && (
              <p className="text-white/40 text-sm mt-4">
                Streamed{" "}
                {formatDistanceToNow(new Date(stream.endedAt), { addSuffix: true })}
              </p>
            )}
          </div>
        </div>

        {/* Chat Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white/5 border border-white/10 h-[600px] flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-sola-gold" />
              <h2 className="font-display text-sm text-white uppercase tracking-wide">
                Live Chat
              </h2>
            </div>

            {isLive && user ? (
              <LiveChat
                streamId={streamId}
                userId={user.id}
                userName={user.name || "Member"}
                userAvatar={user.avatar || undefined}
              />
            ) : isLive ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <Lock className="h-8 w-8 text-white/20 mb-4" />
                <p className="text-white/60 text-sm">
                  Sign in to participate in chat
                </p>
                <Link
                  href={`/${slug}/login`}
                  className="mt-4 text-sola-gold text-sm hover:underline"
                >
                  Sign in
                </Link>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <MessageSquare className="h-8 w-8 text-white/20 mb-4" />
                <p className="text-white/60 text-sm">
                  Chat is only available during live streams
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
