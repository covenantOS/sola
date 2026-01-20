import { NextRequest, NextResponse } from "next/server"
import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const member = await getCurrentMember()
    const org = await getOrganizationByDomain()

    if (!member || !org) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID required" }, { status: 400 })
    }

    // Get course and verify it belongs to this org
    const course = await db.course.findFirst({
      where: {
        id: courseId,
        organizationId: org.id,
        isPublished: true,
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
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

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 })
    }

    const memberTierIds = membership.tierId ? [membership.tierId] : []

    // Check access
    const hasAccess =
      course.accessType === "FREE" ||
      course.accessTierIds.some((id) => memberTierIds.includes(id))

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have access to this course" },
        { status: 403 }
      )
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: member.id,
          courseId: course.id,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json({ enrollment: existingEnrollment })
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        userId: member.id,
        courseId: course.id,
        progress: 0,
      },
    })

    return NextResponse.json({ enrollment })
  } catch (error) {
    console.error("Enroll error:", error)
    return NextResponse.json({ error: "Failed to enroll" }, { status: 500 })
  }
}
