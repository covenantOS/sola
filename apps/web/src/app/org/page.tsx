import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import Link from "next/link"
import { Users, BookOpen, Video } from "lucide-react"

export default async function OrgHomePage() {
  const org = await getOrganizationByDomain()

  if (!org) {
    return null
  }

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"

  // Get stats
  const [communityCount, courseCount, memberCount] = await Promise.all([
    db.community.count({ where: { organizationId: org.id } }),
    db.course.count({ where: { organizationId: org.id, status: "PUBLISHED" } }),
    db.membership.count({ where: { organizationId: org.id } }),
  ])

  // Get featured courses
  const featuredCourses = await db.course.findMany({
    where: { organizationId: org.id, status: "PUBLISHED" },
    take: 3,
    orderBy: { createdAt: "desc" },
  })

  return (
    <div>
      {/* Hero Section */}
      <div className="relative">
        {/* Banner */}
        {org.banner ? (
          <div className="h-64 md:h-80 overflow-hidden">
            <img
              src={org.banner}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sola-black to-transparent" />
          </div>
        ) : (
          <div
            className="h-64 md:h-80"
            style={{
              background: `linear-gradient(135deg, ${primaryColor}20 0%, transparent 100%)`,
            }}
          />
        )}

        {/* Content overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl text-white uppercase tracking-tight">
              {org.name}
            </h1>
            {org.description && (
              <p className="text-white/70 text-lg mt-4 max-w-2xl">
                {org.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 p-6 text-center">
            <Users className="h-8 w-8 mx-auto mb-3" style={{ color: primaryColor }} />
            <p className="font-display text-3xl text-white">{memberCount}</p>
            <p className="text-white/60 text-sm uppercase tracking-wide mt-1">
              Members
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-3" style={{ color: primaryColor }} />
            <p className="font-display text-3xl text-white">{courseCount}</p>
            <p className="text-white/60 text-sm uppercase tracking-wide mt-1">
              Courses
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 text-center">
            <Video className="h-8 w-8 mx-auto mb-3" style={{ color: primaryColor }} />
            <p className="font-display text-3xl text-white">{communityCount}</p>
            <p className="text-white/60 text-sm uppercase tracking-wide mt-1">
              Communities
            </p>
          </div>
        </div>
      </div>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="font-display text-2xl text-white uppercase tracking-wide mb-8">
            Featured Courses
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="bg-white/5 border border-white/10 hover:border-white/30 transition-colors group"
              >
                <div className="aspect-video bg-sola-dark-navy flex items-center justify-center">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="h-12 w-12 text-white/20" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-4">
                    {Number(course.price) > 0 ? (
                      <span
                        className="font-display text-lg"
                        style={{ color: primaryColor }}
                      >
                        ${Number(course.price)}
                      </span>
                    ) : (
                      <span className="text-green-400 text-sm uppercase">
                        Free
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="p-8 md:p-12 text-center"
          style={{ backgroundColor: `${primaryColor}10`, border: `1px solid ${primaryColor}30` }}
        >
          <h2 className="font-display text-3xl text-white uppercase tracking-tight mb-4">
            Join Our Community
          </h2>
          <p className="text-white/70 max-w-xl mx-auto mb-8">
            Get access to exclusive content, connect with like-minded members, and grow together.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 font-display font-semibold uppercase tracking-widest px-8 py-4 text-sm text-sola-black transition-all duration-300"
            style={{ backgroundColor: primaryColor }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  )
}
