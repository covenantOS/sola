"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"

interface OnboardingInput {
  userId: string
  displayName: string
  bio: string
  organizationName: string
  organizationDescription: string
  useCase: string
  features: string[]
  primaryColor: string
  communityName: string
  defaultChannels: string[]
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 50)
}

async function ensureUniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug || "my-community"
  let counter = 1

  while (true) {
    const existing = await db.organization.findUnique({
      where: { slug },
    })

    if (!existing) {
      return slug
    }

    slug = `${baseSlug}-${counter}`
    counter++
  }
}

const CHANNEL_TYPES: Record<string, "DISCUSSION" | "ANNOUNCEMENTS" | "EVENTS" | "RESOURCES"> = {
  announcements: "ANNOUNCEMENTS",
  general: "DISCUSSION",
  prayer: "DISCUSSION",
  introductions: "DISCUSSION",
  resources: "RESOURCES",
}

export async function completeOnboarding(input: OnboardingInput) {
  try {
    // Update user profile
    const user = await db.user.update({
      where: { id: input.userId },
      data: {
        name: input.displayName,
      },
    })

    // Generate unique slug
    const baseSlug = generateSlug(input.organizationName)
    const slug = await ensureUniqueSlug(baseSlug)

    // Create organization with settings
    const organization = await db.organization.create({
      data: {
        name: input.organizationName,
        slug,
        description: input.organizationDescription || null,
        ownerId: input.userId,
        settings: {
          useCase: input.useCase,
          features: input.features,
          primaryColor: input.primaryColor,
          onboardingComplete: true,
          showTour: true,
        },
      },
    })

    // Create owner membership
    await db.membership.create({
      data: {
        userId: input.userId,
        organizationId: organization.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    })

    // Create default community
    const community = await db.community.create({
      data: {
        name: input.communityName,
        slug: generateSlug(input.communityName),
        description: `Welcome to ${input.communityName}!`,
        organizationId: organization.id,
        isDefault: true,
      },
    })

    // Create selected channels
    const channelData = input.defaultChannels.map((channelSlug, index) => {
      const channelNames: Record<string, string> = {
        announcements: "Announcements",
        general: "General Discussion",
        prayer: "Prayer Requests",
        introductions: "Introductions",
        resources: "Resources",
      }

      return {
        name: channelNames[channelSlug] || channelSlug,
        slug: channelSlug,
        type: CHANNEL_TYPES[channelSlug] || "DISCUSSION",
        communityId: community.id,
        isPublic: true,
        position: index,
      }
    })

    await db.channel.createMany({
      data: channelData,
    })

    revalidatePath("/dashboard")

    return { success: true, organization, community }
  } catch (error) {
    console.error("Failed to complete onboarding:", error)
    return { error: "Failed to set up your organization. Please try again." }
  }
}

export async function dismissTour(userId: string) {
  try {
    // Find user's organization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedOrganizations: {
          take: 1,
        },
      },
    })

    if (!user?.ownedOrganizations[0]) {
      return { error: "Organization not found" }
    }

    const org = user.ownedOrganizations[0]
    const currentSettings = (org.settings as Record<string, unknown>) || {}

    await db.organization.update({
      where: { id: org.id },
      data: {
        settings: {
          ...currentSettings,
          showTour: false,
        },
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to dismiss tour:", error)
    return { error: "Failed to dismiss tour" }
  }
}

export async function restartTour(userId: string) {
  try {
    // Find user's organization
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        ownedOrganizations: {
          take: 1,
        },
      },
    })

    if (!user?.ownedOrganizations[0]) {
      return { error: "Organization not found" }
    }

    const org = user.ownedOrganizations[0]
    const currentSettings = (org.settings as Record<string, unknown>) || {}

    await db.organization.update({
      where: { id: org.id },
      data: {
        settings: {
          ...currentSettings,
          showTour: true,
        },
      },
    })

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Failed to restart tour:", error)
    return { error: "Failed to restart tour" }
  }
}
