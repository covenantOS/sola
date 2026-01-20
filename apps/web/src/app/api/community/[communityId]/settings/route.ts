import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ communityId: string }> }
) {
  try {
    const { communityId } = await params
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify community belongs to organization
    const community = await db.community.findFirst({
      where: {
        id: communityId,
        organizationId: organization.id,
      },
    })

    if (!community) {
      return NextResponse.json({ error: "Community not found" }, { status: 404 })
    }

    const { name, description, isPublic, requireApproval, allowMemberPosts, enableNotifications } =
      await request.json()

    const currentSettings = (community.settings as Record<string, unknown>) || {}

    const updatedCommunity = await db.community.update({
      where: { id: communityId },
      data: {
        name,
        description,
        settings: {
          ...currentSettings,
          isPublic,
          requireApproval,
          allowMemberPosts,
          enableNotifications,
        },
      },
    })

    return NextResponse.json({ community: updatedCommunity })
  } catch (error) {
    console.error("Failed to update community settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}
