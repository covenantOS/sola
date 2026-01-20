"use server"

import { db } from "@/lib/db"
import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"

// Get analytics data for the organization
export async function getAnalytics() {
  const { claims } = await getLogtoContext(logtoConfig)

  if (!claims?.sub) {
    return { error: "Not authenticated" }
  }

  const user = await db.user.findUnique({
    where: { logtoId: claims.sub },
    include: { ownedOrganizations: true },
  })

  if (!user?.ownedOrganizations[0]) {
    return { error: "No organization" }
  }

  const org = user.ownedOrganizations[0]

  // Get member count
  const memberCount = await db.membership.count({
    where: { organizationId: org.id },
  })

  // Get community stats
  const communityCount = await db.community.count({
    where: { organizationId: org.id },
  })

  const channelCount = await db.channel.count({
    where: { community: { organizationId: org.id } },
  })

  const postCount = await db.post.count({
    where: { channel: { community: { organizationId: org.id } } },
  })

  // Get course stats
  const courseCount = await db.course.count({
    where: { organizationId: org.id },
  })

  const publishedCourseCount = await db.course.count({
    where: { organizationId: org.id, status: "PUBLISHED" },
  })

  const enrollmentCount = await db.enrollment.count({
    where: { course: { organizationId: org.id } },
  })

  // Get recent enrollments (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentEnrollments = await db.enrollment.count({
    where: {
      course: { organizationId: org.id },
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Get recent members (last 30 days)
  const recentMembers = await db.membership.count({
    where: {
      organizationId: org.id,
      createdAt: { gte: thirtyDaysAgo },
    },
  })

  // Get livestream stats
  const livestreamCount = await db.livestream.count({
    where: { organizationId: org.id },
  })

  const liveNowCount = await db.livestream.count({
    where: { organizationId: org.id, status: "LIVE" },
  })

  // Get recent activity
  const recentPosts = await db.post.findMany({
    where: { channel: { community: { organizationId: org.id } } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      author: { select: { name: true, avatar: true } },
      channel: { select: { name: true } },
    },
  })

  const recentEnrollmentsList = await db.enrollment.findMany({
    where: { course: { organizationId: org.id } },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: {
      user: { select: { name: true, avatar: true, email: true } },
      course: { select: { title: true } },
    },
  })

  // Calculate course revenue (sum of course prices * enrollments)
  const courses = await db.course.findMany({
    where: { organizationId: org.id, price: { gt: 0 } },
    include: { _count: { select: { enrollments: true } } },
  })

  const estimatedRevenue = courses.reduce((sum, course) => {
    return sum + Number(course.price) * course._count.enrollments
  }, 0)

  return {
    overview: {
      members: memberCount,
      recentMembers,
      communities: communityCount,
      channels: channelCount,
      posts: postCount,
      courses: courseCount,
      publishedCourses: publishedCourseCount,
      enrollments: enrollmentCount,
      recentEnrollments,
      livestreams: livestreamCount,
      liveNow: liveNowCount,
      estimatedRevenue,
    },
    recentActivity: {
      posts: recentPosts.map((p) => ({
        id: p.id,
        title: p.title,
        author: p.author.name,
        authorAvatar: p.author.avatar,
        channel: p.channel.name,
        createdAt: p.createdAt,
      })),
      enrollments: recentEnrollmentsList.map((e) => ({
        id: e.id,
        userName: e.user.name || e.user.email,
        userAvatar: e.user.avatar,
        courseName: e.course.title,
        createdAt: e.createdAt,
      })),
    },
  }
}
