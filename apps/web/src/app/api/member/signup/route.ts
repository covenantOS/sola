import { NextRequest, NextResponse } from "next/server"
import {
  registerMember,
  createSession,
  setSessionCookie,
  joinOrganization,
} from "@/lib/member-auth"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, organizationSlug } = body

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

    // Join the organization
    const joinResult = await joinOrganization(user.id, organizationSlug)

    if (joinResult.error) {
      return NextResponse.json({ error: joinResult.error }, { status: 400 })
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
      membership: joinResult.membership,
    })
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}
