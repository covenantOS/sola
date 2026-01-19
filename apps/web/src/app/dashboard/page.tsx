import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { Button } from "@/components/ui/button"
import {
  Users,
  BookOpen,
  Video,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react"
import Link from "next/link"

export default async function DashboardPage() {
  const { claims } = await getLogtoContext(logtoConfig)
  const userName = (claims?.name as string) || "Creator"

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName}
        </h2>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your community today.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total Members
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">0</span>
            <span className="ml-2 text-xs text-green-500 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              +0%
            </span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Active Courses
            </span>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">0</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Livestreams
            </span>
            <Video className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">0</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Revenue (MTD)
            </span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold">$0.00</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Get Started</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h4 className="font-semibold mb-2">Connect Stripe</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your Stripe account to start accepting payments from your members.
            </p>
            <Link href="/dashboard/settings/payments">
              <Button>
                Connect Stripe
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h4 className="font-semibold mb-2">Create Your Community</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Set up channels for discussions, announcements, and resources.
            </p>
            <Link href="/dashboard/community">
              <Button variant="outline">
                Create Community
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h4 className="font-semibold mb-2">Upload Your First Course</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Create video courses and lessons for your members to learn from.
            </p>
            <Link href="/dashboard/courses/new">
              <Button variant="outline">
                Create Course
                <ArrowUpRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent activity placeholder */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="rounded-lg border bg-card p-6">
          <p className="text-muted-foreground text-center py-8">
            No recent activity yet. Start by creating your first community or course!
          </p>
        </div>
      </div>
    </div>
  )
}
