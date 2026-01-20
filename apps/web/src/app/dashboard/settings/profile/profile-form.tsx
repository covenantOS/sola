"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, User } from "lucide-react"
import { updateProfile } from "@/app/actions/settings"

interface ProfileFormProps {
  userId: string
  initialData: {
    name: string
    avatar: string
  }
}

export function ProfileForm({ userId, initialData }: ProfileFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState(initialData)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateProfile({
        userId,
        name: data.name,
        avatar: data.avatar,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        router.refresh()
      }
    } catch (err) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar Preview */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
          Profile Picture
        </h2>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-white/10 flex items-center justify-center overflow-hidden">
            {data.avatar ? (
              <img
                src={data.avatar}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-10 w-10 text-white/40" />
            )}
          </div>
          <div className="flex-1">
            <label className="block text-sm font-display text-white/80 uppercase tracking-wide mb-2">
              Avatar URL
            </label>
            <input
              type="url"
              value={data.avatar}
              onChange={(e) => setData({ ...data, avatar: e.target.value })}
              placeholder="https://example.com/avatar.jpg"
              className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
            />
            <p className="text-xs text-white/40 mt-2">
              Enter a URL to an image. Upload functionality coming soon.
            </p>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="bg-white/5 border border-white/10 p-6">
        <h2 className="font-display text-lg text-white uppercase tracking-wide mb-4">
          Display Name
        </h2>
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          placeholder="Your display name"
          className="w-full px-4 py-3 bg-white/5 border border-white/20 text-white placeholder:text-white/40 focus:border-sola-gold focus:outline-none transition-colors"
        />
        <p className="text-xs text-white/40 mt-2">
          This is how your name will appear across the platform.
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Profile updated successfully!
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
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
      </div>
    </form>
  )
}
