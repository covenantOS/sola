import { NextRequest, NextResponse } from "next/server"
import {
  registerMember,
  createSession,
  setSessionCookie,
} from "@/lib/member-auth"
import { db } from "@/lib/db"
import { createMembershipCheckout } from "@/lib/stripe"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, organizationSlug, tierId } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!organizationSlug) {
      return NextResponse.json(
        { error: "Organization is required" },
        { status: 400 }
      )
    }

    // Find the organization
    const organization = await db.organization.findUnique({
      where: { slug: organizationSlug },
      include: {
        tiers: {
          where: { isActive: true },
          orderBy: { position: "asc" },
        },
      },
    })

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      )
    }

    // Get the selected tier (or default to first tier)
    const selectedTier = tierId
      ? organization.tiers.find((t) => t.id === tierId)
      : organization.tiers[0]

    if (!selectedTier) {
      return NextResponse.json(
        { error: "Membership tier not found" },
        { status: 404 }
      )
    }

    // Register the member
    const { user, error } = await registerMember(email, password, name)

    if (error) {
      return NextResponse.json({ error }, { status: 400 })
    }

    if (!user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

    // Check if tier is paid (Decimal type)
    const isPaidTier = Number(selectedTier.price) > 0

    if (isPaidTier) {
      // Check if organization has Stripe connected
      if (!organization.stripeAccountId) {
        return NextResponse.json(
          { error: "This organization hasn't set up payments yet" },
          { status: 400 }
        )
      }

      // Create a pending membership
      await db.membership.create({
        data: {
          userId: user.id,
          organizationId: organization.id,
          tierId: selectedTier.id,
          role: "MEMBER",
          status: "PENDING", // Pending until payment
        },
      })

      // Create session and set cookie so user stays logged in
      const userAgent = request.headers.get("user-agent") || undefined
      const forwarded = request.headers.get("x-forwarded-for")
      const ipAddress = forwarded?.split(",")[0] || request.headers.get("x-real-ip") || undefined
      const token = await createSession(user.id, userAgent, ipAddress)
      await setSessionCookie(token)

      // Get the host for building URLs
      const host = request.headers.get("host") || ""
      const protocol = host.includes("localhost") ? "http" : "https"
      const baseUrl = `${protocol}://${host}`

      // Create Stripe checkout session
      const { url } = await createMembershipCheckout({
        organizationId: organization.id,
        tierId: selectedTier.id,
        tierName: selectedTier.name,
        priceInCents: Math.round(Number(selectedTier.price) * 100),
        interval: (selectedTier.interval as "month" | "year") || "month",
        connectedAccountId: organization.stripeAccountId,
        customerEmail: email,
        successUrl: `${baseUrl}/member/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/signup?cancelled=true`,
        applicationFeePercent: 5, // Platform takes 5%
      })

      // Return checkout URL for redirect
      return NextResponse.json({
        success: true,
        requiresPayment: true,
        checkoutUrl: url,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      })
    }

    // Free tier - create active membership immediately
    const membership = await db.membership.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        tierId: selectedTier.id,
        role: "MEMBER",
        status: "ACTIVE",
      },
    })

    // Create session
    const userAgent = request.headers.get("user-agent") || undefined
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded?.split(",")[0] || request.headers.get("x-real-ip") || undefined

    const token = await createSession(user.id, userAgent, ipAddress)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      requiresPayment: false,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      membership: {
        id: membership.id,
        role: membership.role,
      },
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
