import { getOrganizationBySlug, getUserMembership } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import { BookOpen, Clock, Lock, Play, CheckCircle } from "lucide-react"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function CoursesPage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Check authentication
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  let user = null
  let membership = null

  if (isAuthenticated && claims?.sub) {
    user = await getUserByLogtoId(claims.sub)
    if (user) {
      membership = await getUserMembership(user.id, organization.id)
    }
  }

  // Get all published courses
  const courses = await db.course.findMany({
    where: { organizationId: organization.id, isPublished: true },
    orderBy: { position: "asc" },
    include: {
      modules: {
        include: {
          _count: {
            select: { lessons: true },
          },
        },
      },
      _count: {
        select: { enrollments: true },
      },
    },
  })

  // Get user enrollments if logged in
  let enrollments: Record<string, { progress: number }> = {}
  if (user) {
    const userEnrollments = await db.enrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true, progress: true },
    })
    enrollments = Object.fromEntries(
      userEnrollments.map((e) => [e.courseId, { progress: e.progress }])
    )
  }

  // Check course access
  const canAccessCourse = (course: typeof courses[0]) => {
    if (course.accessType === "FREE") return true
    if (!membership) return false
    if (course.accessTierIds.length === 0) return true
    if (!membership.tierId) return false
    return course.accessTierIds.includes(membership.tierId)
  }

  const getTotalLessons = (course: typeof courses[0]) => {
    return course.modules.reduce((acc, m) => acc + m._count.lessons, 0)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
          Courses
        </h1>
        <p className="text-white/60 mt-2">
          Learn and grow with our courses
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <BookOpen className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No Courses Yet
          </h2>
          <p className="text-white/60">
            Check back soon for new courses!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => {
            const hasAccess = canAccessCourse(course)
            const enrollment = enrollments[course.id]
            const totalLessons = getTotalLessons(course)

            return (
              <div
                key={course.id}
                className={`bg-white/5 border overflow-hidden transition-all ${
                  hasAccess
                    ? "border-white/10 hover:border-sola-gold/50"
                    : "border-white/5 opacity-75"
                }`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-sola-dark-navy">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-12 w-12 text-white/20" />
                    </div>
                  )}
                  {!hasAccess && (
                    <div className="absolute inset-0 bg-sola-black/70 flex items-center justify-center">
                      <Lock className="h-8 w-8 text-white/50" />
                    </div>
                  )}
                  {enrollment && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                      <div
                        className="h-full bg-sola-gold"
                        style={{ width: `${enrollment.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="font-display text-lg text-white uppercase tracking-wide line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">
                      {course.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 mt-4 text-sm text-white/50">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span>{totalLessons} lessons</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{course.modules.length} modules</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="mt-4">
                    {hasAccess ? (
                      <Link
                        href={`/${slug}/courses/${course.slug}`}
                        className="w-full flex items-center justify-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
                      >
                        {enrollment ? (
                          <>
                            {enrollment.progress >= 100 ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                            {enrollment.progress >= 100 ? "Review" : "Continue"}
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Start Course
                          </>
                        )}
                      </Link>
                    ) : (
                      <Link
                        href={`/${slug}/join`}
                        className="w-full flex items-center justify-center gap-2 border-2 border-white/30 text-white font-display font-semibold uppercase tracking-widest px-4 py-3 text-sm transition-all duration-300 hover:border-sola-gold"
                      >
                        <Lock className="h-4 w-4" />
                        Upgrade to Access
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
