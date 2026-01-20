"use client"
export const dynamic = "force-dynamic"


import { useState, useEffect, useCallback } from "react"
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Play,
  Settings,
  Trash2,
  Eye,
  Users,
  Radio,
  Copy,
  Check,
  X,
} from "lucide-react"
import { getLivestreams, createLivestream, deleteLivestream, startLivestream, endLivestream } from "@/app/actions/livestreams"
import { format } from "date-fns"

type Livestream = {
  id: string
  title: string
  description: string | null
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED"
  scheduledAt: Date | null
  startedAt: Date | null
  endedAt: Date | null
  livekitRoomName: string | null
  isPublic: boolean
}

export default function LivestreamsPage() {
  const [livestreams, setLivestreams] = useState<Livestream[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    scheduledTime: "",
    isPublic: true,
  })
  const [submitting, setSubmitting] = useState(false)
  const [streamDetails, setStreamDetails] = useState<{
    id: string
    rtmpUrl: string
    streamKey: string
  } | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    loadLivestreams()
  }, [])

  const loadLivestreams = async () => {
    const result = await getLivestreams()
    if (result.livestreams) {
      setLivestreams(result.livestreams as Livestream[])
    }
    setLoading(false)
  }

  const handleCreate = useCallback(async () => {
    if (!formData.title.trim()) return
    setSubmitting(true)

    const data = new FormData()
    data.set("title", formData.title)
    data.set("description", formData.description)
    data.set("isPublic", formData.isPublic.toString())

    if (formData.scheduledAt && formData.scheduledTime) {
      const scheduledAt = new Date(`${formData.scheduledAt}T${formData.scheduledTime}`)
      data.set("scheduledAt", scheduledAt.toISOString())
    }

    const result = await createLivestream(data)
    if (result.success) {
      await loadLivestreams()
      setShowForm(false)
      setFormData({
        title: "",
        description: "",
        scheduledAt: "",
        scheduledTime: "",
        isPublic: true,
      })
    }
    setSubmitting(false)
  }, [formData])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this livestream?")) return

    const result = await deleteLivestream(id)
    if (result.success) {
      setLivestreams((prev) => prev.filter((l) => l.id !== id))
    }
  }, [])

  const handleGoLive = useCallback(async (id: string) => {
    const result = await startLivestream(id)
    if (result.success && result.streamDetails) {
      setStreamDetails({
        id,
        rtmpUrl: result.streamDetails.rtmpUrl,
        streamKey: result.streamDetails.streamKey,
      })
      await loadLivestreams()
    }
  }, [])

  const handleEndStream = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to end this livestream?")) return

    const result = await endLivestream(id)
    if (result.success) {
      setStreamDetails(null)
      await loadLivestreams()
    }
  }, [])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  const statusColors = {
    SCHEDULED: "text-sola-gold bg-sola-gold/10",
    LIVE: "text-sola-red bg-sola-red/10",
    ENDED: "text-white/40 bg-white/5",
    CANCELLED: "text-white/40 bg-white/5",
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-sola-gold"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-white uppercase tracking-tight">
            Livestreams
          </h1>
          <p className="text-white/60 mt-2">
            Schedule and manage your livestreams
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
        >
          <Plus className="h-4 w-4" />
          Schedule Stream
        </button>
      </div>

      {/* Stream Details Modal */}
      {streamDetails && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-sola-dark-navy border border-white/10 w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-display text-xl text-white uppercase tracking-wide flex items-center gap-2">
                <Radio className="h-5 w-5 text-sola-red animate-pulse" />
                You&apos;re Live!
              </h2>
              <button
                onClick={() => setStreamDetails(null)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-white/60">
                Use the following details to connect your streaming software (OBS, Streamyard, etc.)
              </p>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                  RTMP URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={streamDetails.rtmpUrl}
                    readOnly
                    className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(streamDetails.rtmpUrl, "rtmpUrl")}
                    className="px-4 bg-white/5 border border-white/10 text-white/60 hover:text-white"
                  >
                    {copied === "rtmpUrl" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                  Stream Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={streamDetails.streamKey}
                    readOnly
                    className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(streamDetails.streamKey, "streamKey")}
                    className="px-4 bg-white/5 border border-white/10 text-white/60 hover:text-white"
                  >
                    {copied === "streamKey" ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleEndStream(streamDetails.id)}
                className="w-full bg-sola-red text-white font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
              >
                End Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-sola-dark-navy border border-white/10 w-full max-w-lg">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-display text-xl text-white uppercase tracking-wide">
                Schedule Livestream
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-white/60 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
                  placeholder="e.g., Sunday Service"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none resize-none"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData((p) => ({ ...p, scheduledAt: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => setFormData((p) => ({ ...p, scheduledTime: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={formData.isPublic}
                  onChange={(e) => setFormData((p) => ({ ...p, isPublic: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="isPublic" className="text-white/60 text-sm">
                  Public (visible to non-members)
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-4">
              <button
                onClick={() => setShowForm(false)}
                className="px-6 py-3 text-white/60 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !formData.title.trim()}
                className="bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm disabled:opacity-50"
              >
                {submitting ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Livestreams List */}
      {livestreams.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <Video className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No Livestreams
          </h2>
          <p className="text-white/60 mb-6">
            Schedule your first livestream to connect with your community
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm"
          >
            <Plus className="h-4 w-4" />
            Schedule Stream
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {livestreams.map((stream) => (
            <div
              key={stream.id}
              className="bg-white/5 border border-white/10 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-sola-gold/10 flex items-center justify-center">
                    <Video className="h-8 w-8 text-sola-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-lg text-white uppercase tracking-wide">
                        {stream.title}
                      </h3>
                      <span
                        className={`px-2 py-0.5 text-xs uppercase tracking-wide ${
                          statusColors[stream.status]
                        }`}
                      >
                        {stream.status === "LIVE" && (
                          <span className="inline-block w-1.5 h-1.5 bg-sola-red rounded-full mr-1 animate-pulse" />
                        )}
                        {stream.status}
                      </span>
                    </div>
                    {stream.description && (
                      <p className="text-white/60 text-sm mt-1">{stream.description}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                      {stream.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(stream.scheduledAt), "MMM d, yyyy")}
                        </span>
                      )}
                      {stream.scheduledAt && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {format(new Date(stream.scheduledAt), "h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {stream.status === "SCHEDULED" && (
                    <button
                      onClick={() => handleGoLive(stream.id)}
                      className="flex items-center gap-2 bg-sola-red text-white font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs"
                    >
                      <Radio className="h-3 w-3" />
                      Go Live
                    </button>
                  )}
                  {stream.status === "LIVE" && (
                    <button
                      onClick={() => handleEndStream(stream.id)}
                      className="flex items-center gap-2 border border-sola-red text-sola-red font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs"
                    >
                      End Stream
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(stream.id)}
                    className="p-2 text-white/40 hover:text-sola-red"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
