import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const member = await getCurrentMember()

    if (!member) {
      return NextResponse.json({ user: null })
    }

    // Get organizationSlug from query params or subdomain
    const searchParams = request.nextUrl.searchParams
    const orgSlug = searchParams.get("org")

    let membership = null
    let organization = null

    if (orgSlug) {
      organization = await db.organization.findUnique({
        where: { slug: orgSlug },
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
          settings: true,
        },
      })

      if (organization) {
        membership = await db.membership.findUnique({
          where: {
            userId_organizationId: {
              userId: member.id,
              organizationId: organization.id,
            },
          },
          include: {
            tier: {
              select: {
                id: true,
                name: true,
                features: true,
              },
            },
          },
        })
      }
    }

    return NextResponse.json({
      user: {
        id: member.id,
        email: member.email,
        name: member.name,
        avatar: member.avatar,
      },
      membership: membership
        ? {
            id: membership.id,
            role: membership.role,
            status: membership.status,
            tier: membership.tier,
          }
        : null,
      organization: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            logo: organization.logo,
          }
        : null,
    })
  } catch (error) {
    console.error("Get member error:", error)
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    )
  }
}
