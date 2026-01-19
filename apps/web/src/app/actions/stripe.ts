"use server"

import { getLogtoContext } from "@logto/next/server-actions"
import { logtoConfig } from "@/lib/logto"
import { getUserWithOrganization } from "@/lib/user-sync"
import { updateOrganizationStripeAccount } from "@/lib/organization"
import {
  createConnectedAccount,
  createAccountLink,
  createLoginLink,
  getAccountStatus,
} from "@/lib/stripe"
import { revalidatePath } from "next/cache"

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

/**
 * Create a Stripe Connect Express account and return onboarding URL
 */
export async function connectStripeAccount() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const { user, organization } = await getUserWithOrganization(claims.sub)

  if (!user || !organization) {
    return { error: "Organization not found. Please complete onboarding first." }
  }

  // Check if already connected
  if (organization.stripeAccountId) {
    // Check if onboarding is complete
    const status = await getAccountStatus(organization.stripeAccountId)

    if (status.detailsSubmitted && status.chargesEnabled) {
      return { error: "Stripe account already connected" }
    }

    // Generate new onboarding link to continue
    const accountLink = await createAccountLink(
      organization.stripeAccountId,
      `${APP_URL}/dashboard/settings/payments?refresh=true`,
      `${APP_URL}/dashboard/settings/payments?success=true`
    )

    return { url: accountLink.url }
  }

  try {
    // Create new Stripe Express account
    const account = await createConnectedAccount(user.email)

    // Save to database
    await updateOrganizationStripeAccount(organization.id, {
      stripeAccountId: account.id,
      stripeAccountStatus: "pending",
      stripeOnboardingComplete: false,
    })

    // Generate onboarding link
    const accountLink = await createAccountLink(
      account.id,
      `${APP_URL}/dashboard/settings/payments?refresh=true`,
      `${APP_URL}/dashboard/settings/payments?success=true`
    )

    revalidatePath("/dashboard/settings/payments")
    return { url: accountLink.url }
  } catch (error) {
    console.error("Failed to create Stripe account:", error)
    return { error: "Failed to connect Stripe. Please try again." }
  }
}

/**
 * Get Stripe Express Dashboard login link
 */
export async function getStripeDashboardLink() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const { organization } = await getUserWithOrganization(claims.sub)

  if (!organization?.stripeAccountId) {
    return { error: "No Stripe account connected" }
  }

  try {
    const loginLink = await createLoginLink(organization.stripeAccountId)
    return { url: loginLink.url }
  } catch (error) {
    console.error("Failed to create Stripe login link:", error)
    return { error: "Failed to access Stripe dashboard" }
  }
}

/**
 * Refresh Stripe account status
 */
export async function refreshStripeStatus() {
  const { isAuthenticated, claims } = await getLogtoContext(logtoConfig)

  if (!isAuthenticated || !claims?.sub) {
    return { error: "Not authenticated" }
  }

  const { organization } = await getUserWithOrganization(claims.sub)

  if (!organization?.stripeAccountId) {
    return { error: "No Stripe account connected" }
  }

  try {
    const status = await getAccountStatus(organization.stripeAccountId)

    // Update database with current status
    let accountStatus = "pending"
    if (status.detailsSubmitted && status.chargesEnabled && status.payoutsEnabled) {
      accountStatus = "active"
    } else if (status.requirements?.disabled_reason) {
      accountStatus = "restricted"
    }

    await updateOrganizationStripeAccount(organization.id, {
      stripeAccountStatus: accountStatus,
      stripeOnboardingComplete: status.detailsSubmitted && status.chargesEnabled,
    })

    revalidatePath("/dashboard/settings/payments")
    return {
      success: true,
      status: {
        chargesEnabled: status.chargesEnabled,
        payoutsEnabled: status.payoutsEnabled,
        detailsSubmitted: status.detailsSubmitted,
        accountStatus,
      },
    }
  } catch (error) {
    console.error("Failed to refresh Stripe status:", error)
    return { error: "Failed to refresh status" }
  }
}
