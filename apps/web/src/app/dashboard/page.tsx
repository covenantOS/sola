import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import {
  Users,
  BookOpen,
  Video,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Zap,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const userName = (claims?.name as string) || "Creator"

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
          Welcome back, {userName}
        </h2>
        <p className="text-white/60 mt-2">
          Here&apos;s what&apos;s happening with your community today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Total Members</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">0</span>
            <span className="ml-2 text-xs text-sola-gold flex items-center inline-flex">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0%
            </span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Active Courses</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">0</span>
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
            <span className="font-display text-3xl text-white">0</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/60">Revenue (MTD)</span>
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <div className="mt-4">
            <span className="font-display text-3xl text-white">$0.00</span>
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
