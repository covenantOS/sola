"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, User } from "lucide-react"

interface ProfileFormProps {
  member: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  primaryColor: string
}

export function ProfileForm({ member, primaryColor }: ProfileFormProps) {
  const router = useRouter()
  const [name, setName] = useState(member.name)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update profile")
      }

      setSuccess(true)
      router.refresh()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar preview */}
      <div className="flex items-center gap-4">
        {member.avatar ? (
          <img
            src={member.avatar}
            alt={member.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            {name.charAt(0) || <User className="h-6 w-6" />}
          </div>
        )}
        <div>
          <p className="text-white font-medium">{name || "Your Name"}</p>
          <p className="text-white/40 text-sm">{member.email}</p>
        </div>
      </div>

      {/* Name input */}
      <div>
        <label className="block text-sm text-white/60 mb-2">Display Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none transition-colors"
          placeholder="Your name"
        />
      </div>

      {/* Email (read-only) */}
      <div>
        <label className="block text-sm text-white/60 mb-2">Email</label>
        <input
          type="email"
          value={member.email}
          disabled
          className="w-full px-4 py-3 bg-white/5 border border-white/10 text-white/40 cursor-not-allowed"
        />
        <p className="text-white/30 text-xs mt-1">Email cannot be changed</p>
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div
          className="p-3 text-sm"
          style={{ backgroundColor: `${primaryColor}10`, borderColor: `${primaryColor}30`, color: primaryColor }}
        >
          Profile updated successfully!
        </div>
      )}

      {/* Submit button */}
      <button
        type="submit"
        disabled={isSubmitting || name === member.name}
        className="flex items-center gap-2 px-6 py-3 font-display uppercase tracking-wide text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        style={{
          backgroundColor: name !== member.name ? primaryColor : "rgba(255,255,255,0.1)",
          color: name !== member.name ? "#000" : "rgba(255,255,255,0.4)",
        }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Save Changes
          </>
        )}
      </button>
    </form>
  )
}
