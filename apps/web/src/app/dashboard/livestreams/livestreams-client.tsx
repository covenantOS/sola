"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Play,
  Square,
  Trash2,
  Radio,
  AlertCircle,
  Loader2,
  X,
  Globe,
  Lock,
  Edit,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  createLivestream,
  startLivestream,
  endLivestream,
  deleteLivestream,
} from "@/app/actions/livestreams"

interface Livestream {
  id: string
  title: string
  description: string | null
  status: string
  scheduledAt: Date | null
  startedAt: Date | null
  endedAt: Date | null
  isPublic: boolean
  livekitRoomName: string | null
  muxPlaybackId: string | null
}

interface LivestreamsClientProps {
  initialLivestreams: Livestream[]
}

export function LivestreamsClient({ initialLivestreams }: LivestreamsClientProps) {
  const router = useRouter()
  const [livestreams, setLivestreams] = useState(initialLivestreams)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [newStream, setNewStream] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    isPublic: false,
  })

  const handleCreate = async () => {
    if (!newStream.title.trim()) return

    setIsLoading(true)
    const result = await createLivestream(newStream)
    if (!result.error && result.livestream) {
      setShowCreateModal(false)
      setNewStream({ title: "", description: "", scheduledAt: "", isPublic: false })
      router.refresh()
    }
    setIsLoading(false)
  }

  const handleStart = async (id: string) => {
    const result = await startLivestream(id)
    if (!result.error) {
      router.refresh()
    }
  }

  const handleEnd = async (id: string) => {
    const result = await endLivestream(id)
    if (!result.error) {
      router.refresh()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this livestream?")) return
    const result = await deleteLivestream(id)
    if (!result.error) {
      router.refresh()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "LIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-sola-red/20 text-sola-red text-xs uppercase">
            <Radio className="h-3 w-3 animate-pulse" />
            Live
          </span>
        )
      case "SCHEDULED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-sola-gold/20 text-sola-gold text-xs uppercase">
            <Clock className="h-3 w-3" />
            Scheduled
          </span>
        )
      case "ENDED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/10 text-white/60 text-xs uppercase">
            <Square className="h-3 w-3" />
            Ended
          </span>
        )
      default:
        return null
    }
  }

  const liveStreams = livestreams.filter((s) => s.status === "LIVE")
  const scheduledStreams = livestreams.filter((s) => s.status === "SCHEDULED")
  const pastStreams = livestreams.filter((s) => s.status === "ENDED")

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Livestreams
          </h1>
          <p className="text-white/60 mt-1">
            Go live with your community and save recordings.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Schedule Livestream
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Radio className="h-5 w-5 text-sola-red" />
            <span className="text-white/60 text-sm uppercase tracking-wide">
              Live Now
            </span>
          </div>
          <p className="font-display text-3xl text-white">{liveStreams.length}</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="h-5 w-5 text-sola-gold" />
            <span className="text-white/60 text-sm uppercase tracking-wide">
              Scheduled
            </span>
          </div>
          <p className="font-display text-3xl text-white">
            {scheduledStreams.length}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Video className="h-5 w-5 text-white/60" />
            <span className="text-white/60 text-sm uppercase tracking-wide">
              Recordings
            </span>
          </div>
          <p className="font-display text-3xl text-white">{pastStreams.length}</p>
        </div>
      </div>

      {/* Live Now Section */}
      {liveStreams.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-sola-red uppercase tracking-wide mb-4 flex items-center gap-2">
            <Radio className="h-5 w-5 animate-pulse" />
            Live Now
          </h2>
          <div className="space-y-4">
            {liveStreams.map((stream) => (
              <div
                key={stream.id}
                className="bg-sola-red/10 border border-sola-red/30 p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display text-xl text-white uppercase tracking-wide">
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p className="text-white/60 mt-2">{stream.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-4">
                      {getStatusBadge(stream.status)}
                      {stream.startedAt && (
                        <span className="text-sm text-white/40">
                          Started{" "}
                          {format(new Date(stream.startedAt), "h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEnd(stream.id)}
                    className="inline-flex items-center gap-2 bg-sola-red text-white font-display font-semibold uppercase tracking-widest px-4 py-2 text-sm"
                  >
                    <Square className="h-4 w-4" />
                    End Stream
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Streams */}
      {scheduledStreams.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
            Upcoming
          </h2>
          <div className="space-y-4">
            {scheduledStreams.map((stream) => (
              <div
                key={stream.id}
                className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-lg text-white uppercase tracking-wide">
                        {stream.title}
                      </h3>
                      {stream.isPublic ? (
                        <Globe className="h-4 w-4 text-white/40" />
                      ) : (
                        <Lock className="h-4 w-4 text-white/40" />
                      )}
                    </div>
                    {stream.description && (
                      <p className="text-white/60 text-sm">{stream.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3">
                      {getStatusBadge(stream.status)}
                      {stream.scheduledAt && (
                        <span className="text-sm text-white/40">
                          {format(
                            new Date(stream.scheduledAt),
                            "MMM d, yyyy 'at' h:mm a"
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStart(stream.id)}
                      className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-2 text-sm"
                    >
                      <Play className="h-4 w-4" />
                      Go Live
                    </button>
                    <button
                      onClick={() => handleDelete(stream.id)}
                      className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:bg-sola-red/20 hover:border-sola-red/30 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-white/60" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past Streams / Recordings */}
      {pastStreams.length > 0 && (
        <div>
          <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
            Past Recordings
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastStreams.map((stream) => (
              <div
                key={stream.id}
                className="bg-white/5 border border-white/10 p-4 hover:border-white/20 transition-colors"
              >
                <div className="aspect-video bg-sola-black flex items-center justify-center mb-4">
                  {stream.muxPlaybackId ? (
                    <Video className="h-10 w-10 text-white/40" />
                  ) : (
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-white/20 mx-auto mb-2" />
                      <p className="text-xs text-white/40">No recording</p>
                    </div>
                  )}
                </div>
                <h3 className="font-display text-white uppercase tracking-wide text-sm mb-1">
                  {stream.title}
                </h3>
                <p className="text-xs text-white/40">
                  {stream.endedAt &&
                    format(new Date(stream.endedAt), "MMM d, yyyy")}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {livestreams.length === 0 && (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Video className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h3 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No Livestreams Yet
          </h3>
          <p className="text-white/60 mb-6">
            Schedule your first livestream to engage with your community.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
          >
            <Plus className="h-4 w-4" />
            Schedule Livestream
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-sola-dark-navy border border-white/10 w-full max-w-lg">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-display text-lg text-white uppercase tracking-wide">
                Schedule Livestream
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={newStream.title}
                  onChange={(e) =>
                    setNewStream({ ...newStream, title: e.target.value })
                  }
                  placeholder="Sunday Service"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  value={newStream.description}
                  onChange={(e) =>
                    setNewStream({ ...newStream, description: e.target.value })
                  }
                  rows={3}
                  placeholder="What's this livestream about?"
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
                  Scheduled For
                </label>
                <input
                  type="datetime-local"
                  value={newStream.scheduledAt}
                  onChange={(e) =>
                    setNewStream({ ...newStream, scheduledAt: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white focus:border-sola-gold focus:outline-none transition-colors"
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10">
                <div>
                  <p className="text-white font-display uppercase tracking-wide text-sm">
                    Public Access
                  </p>
                  <p className="text-sm text-white/60 mt-1">
                    Anyone can watch without logging in
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNewStream({ ...newStream, isPublic: !newStream.isPublic })
                  }
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    newStream.isPublic ? "bg-sola-gold" : "bg-white/20"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                      newStream.isPublic ? "translate-x-7" : "translate-x-1"
                    )}
                  />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newStream.title.trim() || isLoading}
                className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" />
                    Schedule
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
