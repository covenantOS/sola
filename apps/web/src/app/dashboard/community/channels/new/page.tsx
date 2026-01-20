import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ChannelForm } from "./channel-form"

export default async function NewChannelPage() {
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

  // Get tiers for access control
  const tiers = await db.membershipTier.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: { position: "asc" },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/community/channels"
          className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-white/60" />
        </Link>
        <div>
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            Create Channel
          </h1>
          <p className="text-white/60 mt-1">
            Add a new channel to your community.
          </p>
        </div>
      </div>

      <ChannelForm communityId={community.id} tiers={tiers} />
    </div>
  )
}
