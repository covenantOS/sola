"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// ==================== COURSES ====================

export async function getCourses() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Organization not found", courses: [] }
  }

  const courses = await db.course.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    include: {
      modules: {
        include: {
          _count: {
            select: { lessons: true },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  })

  return { courses }
}

export async function getCourse(courseId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Organization not found" }
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
      },
      _count: {
        select: {
          enrollments: true,
        },
      },
    },
  })

  if (!course || course.organizationId !== organization.id) {
    return { error: "Course not found" }
  }

  return { course }
}

export async function createCourse(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string | undefined
  const price = formData.get("price") as string | undefined

  if (!title || title.trim().length < 2) {
    return { error: "Course title must be at least 2 characters" }
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  try {
    const course = await db.course.create({
      data: {
        title: title.trim(),
        slug,
        description: description?.trim(),
        price: price ? parseFloat(price) : null,
        organizationId: organization.id,
      },
    })

    revalidatePath("/dashboard/courses")
    return { success: true, course }
  } catch (error) {
    console.error("Failed to create course:", error)
    return { error: "Failed to create course" }
  }
}

export async function updateCourse(courseId: string, formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string | undefined
  const price = formData.get("price") as string | undefined
  const isPublished = formData.get("isPublished") === "true"

  try {
    const course = await db.course.update({
      where: { id: courseId },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        price: price ? parseFloat(price) : null,
        isPublished,
      },
    })

    revalidatePath("/dashboard/courses")
    revalidatePath(`/dashboard/courses/${courseId}`)
    return { success: true, course }
  } catch (error) {
    console.error("Failed to update course:", error)
    return { error: "Failed to update course" }
  }
}

export async function deleteCourse(courseId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    await db.course.delete({
      where: { id: courseId },
    })

    revalidatePath("/dashboard/courses")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete course:", error)
    return { error: "Failed to delete course" }
  }
}

// ==================== MODULES ====================

export async function createModule(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const courseId = formData.get("courseId") as string
  const title = formData.get("title") as string

  if (!title || title.trim().length < 2) {
    return { error: "Module title must be at least 2 characters" }
  }

  // Get max position
  const maxPosition = await db.courseModule.aggregate({
    where: { courseId },
    _max: { position: true },
  })

  try {
    const module = await db.courseModule.create({
      data: {
        title: title.trim(),
        courseId,
        position: (maxPosition._max.position || 0) + 1,
      },
    })

    revalidatePath(`/dashboard/courses/${courseId}`)
    return { success: true, module }
  } catch (error) {
    console.error("Failed to create module:", error)
    return { error: "Failed to create module" }
  }
}

export async function updateModule(moduleId: string, formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const title = formData.get("title") as string

  try {
    const module = await db.courseModule.update({
      where: { id: moduleId },
      data: { title: title?.trim() },
    })

    revalidatePath(`/dashboard/courses`)
    return { success: true, module }
  } catch (error) {
    console.error("Failed to update module:", error)
    return { error: "Failed to update module" }
  }
}

export async function deleteModule(moduleId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    await db.courseModule.delete({
      where: { id: moduleId },
    })

    revalidatePath(`/dashboard/courses`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete module:", error)
    return { error: "Failed to delete module" }
  }
}

// ==================== LESSONS ====================

export async function createLesson(formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const moduleId = formData.get("moduleId") as string
  const title = formData.get("title") as string
  const description = formData.get("description") as string | undefined
  const type = (formData.get("type") as string) || "VIDEO"

  if (!title || title.trim().length < 2) {
    return { error: "Lesson title must be at least 2 characters" }
  }

  // Get max position
  const maxPosition = await db.lesson.aggregate({
    where: { moduleId },
    _max: { position: true },
  })

  try {
    const lesson = await db.lesson.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        type: type as "VIDEO" | "TEXT" | "QUIZ" | "ASSIGNMENT",
        moduleId,
        position: (maxPosition._max.position || 0) + 1,
      },
    })

    revalidatePath(`/dashboard/courses`)
    return { success: true, lesson }
  } catch (error) {
    console.error("Failed to create lesson:", error)
    return { error: "Failed to create lesson" }
  }
}

