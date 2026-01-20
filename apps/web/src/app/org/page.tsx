import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import Link from "next/link"
import {
  Users,
  BookOpen,
  Video,
  ArrowRight,
  Star,
  CheckCircle,
  MessageCircle,
  Play,
  Sparkles,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default async function OrgHomePage() {
  const org = await getOrganizationByDomain()

  if (!org) {
    return null
  }

  // Get org settings with appearance
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"
  const heroLayout = (settings.heroLayout as string) || "centered"
  const showStats = settings.showStats !== false
  const showTestimonials = settings.showTestimonials !== false

  // Get tiers
  const tiers = await db.membershipTier.findMany({
    where: { organizationId: org.id, isActive: true },
    orderBy: { position: "asc" },
  })

  // Get stats
  const [communityCount, courseCount, memberCount, postCount] = await Promise.all([
    db.community.count({ where: { organizationId: org.id } }),
    db.course.count({ where: { organizationId: org.id, isPublished: true } }),
    db.membership.count({ where: { organizationId: org.id } }),
    db.post.count({
      where: {
        channel: { community: { organizationId: org.id } },
        isPublished: true,
      },
    }),
  ])

  // Get featured courses
  const featuredCourses = await db.course.findMany({
    where: { organizationId: org.id, isPublished: true },
    take: 3,
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { modules: true } },
    },
  })

  // Get recent posts for social proof
  const recentPosts = await db.post.findMany({
    where: {
      channel: { community: { organizationId: org.id } },
      isPublished: true,
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true, avatar: true } },
    },
  })

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0">
          {org.banner ? (
            <>
              <img
                src={org.banner}
                alt=""
                className="w-full h-full object-cover animate-slow-zoom"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-sola-black" />
            </>
          ) : (
            <div className="absolute inset-0">
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  background: `radial-gradient(ellipse at 50% 0%, ${primaryColor} 0%, transparent 70%)`,
                }}
              />
              <div
                className="absolute top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-10 animate-pulse-slow"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] rounded-full opacity-10 animate-pulse-slow"
                style={{ backgroundColor: primaryColor, animationDelay: "1s" }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div
          className={`relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 ${
            heroLayout === "centered" ? "text-center" : ""
          }`}
        >
          {/* Badge - only show if we have meaningful member count */}
          {memberCount >= 10 && (
            <div
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in-up ${
                heroLayout === "centered" ? "mx-auto" : ""
              }`}
              style={{ backgroundColor: `${primaryColor}20`, border: `1px solid ${primaryColor}40` }}
            >
              <Sparkles className="h-4 w-4" style={{ color: primaryColor }} />
              <span className="text-white/80 text-sm font-medium">
                {memberCount.toLocaleString()} members and growing
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            className="font-display text-5xl md:text-6xl lg:text-7xl text-white uppercase tracking-tight mb-6 animate-fade-in-up"
            style={{ animationDelay: "0.1s" }}
          >
            {org.name}
          </h1>

          {/* Description */}
          {org.description && (
            <p
              className={`text-white/70 text-xl md:text-2xl max-w-3xl mb-10 animate-fade-in-up ${
                heroLayout === "centered" ? "mx-auto" : ""
              }`}
              style={{ animationDelay: "0.2s" }}
            >
              {org.description}
            </p>
          )}

          {/* CTA Buttons */}
          <div
            className={`flex flex-col sm:flex-row gap-4 animate-fade-in-up ${
              heroLayout === "centered" ? "justify-center" : ""
            }`}
            style={{ animationDelay: "0.3s" }}
          >
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-widest px-8 py-4 text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: primaryColor,
                color: "#000",
                boxShadow: `0 0 30px ${primaryColor}40`,
              }}
            >
              Join Now
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-widest px-8 py-4 text-sm text-white border border-white/20 hover:border-white/40 hover:bg-white/5 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>

          {/* Social proof avatars - only show if meaningful activity */}
          {recentPosts.length >= 3 && postCount >= 5 && (
            <div
              className={`mt-12 flex items-center gap-4 animate-fade-in-up ${
                heroLayout === "centered" ? "justify-center" : ""
              }`}
              style={{ animationDelay: "0.4s" }}
            >
              <div className="flex -space-x-3">
                {recentPosts.slice(0, 5).map((post, i) => (
                  <div
                    key={post.id}
                    className="w-10 h-10 rounded-full border-2 border-sola-black overflow-hidden"
                    style={{ zIndex: 5 - i }}
                  >
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-white text-sm font-display"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {(post.author.name || "?")[0]}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-white/60 text-sm">
                <span className="text-white">{postCount.toLocaleString()}</span> posts in the community
              </p>
            </div>
          )}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-2 bg-white/40 rounded-full animate-scroll-indicator" />
          </div>
        </div>
      </section>

      {/* Stats Section - only show if there's meaningful content */}
      {showStats && (memberCount >= 10 || courseCount > 0) && (
        <section className="py-16 border-y border-white/10 bg-white/[0.02]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className={`grid gap-8 ${
              [memberCount >= 10, courseCount > 0, postCount >= 5].filter(Boolean).length <= 2
                ? 'grid-cols-2 max-w-lg mx-auto'
                : 'grid-cols-2 md:grid-cols-4'
            }`}>
              {[
                { icon: Users, value: memberCount, label: "Members", show: memberCount >= 10 },
                { icon: BookOpen, value: courseCount, label: "Courses", show: courseCount > 0 },
                { icon: MessageCircle, value: postCount, label: "Posts", show: postCount >= 5 },
                { icon: Video, value: communityCount, label: "Channels", show: communityCount > 0 && postCount >= 5 },
              ].filter(stat => stat.show).map((stat, i) => (
                <div
                  key={stat.label}
                  className="text-center group"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: `${primaryColor}15` }}
                  >
                    <stat.icon className="h-7 w-7" style={{ color: primaryColor }} />
                  </div>
                  <p className="font-display text-4xl text-white mb-1">
                    {stat.value.toLocaleString()}
                  </p>
                  <p className="text-white/50 text-sm uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Membership Tiers */}
      {tiers.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight mb-4">
                Choose Your Path
              </h2>
              <p className="text-white/60 text-lg max-w-2xl mx-auto">
                Select the membership level that&apos;s right for you and start your journey today.
              </p>
            </div>

            <div className={`grid gap-8 ${tiers.length === 1 ? 'max-w-md mx-auto' : tiers.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto' : 'md:grid-cols-3'}`}>
              {tiers.map((tier, i) => {
                const features =
                  typeof tier.features === "string"
                    ? JSON.parse(tier.features)
                    : tier.features || []
                const isHighlighted = i === 1 && tiers.length > 1

                return (
                  <div
                    key={tier.id}
                    className={`relative group ${isHighlighted ? "md:-mt-4" : ""}`}
                  >
                    {isHighlighted && (
                      <div
                        className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-display uppercase tracking-wider"
                        style={{ backgroundColor: primaryColor, color: "#000" }}
                      >
                        Most Popular
                      </div>
                    )}
                    <div
                      className={`h-full p-8 border transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-xl ${
                        isHighlighted
                          ? `border-2`
                          : "bg-white/5 border-white/10 group-hover:border-white/30"
                      }`}
                      style={
                        isHighlighted
                          ? {
                              borderColor: primaryColor,
                              backgroundColor: `${primaryColor}10`,
                              boxShadow: `0 0 60px ${primaryColor}20`,
                            }
                          : {}
                      }
                    >
                      <h3 className="font-display text-xl text-white uppercase tracking-wide mb-2">
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline gap-1 mb-6">
                        <span className="font-display text-4xl" style={{ color: primaryColor }}>
                          ${Number(tier.price)}
                        </span>
                        <span className="text-white/40">
                          /{tier.interval === "year" ? "year" : "month"}
                        </span>
                      </div>
                      {tier.description && (
                        <p className="text-white/60 text-sm mb-6">{tier.description}</p>
                      )}
                      <ul className="space-y-3 mb-8">
                        {features.slice(0, 6).map((feature: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-3 text-sm">
                            <CheckCircle
                              className="h-5 w-5 flex-shrink-0 mt-0.5"
                              style={{ color: primaryColor }}
                            />
                            <span className="text-white/70">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={`/signup?tier=${tier.id}`}
                        className={`block w-full text-center font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 ${
                          isHighlighted
                            ? "hover:opacity-90"
                            : "border border-white/20 text-white hover:bg-white/5"
                        }`}
                        style={
                          isHighlighted
                            ? { backgroundColor: primaryColor, color: "#000" }
                            : {}
                        }
                      >
                        Get Started
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-20 bg-white/[0.02] border-y border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight mb-4">
                  Featured Courses
                </h2>
                <p className="text-white/60 text-lg">
                  Level up your skills with our premium courses
                </p>
              </div>
              <Link
                href="/courses"
                className="hidden md:flex items-center gap-2 text-sm hover:gap-3 transition-all"
                style={{ color: primaryColor }}
              >
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.slug}`}
                  className="group bg-white/5 border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-[1.02] overflow-hidden"
                >
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div
                        className="w-14 h-14 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Play className="h-6 w-6 text-black ml-1" />
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-lg text-white uppercase tracking-wide group-hover:text-sola-gold transition-colors mb-2">
                      {course.title}
                    </h3>
                    {course.description && (
                      <p className="text-white/60 text-sm line-clamp-2 mb-4">
                        {course.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-white/40 text-sm">
                        <BookOpen className="h-4 w-4" />
                        <span>{course._count.modules} modules</span>
                      </div>
                      {Number(course.price) > 0 ? (
                        <span className="font-display text-lg" style={{ color: primaryColor }}>
                          ${Number(course.price)}
                        </span>
                      ) : (
                        <span className="text-green-400 text-sm uppercase font-medium">
                          Free
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center md:hidden">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 text-sm"
                style={{ color: primaryColor }}
              >
                View All Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="p-12 md:p-16 relative overflow-hidden"
            style={{
              backgroundColor: `${primaryColor}10`,
              border: `1px solid ${primaryColor}30`,
            }}
          >
            {/* Decorative elements */}
            <div
              className="absolute -top-20 -right-20 w-40 h-40 rounded-full opacity-20 blur-3xl"
              style={{ backgroundColor: primaryColor }}
            />
            <div
              className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10 blur-3xl"
              style={{ backgroundColor: primaryColor }}
            />

            <div className="relative z-10">
              <Star className="h-10 w-10 mx-auto mb-6" style={{ color: primaryColor }} />
              <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
                Join {memberCount.toLocaleString()} members who are already part of our community.
                Start your journey today.
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-3 font-display font-semibold uppercase tracking-widest px-10 py-4 text-sm transition-all duration-300 hover:scale-105"
                style={{
                  backgroundColor: primaryColor,
                  color: "#000",
                  boxShadow: `0 0 30px ${primaryColor}40`,
                }}
              >
                Join the Community
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
