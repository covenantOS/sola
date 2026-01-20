import { NextRequest, NextResponse } from "next/server"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params

  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return NextResponse.json({ error: "Organization not found" }, { status: 404 })
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              organizationId: true,
            },
          },
        },
      },
    },
  })

  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
  }

  // Verify ownership
  if (lesson.module.course.organizationId !== organization.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  return NextResponse.json({
    lesson: {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      content: lesson.content,
      muxPlaybackId: lesson.muxPlaybackId,
      muxAssetId: lesson.muxAssetId,
      videoDuration: lesson.videoDuration,
      isFreePreview: lesson.isFreePreview,
      position: lesson.position,
      moduleId: lesson.moduleId,
    },
    module: {
      id: lesson.module.id,
      title: lesson.module.title,
      courseId: lesson.module.courseId,
      course: {
        id: lesson.module.course.id,
        title: lesson.module.course.title,
      },
    },
  })
}
