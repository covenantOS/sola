import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import Link from "next/link"
import { BookOpen, Clock, Play, ArrowLeft, Lock } from "lucide-react"
import { getCurrentMember } from "@/lib/member-auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function CoursesPage() {
  const org = await getOrganizationByDomain()

  if (!org) {
    return <div>Organization not found</div>
  }

  const member = await getCurrentMember()

  // Require auth to view courses
  if (!member) {
    redirect("/login?redirect=/courses")
  }

  // Get membership
  const membership = member ? await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId: member.id,
        organizationId: org.id,
      },
    },
    include: { tier: true },
  }) : null

  if (!membership) {
    redirect("/signup?redirect=/courses")
  }

  const memberTierIds = membership?.tierId ? [membership.tierId] : []

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get all published courses
  const courses = await db.course.findMany({
    where: {
      organizationId: org.id,
      isPublished: true,
    },
    include: {
      _count: { select: { modules: true, enrollments: true } },
      modules: {
        include: {
          _count: { select: { lessons: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Check enrollment for each course
  const enrollments = member
    ? await db.enrollment.findMany({
        where: {
          userId: member.id,
          courseId: { in: courses.map((c) => c.id) },
        },
      })
    : []

  const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId))

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/member"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl text-white uppercase tracking-tight">
            Courses
          </h1>
          <p className="text-white/60 mt-2">
            Explore all available courses and continue your learning journey.
          </p>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-white/5 border border-white/10 p-12 text-center">
            <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/60">No courses available yet.</p>
            <p className="text-white/40 text-sm mt-2">Check back later!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const isEnrolled = enrolledCourseIds.has(course.id)
              const lessonCount = course.modules.reduce(
                (acc, m) => acc + m._count.lessons,
                0
              )
              const hasAccess =
                Number(course.price) === 0 ||
                isEnrolled ||
                course.accessTierIds.some((id) => memberTierIds.includes(id)) ||
                course.accessTierIds.length === 0

              return (
                <Link
                  key={course.id}
                  href={hasAccess ? `/member/courses/${course.slug}` : `/member/courses/${course.slug}`}
                  className="group bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                >
                  {/* Thumbnail */}
                  <div className="aspect-video bg-sola-dark-navy relative overflow-hidden">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-white/20" />
                      </div>
                    )}

                    {/* Overlay for locked courses */}
                    {!hasAccess && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <div className="text-center">
                          <Lock className="h-8 w-8 text-white/60 mx-auto mb-2" />
                          <p className="text-white/60 text-sm">Upgrade to access</p>
                        </div>
                      </div>
                    )}

                    {/* Play overlay */}
                    {hasAccess && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: primaryColor }}
                        >
                          <Play className="h-6 w-6 text-black ml-1" />
                        </div>
                      </div>
                    )}

                    {/* Enrolled badge */}
                    {isEnrolled && (
                      <div
                        className="absolute top-3 right-3 px-2 py-1 text-xs font-medium"
                        style={{ backgroundColor: primaryColor, color: "#000" }}
                      >
                        Enrolled
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors mb-2">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-white/60 text-sm line-clamp-2 mb-4">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-white/40 text-sm">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {course._count.modules} modules
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {lessonCount} lessons
                        </span>
                      </div>
                      {Number(course.price) > 0 && !isEnrolled ? (
                        <span className="font-display text-lg" style={{ color: primaryColor }}>
                          ${Number(course.price)}
                        </span>
                      ) : (
                        <span className="text-green-400 text-sm uppercase font-medium">
                          {isEnrolled ? "Continue" : "Free"}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
