import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import Link from "next/link"
import { BookOpen, Clock, Users, ChevronRight, CheckCircle2 } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MemberCoursesPage() {
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!member || !org) return null

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

  if (!membership) return null

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings for branding
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get accessible courses
  const courses = await db.course.findMany({
    where: {
      organizationId: org.id,
      isPublished: true,
      OR: [
        { accessType: "FREE" },
        { accessTierIds: { hasSome: memberTierIds } },
      ],
    },
    include: {
      modules: {
        include: {
          lessons: {
            select: {
              id: true,
              videoDuration: true,
            },
          },
        },
        orderBy: { position: "asc" },
      },
      _count: {
        select: { enrollments: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  // Get user's enrollments
  const enrollments = await db.enrollment.findMany({
    where: {
      userId: member.id,
      courseId: { in: courses.map((c) => c.id) },
    },
  })

  const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e]))

  // Calculate total duration for each course
  const coursesWithStats = courses.map((course) => {
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
    const totalDuration = course.modules.reduce(
      (sum, m) => sum + m.lessons.reduce((lSum, l) => lSum + (l.videoDuration || 0), 0),
      0
    )
    const enrollment = enrollmentMap.get(course.id)

    return {
      ...course,
      totalLessons,
      totalDuration,
      isEnrolled: !!enrollment,
      progress: enrollment?.progress || 0,
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-white uppercase tracking-tight">
          Courses
        </h1>
        <p className="text-white/60 mt-2">
          Learn at your own pace with our curated courses
        </p>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <BookOpen className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/60">No courses available yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coursesWithStats.map((course) => (
            <Link
              key={course.id}
              href={`/member/courses/${course.slug}`}
              className="group bg-white/5 border border-white/10 overflow-hidden hover:border-white/30 transition-all"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-sola-dark-navy relative">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-white/10" />
                  </div>
                )}
                {course.isEnrolled && course.progress > 0 && (
                  <div
                    className="absolute bottom-0 left-0 h-1"
                    style={{
                      width: `${course.progress}%`,
                      backgroundColor: primaryColor,
                    }}
                  />
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  {course.isEnrolled && course.progress >= 100 && (
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: primaryColor }} />
                  )}
                </div>

                {course.description && (
                  <p className="text-white/60 text-sm mt-2 line-clamp-2">
                    {course.description}
                  </p>
                )}

                <div className="flex items-center gap-4 mt-4 text-white/40 text-xs">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.modules.length} modules
                  </span>
                  <span>{course.totalLessons} lessons</span>
                  {course.totalDuration > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.round(course.totalDuration / 60)}min
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-white/30" />
                    <span className="text-white/40 text-xs">
                      {course._count.enrollments} enrolled
                    </span>
                  </div>
                  {course.isEnrolled ? (
                    <span
                      className="text-xs px-2 py-1"
                      style={{ backgroundColor: `${primaryColor}20`, color: primaryColor }}
                    >
                      {course.progress >= 100
                        ? "Completed"
                        : course.progress > 0
                        ? `${Math.round(course.progress)}% complete`
                        : "Enrolled"}
                    </span>
                  ) : (
                    <span className="text-white/60 text-xs flex items-center gap-1 group-hover:text-white transition-colors">
                      Start Course <ChevronRight className="h-3 w-3" />
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
