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
} from "lucide-react"
import Link from "next/link"

async function getDashboardStats(organizationId: string) {
  const [memberships, courses, livestreams] = await Promise.all([
    db.membership.count({
      where: { organizationId },
    }),
    db.course.count({
      where: { organizationId, isPublished: true },
    }),
    db.livestream.count({
      where: { organizationId },
    }),
  ])

  return {
    totalMembers: memberships,
    activeCourses: courses,
    totalLivestreams: livestreams,
  }
}

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const userName = (claims?.name as string) || "Creator"
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  const stats = organization
    ? await getDashboardStats(organization.id)
    : { totalMembers: 0, activeCourses: 0, totalLivestreams: 0 }

  const isStripeConnected = organization?.stripeOnboardingComplete

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div data-tour="dashboard-welcome">
        <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
          Welcome back, {userName}
        </h2>
        <p className="text-white/60 mt-2">
          Here&apos;s what&apos;s happening with your community today.
        </p>
      </div>

      {/* Stripe Connection Alert */}
      {!isStripeConnected && (
        <div className="bg-sola-gold/10 border border-sola-gold/30 p-4 flex items-center gap-4">
          <AlertCircle className="h-5 w-5 text-sola-gold flex-shrink-0" />
          <div className="flex-1">
            <p className="text-white font-display uppercase tracking-wide text-sm">
              Connect Stripe to start accepting payments
            </p>
            <p className="text-white/60 text-sm">
              You need to connect your Stripe account before you can accept membership payments or sell courses.
            </p>
          </div>
          <Link
            href="/dashboard/settings/payments"
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-4 py-2 text-xs transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)] whitespace-nowrap"
          >
            Connect Stripe
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>
      )}

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
            <span className="text-sm text-white/60">Livestreams</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Video className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">{stats.totalLivestreams}</span>
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

      {/* Quick actions */}
      <div>
        <h3 className="font-display text-xl text-white uppercase tracking-wide mb-6">
          Get Started
        </h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all duration-300">
            <div className="w-12 h-12 bg-sola-gold/10 flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-sola-gold" />
            </div>
            <h4 className="font-display text-lg text-white uppercase tracking-wide mb-2">
              Connect Stripe
            </h4>
            <p className="text-sm text-white/60 mb-6">
              Connect your Stripe account to start accepting payments from your members.
            </p>
            <Link
              href="/dashboard/settings/payments"
              className="inline-flex items-center bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
            >
              Connect Stripe
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all duration-300">
            <div className="w-12 h-12 bg-sola-gold/10 flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-sola-gold" />
            </div>
            <h4 className="font-display text-lg text-white uppercase tracking-wide mb-2">
              Create Your Community
            </h4>
            <p className="text-sm text-white/60 mb-6">
              Set up channels for discussions, announcements, and resources.
            </p>
            <Link
              href="/dashboard/community"
              className="inline-flex items-center bg-transparent text-white border-2 border-white/30 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:border-sola-red"
            >
              Create Community
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <div className="bg-white/5 border border-white/10 p-6 hover:border-sola-gold/50 transition-all duration-300">
            <div className="w-12 h-12 bg-sola-gold/10 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-sola-gold" />
            </div>
            <h4 className="font-display text-lg text-white uppercase tracking-wide mb-2">
              Upload Your First Course
            </h4>
            <p className="text-sm text-white/60 mb-6">
              Create video courses and lessons for your members to learn from.
            </p>
            <Link
              href="/dashboard/courses/new"
              className="inline-flex items-center bg-transparent text-white border-2 border-white/30 font-display font-semibold uppercase tracking-widest px-6 py-3 text-sm transition-all duration-300 hover:border-sola-red"
            >
              Create Course
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h3 className="font-display text-xl text-white uppercase tracking-wide mb-6">
          Recent Activity
        </h3>
        <div className="bg-white/5 border border-white/10 p-8">
          <p className="text-white/40 text-center py-8">
            No recent activity yet. Start by creating your first community or course.
          </p>
        </div>
      </div>
    </div>
  )
}
