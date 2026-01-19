"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { syncUserFromLogto, getUserWithOrganization } from "@/lib/user-sync"
import { createOrganization } from "@/lib/organization"
import { revalidatePath } from "next/cache"

/**
 * Get current user from session and sync to database
 */
export async function getCurrentUser() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return null
  }

  const user = await syncUserFromLogto({
    sub: claims.sub,
    email: claims.email as string | undefined,
    name: claims.name as string | undefined,
    picture: claims.picture as string | undefined,
  })

  return user
}

/**
 * Get current user with their organization
 */
export async function getCurrentUserWithOrganization() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { user: null, organization: null }
  }

  // First sync the user
  const user = await syncUserFromLogto({
    sub: claims.sub,
    email: claims.email as string | undefined,
    name: claims.name as string | undefined,
    picture: claims.picture as string | undefined,
  })

  // Then get with organization
  const result = await getUserWithOrganization(claims.sub)
  return {
    user: result.user || user,
    organization: result.organization,
  }
}

/**
 * Create organization for current user (onboarding)
 */
export async function createUserOrganization(formData: FormData) {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string | undefined

  if (!name || name.trim().length < 2) {
    return { error: "Organization name must be at least 2 characters" }
  }

  // Get user from database
  const { user } = await getUserWithOrganization(claims.sub)

  if (!user) {
    return { error: "User not found" }
  }

  try {
    const organization = await createOrganization({
      name: name.trim(),
      ownerId: user.id,
      description: description?.trim(),
    })

    revalidatePath("/dashboard")
    return { success: true, organization }
  } catch (error) {
    console.error("Failed to create organization:", error)
    return { error: "Failed to create organization" }
  }
}
