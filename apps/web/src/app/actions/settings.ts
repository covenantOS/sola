"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Update user profile
export async function updateProfile({
  userId,
  name,
  avatar,
}: {
  userId: string
  name: string
  avatar: string
}) {
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        name: name || null,
        avatar: avatar || null,
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update profile:", error)
    return { error: "Failed to update profile" }
  }
}

// Update notification settings
export async function updateNotificationSettings({
  organizationId,
  emailNewMember,
  emailNewComment,
  emailNewEnrollment,
  emailWeeklyDigest,
}: {
  organizationId: string
  emailNewMember: boolean
  emailNewComment: boolean
  emailNewEnrollment: boolean
  emailWeeklyDigest: boolean
}) {
  try {
    const org = await db.organization.findUnique({
      where: { id: organizationId },
    })

    if (!org) {
      return { error: "Organization not found" }
    }

    const currentSettings = (org.settings as Record<string, unknown>) || {}
    const newSettings = {
      ...currentSettings,
      emailNewMember,
      emailNewComment,
      emailNewEnrollment,
      emailWeeklyDigest,
    }

    await db.organization.update({
      where: { id: organizationId },
      data: { settings: newSettings },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to update notification settings:", error)
    return { error: "Failed to update notification settings" }
  }
}

// Update domain settings
export async function updateDomainSettings({
  organizationId,
  slug,
  customDomain,
}: {
  organizationId: string
  slug: string
  customDomain: string | null
}) {
  try {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { error: "Slug can only contain lowercase letters, numbers, and hyphens" }
    }

    if (slug.length < 3) {
      return { error: "Slug must be at least 3 characters" }
    }

    // Check if slug is already taken (by another org)
    const existingOrg = await db.organization.findFirst({
      where: {
        slug,
        id: { not: organizationId },
      },
    })

    if (existingOrg) {
      return { error: "This subdomain is already taken" }
    }

    // Validate custom domain format if provided
    if (customDomain) {
      // Basic domain validation
      const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/
      if (!domainRegex.test(customDomain)) {
        return { error: "Invalid domain format" }
      }

      // Check if custom domain is already taken
      const existingDomain = await db.organization.findFirst({
        where: {
          customDomain,
          id: { not: organizationId },
        },
      })

      if (existingDomain) {
        return { error: "This custom domain is already in use" }
      }
    }

    await db.organization.update({
      where: { id: organizationId },
      data: {
        slug,
        customDomain: customDomain || null,
      },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to update domain settings:", error)
    return { error: "Failed to update domain settings" }
  }
}

// Update branding settings
export async function updateBrandingSettings({
  organizationId,
  name,
  description,
  logo,
  banner,
  primaryColor,
}: {
  organizationId: string
  name: string
  description: string
  logo: string
  banner: string
  primaryColor: string
}) {
  try {
    if (!name || name.length < 2) {
      return { error: "Organization name must be at least 2 characters" }
    }

    const org = await db.organization.findUnique({
      where: { id: organizationId },
    })

    if (!org) {
      return { error: "Organization not found" }
    }

    const currentSettings = (org.settings as Record<string, unknown>) || {}
    const newSettings = {
      ...currentSettings,
      primaryColor,
    }

    await db.organization.update({
      where: { id: organizationId },
      data: {
        name,
        description: description || null,
        logo: logo || null,
        banner: banner || null,
        settings: newSettings,
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to update branding settings:", error)
    return { error: "Failed to update branding settings" }
  }
}
