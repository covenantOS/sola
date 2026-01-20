import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { cancelSubscription } from "@/lib/stripe"

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

    if (!membership?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      )
    }

    // Cancel at end of period
    await cancelSubscription(membership.stripeSubscriptionId, true)

    // Update membership status
    await db.membership.update({
      where: { id: membership.id },
      data: {
        status: "CANCELLED",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Subscription will be cancelled at the end of the billing period",
    })
  } catch (error) {
    console.error("Failed to cancel subscription:", error)
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}
