import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft, Shield, Bell, Lock, Users } from "lucide-react"
import { CommunitySettingsForm } from "./settings-form"

export default async function CommunitySettingsPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return <div>Organization not found</div>
  }

  const community = await db.community.findFirst({
    where: { organizationId: organization.id, isDefault: true },
  })

  if (!community) {
    return (
      <div className="text-center py-12">
        <p className="text-white/60">No community found. Create one first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/community"
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/60" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Community Settings
          </h1>
          <p className="text-white/60 mt-1">
            Configure community rules and access settings.
          </p>
        </div>
      </div>

      <CommunitySettingsForm
        communityId={community.id}
        initialData={{
          name: community.name,
          description: community.description || "",
          isPublic: (community.settings as Record<string, unknown>)?.isPublic as boolean ?? true,
          requireApproval: (community.settings as Record<string, unknown>)?.requireApproval as boolean || false,
          allowMemberPosts: (community.settings as Record<string, unknown>)?.allowMemberPosts as boolean ?? true,
          enableNotifications: (community.settings as Record<string, unknown>)?.enableNotifications as boolean ?? true,
        }}
      />
    </div>
  )
}
