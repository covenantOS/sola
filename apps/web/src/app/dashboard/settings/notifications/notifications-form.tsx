"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save, Bell, Mail } from "lucide-react"
import { updateNotificationSettings } from "@/app/actions/settings"
import { cn } from "@/lib/utils"

interface NotificationsFormProps {
  organizationId: string
  initialData: {
    emailNewMember: boolean
    emailNewComment: boolean
    emailNewEnrollment: boolean
    emailWeeklyDigest: boolean
  }
}

const notifications = [
  {
    key: "emailNewMember",
    label: "New Member",
    description: "Get notified when someone joins your community",
  },
  {
    key: "emailNewComment",
    label: "New Comments",
    description: "Get notified when someone comments on your posts",
  },
  {
    key: "emailNewEnrollment",
    label: "Course Enrollments",
    description: "Get notified when someone enrolls in a course",
  },
  {
    key: "emailWeeklyDigest",
    label: "Weekly Digest",
    description: "Receive a weekly summary of your community activity",
  },
]

export function NotificationsForm({ organizationId, initialData }: NotificationsFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [data, setData] = useState(initialData)

  const handleToggle = (key: keyof typeof data) => {
    setData((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const result = await updateNotificationSettings({
        organizationId,
        ...data,
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
      {/* Email Notifications */}
      <div className="bg-white/5 border border-white/10 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-sola-gold" />
          </div>
          <div>
            <h2 className="font-display text-lg text-white uppercase tracking-wide">
              Email Notifications
            </h2>
            <p className="text-sm text-white/60">
              Choose what emails you want to receive
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.key}
              className="flex items-center justify-between p-4 bg-white/5 border border-white/10"
            >
              <div>
                <p className="text-white font-display uppercase tracking-wide text-sm">
                  {notification.label}
                </p>
                <p className="text-sm text-white/60 mt-1">
                  {notification.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(notification.key as keyof typeof data)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative",
                  data[notification.key as keyof typeof data]
                    ? "bg-sola-gold"
                    : "bg-white/20"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    data[notification.key as keyof typeof data]
                      ? "translate-x-7"
                      : "translate-x-1"
                  )}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-sola-red/10 border border-sola-red/30 text-sola-red text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Notification settings updated!
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
