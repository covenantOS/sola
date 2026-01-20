import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const organization = await db.organization.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        logo: true,
        banner: true,
        settings: true,
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Get active membership tiers
    const tiers = await db.membershipTier.findMany({
      where: {
        organizationId: organization.id,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        interval: true,
        features: true,
        position: true,
      },
      orderBy: { position: "asc" },
    })

    // Get stats
    const [memberCount, courseCount, communityCount] = await Promise.all([
      db.membership.count({ where: { organizationId: organization.id } }),
      db.course.count({ where: { organizationId: organization.id, isPublished: true } }),
      db.community.count({ where: { organizationId: organization.id } }),
    ])

    return NextResponse.json({
      organization,
      tiers: tiers.map((tier) => ({
        ...tier,
        price: Number(tier.price),
        features: typeof tier.features === "string" ? JSON.parse(tier.features) : tier.features,
      })),
      stats: {
        members: memberCount,
        courses: courseCount,
        communities: communityCount,
      },
    })
  } catch (error) {
    console.error("Get organization error:", error)
    return NextResponse.json(
      { error: "Failed to get organization info" },
      { status: 500 }
    )
  }
}
