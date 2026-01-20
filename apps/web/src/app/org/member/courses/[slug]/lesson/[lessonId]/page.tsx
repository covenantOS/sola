import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Download,
  Lock,
} from "lucide-react"
import { LessonVideoPlayer } from "./video-player"
import { MarkCompleteButton } from "./mark-complete-button"

export const dynamic = "force-dynamic"

const lessonTypeIcons = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
  DOWNLOAD: Download,
}

export default async function LessonPlayerPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>
}) {
  const { slug, lessonId } = await params
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!member || !org) {
    redirect("/login")
  }

  // Get membership with tier
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
    include: {
      tier: true,
    },
  })

  if (!membership) {
    redirect("/signup")
  }

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings for branding
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get course with all lessons for navigation
  const course = await db.course.findFirst({
    where: {
      organizationId: org.id,
      slug,
      isPublished: true,
    },
    include: {
      modules: {
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
        orderBy: { position: "asc" },
      },
    },
  })

  if (!course) {
    notFound()
  }

  // Check access
  const hasAccess =
    course.accessType === "FREE" ||
    course.accessTierIds.some((id) => memberTierIds.includes(id))

  // Get the lesson
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      module: {
        select: {
          id: true,
          title: true,
          courseId: true,
        },
      },
    },
  })

  if (!lesson || lesson.module.courseId !== course.id) {
    notFound()
  }

  // Check if user can access this lesson
  const canAccess = hasAccess || lesson.isFreePreview
  if (!canAccess) {
    redirect(`/member/courses/${slug}`)
  }

  // Get enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: member.id,
        courseId: course.id,
      },
    },
  })

  // Get completion status
  const completion = await db.lessonCompletion.findUnique({
    where: {
      userId_lessonId: {
        userId: member.id,
        lessonId: lesson.id,
      },
    },
  })

  // Build flat lesson list for navigation
  const allLessons = course.modules.flatMap((m, mi) =>
    m.lessons.map((l, li) => ({
      ...l,
      moduleTitle: m.title,
      moduleIndex: mi,
      lessonIndex: li,
    }))
  )

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId)
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null

  // Get all lesson completions
  const completions = await db.lessonCompletion.findMany({
    where: {
      userId: member.id,
      lessonId: { in: allLessons.map((l) => l.id) },
    },
  })
  const completedLessonIds = new Set(completions.map((c) => c.lessonId))

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-sola-dark-navy border-b border-white/10 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link
            href={`/member/courses/${slug}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{course.title}</span>
            <span className="sm:hidden">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            {prevLesson && (
              <Link
                href={`/member/courses/${slug}/lesson/${prevLesson.id}`}
                className="p-2 text-white/60 hover:text-white transition-colors"
                title="Previous lesson"
              >
                <ChevronLeft className="h-5 w-5" />
              </Link>
            )}
            <span className="text-white/40 text-sm">
              {currentIndex + 1} / {allLessons.length}
            </span>
            {nextLesson && (
              <Link
                href={`/member/courses/${slug}/lesson/${nextLesson.id}`}
                className="p-2 text-white/60 hover:text-white transition-colors"
                title="Next lesson"
              >
                <ChevronRight className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-0">
        {/* Main content */}
        <div className="lg:col-span-3 bg-black">
          {/* Video Player */}
          {lesson.type === "VIDEO" && lesson.muxPlaybackId ? (
            <LessonVideoPlayer
              playbackId={lesson.muxPlaybackId}
              lessonId={lesson.id}
              courseSlug={slug}
              nextLessonId={nextLesson?.id}
            />
          ) : lesson.type === "VIDEO" ? (
            <div className="aspect-video bg-sola-dark-navy flex items-center justify-center">
              <div className="text-center text-white/40">
                <PlayCircle className="h-12 w-12 mx-auto mb-2" />
                <p>Video not yet available</p>
              </div>
            </div>
          ) : null}

          {/* Lesson content */}
          <div className="p-6 bg-sola-black">
            <div className="max-w-3xl">
              <h1 className="font-display text-2xl text-white uppercase tracking-tight">
                {lesson.title}
              </h1>
              <p className="text-white/40 text-sm mt-1">
                {lesson.module.title}
              </p>

              {lesson.description && (
                <p className="text-white/70 mt-4">{lesson.description}</p>
              )}

              {/* Text content for TEXT type lessons */}
              {lesson.type === "TEXT" && lesson.content && (
                <div
                  className="prose prose-invert prose-sm max-w-none mt-6"
                  dangerouslySetInnerHTML={{ __html: lesson.content }}
                />
              )}

              {/* Mark complete button */}
              <div className="mt-8 flex items-center gap-4">
                <MarkCompleteButton
                  lessonId={lesson.id}
                  isCompleted={!!completion}
                  primaryColor={primaryColor}
                />
                {nextLesson && (
                  <Link
                    href={`/member/courses/${slug}/lesson/${nextLesson.id}`}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                  >
                    Next: {nextLesson.title}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar - Lesson list */}
        <div className="lg:col-span-1 bg-sola-dark-navy border-l border-white/10 h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-display text-sm text-white uppercase tracking-wide">
              Course Content
            </h3>
          </div>

          {course.modules.map((module, moduleIndex) => (
            <div key={module.id}>
              <div className="px-4 py-2 bg-white/5 border-b border-white/10">
                <span className="text-white/40 text-xs font-display uppercase tracking-wide">
                  Module {moduleIndex + 1}: {module.title}
                </span>
              </div>
              {module.lessons.map((l, lessonIndex) => {
                const Icon = lessonTypeIcons[l.type as keyof typeof lessonTypeIcons] || PlayCircle
                const isCompleted = completedLessonIds.has(l.id)
                const isCurrent = l.id === lessonId
                const isLocked = !hasAccess && !l.isFreePreview

                return (
                  <Link
                    key={l.id}
                    href={
                      isLocked
                        ? "#"
                        : `/member/courses/${slug}/lesson/${l.id}`
                    }
                    className={`flex items-center gap-3 px-4 py-3 border-b border-white/5 transition-colors ${
                      isCurrent
                        ? "bg-white/10"
                        : isLocked
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-white/5"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2
                        className="h-4 w-4 flex-shrink-0"
                        style={{ color: primaryColor }}
                      />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4 flex-shrink-0 text-white/30" />
                    ) : (
                      <Icon className="h-4 w-4 flex-shrink-0 text-white/40" />
                    )}
                    <span
                      className={`flex-1 text-sm ${
                        isCurrent
                          ? "text-white"
                          : isCompleted
                          ? "text-white/60"
                          : "text-white/80"
                      }`}
                    >
                      {moduleIndex + 1}.{lessonIndex + 1} {l.title}
                    </span>
                    {l.videoDuration && (
                      <span className="text-white/30 text-xs">
                        {Math.round(l.videoDuration / 60)}m
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
