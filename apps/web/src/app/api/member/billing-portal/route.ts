import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { createBillingPortalSession } from "@/lib/stripe"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()
    const org = await getOrganizationByDomain()

    if (!member || !org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get membership
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: member.id,
          organizationId: org.id,
        },
      },
    })

    if (!membership?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      )
    }

    // Get the host for return URL
    const host = request.headers.get("host") || ""
    const protocol = host.includes("localhost") ? "http" : "https"
    const returnUrl = `${protocol}://${host}/member/profile`

    // Create billing portal session
    const session = await createBillingPortalSession(
      membership.stripeCustomerId,
      returnUrl
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Failed to create billing portal session:", error)
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    )
  }
}
