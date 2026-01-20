import { getCurrentMember } from "@/lib/member-auth"
import { getOrganizationByDomain } from "@/lib/subdomain"
import { db } from "@/lib/db"
import Link from "next/link"
import { Users, BookOpen, Video, ArrowRight, MessageSquare } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function MemberDashboard() {
  const member = await getCurrentMember()
  const org = await getOrganizationByDomain()

  if (!member || !org) return null

  // Get full user data to check createdAt
  const user = await db.user.findUnique({
    where: { id: member.id },
    select: { createdAt: true },
  })

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

  // Check if user was created within the last 60 seconds (new user)
  const isNewUser = user?.createdAt
    ? new Date().getTime() - new Date(user.createdAt).getTime() < 60000
    : false

  const memberTierIds = membership.tierId ? [membership.tierId] : []

  // Get org settings
  const settings = (org.settings as Record<string, unknown>) || {}
  const primaryColor = (settings.primaryColor as string) || "#D4A84B"
  const enabledFeatures = (settings.features as string[]) || ["community"]

  // Get accessible communities
  const communities = await db.community.findMany({
    where: { organizationId: org.id },
    include: {
      channels: {
        where: {
          OR: [
            { isPublic: true },
            { accessTierIds: { hasSome: memberTierIds } },
          ],
        },
        take: 3,
        orderBy: { position: "asc" },
      },
      _count: {
        select: { channels: true },
      },
    },
  })

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
      _count: {
        select: { modules: true },
      },
    },
    take: 6,
    orderBy: { createdAt: "desc" },
  })

  // Get user's enrollments with progress
  const enrollments = await db.enrollment.findMany({
    where: { userId: member.id },
    include: {
      course: true,
    },
    orderBy: { enrolledAt: "desc" },
    take: 3,
  })

  // Get recent posts from accessible channels
  const channelIds = communities.flatMap((c) => c.channels.map((ch) => ch.id))
  const recentPosts = await db.post.findMany({
    where: {
      channelId: { in: channelIds },
      isPublished: true,
    },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
      channel: {
        select: {
          id: true,
          name: true,
          slug: true,
          community: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: { comments: true, reactions: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  })

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="font-display text-3xl text-white uppercase tracking-tight">
          {isNewUser
            ? `Welcome to ${org.name}!`
            : `Welcome back, ${member.name || "Member"}!`}
        </h1>
        <p className="text-white/60 mt-2">
          {isNewUser
            ? "We're excited to have you here. Let's explore what's available."
            : `Here's what's happening in ${org.name}`}
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Continue Learning */}
          {enrollments.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-white uppercase tracking-wide">
                  Continue Learning
                </h2>
                <Link
                  href="/member/courses"
                  className="text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  style={{ color: primaryColor }}
                >
                  All Courses <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-4">
                {enrollments.map((enrollment) => (
                  <Link
                    key={enrollment.id}
                    href={`/member/courses/${enrollment.course.slug}`}
                    className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 hover:border-white/30 transition-colors"
                  >
                    <div className="w-24 h-16 bg-sola-dark-navy flex items-center justify-center flex-shrink-0">
                      {enrollment.course.thumbnail ? (
                        <img
                          src={enrollment.course.thumbnail}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="h-6 w-6 text-white/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-white uppercase tracking-wide truncate">
                        {enrollment.course.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-white/10 overflow-hidden">
                          <div
                            className="h-full"
                            style={{
                              width: `${enrollment.progress}%`,
                              backgroundColor: primaryColor,
                            }}
                          />
                        </div>
                        <span className="text-white/60 text-sm">
                          {Math.round(enrollment.progress)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {enabledFeatures.includes("community") && recentPosts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-xl text-white uppercase tracking-wide">
                  Recent Activity
                </h2>
                <Link
                  href="/community"
                  className="text-sm flex items-center gap-1 hover:gap-2 transition-all"
                  style={{ color: primaryColor }}
                >
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="space-y-3">
                {recentPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/community/${post.channel?.slug || post.channelId}`}
                    className="block bg-white/5 border border-white/10 p-4 hover:border-white/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name || ""}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white"
                          style={{ backgroundColor: primaryColor }}
                        >
                          {post.author.name?.charAt(0) || "?"}
                        </div>
                      )}
                      <div>
                        <span className="text-white text-sm font-medium">
                          {post.author.name || "Anonymous"}
                        </span>
                        <span className="text-white/40 text-xs ml-2">
                          in {post.channel?.name}
                        </span>
                      </div>
                    </div>
                    <p className="text-white/80 text-sm line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 mt-3 text-white/40 text-xs">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {post._count.comments}
                      </span>
                      <span>{post._count.reactions} reactions</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Links */}
          <div className="bg-white/5 border border-white/10 p-6">
            <h3 className="font-display text-lg text-white uppercase tracking-wide mb-4">
              Quick Links
            </h3>
            <div className="space-y-2">
              {enabledFeatures.includes("community") && communities.length > 0 && (
                <Link
                  href="/community"
                  className="flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Users className="h-5 w-5" />
                  <span>Community ({communities.length})</span>
                </Link>
              )}
              {enabledFeatures.includes("courses") && (
                <Link
                  href="/member/courses"
                  className="flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  <span>Courses ({courses.length})</span>
                </Link>
              )}
              {enabledFeatures.includes("livestreams") && (
                <Link
                  href="/member/livestreams"
                  className="flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <Video className="h-5 w-5" />
                  <span>Livestreams</span>
                </Link>
              )}
              {enabledFeatures.includes("messaging") && (
                <Link
                  href="/member/messages"
                  className="flex items-center gap-3 p-3 text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <MessageSquare className="h-5 w-5" />
                  <span>Messages</span>
                </Link>
              )}
            </div>
          </div>

          {/* Membership Info */}
          {membership.tier && (
            <div
              className="border p-6"
              style={{
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`,
              }}
            >
              <h3 className="font-display text-lg text-white uppercase tracking-wide mb-2">
                Your Plan
              </h3>
              <p className="font-display text-xl mb-4" style={{ color: primaryColor }}>
                {membership.tier.name}
              </p>
              {membership.tier.features && (
                <ul className="space-y-2 text-sm">
                  {(typeof membership.tier.features === "string"
                    ? JSON.parse(membership.tier.features)
                    : membership.tier.features
                  )
                    .slice(0, 5)
                    .map((feature: string, idx: number) => (
                      <li key={idx} className="text-white/60 flex items-start gap-2">
                        <span style={{ color: primaryColor }}>✓</span>
                        {feature}
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
