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
  CheckCircle2,
  AlertCircle,
  Eye,
  ExternalLink,
  Crown,
  Hash,
  Clock,
  Plus,
  Send,
  Radio,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

type RecentMember = {
  id: string
  joinedAt: Date
  user: { name: string | null; avatar: string | null; email: string }
  tier: { name: string } | null
}

type RecentPost = {
  id: string
  content: string
  createdAt: Date
  author: { name: string | null; avatar: string | null }
  channel: { name: string } | null
}

async function getDashboardStats(organizationId: string) {
  const [
    memberships,
    courses,
    livestreams,
    tiers,
    communities,
    recentPosts,
    recentMembers,
    tiersWithPrices,
  ] = await Promise.all([
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
    // Get recent new members
    db.membership.findMany({
      where: { organizationId, status: "ACTIVE" },
      include: {
        user: {
          select: { name: true, avatar: true, email: true },
        },
        tier: {
          select: { name: true },
        },
      },
      orderBy: { joinedAt: "desc" },
      take: 3,
    }),
    // Get tiers with prices for revenue estimate
    db.membershipTier.findMany({
      where: { organizationId, isActive: true },
      select: { id: true, price: true },
    }),
  ])

  // Calculate estimated monthly revenue
  const memberCountByTier = await db.membership.groupBy({
    by: ["tierId"],
    where: { organizationId, status: "ACTIVE" },
    _count: { id: true },
  })

  let estimatedRevenue = 0
  for (const group of memberCountByTier) {
    const tier = tiersWithPrices.find((t) => t.id === group.tierId)
    if (tier) {
      estimatedRevenue += Number(tier.price) * group._count.id
    }
  }

  return {
    totalMembers: memberships,
    activeCourses: courses,
    totalLivestreams: livestreams,
    totalTiers: tiers,
    hasChannels: (communities?.channels?.length || 0) > 0,
    hasCommunity: !!communities,
    recentPosts: recentPosts as RecentPost[],
    recentMembers: recentMembers as RecentMember[],
    estimatedRevenue,
  }
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 18) return "Good afternoon"
  return "Good evening"
}

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const userName = (claims?.name as string)?.split(" ")[0] || "Creator"
  const { user, organization } = await getUserWithOrganization(claims?.sub || "")

  const stats = organization
    ? await getDashboardStats(organization.id)
    : {
        totalMembers: 0,
        activeCourses: 0,
        totalLivestreams: 0,
        totalTiers: 0,
        hasChannels: false,
        hasCommunity: false,
        recentPosts: [] as RecentPost[],
        recentMembers: [] as RecentMember[],
        estimatedRevenue: 0,
      }

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

  const communityUrl = organization
    ? `https://${organization.slug}.${process.env.NEXT_PUBLIC_ROOT_DOMAIN || "solaplus.ai"}`
    : null

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex items-start justify-between" data-tour="dashboard-welcome">
        <div>
          <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
            {getGreeting()}, {userName}
          </h2>
          <p className="text-white/60 mt-2">
            {isSetupComplete
              ? "Here's what's happening with your community today."
              : `${completedSteps}/${totalSteps} setup steps complete. Let's finish setting up.`}
          </p>
        </div>
        {communityUrl && (
          <a
            href={communityUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-white/60 hover:text-sola-gold transition-colors duration-200"
          >
            <Eye className="h-4 w-4" />
            View Public Page
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Stats grid - Command Center Style */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-tour="dashboard-stats">
        {/* Revenue Card */}
        <div className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Est. Monthly Revenue</span>
            <div
              className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <DollarSign className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">
              ${stats.estimatedRevenue.toLocaleString()}
            </span>
            {isStripeConnected && (
              <span className="ml-2 text-xs text-green-400 flex items-center inline-flex">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Live
              </span>
            )}
          </div>
        </div>

        {/* Members Card */}
        <div className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Total Members</span>
            <div
              className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Users className="h-5 w-5" style={{ color: primaryColor }} />
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

        {/* Courses Card */}
        <div className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Published Courses</span>
            <div
              className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <BookOpen className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">{stats.activeCourses}</span>
          </div>
        </div>

        {/* Tiers Card */}
        <div className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/30 transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Membership Tiers</span>
            <div
              className="w-10 h-10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
              style={{ backgroundColor: `${primaryColor}15` }}
            >
              <Crown className="h-5 w-5" style={{ color: primaryColor }} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="font-display text-3xl text-white">{stats.totalTiers}</span>
            {!isStripeConnected && (
              <span className="text-xs text-yellow-400 flex items-center">
                <AlertCircle className="h-3 w-3 mr-1" />
                Connect Stripe
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white/5 border border-white/10 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-sm text-white/60 uppercase tracking-wide">
            Quick Actions
          </h3>
          <Sparkles className="h-4 w-4 text-sola-gold" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/dashboard/community"
            className="flex items-center gap-3 px-4 py-3 text-sm font-display uppercase tracking-wide transition-all duration-200 hover:scale-[1.02]"
            style={{ backgroundColor: primaryColor, color: "#000" }}
          >
            <Plus className="h-4 w-4" />
            New Post
          </Link>
          <Link
            href="/dashboard/courses/new"
            className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-all duration-200 hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" />
            New Course
          </Link>
          <Link
            href="/dashboard/livestreams"
            className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-all duration-200 hover:scale-[1.02]"
          >
            <Radio className="h-4 w-4" />
            Go Live
          </Link>
          <Link
            href="/dashboard/messages"
            className="flex items-center gap-3 px-4 py-3 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-all duration-200 hover:scale-[1.02]"
          >
            <Send className="h-4 w-4" />
            Message
          </Link>
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
            <div
              className={`flex items-center justify-between p-4 transition-opacity duration-200 ${
                setupSteps.stripe ? "opacity-60" : ""
              }`}
            >
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
                  className="px-4 py-2 text-sm font-display uppercase tracking-wide transition-all duration-200 hover:scale-105"
                  style={{ backgroundColor: primaryColor, color: "#000" }}
                >
                  Connect
                </Link>
              )}
            </div>

            {/* Membership Tiers */}
            <div
              className={`flex items-center justify-between p-4 transition-opacity duration-200 ${
                setupSteps.tiers ? "opacity-60" : ""
              }`}
            >
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
                  className="px-4 py-2 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-all duration-200"
                >
                  Create
                </Link>
              )}
            </div>

            {/* Community */}
            <div
              className={`flex items-center justify-between p-4 transition-opacity duration-200 ${
                setupSteps.community ? "opacity-60" : ""
              }`}
            >
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
                  className="px-4 py-2 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-all duration-200"
                >
                  Set Up
                </Link>
              )}
            </div>

            {/* Course */}
            <div
              className={`flex items-center justify-between p-4 transition-opacity duration-200 ${
                setupSteps.course ? "opacity-60" : ""
              }`}
            >
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
                  className="px-4 py-2 bg-white/10 text-white text-sm font-display uppercase tracking-wide hover:bg-white/20 transition-all duration-200"
                >
                  Create
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Two column layout for activity */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-white uppercase tracking-wide">
              Recent Activity
            </h3>
            <Link
              href="/dashboard/community"
              className="text-sm text-white/40 hover:text-sola-gold flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {stats.recentPosts.length > 0 ? (
            <div className="bg-white/5 border border-white/10 divide-y divide-white/5">
              {stats.recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 flex items-start gap-4 hover:bg-white/5 transition-colors duration-200"
                >
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
                      <span className="text-white font-medium">
                        {post.author.name || "Member"}
                      </span>
                      <span className="text-white/40">posted in</span>
                      <span style={{ color: primaryColor }}>#{post.channel?.name}</span>
                    </div>
                    <p className="text-white/60 text-sm mt-1 line-clamp-2">{post.content}</p>
                    <p className="text-white/30 text-xs mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 p-8 text-center">
              <Hash className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">
                No recent activity. Create a channel to get started!
              </p>
            </div>
          )}
        </div>

        {/* New Members - Takes 1 column */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-lg text-white uppercase tracking-wide">
              New Members
            </h3>
            <Link
              href="/dashboard/members"
              className="text-sm text-white/40 hover:text-sola-gold flex items-center gap-1 transition-colors"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          {stats.recentMembers.length > 0 ? (
            <div className="bg-white/5 border border-white/10 divide-y divide-white/5">
              {stats.recentMembers.map((membership) => (
                <div
                  key={membership.id}
                  className="p-4 flex items-center gap-3 hover:bg-white/5 transition-colors duration-200"
                >
                  {membership.user.avatar ? (
                    <img
                      src={membership.user.avatar}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm text-white"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {membership.user.name?.charAt(0) ||
                        membership.user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {membership.user.name || membership.user.email}
                    </p>
                    {membership.tier && (
                      <p className="text-xs" style={{ color: primaryColor }}>
                        {membership.tier.name}
                      </p>
                    )}
                  </div>
                  <p className="text-white/30 text-xs">
                    {formatDistanceToNow(new Date(membership.joinedAt), { addSuffix: true })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 p-8 text-center">
              <Users className="h-10 w-10 text-white/20 mx-auto mb-3" />
              <p className="text-white/40">No members yet. Share your page to grow!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
