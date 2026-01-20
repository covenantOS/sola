"use client"

import { formatDistanceToNow } from "date-fns"
import {
  Users,
  BookOpen,
  MessageSquare,
  Video,
  TrendingUp,
  DollarSign,
  Radio,
  Hash,
  FileText,
  GraduationCap,
  User,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"

interface AnalyticsClientProps {
  overview: {
    members: number
    recentMembers: number
    communities: number
    channels: number
    posts: number
    courses: number
    publishedCourses: number
    enrollments: number
    recentEnrollments: number
    livestreams: number
    liveNow: number
    estimatedRevenue: number
  }
  recentActivity: {
    posts: Array<{
      id: string
      title: string
      author: string | null
      authorAvatar: string | null
      channel: string
      createdAt: Date
    }>
    enrollments: Array<{
      id: string
      userName: string | null
      userAvatar: string | null
      courseName: string
      createdAt: Date
    }>
  }
}

export function AnalyticsClient({ overview, recentActivity }: AnalyticsClientProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl text-white uppercase tracking-wide">
          Analytics
        </h1>
        <p className="text-white/60 mt-1">
          Track your community growth and engagement.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Members */}
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-sola-gold" />
            </div>
            {overview.recentMembers > 0 && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                +{overview.recentMembers}
              </div>
            )}
          </div>
          <p className="font-display text-3xl text-white">{overview.members}</p>
          <p className="text-white/60 text-sm mt-1">Total Members</p>
        </div>

        {/* Enrollments */}
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-sola-gold" />
            </div>
            {overview.recentEnrollments > 0 && (
              <div className="flex items-center gap-1 text-green-400 text-sm">
                <ArrowUpRight className="h-4 w-4" />
                +{overview.recentEnrollments}
              </div>
            )}
          </div>
          <p className="font-display text-3xl text-white">{overview.enrollments}</p>
          <p className="text-white/60 text-sm mt-1">Course Enrollments</p>
        </div>

        {/* Revenue */}
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-sola-gold/10 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-sola-gold" />
            </div>
          </div>
          <p className="font-display text-3xl text-white">
            ${overview.estimatedRevenue.toLocaleString()}
          </p>
          <p className="text-white/60 text-sm mt-1">Estimated Revenue</p>
        </div>

        {/* Live Now */}
        <div className="bg-white/5 border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-sola-red/10 flex items-center justify-center">
              <Radio className="h-5 w-5 text-sola-red" />
            </div>
            {overview.liveNow > 0 && (
              <span className="px-2 py-1 bg-sola-red/20 text-sola-red text-xs uppercase">
                Live
              </span>
            )}
          </div>
          <p className="font-display text-3xl text-white">{overview.liveNow}</p>
          <p className="text-white/60 text-sm mt-1">Streaming Now</p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="bg-white/5 border border-white/10 p-4 text-center">
          <p className="font-display text-2xl text-white">{overview.communities}</p>
          <p className="text-white/40 text-xs uppercase tracking-wide mt-1">
            Communities
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 text-center">
          <p className="font-display text-2xl text-white">{overview.channels}</p>
          <p className="text-white/40 text-xs uppercase tracking-wide mt-1">
            Channels
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 text-center">
          <p className="font-display text-2xl text-white">{overview.posts}</p>
          <p className="text-white/40 text-xs uppercase tracking-wide mt-1">
            Posts
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 text-center">
          <p className="font-display text-2xl text-white">{overview.courses}</p>
          <p className="text-white/40 text-xs uppercase tracking-wide mt-1">
            Courses
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 text-center">
          <p className="font-display text-2xl text-white">
            {overview.publishedCourses}
          </p>
          <p className="text-white/40 text-xs uppercase tracking-wide mt-1">
            Published
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 p-4 text-center">
          <p className="font-display text-2xl text-white">{overview.livestreams}</p>
          <p className="text-white/40 text-xs uppercase tracking-wide mt-1">
            Livestreams
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Posts */}
        <div className="bg-white/5 border border-white/10">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-display text-lg text-white uppercase tracking-wide flex items-center gap-2">
              <FileText className="h-5 w-5 text-sola-gold" />
              Recent Posts
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentActivity.posts.length === 0 ? (
              <div className="p-6 text-center text-white/40">
                No posts yet
              </div>
            ) : (
              recentActivity.posts.map((post) => (
                <div key={post.id} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">{post.title}</p>
                    <p className="text-xs text-white/40">
                      {post.author} in #{post.channel}
                    </p>
                  </div>
                  <span className="text-xs text-white/30">
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Enrollments */}
        <div className="bg-white/5 border border-white/10">
          <div className="p-4 border-b border-white/10">
            <h2 className="font-display text-lg text-white uppercase tracking-wide flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-sola-gold" />
              Recent Enrollments
            </h2>
          </div>
          <div className="divide-y divide-white/5">
            {recentActivity.enrollments.length === 0 ? (
              <div className="p-6 text-center text-white/40">
                No enrollments yet
              </div>
            ) : (
              recentActivity.enrollments.map((enrollment) => (
                <div key={enrollment.id} className="p-4 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {enrollment.userAvatar ? (
                      <img
                        src={enrollment.userAvatar}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="h-4 w-4 text-white/40" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white truncate">
                      {enrollment.userName || "Anonymous"}
                    </p>
                    <p className="text-xs text-white/40 truncate">
                      enrolled in {enrollment.courseName}
                    </p>
                  </div>
                  <span className="text-xs text-white/30">
                    {formatDistanceToNow(new Date(enrollment.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-sola-gold/10 border border-sola-gold/30 p-6 text-center">
        <TrendingUp className="h-10 w-10 text-sola-gold mx-auto mb-4" />
        <h3 className="font-display text-white uppercase tracking-wide mb-2">
          Advanced Analytics Coming Soon
        </h3>
        <p className="text-white/60 text-sm max-w-md mx-auto">
          We&apos;re building detailed charts, engagement metrics, revenue tracking,
          and more to help you grow your community.
        </p>
      </div>
    </div>
  )
}
