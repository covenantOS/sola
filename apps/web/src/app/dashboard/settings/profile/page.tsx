import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ProfileForm } from "./profile-form"

export default async function ProfileSettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return null
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
  })

  if (!user) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/settings"
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/60" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Profile Settings
          </h1>
          <p className="text-white/60 mt-1">
            Update your personal information and public profile.
          </p>
        </div>
      </div>

      {/* Profile Form */}
      <ProfileForm
        userId={user.id}
        initialData={{
          name: user.name || "",
          avatar: user.avatar || "",
        }}
      />
    </div>
  )
}
