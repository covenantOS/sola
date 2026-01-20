"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Camera, Save } from "lucide-react"
import { updateMemberProfile } from "@/app/actions/user"

interface Props {
  user: {
    id: string
    name: string
    email: string
    avatar: string
  }
}

export function MemberSettingsForm({ user }: Props) {
  const [name, setName] = useState(user.name)
  const [avatar, setAvatar] = useState(user.avatar)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)

    startTransition(async () => {
      const formData = new FormData()
      formData.set("name", name)
      if (avatar !== user.avatar) {
        formData.set("avatar", avatar)
      }

      const result = await updateMemberProfile(formData)
      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully" })
        router.refresh()
      } else {
        setMessage({ type: "error", text: result.error || "Failed to update profile" })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-start gap-6">
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 bg-sola-gold/20 rounded-full flex items-center justify-center">
              <span className="text-sola-gold font-display text-3xl">
                {name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-sola-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-sola-gold/80 transition-colors">
            <Camera className="h-4 w-4 text-sola-black" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  // For now, create a local URL - in production, upload to storage
                  const url = URL.createObjectURL(file)
                  setAvatar(url)
                }
              }}
            />
          </label>
        </div>
        <div className="flex-1">
          <p className="text-white/50 text-sm">
            Upload a new avatar. Recommended size is 256x256 pixels.
          </p>
          {avatar && avatar !== user.avatar && (
            <button
              type="button"
              onClick={() => setAvatar(user.avatar)}
              className="text-sola-red text-sm mt-2 hover:underline"
            >
              Reset to original
            </button>
          )}
        </div>
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white focus:border-sola-gold focus:outline-none"
          placeholder="Your name"
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-xs text-white/50 uppercase tracking-wide mb-2">
          Email Address
        </label>
        <input
          type="email"
          value={user.email}
          disabled
          className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white/50 cursor-not-allowed"
        />
        <p className="text-xs text-white/30 mt-1">
          Email cannot be changed here. Contact support if needed.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 ${
            message.type === "success"
              ? "bg-green-500/10 border border-green-500/30 text-green-400"
              : "bg-sola-red/10 border border-sola-red/30 text-sola-red"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  )
}
