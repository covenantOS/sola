import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Users,
  PlayCircle,
  FileText,
  HelpCircle,
  ClipboardList,
  Download,
  CheckCircle2,
  Lock,
  ChevronDown,
} from "lucide-react"
import { EnrollButton } from "./enroll-button"

export const dynamic = "force-dynamic"

const lessonTypeIcons = {
  VIDEO: PlayCircle,
  TEXT: FileText,
  QUIZ: HelpCircle,
  ASSIGNMENT: ClipboardList,
  DOWNLOAD: Download,
}

export default async function MemberCourseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
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

  // Get course with modules and lessons
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
      _count: {
        select: { enrollments: true },
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

  // Get enrollment
  const enrollment = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: member.id,
        courseId: course.id,
      },
    },
  })

  // Get lesson completions
  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id))
  const completions = await db.lessonCompletion.findMany({
    where: {
      userId: member.id,
      lessonId: { in: lessonIds },
    },
  })
  const completedLessonIds = new Set(completions.map((c) => c.lessonId))

  // Calculate stats
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  const completedLessons = completions.length
  const totalDuration = course.modules.reduce(
    (sum, m) =>
      sum + m.lessons.reduce((lSum, l) => lSum + (l.videoDuration || 0), 0),
    0
  )

  // Find next lesson to continue
  let nextLesson: { moduleIndex: number; lessonId: string } | null = null
  if (enrollment) {
    for (let mi = 0; mi < course.modules.length; mi++) {
      const module = course.modules[mi]
      for (const lesson of module.lessons) {
        if (!completedLessonIds.has(lesson.id)) {
          nextLesson = { moduleIndex: mi, lessonId: lesson.id }
          break
        }
      }
      if (nextLesson) break
    }
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href="/member/courses"
        className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Courses
      </Link>

      {/* Course header */}
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {/* Thumbnail */}
          <div className="aspect-video bg-sola-dark-navy relative overflow-hidden">
            {course.thumbnail ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-white/10" />
              </div>
            )}
          </div>

          <div className="mt-6">
            <h1 className="font-display text-3xl text-white uppercase tracking-tight">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-white/60 mt-3">{course.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-4 text-white/40 text-sm">
              <span className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                {course.modules.length} modules
              </span>
              <span className="flex items-center gap-1.5">
                <PlayCircle className="h-4 w-4" />
                {totalLessons} lessons
              </span>
              {totalDuration > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {Math.round(totalDuration / 60)} min
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                {course._count.enrollments} enrolled
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div
            className="sticky top-24 bg-white/5 border p-6"
            style={{ borderColor: `${primaryColor}30` }}
          >
            {!hasAccess ? (
              <>
                <div className="flex items-center gap-2 text-white/60 mb-4">
                  <Lock className="h-5 w-5" />
                  <span>This course requires a membership upgrade</span>
                </div>
                <Link
                  href="/member/upgrade"
                  className="block w-full text-center font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all"
                  style={{ backgroundColor: primaryColor, color: "#000" }}
                >
                  Upgrade to Access
                </Link>
              </>
            ) : enrollment ? (
              <>
                {/* Progress */}
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-white/60">Your Progress</span>
                    <span style={{ color: primaryColor }}>
                      {completedLessons}/{totalLessons} lessons
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${enrollment.progress}%`,
                        backgroundColor: primaryColor,
                      }}
                    />
                  </div>
                </div>

                {nextLesson ? (
                  <Link
                    href={`/member/courses/${course.slug}/lesson/${nextLesson.lessonId}`}
                    className="block w-full text-center font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all"
                    style={{ backgroundColor: primaryColor, color: "#000" }}
                  >
                    {completedLessons > 0 ? "Continue Learning" : "Start Course"}
                  </Link>
                ) : (
                  <div
                    className="text-center py-3 flex items-center justify-center gap-2"
                    style={{ color: primaryColor }}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Course Completed!
                  </div>
                )}
              </>
            ) : (
              <EnrollButton
                courseId={course.id}
                primaryColor={primaryColor}
              />
            )}
          </div>
        </div>
      </div>

      {/* Course content */}
      <div>
        <h2 className="font-display text-xl text-white uppercase tracking-wide mb-4">
          Course Content
        </h2>

        <div className="space-y-2">
          {course.modules.map((module, moduleIndex) => (
            <details key={module.id} className="group" open={moduleIndex === 0}>
              <summary className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 cursor-pointer hover:border-white/20 transition-colors list-none">
                <ChevronDown className="h-4 w-4 text-white/40 group-open:rotate-180 transition-transform" />
                <span className="text-white/40 text-sm font-display">
                  {moduleIndex + 1}.
                </span>
                <span className="font-display text-white uppercase tracking-wide flex-1">
                  {module.title}
                </span>
                <span className="text-white/40 text-sm">
                  {module.lessons.filter((l) => completedLessonIds.has(l.id)).length}/
                  {module.lessons.length} complete
                </span>
              </summary>

              <div className="border-x border-b border-white/10">
                {module.lessons.map((lesson, lessonIndex) => {
                  const Icon = lessonTypeIcons[lesson.type as keyof typeof lessonTypeIcons] || PlayCircle
                  const isCompleted = completedLessonIds.has(lesson.id)
                  const isLocked = !hasAccess && !lesson.isFreePreview
                  const canAccess = hasAccess || lesson.isFreePreview

                  return (
                    <Link
                      key={lesson.id}
                      href={
                        canAccess
                          ? `/member/courses/${course.slug}/lesson/${lesson.id}`
                          : "#"
                      }
                      className={`flex items-center gap-3 px-4 py-3 pl-12 border-t border-white/5 transition-colors ${
                        canAccess
                          ? "hover:bg-white/5 cursor-pointer"
                          : "opacity-50 cursor-not-allowed"
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
                      <span className="text-white/40 text-sm">
                        {moduleIndex + 1}.{lessonIndex + 1}
                      </span>
                      <span
                        className={`flex-1 ${
                          isCompleted ? "text-white/60" : "text-white/80"
                        }`}
                      >
                        {lesson.title}
                      </span>
                      {lesson.isFreePreview && !enrollment && (
                        <span className="text-xs px-2 py-0.5 bg-sola-gold/20 text-sola-gold">
                          Preview
                        </span>
                      )}
                      {lesson.videoDuration && (
                        <span className="text-white/30 text-xs">
                          {Math.round(lesson.videoDuration / 60)}min
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  )
}
