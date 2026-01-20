import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import crypto from "crypto"

export async function GET() {
  try {
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const domains = await db.domain.findMany({
      where: { organizationId: organization.id },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    })

    return NextResponse.json({ domains })
  } catch (error) {
    console.error("Failed to get domains:", error)
    return NextResponse.json({ error: "Failed to get domains" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { domain, targetType, targetId } = await request.json()

    if (!domain) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 })
    }

    // Validate domain format
    const domainRegex = /^([a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      return NextResponse.json({ error: "Invalid domain format" }, { status: 400 })
    }

    // Check if domain already exists
    const existingDomain = await db.domain.findUnique({
      where: { domain },
    })

    if (existingDomain) {
      return NextResponse.json({ error: "Domain already in use" }, { status: 400 })
    }

    // If targeting a course, verify it belongs to this org
    if (targetType === "COURSE" && targetId) {
      const course = await db.course.findFirst({
        where: { id: targetId, organizationId: organization.id },
      })
      if (!course) {
        return NextResponse.json({ error: "Course not found" }, { status: 404 })
      }
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(16).toString("hex")

    // Check if this is the first custom domain
    const existingDomains = await db.domain.count({
      where: { organizationId: organization.id },
    })

    const newDomain = await db.domain.create({
      data: {
        organizationId: organization.id,
        domain,
        type: "CUSTOM",
        status: "PENDING",
        targetType: targetType || "COMMUNITY",
        targetId: targetId || null,
        verificationToken,
        isPrimary: existingDomains === 0,
      },
    })

    // TODO: Add domain to Vercel via API
    // This would require VERCEL_TOKEN and VERCEL_PROJECT_ID env vars

    return NextResponse.json({ domain: newDomain })
  } catch (error) {
    console.error("Failed to add domain:", error)
    return NextResponse.json({ error: "Failed to add domain" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { claims } = await getLogtoContext(logtoConfig)
    const { organization } = await getUserWithOrganization(claims?.sub || "")

    if (!organization) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const domainId = searchParams.get("id")

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 })
    }

    // Verify domain belongs to this org
    const domain = await db.domain.findFirst({
      where: { id: domainId, organizationId: organization.id },
    })

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 })
    }

    await db.domain.delete({
      where: { id: domainId },
    })

    // TODO: Remove domain from Vercel via API

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete domain:", error)
    return NextResponse.json({ error: "Failed to delete domain" }, { status: 500 })
  }
}
