import { getOrganizationBySlug, getUserMembership } from "@/lib/organization"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserByLogtoId } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import Link from "next/link"
import {
  Users,
  BookOpen,
  Video,
  ArrowRight,
  MessageSquare,
  Calendar,
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface PageProps {
  params: Promise<{ slug: string }>
}

export default async function PublicHomePage({ params }: PageProps) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  // Check if user is authenticated
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)
  let user = null
  let membership = null

  if (isAuthenticated && claims?.sub) {
    user = await getUserByLogtoId(claims.sub)
    if (user) {
      membership = await getUserMembership(user.id, organization.id)
    }
  }

  // If logged in member, show member home
  if (user && membership) {
    // Get recent posts from accessible channels
    const community = await db.community.findFirst({
      where: { organizationId: organization.id, isDefault: true },
      include: {
        channels: {
          where: {
            OR: [
              { isPublic: true },
              { accessTierIds: { hasSome: membership.tierId ? [membership.tierId] : [] } },
            ],
          },
        },
      },
    })

    const channelIds = community?.channels.map((c) => c.id) || []

    const recentPosts = await db.post.findMany({
      where: { channelId: { in: channelIds } },
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        channel: {
          select: { name: true, slug: true },
        },
      },
    })

    // Get user's course enrollments
    const enrollments = await db.enrollment.findMany({
      where: { userId: user.id },
      include: {
        course: {
          select: { id: true, title: true, slug: true, thumbnail: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
      take: 3,
    })

    return (
      <div className="space-y-8">
        {/* Welcome */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl md:text-4xl text-white uppercase tracking-tight">
              Welcome back, {user.name?.split(" ")[0] || "Member"}!
            </h1>
            <p className="text-white/60 mt-2">
              Here&apos;s what&apos;s happening in {organization.name}
            </p>
          </div>
          {membership.tier && (
            <div className="bg-sola-gold/10 border border-sola-gold/30 px-4 py-2">
              <span className="text-xs text-white/50 uppercase tracking-wide">Your Plan</span>
              <p className="text-sola-gold font-display uppercase tracking-wide">
                {membership.tier.name}
              </p>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid gap-4 md:grid-cols-4">
          <Link
            href={`/${slug}/community`}
            className="bg-white/5 border border-white/10 p-4 hover:border-sola-gold/50 transition-all"
          >
            <Users className="h-6 w-6 text-sola-gold mb-2" />
            <span className="font-display text-white uppercase tracking-wide">Community</span>
          </Link>
          <Link
            href={`/${slug}/courses`}
            className="bg-white/5 border border-white/10 p-4 hover:border-sola-gold/50 transition-all"
          >
            <BookOpen className="h-6 w-6 text-sola-gold mb-2" />
            <span className="font-display text-white uppercase tracking-wide">Courses</span>
          </Link>
          <Link
            href={`/${slug}/messages`}
            className="bg-white/5 border border-white/10 p-4 hover:border-sola-gold/50 transition-all"
          >
            <MessageSquare className="h-6 w-6 text-sola-gold mb-2" />
            <span className="font-display text-white uppercase tracking-wide">Messages</span>
          </Link>
          <Link
            href={`/${slug}/settings`}
            className="bg-white/5 border border-white/10 p-4 hover:border-sola-gold/50 transition-all"
          >
            <Calendar className="h-6 w-6 text-sola-gold mb-2" />
            <span className="font-display text-white uppercase tracking-wide">Settings</span>
          </Link>
        </div>

        {/* What's New */}
        <div>
          <h2 className="font-display text-xl text-white uppercase tracking-wide mb-4">
            What&apos;s New
          </h2>
          {recentPosts.length > 0 ? (
            <div className="space-y-3">
              {recentPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/${slug}/community/${post.channel.slug}`}
                  className="block bg-white/5 border border-white/10 p-4 hover:border-sola-gold/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {post.author.avatar ? (
                      <img
                        src={post.author.avatar}
                        alt={post.author.name || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-sola-gold/20 rounded-full flex items-center justify-center">
                        <span className="text-sola-gold font-display text-sm">
                          {(post.author.name || "U")[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-white font-medium">{post.author.name}</span>
                        <span className="text-white/30">in</span>
                        <span className="text-sola-gold">#{post.channel.name}</span>
                        <span className="text-white/30">
                          {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-white/70 mt-1 line-clamp-2">{post.content}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 p-8 text-center">
              <MessageSquare className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/40">No recent posts. Check back soon!</p>
            </div>
          )}
        </div>

        {/* Your Courses */}
        {enrollments.length > 0 && (
          <div>
            <h2 className="font-display text-xl text-white uppercase tracking-wide mb-4">
              Your Courses
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {enrollments.map((enrollment) => (
                <Link
                  key={enrollment.id}
                  href={`/${slug}/courses/${enrollment.course.slug}`}
                  className="bg-white/5 border border-white/10 overflow-hidden hover:border-sola-gold/30 transition-all"
                >
                  {enrollment.course.thumbnail && (
                    <img
                      src={enrollment.course.thumbnail}
                      alt={enrollment.course.title}
                      className="w-full h-32 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-display text-white uppercase tracking-wide">
                      {enrollment.course.title}
                    </h3>
                    <div className="mt-2">
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sola-gold"
                          style={{ width: `${enrollment.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-white/50 mt-1">
                        {enrollment.progress.toFixed(0)}% complete
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Non-member view - show public landing page
  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center py-12">
        {organization.banner && (
          <div className="absolute inset-0 -z-10">
            <img
              src={organization.banner}
              alt=""
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-sola-black to-transparent" />
          </div>
        )}
        <h1 className="font-display text-4xl md:text-6xl text-white uppercase tracking-tight">
          {organization.name}
        </h1>
        {organization.description && (
          <p className="text-white/60 mt-4 max-w-2xl mx-auto text-lg">
            {organization.description}
          </p>
        )}
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link
            href={`/${slug}/join`}
            className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-8 py-4 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
          >
            Join Now
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/${slug}/login`}
            className="inline-flex items-center gap-2 border-2 border-white/30 text-white font-display font-semibold uppercase tracking-widest px-8 py-4 text-sm transition-all duration-300 hover:border-white"
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white/5 border border-white/10 p-6 text-center">
          <Users className="h-8 w-8 text-sola-gold mx-auto mb-2" />
          <p className="font-display text-3xl text-white">{organization._count?.memberships || 0}</p>
          <p className="text-white/50 text-sm">Members</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 text-center">
          <BookOpen className="h-8 w-8 text-sola-gold mx-auto mb-2" />
          <p className="font-display text-3xl text-white">{organization._count?.courses || 0}</p>
          <p className="text-white/50 text-sm">Courses</p>
        </div>
        <div className="bg-white/5 border border-white/10 p-6 text-center">
          <Video className="h-8 w-8 text-sola-gold mx-auto mb-2" />
          <p className="font-display text-3xl text-white">{organization._count?.livestreams || 0}</p>
          <p className="text-white/50 text-sm">Livestreams</p>
        </div>
      </div>

      {/* About */}
      <div className="bg-white/5 border border-white/10 p-8">
        <h2 className="font-display text-2xl text-white uppercase tracking-wide mb-4">
          About {organization.name}
        </h2>
        <div className="flex items-start gap-6">
          {organization.owner.avatar ? (
            <img
              src={organization.owner.avatar}
              alt={organization.owner.name || "Creator"}
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 bg-sola-gold/20 rounded-full flex items-center justify-center">
              <span className="text-sola-gold font-display text-2xl">
                {(organization.owner.name || "C")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-white font-display uppercase tracking-wide">
              {organization.owner.name || "Creator"}
            </p>
            <p className="text-white/60 mt-2">
              {organization.description || `Welcome to ${organization.name}!`}
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center py-8">
        <h2 className="font-display text-2xl text-white uppercase tracking-wide mb-4">
          Ready to Join?
        </h2>
        <p className="text-white/60 mb-6">
          Become a member and get access to exclusive content
        </p>
        <Link
          href={`/${slug}/join`}
          className="inline-flex items-center gap-2 bg-sola-gold text-sola-black font-display font-semibold uppercase tracking-widest px-8 py-4 text-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(212,168,75,0.4)]"
        >
          View Membership Options
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
