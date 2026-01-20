import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { communityId, name, slug, description, type, isPublic, accessTierIds } =
      await request.json()

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

    // Check for duplicate slug
    const existingChannel = await db.channel.findFirst({
      where: {
        communityId,
        slug,
      },
    })

    if (existingChannel) {
      return NextResponse.json({ error: "A channel with this URL already exists" }, { status: 400 })
    }

    // Get max position
    const maxPosition = await db.channel.findFirst({
      where: { communityId },
      orderBy: { position: "desc" },
      select: { position: true },
    })

    const channel = await db.channel.create({
      data: {
        communityId,
        name,
        slug,
        description,
        type,
        isPublic,
        accessTierIds,
        position: (maxPosition?.position || 0) + 1,
      },
    })

    return NextResponse.json({ channel })
  } catch (error) {
    console.error("Failed to create channel:", error)
    return NextResponse.json({ error: "Failed to create channel" }, { status: 500 })
  }
}