export async function updateLesson(lessonId: string, formData: FormData) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  const title = formData.get("title") as string
  const description = formData.get("description") as string | undefined
  const content = formData.get("content") as string | undefined
  const isPublished = formData.get("isPublished") === "true"

  try {
    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data: {
        title: title?.trim(),
        description: description?.trim(),
        content: content?.trim(),
        isPublished,
      },
    })

    revalidatePath(`/dashboard/courses`)
    return { success: true, lesson }
  } catch (error) {
    console.error("Failed to update lesson:", error)
    return { error: "Failed to update lesson" }
  }
}

export async function deleteLesson(lessonId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    await db.lesson.delete({
      where: { id: lessonId },
    })

    revalidatePath(`/dashboard/courses`)
    return { success: true }
  } catch (error) {
    console.error("Failed to delete lesson:", error)
    return { error: "Failed to delete lesson" }
  }
}

export async function attachVideoToLesson(lessonId: string, muxAssetId: string, muxPlaybackId: string, duration?: number) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  try {
    const lesson = await db.lesson.update({
      where: { id: lessonId },
      data: {
        muxAssetId,
        muxPlaybackId,
        videoDuration: duration,
      },
    })

    revalidatePath(`/dashboard/courses`)
    return { success: true, lesson }
  } catch (error) {
    console.error("Failed to attach video to lesson:", error)
    return { error: "Failed to attach video" }
  }
}

// ==================== ENROLLMENTS & PROGRESS ====================

export async function getEnrollments(courseId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized", enrollments: [] }
  }

  const enrollments = await db.enrollment.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return { enrollments }
}

export async function getUserProgress(courseId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user } = await getUserWithOrganization(claims?.sub || "")

  if (!user) {
    return { error: "Not authenticated" }
  }

  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId: user.id, courseId },
    },
  })

  if (!enrollment) {
    return { error: "Not enrolled" }
  }

  // Get completed lessons
  const completedLessons = await db.lessonCompletion.findMany({
    where: {
      userId: user.id,
      lesson: {
        module: {
          courseId,
        },
      },
    },
    select: {
      lessonId: true,
    },
  })

  return {
    enrollment,
    progress: enrollment.progress,
    completedLessonIds: completedLessons.map(c => c.lessonId),
  }
}

export async function markLessonComplete(lessonId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { user } = await getUserWithOrganization(claims?.sub || "")

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Get lesson and its course
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        include: {
          course: true,
        },
      },
    },
  })

  if (!lesson) {
    return { error: "Lesson not found" }
  }

  // Check enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: user.id,
        courseId: lesson.module.courseId,
      },
    },
  })

  if (!enrollment) {
    return { error: "Not enrolled in this course" }
  }

  try {
    // Create lesson completion record (upsert to handle duplicates)
    await db.lessonCompletion.upsert({
      where: {
        userId_lessonId: {
          userId: user.id,
          lessonId,
        },
      },
      create: {
        userId: user.id,
        lessonId,
      },
      update: {
        completedAt: new Date(),
      },
    })

    // Update enrollment progress percentage
    const totalLessons = await db.lesson.count({
      where: {
        module: {
          courseId: lesson.module.courseId,
        },
      },
    })

    const completedLessons = await db.lessonCompletion.count({
      where: {
        userId: user.id,
        lesson: {
          module: {
            courseId: lesson.module.courseId,
          },
        },
      },
    })

    const progressPercent = Math.round((completedLessons / totalLessons) * 100)

    await db.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercent,
        completedAt: completedLessons === totalLessons ? new Date() : null,
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Failed to mark lesson complete:", error)
    return { error: "Failed to update progress" }
  }
}
