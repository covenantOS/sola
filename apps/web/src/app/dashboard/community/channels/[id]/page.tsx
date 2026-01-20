import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2 } from "lucide-react"
import { ChannelForm } from "../new/channel-form"
import { DeleteChannelButton } from "./delete-button"

export default async function EditChannelPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return <div>Organization not found</div>
  }

  const channel = await db.channel.findFirst({
    where: {
      id,
      community: {
        organizationId: organization.id,
      },
    },
    include: {
      community: true,
    },
  })

  if (!channel) {
    notFound()
  }

  // Get tiers for access control
  const tiers = await db.membershipTier.findMany({
    where: { organizationId: organization.id, isActive: true },
    orderBy: { position: "asc" },
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/community/channels"
            className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-white/60" />
          </Link>
          <div>
            <h1 className="font-display text-2xl text-white uppercase tracking-wide">
              Edit Channel
            </h1>
            <p className="text-white/60 mt-1">
              Update channel settings and access controls.
            </p>
          </div>
        </div>
        <DeleteChannelButton channelId={channel.id} channelName={channel.name} />
      </div>

      <ChannelForm
        communityId={channel.communityId}
        tiers={tiers}
        initialData={{
          id: channel.id,
          name: channel.name,
          slug: channel.slug,
          description: channel.description || "",
          type: channel.type,
          isPublic: channel.isPublic,
          accessTierIds: channel.accessTierIds,
        }}
      />
    </div>
  )
}
