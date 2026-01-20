import { db } from "./db"

// Role hierarchy - higher number = more permissions
const ROLE_HIERARCHY: Record<string, number> = {
  MEMBER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  OWNER: 4,
}

export type UserRole = "MEMBER" | "MODERATOR" | "ADMIN" | "OWNER"

export interface PermissionContext {
  userId: string
  role: UserRole
  tierId: string | null
  isOwner: boolean
  organizationId: string
}

/**
 * Get permission context for a user in an organization
 */
export async function getPermissionContext(
  userId: string | null,
  organizationId: string
): Promise<PermissionContext | null> {
  if (!userId) return null

  // Check if user is the organization owner
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { ownerId: true },
  })

  const isOwner = organization?.ownerId === userId

  // Get membership
  const membership = await db.membership.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
    select: {
      role: true,
      tierId: true,
    },
  })

  // Owner always has access even without explicit membership
  if (isOwner && !membership) {
    return {
      userId,
      role: "OWNER",
      tierId: null,
      isOwner: true,
      organizationId,
    }
  }

  if (!membership) return null

  return {
    userId,
    role: isOwner ? "OWNER" : (membership.role as UserRole),
    tierId: membership.tierId,
    isOwner,
    organizationId,
  }
}

/**
 * Check if user has at least a certain role level
 */
export function hasRole(context: PermissionContext | null, requiredRole: UserRole): boolean {
  if (!context) return false
  return ROLE_HIERARCHY[context.role] >= ROLE_HIERARCHY[requiredRole]
}

/**
 * Check if user can view a channel
 */
export function canViewChannel(
  context: PermissionContext | null,
  channel: {
    isPublic: boolean
    accessTierIds: string[]
  }
): boolean {
  // Public channels are visible to everyone
  if (channel.isPublic) return true

  // Must be authenticated
  if (!context) return false

  // Owners and admins can see everything
  if (hasRole(context, "ADMIN")) return true

  // Check tier access
  if (channel.accessTierIds.length === 0) return true // No restrictions
  if (!context.tierId) return false
  return channel.accessTierIds.includes(context.tierId)
}

/**
 * Check if user can post in a channel
 */
export function canPostInChannel(
  context: PermissionContext | null,
  channel: {
    type: string
    accessTierIds: string[]
    isPublic: boolean
  }
): boolean {
  // Must be authenticated
  if (!context) return false

  // Announcement channels are admin/owner only
  if (channel.type === "ANNOUNCEMENTS") {
    return hasRole(context, "ADMIN")
  }

  // Must be able to view channel to post in it
  if (!canViewChannel(context, channel)) return false

  // Regular members can post in channels they can view
  return true
}

/**
 * Check if user can edit/delete a post
 */
export function canModifyPost(
  context: PermissionContext | null,
  post: { authorId: string }
): boolean {
  if (!context) return false

  // Authors can modify their own posts
  if (post.authorId === context.userId) return true

  // Moderators and above can modify any post
  return hasRole(context, "MODERATOR")
}

/**
 * Check if user can delete a comment
 */
export function canDeleteComment(
  context: PermissionContext | null,
  comment: { authorId: string }
): boolean {
  if (!context) return false

  // Authors can delete their own comments
  if (comment.authorId === context.userId) return true

  // Moderators and above can delete any comment
  return hasRole(context, "MODERATOR")
}

/**
 * Check if user can pin/unpin posts
 */
export function canPinPost(context: PermissionContext | null): boolean {
  return hasRole(context, "MODERATOR")
}

/**
 * Check if user can manage member roles
 */
export function canManageRoles(context: PermissionContext | null): boolean {
  return hasRole(context, "ADMIN")
}

/**
 * Check if user can manage community settings
 */
export function canManageCommunity(context: PermissionContext | null): boolean {
  return hasRole(context, "ADMIN")
}

/**
 * Check if user can access a course
 */
export function canAccessCourse(
  context: PermissionContext | null,
  course: {
    accessType: string
    accessTierIds: string[]
  }
): boolean {
  // Free courses are accessible to everyone (even unauthenticated)
  if (course.accessType === "FREE") return true

  // Must be authenticated for non-free courses
  if (!context) return false

  // Owners and admins can access all courses
  if (hasRole(context, "ADMIN")) return true

  // Check tier access for MEMBERSHIP type courses
  if (course.accessType === "MEMBERSHIP") {
    if (course.accessTierIds.length === 0) return true // No restrictions
    if (!context.tierId) return false
    return course.accessTierIds.includes(context.tierId)
  }

  // PAID courses - check if enrolled (handled separately)
  return true
}

/**
 * Check if user can mute other members
 */
export function canMuteMembers(context: PermissionContext | null): boolean {
  return hasRole(context, "MODERATOR")
}

/**
 * Get role badge style for display
 */
export function getRoleBadgeStyle(role: UserRole): { label: string; className: string } {
  switch (role) {
    case "OWNER":
      return { label: "Creator", className: "bg-sola-gold text-sola-black" }
    case "ADMIN":
      return { label: "Admin", className: "bg-sola-red text-white" }
    case "MODERATOR":
      return { label: "Mod", className: "bg-blue-600 text-white" }
    default:
      return { label: "", className: "" }
  }
}
