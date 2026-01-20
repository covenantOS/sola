"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Shield, Bell, Users, MessageSquare } from "lucide-react"

interface CommunitySettingsFormProps {
  communityId: string
  initialData: {
    name: string
    description: string
    isPublic: boolean
    requireApproval: boolean
    allowMemberPosts: boolean
    enableNotifications: boolean
  }
}

export function CommunitySettingsForm({ communityId, initialData }: CommunitySettingsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState(initialData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess(false)

    try {
      const res = await fetch(`/api/community/${communityId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setSuccess(true)
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to update settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-6">
          Basic Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">Community Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sola-gold/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-sola-gold/50 resize-none"
              placeholder="Describe your community..."
            />
          </div>
        </div>
      </div>

      {/* Access Settings */}
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-5 w-5 text-sola-gold" />
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Access Settings
          </h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-white">Public Community</p>
                <p className="text-sm text-white/40">Anyone can view the community landing page</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="w-5 h-5 accent-sola-gold"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-white">Require Approval</p>
                <p className="text-sm text-white/40">New members need approval to join</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.requireApproval}
              onChange={(e) => setFormData({ ...formData, requireApproval: e.target.checked })}
              className="w-5 h-5 accent-sola-gold"
            />
          </label>
        </div>
      </div>

      {/* Posting Settings */}
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="h-5 w-5 text-sola-gold" />
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Posting Settings
          </h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-white">Allow Member Posts</p>
                <p className="text-sm text-white/40">Members can create posts in discussion channels</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.allowMemberPosts}
              onChange={(e) => setFormData({ ...formData, allowMemberPosts: e.target.checked })}
              className="w-5 h-5 accent-sola-gold"
            />
          </label>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="h-5 w-5 text-sola-gold" />
          <h2 className="font-display text-lg text-white uppercase tracking-wide">
            Notifications
          </h2>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-white/40" />
              <div>
                <p className="text-white">Enable Notifications</p>
                <p className="text-sm text-white/40">Send email notifications for new posts and replies</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={formData.enableNotifications}
              onChange={(e) => setFormData({ ...formData, enableNotifications: e.target.checked })}
              className="w-5 h-5 accent-sola-gold"
            />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        {success && (
          <p className="text-green-400 text-sm">Settings saved successfully!</p>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="ml-auto inline-flex items-center gap-2 bg-sola-gold text-sola-black px-6 py-3 font-display font-semibold uppercase tracking-widest text-sm disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Settings
        </button>
      </div>
    </form>
  )
}
