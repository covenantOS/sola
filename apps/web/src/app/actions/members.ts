"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function updateMemberRole(memberId: string, newRole: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  // Validate role
  if (!["ADMIN", "MODERATOR", "MEMBER"].includes(newRole)) {
    return { error: "Invalid role" }
  }

  // Check that membership belongs to this organization
  const membership = await db.membership.findUnique({
    where: { id: memberId },
  })

  if (!membership || membership.organizationId !== organization.id) {
    return { error: "Member not found" }
  }

  // Cannot change owner role
  if (membership.role === "OWNER") {
    return { error: "Cannot change owner role" }
  }

  try {
    await db.membership.update({
      where: { id: memberId },
      data: { role: newRole as "ADMIN" | "MODERATOR" | "MEMBER" },
    })

    revalidatePath("/dashboard/community/members")
    return { success: true }
  } catch (error) {
    console.error("Failed to update member role:", error)
    return { error: "Failed to update role" }
  }
}

export async function removeMember(memberId: string) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Not authorized" }
  }

  // Check that membership belongs to this organization
  const membership = await db.membership.findUnique({
    where: { id: memberId },
  })

  if (!membership || membership.organizationId !== organization.id) {
    return { error: "Member not found" }
  }

  // Cannot remove owner
  if (membership.role === "OWNER") {
    return { error: "Cannot remove owner" }
  }

  try {
    await db.membership.delete({
      where: { id: memberId },
    })

    revalidatePath("/dashboard/community/members")
    return { success: true }
  } catch (error) {
    console.error("Failed to remove member:", error)
    return { error: "Failed to remove member" }
  }
}

export async function getMembers(filters?: {
  search?: string
  tierId?: string
  status?: string
  role?: string
}) {
  const { claims } = await getLogtoContext(logtoConfig)
  const { organization } = await getUserWithOrganization(claims?.sub || "")

  if (!organization) {
    return { error: "Organization not found", members: [] }
  }

  const where: any = { organizationId: organization.id }

  if (filters?.search) {
    where.user = {
      OR: [
        { name: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ],
    }
  }

  if (filters?.tierId) {
    where.tierId = filters.tierId
  }

  if (filters?.status) {
    where.status = filters.status
  }

  if (filters?.role) {
    where.role = filters.role
  }

  const members = await db.membership.findMany({
    where,
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
      tier: {
        select: { id: true, name: true },
      },
    },
    orderBy: { joinedAt: "desc" },
  })

  return { members }
}
