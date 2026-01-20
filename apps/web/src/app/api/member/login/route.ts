import { NextRequest, NextResponse } from "next/server"
import {
  loginMember,
  createSession,
  setSessionCookie,
} from "@/lib/member-auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, organizationSlug } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Login the member
    const { user, error } = await loginMember(email, password)

    if (error) {
      return NextResponse.json({ error }, { status: 401 })
    }

    if (!user) {
      return NextResponse.json(
        { error: "Failed to login" },
        { status: 500 }
      )
    }

    // If organizationSlug is provided, verify membership
    if (organizationSlug) {
      const organization = await db.organization.findUnique({
        where: { slug: organizationSlug },
      })

      if (!organization) {
        return NextResponse.json(
          { error: "Organization not found" },
          { status: 404 }
        )
      }

      const membership = await db.membership.findUnique({
        where: {
          userId_organizationId: {
            userId: user.id,
            organizationId: organization.id,
          },
        },
      })

      if (!membership) {
        return NextResponse.json(
          { error: "You are not a member of this community. Please sign up first." },
          { status: 403 }
        )
      }
    }

    // Create session
    const userAgent = request.headers.get("user-agent") || undefined
    const forwarded = request.headers.get("x-forwarded-for")
    const ipAddress = forwarded?.split(",")[0] || request.headers.get("x-real-ip") || undefined

    const token = await createSession(user.id, userAgent, ipAddress)
    await setSessionCookie(token)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    )
  }
}
