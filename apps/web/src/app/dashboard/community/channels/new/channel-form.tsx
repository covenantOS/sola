"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Hash, Megaphone, Calendar, BookOpen, Globe, Lock } from "lucide-react"

interface ChannelFormProps {
  communityId: string
  tiers: Array<{
    id: string
    name: string
    price: unknown
  }>
  initialData?: {
    id: string
    name: string
    slug: string
    description: string
    type: string
    isPublic: boolean
    accessTierIds: string[]
  }
}

const channelTypes = [
  { value: "DISCUSSION", label: "Discussion", icon: Hash, description: "Open conversation space" },
  { value: "ANNOUNCEMENTS", label: "Announcements", icon: Megaphone, description: "Admin-only posts" },
  { value: "EVENTS", label: "Events", icon: Calendar, description: "Event scheduling" },
  { value: "RESOURCES", label: "Resources", icon: BookOpen, description: "Files and links" },
]

export function ChannelForm({ communityId, tiers, initialData }: ChannelFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    type: initialData?.type || "DISCUSSION",
    isPublic: initialData?.isPublic ?? false,
    accessTierIds: initialData?.accessTierIds || [],
  })

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: formData.slug || generateSlug(name),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const url = initialData
        ? `/api/channels/${initialData.id}`
        : "/api/channels"
      const method = initialData ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          communityId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to save channel")
        return
      }

      router.push("/dashboard/community/channels")
      router.refresh()
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTierAccess = (tierId: string) => {
    setFormData((prev) => ({
      ...prev,
      accessTierIds: prev.accessTierIds.includes(tierId)
        ? prev.accessTierIds.filter((id) => id !== tierId)
        : [...prev.accessTierIds, tierId],
    }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-4 text-red-400">
          {error}
        </div>
      )}

      {/* Basic Info */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-6">
          Channel Details
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Channel Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sola-gold/50"
              placeholder="e.g., General Discussion"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">URL Slug *</label>
            <div className="flex items-center">
              <span className="bg-white/10 border border-white/10 border-r-0 px-4 py-3 text-white/40">
                /community/
              </span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                className="flex-1 bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sola-gold/50"
                placeholder="general-discussion"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sola-gold/50 resize-none"
              placeholder="What's this channel about?"
            />
          </div>
        </div>
      </div>

      {/* Channel Type */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-6">
          Channel Type
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {channelTypes.map((type) => (
            <label
              key={type.value}
              className={`flex items-start gap-4 p-4 border cursor-pointer transition-all ${
                formData.type === type.value
                  ? "border-sola-gold bg-sola-gold/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="type"
                value={type.value}
                checked={formData.type === type.value}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="sr-only"
              />
              <div
                className={`w-10 h-10 flex items-center justify-center ${
                  formData.type === type.value ? "bg-sola-gold/20" : "bg-white/5"
                }`}
              >
                <type.icon
                  className={`h-5 w-5 ${
                    formData.type === type.value ? "text-sola-gold" : "text-white/40"
                  }`}
                />
              </div>
              <div>
                <p className="text-white font-medium">{type.label}</p>
                <p className="text-sm text-white/40">{type.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Access Control */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-6">
          Access Control
        </h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-white">Public Channel</p>
                <p className="text-sm text-white/40">All members can access this channel</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-5 h-5 accent-sola-gold"
            />
          </label>

          {!formData.isPublic && tiers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-white/60 mb-3 flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Restrict to specific tiers:
              </p>
              <div className="space-y-2">
                {tiers.map((tier) => (
                  <label
                    key={tier.id}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={formData.accessTierIds.includes(tier.id)}
                      onChange={() => toggleTierAccess(tier.id)}
                      className="w-4 h-4 accent-sola-gold"
                    />
                    <span className="text-white">{tier.name}</span>
                    <span className="text-white/40 text-sm ml-auto">
                      ${Number(tier.price)}/mo
                    </span>
                  </label>
                ))}
              </div>
              {formData.accessTierIds.length === 0 && !formData.isPublic && (
                <p className="text-amber-400 text-sm mt-2">
                  ⚠️ No tiers selected - only admins will have access
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4">
        <Link
          href="/dashboard/community/channels"
          className="px-6 py-3 text-white/60 hover:text-white transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black px-6 py-3 font-display font-semibold uppercase tracking-widest text-sm disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {initialData ? "Update Channel" : "Create Channel"}
        </button>
      </div>
    </form>
  )
}

function Link({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
