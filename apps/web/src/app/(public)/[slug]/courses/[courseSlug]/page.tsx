import { getOrganizationBySlug, getUserMembership } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import {
  BookOpen,
  Play,
  CheckCircle,
  Lock,
  ChevronRight,
  ChevronDown,
  FileText,
  HelpCircle,
  Download,
} from "lucide-react"
import { CoursePlayer } from "@/components/public/course-player"

interface PageProps {
  params: Promise<{ slug: string; courseSlug: string }>
  searchParams: Promise<{ lesson?: string }>
}

export default async function CoursePlayerPage({ params, searchParams }: PageProps) {
  const { slug, courseSlug } = await params
  const { lesson: lessonId } = await searchParams

  const organization = await getOrganizationBySlug(slug)
  if (!organization) {
    notFound()
  }

  // Get course
  const course = await db.course.findFirst({
    where: { organizationId: organization.id, slug: courseSlug },
    include: {
      modules: {
        orderBy: { position: "asc" },
        include: {
          lessons: {
            orderBy: { position: "asc" },
          },
        },
      },
    },
  })

  if (!course) {
    notFound()
  }

  // Check authentication
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  let user = null
  let membership = null
  let enrollment = null

  if (isAuthenticated && claims?.sub) {
    user = await getUserByLogtoId(claims.sub)
    if (user) {
      membership = await getUserMembership(user.id, organization.id)
      enrollment = await db.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId: user.id,
            courseId: course.id,
          },
        },
      })
    }
  }

  // Check access
  const canAccess = () => {
    if (course.accessType === "FREE") return true
    if (!membership) return false
    if (course.accessTierIds.length === 0) return true
    if (!membership.tierId) return false
    return course.accessTierIds.includes(membership.tierId)
  }

  if (!canAccess()) {
    redirect(`/${slug}/join`)
  }

  // Create enrollment if not exists
  if (user && !enrollment) {
    enrollment = await db.enrollment.create({
      data: {
        userId: user.id,
        courseId: course.id,
      },
    })
  }

  // Get completed lessons
  const completedLessons = user
    ? await db.lessonCompletion.findMany({
        where: { userId: user.id },
        select: { lessonId: true },
      })
    : []
  const completedLessonIds = new Set(completedLessons.map((c) => c.lessonId))

  // Get all lessons flat
  const allLessons = course.modules.flatMap((m) => m.lessons)

  // Get current lesson
  const currentLesson = lessonId
    ? allLessons.find((l) => l.id === lessonId)
    : allLessons[0]

  if (!currentLesson) {
    notFound()
  }

  // Get current lesson index for navigation
  const currentLessonIndex = allLessons.findIndex((l) => l.id === currentLesson.id)
  const previousLesson = currentLessonIndex > 0 ? allLessons[currentLessonIndex - 1] : null
  const nextLesson = currentLessonIndex < allLessons.length - 1 ? allLessons[currentLessonIndex + 1] : null

  const lessonTypeIcons = {
    VIDEO: Play,
    TEXT: FileText,
    QUIZ: HelpCircle,
    ASSIGNMENT: FileText,
    DOWNLOAD: Download,
  }

  // Calculate progress
  const totalLessons = allLessons.length
  const completedCount = allLessons.filter((l) => completedLessonIds.has(l.id)).length
  const progress = totalLessons > 0 ? (completedCount / totalLessons) * 100 : 0

  return (
    <div className="flex h-[calc(100vh-180px)] -mx-4 sm:-mx-6 lg:-mx-8">
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Video/Content Area */}
        <div className="flex-shrink-0">
          <CoursePlayer
            lesson={currentLesson}
            courseSlug={courseSlug}
            slug={slug}
            isCompleted={completedLessonIds.has(currentLesson.id)}
            previousLessonId={previousLesson?.id}
            nextLessonId={nextLesson?.id}
            userId={user?.id}
          />
        </div>

        {/* Lesson Info */}
        <div className="p-6 border-t border-white/10">
          <h1 className="font-display text-2xl text-white uppercase tracking-wide">
            {currentLesson.title}
          </h1>
          {currentLesson.description && (
            <p className="text-white/60 mt-2">{currentLesson.description}</p>
          )}

          {/* Lesson Content (for text lessons) */}
          {currentLesson.type === "TEXT" && currentLesson.content && (
            <div className="mt-6 prose prose-invert max-w-none">
              <div
                className="text-white/80"
                dangerouslySetInnerHTML={{ __html: currentLesson.content }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Curriculum Sidebar */}
      <div className="w-80 bg-white/5 border-l border-white/10 flex flex-col flex-shrink-0 overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <Link
            href={`/${slug}/courses`}
            className="text-sola-gold text-sm hover:underline"
          >
            &larr; Back to Courses
          </Link>
          <h2 className="font-display text-lg text-white uppercase tracking-wide mt-2">
            {course.title}
          </h2>
          <div className="mt-2">
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-sola-gold" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-white/50 mt-1">
              {completedCount} of {totalLessons} lessons completed
            </p>
          </div>
        </div>

        {/* Module List */}
        <div className="flex-1 overflow-y-auto">
          {course.modules.map((module, moduleIndex) => (
            <div key={module.id} className="border-b border-white/5">
              <div className="px-4 py-3 bg-white/[0.02]">
                <h3 className="font-display text-sm text-white/80 uppercase tracking-wide">
                  Module {moduleIndex + 1}: {module.title}
                </h3>
              </div>
              <div>
                {module.lessons.map((lesson) => {
                  const isActive = lesson.id === currentLesson.id
                  const isCompleted = completedLessonIds.has(lesson.id)
                  const Icon = lessonTypeIcons[lesson.type]

                  return (
                    <Link
                      key={lesson.id}
                      href={`/${slug}/courses/${courseSlug}?lesson=${lesson.id}`}
                      className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                        isActive
                          ? "bg-sola-gold/10 border-l-2 border-sola-gold"
                          : "hover:bg-white/5 border-l-2 border-transparent"
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? "bg-green-500/20 text-green-500"
                            : isActive
                            ? "bg-sola-gold/20 text-sola-gold"
                            : "bg-white/10 text-white/40"
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <Icon className="h-3 w-3" />
                        )}
                      </div>
                      <span
                        className={`flex-1 text-sm truncate ${
                          isActive ? "text-white" : "text-white/60"
                        }`}
                      >
                        {lesson.title}
                      </span>
                      {lesson.videoDuration && (
                        <span className="text-xs text-white/30">
                          {Math.floor(lesson.videoDuration / 60)}:{String(lesson.videoDuration % 60).padStart(2, "0")}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
