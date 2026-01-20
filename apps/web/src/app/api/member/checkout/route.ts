import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain, getSubdomainInfo } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { createMembershipCheckout } from "@/lib/stripe"

export const dynamic = "force-dynamic"

const PLATFORM_FEE_PERCENT = parseInt(process.env.PLATFORM_FEE_PERCENT || "0", 10)

export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()
    const org = await getOrganizationByDomain()

    if (!member || !org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if org has Stripe connected
    if (!org.stripeAccountId || !org.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: "This organization is not ready to accept payments" },
        { status: 400 }
      )
    }

    const { tierId } = await request.json()

    if (!tierId) {
      return NextResponse.json({ error: "Tier ID required" }, { status: 400 })
    }

    // Get the tier
    const tier = await db.membershipTier.findFirst({
      where: {
        id: tierId,
        organizationId: org.id,
        isActive: true,
      },
    })

    if (!tier) {
      return NextResponse.json({ error: "Tier not found" }, { status: 404 })
    }

    if (Number(tier.price) === 0) {
      return NextResponse.json(
        { error: "This is a free tier, no payment needed" },
        { status: 400 }
      )
    }

    // Get membership to check current tier and customer ID
    const membership = await db.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: member.id,
          organizationId: org.id,
        },
      },
    })

    // Build URLs
    const { originalHost } = await getSubdomainInfo()
    const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
    const baseUrl = `${protocol}://${originalHost}`

    const priceInCents = Math.round(Number(tier.price) * 100)
    const interval = tier.interval === "year" ? "year" : "month"

    // Create checkout session
    const { url, customerId } = await createMembershipCheckout({
      organizationId: org.id,
      tierId: tier.id,
      tierName: tier.name,
      priceInCents,
      interval,
      connectedAccountId: org.stripeAccountId,
      customerId: membership?.stripeCustomerId || undefined,
      customerEmail: member.email,
      successUrl: `${baseUrl}/member/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/member/upgrade?canceled=true`,
      applicationFeePercent: PLATFORM_FEE_PERCENT,
    })

    // Update membership with customer ID if new
    if (membership && customerId && !membership.stripeCustomerId) {
      await db.membership.update({
        where: { id: membership.id },
        data: { stripeCustomerId: customerId },
      })
    }

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }
}
