import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import Link from "next/link"
import {
  BookOpen,
  Plus,
  Users,
  PlayCircle,
  Clock,
  DollarSign,
  Eye,
  EyeOff,
  MoreVertical,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

async function getCourses(organizationId: string) {
  return db.course.findMany({
    where: { organizationId },
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
}

export default async function CoursesPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <p className="text-white/60">Organization not found</p>
      </div>
    )
  }

  const courses = await getCourses(organization.id)

  const totalLessons = (course: typeof courses[0]) =>
    course.modules.reduce((sum, mod) => sum + mod._count.lessons, 0)

  return (
    <div className="space-y-8" data-tour="courses-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
            Courses
          </h2>
          <p className="text-white/60 mt-2">
            Create and manage your video courses
          </p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
        >
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      {/* Course Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Total Courses</span>
            <BookOpen className="h-5 w-5 text-sola-gold" />
          </div>
          <div className="mt-2">
            <span className="font-display text-3xl text-white">{courses.length}</span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Published</span>
            <Eye className="h-5 w-5 text-sola-gold" />
          </div>
          <div className="mt-2">
            <span className="font-display text-3xl text-white">
              {courses.filter(c => c.isPublished).length}
            </span>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Total Enrollments</span>
            <Users className="h-5 w-5 text-sola-gold" />
          </div>
          <div className="mt-2">
            <span className="font-display text-3xl text-white">
              {courses.reduce((sum, c) => sum + c._count.enrollments, 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Course List */}
      {courses.length === 0 ? (
        <div className="bg-white/5 border border-white/10 p-12 text-center">
          <BookOpen className="h-16 w-16 text-white/10 mx-auto mb-4" />
          <h3 className="font-display text-xl text-white uppercase tracking-wide mb-2">
            No courses yet
          </h3>
          <p className="text-white/40 mb-6">
            Create your first course to start teaching your community.
          </p>
          <Link
            href="/dashboard/courses/new"
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
          >
            <Plus className="h-4 w-4" />
            Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/courses/${course.id}`}
              className="group bg-white/5 border border-white/10 hover:border-sola-gold/50 transition-all duration-300"
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-white/5 relative overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PlayCircle className="h-16 w-16 text-white/10 group-hover:text-sola-gold/30 transition-colors" />
                  </div>
                )}
                {/* Status Badge */}
                <div className="absolute top-3 right-3">
                  {course.isPublished ? (
                    <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 px-2 py-1 text-xs font-display uppercase tracking-wide">
                      <Eye className="h-3 w-3" />
                      Published
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-white/10 text-white/60 px-2 py-1 text-xs font-display uppercase tracking-wide">
                      <EyeOff className="h-3 w-3" />
                      Draft
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors line-clamp-1">
                  {course.title}
                </h3>
                {course.description && (
                  <p className="text-sm text-white/60 mt-1 line-clamp-2">
                    {course.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mt-4 text-sm text-white/40">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {course.modules.length} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <PlayCircle className="h-4 w-4" />
                    {totalLessons(course)} lessons
                  </span>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className="flex items-center gap-1 text-sm text-white/40">
                    <Users className="h-4 w-4" />
                    {course._count.enrollments} enrolled
                  </span>
                  {course.price ? (
                    <span className="flex items-center gap-1 text-sm text-sola-gold">
                      <DollarSign className="h-4 w-4" />
                      {course.price.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-sm text-white/40">Free</span>
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
