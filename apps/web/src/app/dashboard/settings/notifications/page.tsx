import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { NotificationsForm } from "./notifications-form"

export default async function NotificationsSettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user, organization } = await getUserWithOrganization(claims?.sub || "")

  if (!user || !organization) {
    return null
  }

  // Get notification settings from organization settings JSON
  const orgSettings = (organization.settings as Record<string, unknown>) || {}
  const notificationSettings = {
    emailNewMember: orgSettings.emailNewMember !== false,
    emailNewComment: orgSettings.emailNewComment !== false,
    emailNewEnrollment: orgSettings.emailNewEnrollment !== false,
    emailWeeklyDigest: orgSettings.emailWeeklyDigest !== false,
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
            Notification Settings
          </h1>
          <p className="text-white/60 mt-1">
            Configure how you want to be notified about activity.
          </p>
        </div>
      </div>

      {/* Notifications Form */}
      <NotificationsForm
        organizationId={organization.id}
        initialData={notificationSettings}
      />
    </div>
  )
}
