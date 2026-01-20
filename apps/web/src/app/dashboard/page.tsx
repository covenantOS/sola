import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import {
  Users,
  BookOpen,
  Video,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Zap,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Eye,
  ExternalLink,
  Crown,
  Hash,
  Clock,
} from "lucide-react"
import Link from "next/link"

async function getDashboardStats(organizationId: string) {
  const [memberships, courses, livestreams, tiers, communities, recentPosts] = await Promise.all([
    db.membership.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    db.course.count({
      where: { organizationId, isPublished: true },
    }),
    db.livestream.count({
      where: { organizationId },
    }),
    db.membershipTier.count({
      where: { organizationId, isActive: true },
    }),
    db.community.findFirst({
      where: { organizationId },
      include: {
        channels: {
          take: 1,
        },
      },
    }),
    db.post.findMany({
      where: {
        channel: {
          community: {
            organizationId,
          },
        },
      },
      include: {
        author: {
          select: { name: true, avatar: true },
        },
        channel: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  return {
    totalMembers: memberships,
    activeCourses: courses,
    totalLivestreams: livestreams,
    totalTiers: tiers,
    hasChannels: (communities?.channels?.length || 0) > 0,
    hasCommunity: !!communities,
    recentPosts,
  }
}

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const userName = (claims?.name as string) || "Creator"
  const { user, organization } = await getUserWithOrganization(claims?.sub || "")

  const stats = organization
    ? await getDashboardStats(organization.id)
    : { totalMembers: 0, activeCourses: 0, totalLivestreams: 0, totalTiers: 0, hasChannels: false, hasCommunity: false, recentPosts: [] }

  const isStripeConnected = organization?.stripeOnboardingComplete
  const orgSettings = (organization?.settings as Record<string, unknown>) || {}
  const primaryColor = (orgSettings.primaryColor as string) || "#D4A84B"

  // Check completion status for each step
  const setupSteps = {
    stripe: isStripeConnected,
    tiers: stats.totalTiers > 0,
    community: stats.hasChannels,
    course: stats.activeCourses > 0,
  }

  const completedSteps = Object.values(setupSteps).filter(Boolean).length
  const totalSteps = Object.keys(setupSteps).length
  const isSetupComplete = completedSteps === totalSteps

  // Check if user was created within the last 60 seconds (new user)
  const isNewUser = user?.createdAt
    ? new Date().getTime() - new Date(user.createdAt).getTime() < 60000
    : false

  const welcomeMessage = isNewUser
    ? `Welcome to ${organization?.name || "Sola+"}!`
    : `Welcome back, ${userName}`

  const communityUrl = organization
    ? `https://${organization.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "solaplus.ai"}`
    : null

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-start justify-between" data-tour="dashboard-welcome">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
            {welcomeMessage}
          </h2>
          <p className="text-white/60 mt-2">
            {isSetupComplete
              ? "Here's what's happening with your community today."
              : `${completedSteps}/${totalSteps} setup steps complete. Let's finish setting up your community.`}
          </p>
        </div>
        {communityUrl && (
          <a
            href={communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-sola-gold transition-colors"
          >
            <Eye className="h-4 w-4" />
            View Public Page
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-stats">
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Total Members</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">{stats.totalMembers}</span>
            {stats.totalMembers > 0 && (
              <span className="ml-2 text-xs text-sola-gold flex items-center inline-flex">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active
              </span>
            )}
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Published Courses</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">{stats.activeCourses}</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Membership Tiers</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Crown className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">{stats.totalTiers}</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Stripe Status</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {isStripeConnected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-green-400 text-sm">Connected</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-sola-gold" />
                <span className="text-sola-gold text-sm">Not Connected</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Setup Checklist - only show if not complete */}
      {!isSetupComplete && (
        <div className="bg-white/5 border border-white/10">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="font-display text-lg text-white uppercase tracking-wide">
              Get Started
            </h3>
            <span className="text-sm text-white/40">
              {completedSteps}/{totalSteps} complete
            </span>
          </div>
          <div className="divide-y divide-white/5">
            {/* Stripe */}
            <div className={`flex items-center justify-between p-4 ${setupSteps.stripe ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4">
                {setupSteps.stripe ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-white/30 rounded-full" />
                )}
                <div>
                  <p className="text-white font-medium">Connect Stripe</p>
                  <p className="text-white/40 text-sm">Accept payments from members</p>
                </div>
              </div>
              {!setupSteps.stripe && (
                <Link
                  href="/dashboard/settings/payments"
                  className="px-4 py-2 text-sm font-display uppercase tracking-wide"
                  style={{ backgroundColor: primaryColor, color: "#000" }}
                >
                  Connect
                </Link>
              )}
            </div>

            {/* Membership Tiers */}
            <div className={`flex items-center justify-between p-4 ${setupSteps.tiers ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4">
                {setupSteps.tiers ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-white/30 rounded-full" />
                )}
                <div>
                  <p className="text-white font-medium">Create Membership Tiers</p>
                  <p className="text-white/40 text-sm">Set pricing for your community</p>
                </div>
              </div>
              {!setupSteps.tiers && (
                <Link
                  href="/dashboard/members"
                  className="px-4 py-2 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-colors"
                >
                  Create Tier
                </Link>
              )}
            </div>

            {/* Community */}
            <div className={`flex items-center justify-between p-4 ${setupSteps.community ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4">
                {setupSteps.community ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-white/30 rounded-full" />
                )}
                <div>
                  <p className="text-white font-medium">Set Up Community</p>
                  <p className="text-white/40 text-sm">Create channels for discussions</p>
                </div>
              </div>
              {!setupSteps.community && (
                <Link
                  href="/dashboard/community"
                  className="px-4 py-2 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-colors"
                >
                  Set Up
                </Link>
              )}
            </div>

            {/* Course */}
            <div className={`flex items-center justify-between p-4 ${setupSteps.course ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-4">
                {setupSteps.course ? (
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                ) : (
                  <div className="w-5 h-5 border-2 border-white/30 rounded-full" />
                )}
                <div>
                  <p className="text-white font-medium">Create a Course</p>
                  <p className="text-white/40 text-sm">Upload video content for members</p>
                </div>
              </div>
              {!setupSteps.course && (
                <Link
                  href="/dashboard/courses/new"
                  className="px-4 py-2 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-colors"
                >
                  Create
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - show when setup is complete */}
      {isSetupComplete && (
        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/dashboard/community"
            className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 hover:border-sola-gold/50 transition-all"
          >
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Hash className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <p className="text-white font-display uppercase tracking-wide text-sm">Community</p>
              <p className="text-white/40 text-xs">Manage channels & posts</p>
            </div>
          </Link>

          <Link
            href="/dashboard/members"
            className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 hover:border-sola-gold/50 transition-all"
          >
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <p className="text-white font-display uppercase tracking-wide text-sm">Members</p>
              <p className="text-white/40 text-xs">{stats.totalMembers} active members</p>
            </div>
          </Link>

          <Link
            href="/dashboard/courses"
            className="flex items-center gap-4 bg-white/5 border border-white/10 p-4 hover:border-sola-gold/50 transition-all"
          >
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-sola-gold" />
            </div>
            <div>
              <p className="text-white font-display uppercase tracking-wide text-sm">Courses</p>
              <p className="text-white/40 text-xs">{stats.activeCourses} published courses</p>
            </div>
          </Link>
        </div>
      )}

      {/* Recent activity */}
      <div>
        <h3 className="font-display text-xl text-white uppercase tracking-wide mb-6">
          Recent Activity
        </h3>
        {stats.recentPosts.length > 0 ? (
          <div className="bg-white/5 border border-white/10 divide-y divide-white/5">
            {stats.recentPosts.map((post) => (
              <div key={post.id} className="p-4 flex items-start gap-4">
                {post.author.avatar ? (
                  <img
                    src={post.author.avatar}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {post.author.name?.charAt(0) || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white font-medium">{post.author.name || "Member"}</span>
                    <span className="text-white/40">posted in</span>
                    <span className="text-sola-gold">#{post.channel?.name}</span>
                  </div>
                  <p className="text-white/60 text-sm mt-1 line-clamp-2">{post.content}</p>
                  <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 p-8">
            <p className="text-white/40 text-center py-8">
              No recent activity yet. Start by creating content or inviting members.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
