"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  addDomainToVercel,
  removeDomainFromVercel,
  checkDomainStatus,
  verifyDomain,
} from "@/lib/vercel"

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

// Reserved subdomains that can't be used by creators
const RESERVED_SUBDOMAINS = [
  "my", "app", "www", "api", "admin", "help", "docs", "blog", "status",
  "mail", "ftp", "smtp", "pop", "imap", "cdn", "static", "assets",
]

// Update domain settings (slug only - custom domains managed via Domain model)
export async function updateDomainSettings({
  organizationId,
  slug,
}: {
  organizationId: string
  slug: string
}) {
  try {
    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return { error: "Slug can only contain lowercase letters, numbers, and hyphens" }
    }

    if (slug.length < 3) {
      return { error: "Slug must be at least 3 characters" }
    }

    // Check if slug is reserved
    if (RESERVED_SUBDOMAINS.includes(slug.toLowerCase())) {
      return { error: "This subdomain is reserved and cannot be used" }
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

    await db.organization.update({
      where: { id: organizationId },
      data: { slug },
    })

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Failed to update domain settings:", error)
    return { error: "Failed to update domain settings" }
  }
}

// Check custom domain verification status
export async function checkCustomDomainStatus(domain: string) {
  try {
    const status = await checkDomainStatus(domain)
    return status
  } catch (error) {
    console.error("Failed to check domain status:", error)
    return {
      exists: false,
      verified: false,
      configured: false,
      misconfigured: false,
      error: "Failed to check domain status",
    }
  }
}

// Verify custom domain (trigger DNS check)
export async function verifyCustomDomain(domain: string) {
  try {
    const result = await verifyDomain(domain)
    return result
  } catch (error) {
    console.error("Failed to verify domain:", error)
    return {
      success: false,
      verified: false,
      error: "Failed to verify domain",
    }
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
