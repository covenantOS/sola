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

    const { lessonId } = await request.json()

    if (!lessonId) {
      return NextResponse.json({ error: "Lesson ID required" }, { status: 400 })
    }

    // Get lesson with module and course
    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                organizationId: true,
              },
            },
          },
        },
      },
    })

    if (!lesson || lesson.module.course.organizationId !== org.id) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const courseId = lesson.module.course.id

    // Check enrollment
    const enrollment = await db.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId: member.id,
          courseId,
        },
      },
    })

    if (!enrollment) {
      // Auto-enroll if course is free
      const course = await db.course.findUnique({
        where: { id: courseId },
      })

      if (course?.accessType !== "FREE") {
        return NextResponse.json({ error: "Not enrolled" }, { status: 403 })
      }

      await db.enrollment.create({
        data: {
          userId: member.id,
          courseId,
          progress: 0,
        },
      })
    }

    // Create or update completion
    const completion = await db.lessonCompletion.upsert({
      where: {
        userId_lessonId: {
          userId: member.id,
          lessonId,
        },
      },
      create: {
        userId: member.id,
        lessonId,
      },
      update: {
        completedAt: new Date(),
      },
    })

    // Update enrollment progress
    await updateEnrollmentProgress(member.id, courseId)

    return NextResponse.json({ completion })
  } catch (error) {
    console.error("Complete lesson error:", error)
    return NextResponse.json(
      { error: "Failed to complete lesson" },
      { status: 500 }
    )
  }
}

async function updateEnrollmentProgress(userId: string, courseId: string) {
  // Get all lessons in the course
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  })

  if (!course) return

  const allLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id))
  const totalLessons = allLessonIds.length

  if (totalLessons === 0) return

  // Get completed lessons
  const completedLessons = await db.lessonCompletion.count({
    where: {
      userId,
      lessonId: { in: allLessonIds },
    },
  })

  const progress = (completedLessons / totalLessons) * 100

  // Update enrollment
  await db.enrollment.update({
    where: {
      userId_courseId: {
        userId,
        courseId,
      },
    },
    data: {
      progress,
      completedAt: progress >= 100 ? new Date() : null,
    },
  })
}
